import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_URL = process.env.VITE_API_URL || 'https://localhost:7155';
if (!process.env.VITE_API_URL) {
    // Helpful dev-time warning
    // eslint-disable-next-line no-console
    console.warn(`[vite] VITE_API_URL not set, using fallback ${API_URL}`);
}

export default defineConfig({
    plugins: [react()],
    server: {
        port: 51322,
        proxy: {
            '/api': {
                target: API_URL,
                changeOrigin: true,
                secure: false
            },
            '/chatHub': {
                target: API_URL,
                changeOrigin: true,
                ws: true,
                secure: false
            }
        }
    }
});