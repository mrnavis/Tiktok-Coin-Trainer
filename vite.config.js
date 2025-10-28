import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ¡Cambia esto por el nombre EXACTO de tu repo!
const REPO = 'Tiktok-Coin-Trainer'

export default defineConfig({
  plugins: [react()],
  base: `/${REPO}/`,
})
