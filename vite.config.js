import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': '/src' },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui':     ['framer-motion', 'lucide-react'],
            'vendor-http':   ['axios'],
          },
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            // Rewrite Set-Cookie so it stores correctly on http://localhost
            proxy.on('proxyRes', (proxyRes) => {
              const setCookie = proxyRes.headers['set-cookie']
              if (setCookie) {
                proxyRes.headers['set-cookie'] = setCookie.map((c) =>
                  c
                    .replace(/;\s*Secure/gi, '')
                    .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
                )
              }
            })
          },
        },
      },
    },
  }
})
