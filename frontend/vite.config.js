import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: true, 
    host: true,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true
      }
    }
  }
});