import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const dataDir = path.resolve(__dirname, '..', 'data')

export default defineConfig({
  plugins: [
    react(),
    // Serve ../data as /data during dev
    {
      name: 'serve-data',
      configureServer(server) {
        server.middlewares.use('/data', (req, res, next) => {
          const filePath = path.join(dataDir, req.url)
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'application/json')
            fs.createReadStream(filePath).pipe(res)
          } else {
            next()
          }
        })
      },
    },
    // Copy ../data into dist/data at build time
    {
      name: 'copy-data',
      closeBundle() {
        const dest = path.resolve(__dirname, 'dist', 'data')
        if (fs.existsSync(dataDir)) {
          fs.cpSync(dataDir, dest, { recursive: true })
        }
      },
    },
  ],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
