// Import the functions and plugins needed for Vite
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Export the configuration for the Vite dev server
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all network interfaces inside Docker
    host: '0.0.0.0',
    port: 3000,

    // 👇 The proxy section tells Vite how to forward API requests.
    // Any request from the frontend that begins with `/api`
    // will be sent (proxied) to the Flask service named "student-profile"
    // which listens on port 5001 inside the Docker network.
    proxy: {
      '/api': {
        target: 'http://student-profile:5001',
        changeOrigin: true,

        // Remove the `/api` prefix when sending to the backend.
        // Example:
        // Frontend request:  /api/students
        // Becomes:           /students (at the backend)
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
})
