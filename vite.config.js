import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cambia este nombre por el de tu repo EXACTO
const REPO = 'Tiktok-Coin-Trainer'

export default defineConfig({
  plugins: [react()],
  base: `/${REPO}/`,
})
