import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'
import { copyFileSync, existsSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
    codeInspectorPlugin({
      bundler: 'vite',
    }),
    basicSsl(),
    {
      name: 'copy-redirects',
      writeBundle() {
        const redirectsSrc = resolve(__dirname, 'public/_redirects')
        const redirectsDest = resolve(__dirname, 'dist/build/h5/_redirects')
        if (existsSync(redirectsSrc)) {
          copyFileSync(redirectsSrc, redirectsDest)
          console.log('Copied _redirects to build output')
        }
      }
    }
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/uni.scss";',
      },
    },
  },
  server: {
    proxy: {
      '/webdav': {
        target: 'https://dav.jianguoyun.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/webdav/, '')
      }
    }
  }
})
