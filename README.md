# TikCoin Trainer (Web)
Simulador educativo para reflexionar sobre micropagos y *dark patterns* tipo TikTok.

## Requisitos
- Node.js 18+
- npm o pnpm

## Desarrollo local
```bash
npm install
npm run dev
```
Abre http://localhost:5173

## Build de producción
```bash
npm run build
npm run preview
```

## Deploy (opciones rápidas)
### Netlify
- Crea un sitio nuevo y conecta el repo o sube la carpeta.
- Build command: `npm run build`
- Publish directory: `dist`

### Vercel
- Importa el repo/proyecto.
- Framework: Vite (detectado automáticamente)
- Output: `dist`

### GitHub Pages (manual rápido)
1. `npm run build`
2. Sube el contenido de `dist` a la rama `gh-pages`.
