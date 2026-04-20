import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
    codeInspectorPlugin({
      bundler: 'vite',
    }),
    basicSsl(),
    {
      name: 'copy-redirects-and-inject-version',
      writeBundle() {
        // Copy _redirects
        const redirectsSrc = resolve(__dirname, 'public/_redirects')
        const redirectsDest = resolve(__dirname, 'dist/build/h5/_redirects')
        if (existsSync(redirectsSrc)) {
          copyFileSync(redirectsSrc, redirectsDest)
          console.log('Copied _redirects to build output')
        }

        // Inject version into index.html
        const manifestPath = resolve(__dirname, 'src/manifest.json')
        const indexPath = resolve(__dirname, 'dist/build/h5/index.html')

        if (existsSync(manifestPath) && existsSync(indexPath)) {
          const manifestContent = readFileSync(manifestPath, 'utf-8')
          const versionMatch = manifestContent.match(/"versionName"\s*:\s*"([^"]+)"/)
          if (versionMatch) {
            const versionName = versionMatch[1]
            let indexHtml = readFileSync(indexPath, 'utf-8')
            indexHtml = indexHtml.replace('<html lang="en">', `<html lang="en" data-version="${versionName}">`)
            writeFileSync(indexPath, indexHtml)
            console.log(`Injected version ${versionName} into index.html`)
          }
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
