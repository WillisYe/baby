import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

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

        // Create _headers to set MIME type for .wgt files
        const headersPath = resolve(__dirname, 'dist/build/h5/_headers')
        const headersContent = `/*.wgt\n  Content-Type: application/octet-stream\n`
        writeFileSync(headersPath, headersContent)
        console.log('Created _headers for .wgt files')

        // Generate version marker file for app hot update
        const manifestPath = resolve(__dirname, 'src/manifest.json')
        const versionDir = resolve(__dirname, 'dist/build/h5/static/h5')
        const versionOutputPath = resolve(versionDir, 'app_version.txt.apk')
        if (!existsSync(versionDir)) {
          mkdirSync(versionDir, { recursive: true })
        }
        if (existsSync(manifestPath)) {
          const manifestContent = readFileSync(manifestPath, 'utf-8')
          const versionMatch = manifestContent.match(/"versionName"\s*:\s*"([^\"]+)"/)
          if (versionMatch) {
            const versionName = versionMatch[1]
            writeFileSync(versionOutputPath, versionName, 'utf-8')
            console.log(`Created app_version.txt.apk with version ${versionName}`)
          }
        }

        // Copy .wgt to .wgt.apk and .apk so Cloudflare Pages can serve it as a downloadable asset
        const sourceWgt = resolve(__dirname, 'src/static/h5/__UNI__F1A388D.wgt')
        const targetWgt = resolve(versionDir, '__UNI__F1A388D.wgt.apk')
        const targetApk = resolve(versionDir, '__UNI__F1A388D.apk')
        if (existsSync(sourceWgt)) {
          copyFileSync(sourceWgt, targetWgt)
          copyFileSync(sourceWgt, targetApk)
          console.log('Created __UNI__F1A388D.wgt.apk and __UNI__F1A388D.apk from source __UNI__F1A388D.wgt')
        } else {
          console.log('Source WGT not found, skipping __UNI__F1A388D.wgt.apk / __UNI__F1A388D.apk copy')
        }
      },
      transformIndexHtml(html) {
        // Inject version into index.html
        const manifestPath = resolve(__dirname, 'src/manifest.json')
        if (existsSync(manifestPath)) {
          const manifestContent = readFileSync(manifestPath, 'utf-8')
          const versionMatch = manifestContent.match(/"versionName"\s*:\s*"([^"]+)"/)
          if (versionMatch) {
            const versionName = versionMatch[1]
            html = html.replace('<html lang="en">', `<html lang="en" data-version="${versionName}">`)
            console.log(`Injected version ${versionName} into index.html`)
          }
        }
        return html
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
