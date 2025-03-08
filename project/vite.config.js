import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  port: 5173,
  host: true,
  plugins: [react()],
})
