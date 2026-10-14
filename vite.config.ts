import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // ECharts pèse 507 kB minifiés à lui seul : le seuil d'alerte est relevé
    // juste au-dessus pour qu'il reste utile sur notre propre code.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // ECharts dans son propre lot : partagé par les écrans à graphiques
        // et mis en cache une seule fois par le navigateur.
        advancedChunks: {
          groups: [{ name: 'echarts', test: /node_modules[\\/]+echarts|zrender/ }],
        },
      },
    },
  },
})
