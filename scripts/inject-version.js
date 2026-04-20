const fs = require('fs')
const path = require('path')

console.log('Current working directory:', process.cwd())

// 读取 manifest.json
const manifestPath = path.join(process.cwd(), 'src', 'manifest.json')
console.log('Manifest path:', manifestPath)
const manifestContent = fs.readFileSync(manifestPath, 'utf-8')

// 使用正则表达式提取 versionName
const versionMatch = manifestContent.match(/"versionName"\s*:\s*"([^"]+)"/)
if (!versionMatch) {
  throw new Error('versionName not found in manifest.json')
}
const versionName = versionMatch[1]

console.log('Version name:', versionName)

// 读取 index.html
const indexPath = path.join(process.cwd(), 'dist', 'build', 'h5', 'index.html')
console.log('Index path:', indexPath)
let indexHtml = fs.readFileSync(indexPath, 'utf-8')

// 在 <html> 标签中添加 data-version 属性
indexHtml = indexHtml.replace('<html lang="en">', `<html lang="en" data-version="${versionName}">`)

// 写入修改后的 index.html
fs.writeFileSync(indexPath, indexHtml)

console.log(`Injected version ${versionName} into index.html`)