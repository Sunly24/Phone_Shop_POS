import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
            publicDirectory: 'public',
            buildDirectory: 'build',
        }),
        react(),
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
            },
        }),
        VitePWA({
            registerType: 'autoUpdate', 
            manifest: {
                name: 'JG BAN PHONE STORE',
                short_name: 'JB STORE',
                start_url: '/',
                display: 'standalone', 
                background_color: '#ffffff',
                theme_color: '#2563eb', 
                icons: [
                {
                    src: '/images/brand-logo/JB-logo.png',
                    sizes: '192x192',
                    type: 'image/png',
                },
                {
                    src: '/images/brand-logo/JB-logo.png',
                    sizes: '512x512',
                    type: 'image/png',
                },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
            '@public': path.resolve(__dirname, 'public'),
        },
    },
    server: {
        https: false, 
        host: '0.0.0.0',
        port: 5173,
        cors: true,
        hmr: {
            host: 'localhost',
            port: 5173,
        },
    },
    define: {
        global: 'globalThis',
    },
});
