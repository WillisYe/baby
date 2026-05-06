const fs = require('fs')
const path = require('path')

// 读取 manifest.json 获取版本
const manifestPath = path.join(__dirname, '..', 'src', 'manifest.json')
const manifestContent = fs.readFileSync(manifestPath, 'utf-8')
const versionMatch = manifestContent.match(/"versionName"\s*:\s*"([^"]+)"/)
const versionName = versionMatch ? versionMatch[1] : '1.0.0'

// 生成版本文件
const staticDir = path.join(__dirname, '..', 'src', 'static', 'h5')
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true })
}

const versionFile = path.join(staticDir, 'app_version.txt')
fs.writeFileSync(versionFile, versionName, 'utf-8')

console.log(`Generated version file: ${versionFile} with version: ${versionName}`)

// 查找 WGT 文件
const srcWgtPath = path.join(__dirname, '..', 'unpackage', 'release', '__UNI__F1A388D.wgt')

if (fs.existsSync(srcWgtPath)) {
  const destWgtPath = path.join(staticDir, '__UNI__F1A388D.wgt')
  fs.copyFileSync(srcWgtPath, destWgtPath)
  console.log(`Copied WGT file: ${destWgtPath}`)
} else {
  console.warn('No WGT file found in unpackage directory')
}