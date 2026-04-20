import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import basicSsl from '@vitejs/plugin-basic-ssl'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
    codeInspectorPlugin({
      bundler: 'vite',
    }),
    basicSsl(),
    {
      name: 'copy-h5-assets',
      writeBundle(options, bundle) {
        if (options.dir && options.dir.includes('h5')) {
          const staticDir = path.join(__dirname, 'src', 'static', 'h5')
          const outputDir = path.join(options.dir, 'static', 'h5')

          // 确保输出目录存在
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
          }

          // 复制版本文件和 WGT 文件
          const files = ['app_version.txt', '__UNI__E9B6D54.wgt']
          files.forEach(file => {
            const srcPath = path.join(staticDir, file)
            const destPath = path.join(outputDir, file)
            if (fs.existsSync(srcPath)) {
              fs.copyFileSync(srcPath, destPath)
              console.log(`Copied ${file} to build output`)
            }
          })
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
