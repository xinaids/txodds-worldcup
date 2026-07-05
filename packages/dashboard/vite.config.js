import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["icon.svg"],
            manifest: {
                name: "Dale — Sharp Odds Intelligence",
                short_name: "Dale",
                description: "Live World Cup odds shift detection. Agent signals precede score feeds by 111-120 seconds.",
                theme_color: "#080A0F",
                background_color: "#080A0F",
                display: "standalone",
                orientation: "portrait",
                start_url: "/",
                icons: [
                    { src: "/icon.svg", sizes: "192x192", type: "image/svg+xml" },
                    { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
                runtimeCaching: [
                    {
                        urlPattern: /^http:\/\/localhost:3001\/api\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "api-cache",
                            expiration: { maxEntries: 50, maxAgeSeconds: 30 },
                        },
                    },
                ],
            },
        }),
    ],
    server: {
        port: 4000,
        host: true,
    },
});
