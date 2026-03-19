import type { Plugin, Connect } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Vite plugin that proxies AI API requests to avoid CORS issues in dev mode.
 * The browser sends requests to /__ai_proxy with the real target URL in x-proxy-url header.
 * The middleware forwards the request server-side (no CORS) and streams the response back.
 */
function aiProxyPlugin(): Plugin {
  return {
    name: 'ai-proxy',
    configureServer(server) {
      server.middlewares.use('/__ai_proxy', (async (req: Connect.IncomingMessage, res, _next) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          })
          res.end()
          return
        }

        const targetUrl = req.headers['x-proxy-url'] as string | undefined
        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.end('Missing x-proxy-url header')
          return
        }

        // Read request body
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        await new Promise<void>((resolve) => req.on('end', resolve))
        const body = Buffer.concat(chunks)

        // Forward headers, stripping hop-by-hop and proxy-specific ones
        const skipHeaders = new Set(['host', 'origin', 'referer', 'x-proxy-url', 'connection', 'accept-encoding'])
        const forwardHeaders: Record<string, string> = {}
        for (const [key, value] of Object.entries(req.headers)) {
          if (skipHeaders.has(key) || !value) continue
          forwardHeaders[key] = Array.isArray(value) ? value[0] : value
        }

        try {
          const upstream = await fetch(targetUrl, {
            method: req.method || 'POST',
            headers: forwardHeaders,
            body: body.length > 0 ? body : undefined,
          })

          // Forward response status and headers
          const responseHeaders: Record<string, string> = {}
          upstream.headers.forEach((v, k) => {
            // Skip hop-by-hop headers
            if (!['transfer-encoding', 'connection'].includes(k)) {
              responseHeaders[k] = v
            }
          })
          res.writeHead(upstream.status, responseHeaders)

          // Stream response body
          if (upstream.body) {
            const reader = (upstream.body as ReadableStream<Uint8Array>).getReader()
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                res.write(value)
              }
            } finally {
              reader.releaseLock()
            }
          }
          res.end()
        } catch (err) {
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain' })
          }
          res.end(`Proxy error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }) as Connect.NextHandleFunction)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    aiProxyPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'Markitor',
        short_name: 'Markitor',
        description: 'A powerful markdown editor with AI assistance',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
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
