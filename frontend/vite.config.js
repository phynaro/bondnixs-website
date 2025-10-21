import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    // Ensure environment variables are available
    'import.meta.env.MODE': JSON.stringify(mode),
    'import.meta.env.DEV': mode === 'development',
    'import.meta.env.PROD': mode === 'production',
  },
}))
