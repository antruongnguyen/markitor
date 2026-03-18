import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@codemirror/')) {
            return 'vendor-codemirror'
          }

          if (id.includes('node_modules/highlight.js') || id.includes('node_modules/markdown-it')) {
            return 'vendor-markdown'
          }

          if (id.includes('node_modules/katex')) {
            return 'vendor-katex'
          }

          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'vendor-react'
          }
        },
      },
    },
  },
})
