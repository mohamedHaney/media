import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: "https://mdia1-3pokryme.b4a.run",
        secure: false,
      },
    },
  },
  plugins: [react()],
});
