import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: "https://media-ojwb.vercel.app",
        changeOrigin: true, // Fixes some CORS issues
      },
    },
  },
  plugins: [react()],
});
