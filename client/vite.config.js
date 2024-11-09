import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: import.meta.env.SERVER_DOMAIN,
        secure: false,
      },
    },
  },
  plugins: [react()],
});
