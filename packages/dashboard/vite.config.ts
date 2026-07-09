import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'https://txodds-worldcup.onrender.com'

  return {
    plugins: [{
      name: 'html-env',
      transformIndexHtml(html) {
        return html.replace('__VITE_API_URL_PLACEHOLDER__', apiUrl)
      }
    }],
    build: { rollupOptions: { input: 'index.html' } }
  }
})
