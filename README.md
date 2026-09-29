# Órbita

PWA de hábitos, enfoque y diario. Cada hábito es un planeta que orbita el "sol" de tu día.

- **Órbita**: hábitos con días programados, rachas, lunas por cada semana de racha. Se marcan tocando el planeta o la lista.
- **Enfoque**: Pomodoro (4 bloques y una pausa larga) con paisajes sonoros generados con Web Audio (lluvia, océano, ruido marrón, cosmos), wake lock, vibración y avisos.
- **Diario**: ánimo de 1 a 5, etiquetas, notas y constelación de 30 días.
- **Progreso**: KPIs, minutos de enfoque de 14 días, mapa de constancia de 12 semanas y descubrimientos calculados con tus datos.
- **Ajustes**: tema, duraciones, instalación, respaldo (exportar, copiar, importar) y borrado.

Todos los datos se guardan en el dispositivo (localStorage). La app funciona sin conexión gracias al service worker.

## Estructura

| Ruta | Contenido |
|---|---|
| `src/app.html` | Código fuente: estilos, vistas y lógica |
| `src/sw.js` | Service worker (sin conexión) |
| `src/manifest.webmanifest` | Datos de instalación |
| `scripts/build.mjs` | Genera `dist/` e íconos PNG |
| `dist/` | Versión lista para publicar |

## Compilar

```
node scripts/build.mjs
```

## Publicar

- **GitHub Pages (automático)**: cada `push` a `main` ejecuta `.github/workflows/pages.yml`, que compila y publica `dist/`.
- **Netlify Drop**: arrastra la carpeta `dist/` a https://app.netlify.com/drop
- **Vercel**: `npx vercel dist --prod`
