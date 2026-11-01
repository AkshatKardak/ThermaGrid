import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
  },
  resolve: {
    alias: [
      {
        find: /^use-sync-external-store\/shim\/with-selector.*$/,
        replacement: path.resolve(__dirname, 'src/shims/useSyncExternalStoreWithSelector.ts'),
      },
      {
        find: /^use-sync-external-store\/shim.*$/,
        replacement: path.resolve(__dirname, 'src/shims/useSyncExternalStore.ts'),
      },
      {
        find: /^use-sync-external-store$/,
        replacement: path.resolve(__dirname, 'src/shims/useSyncExternalStore.ts'),
      },
    ],
  },
  optimizeDeps: {
    exclude: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'deck.gl',
      '@deck.gl/react',
      '@deck.gl/layers',
      '@deck.gl/aggregation-layers',
      '@deck.gl/geo-layers',
    ],
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'recharts',
      'framer-motion',
      'lucide-react',
      'axios',
      '@tanstack/react-query',
    ],
  },
})
