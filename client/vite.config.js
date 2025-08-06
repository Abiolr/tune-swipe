import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  
  // Check if IS_LOCAL is set to 'development'
  const isLocal = env.IS_LOCAL === 'development'
  
  console.log(`[VITE CONFIG] Mode: ${mode}`)
  console.log(`[VITE CONFIG] IS_LOCAL env var: ${env.IS_LOCAL}`)
  console.log(`[VITE CONFIG] Calculated isLocal: ${isLocal}`)
  
  return {
    plugins: [react()],
    define: {
      'import.meta.env.IS_LOCAL': JSON.stringify(isLocal)
    },
    server: {
      proxy: {
        '/api': {
          target: isLocal
            ? 'http://127.0.0.1:5000'
            : 'https://tune-swipe.onrender.com',
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/api/, '')
        }
      }
    }
  }
})