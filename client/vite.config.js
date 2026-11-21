import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Auth0 allows http://localhost:3000 as a callback for local development.
  server: { port: 3000, strictPort: true },
})
