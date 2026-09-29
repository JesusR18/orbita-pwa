// Genera dist/: index.html completo (PWA), manifest, service worker e íconos PNG.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src'), dist = join(root, 'dist');
mkdirSync(join(dist, 'icons'), { recursive: true });

// index.html
const app = readFileSync(join(src, 'app.html'), 'utf8');
const [head, body] = app.split('<!--BODY-->');
if (!body) throw new Error('Falta el marcador <!--BODY--> en src/app.html');
const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Órbita: cada hábito es un planeta que orbita tu día. Pomodoro con paisajes sonoros, diario de ánimo y estadísticas, sin conexión.">
<meta name="theme-color" content="#0C161D">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Órbita">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/icon-192.png">
${head.trim()}
</head>
<body>
${body.trim()}
</body>
</html>
`;
writeFileSync(join(dist, 'index.html'), html);
copyFileSync(join(src, 'sw.js'), join(dist, 'sw.js'));
copyFileSync(join(src, 'manifest.webmanifest'), join(dist, 'manifest.webmanifest'));

// Íconos
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0C161D"/><circle cx="256" cy="256" r="150" fill="none" stroke="#6F8C99" stroke-width="10" stroke-opacity=".55"/><circle cx="256" cy="256" r="82" fill="#FF7648"/><circle cx="362" cy="150" r="36" fill="#3DC49B"/></svg>`;
writeFileSync(join(dist, 'icons', 'icon.svg'), svg);

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, maskable) {
  const S = 4, raw = Buffer.alloc(size * (size * 4 + 1));
  const u = size / 512, rr = maskable ? 0 : 112 * u;
  const scale = maskable ? 0.78 : 1, c = size / 2;
  const tr = v => c + (v - 256) * u * scale;
  const shapes = [
    { cx: tr(256), cy: tr(256), r: 82 * u * scale, col: [255, 118, 72] },
    { cx: tr(362), cy: tr(150), r: 36 * u * scale, col: [61, 196, 155] }
  ];
  const ring = { cx: tr(256), cy: tr(256), r: 150 * u * scale, w: 5 * u * scale };
  const bg = [12, 22, 29], ringCol = [60, 80, 90];
  const inRounded = (x, y) => {
    if (!rr) return true;
    const dx = Math.max(rr - x, 0, x - (size - rr)), dy = Math.max(rr - y, 0, y - (size - rr));
    return dx * dx + dy * dy <= rr * rr;
  };
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let R = 0, G = 0, B = 0, A = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const px = x + (sx + 0.5) / S, py = y + (sy + 0.5) / S;
        if (!inRounded(px, py)) continue;
        let col = bg;
        if (Math.abs(Math.hypot(px - ring.cx, py - ring.cy) - ring.r) <= ring.w) col = ringCol;
        for (const s of shapes) if (Math.hypot(px - s.cx, py - s.cy) <= s.r) col = s.col;
        R += col[0]; G += col[1]; B += col[2]; A += 255;
      }
      const n = S * S, o = y * (size * 4 + 1) + 1 + x * 4;
      const a = A / n;
      raw[o] = a ? Math.round(R / (A / 255)) : 0; raw[o + 1] = a ? Math.round(G / (A / 255)) : 0; raw[o + 2] = a ? Math.round(B / (A / 255)) : 0; raw[o + 3] = Math.round(a);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
writeFileSync(join(dist, 'icons', 'icon-192.png'), png(192, false));
writeFileSync(join(dist, 'icons', 'icon-512.png'), png(512, false));
writeFileSync(join(dist, 'icons', 'maskable-512.png'), png(512, true));
console.log('dist/ generado:', ['index.html', 'sw.js', 'manifest.webmanifest', 'icons/*'].join(', '));
