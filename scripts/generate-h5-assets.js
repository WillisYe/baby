const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const manifestPath = path.resolve(rootDir, 'src', 'manifest.json')
const h5StaticDir = path.resolve(rootDir, 'src', 'static', 'h5')
const versionFilePath = path.resolve(h5StaticDir, 'app_version.txt.apk')
const sourceWgtPath = path.resolve(h5StaticDir, '__UNI__F1A388D.wgt')
const targetWgtPath = path.resolve(h5StaticDir, '__UNI__F1A388D.wgt.apk')

if (!fs.existsSync(manifestPath)) {
  throw new Error(`manifest.json not found: ${manifestPath}`)
}

const manifestContent = fs.readFileSync(manifestPath, 'utf-8')
const versionMatch = manifestContent.match(/"versionName"\s*:\s*"([^"]+)"/)
if (!versionMatch) {
  throw new Error('versionName not found in src/manifest.json')
}

const versionName = versionMatch[1]

if (!fs.existsSync(h5StaticDir)) {
  fs.mkdirSync(h5StaticDir, { recursive: true })
}

fs.writeFileSync(versionFilePath, versionName, 'utf-8')
console.log(`Generated ${path.relative(rootDir, versionFilePath)} = ${versionName}`)

if (!fs.existsSync(sourceWgtPath)) {
  throw new Error(`Source WGT file not found: ${sourceWgtPath}`)
}

fs.copyFileSync(sourceWgtPath, targetWgtPath)
console.log(`Copied ${path.relative(rootDir, sourceWgtPath)} to ${path.relative(rootDir, targetWgtPath)}`)
