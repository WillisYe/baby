const DEFAULT_PATH = '/baby_records'

function normalizeConfig(config = {}) {
  return {
    url: String(config.url || '').trim(),
    username: String(config.username || '').trim(),
    password: String(config.password || '').trim(),
    path: String(config.path || DEFAULT_PATH).trim() || DEFAULT_PATH
  }
}

function hasWebdavConfig(config) {
  return config.url && config.username
}

function base64Encode(input) {
  try {
    return btoa(input)
  } catch (e) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(input, 'utf-8').toString('base64')
    }
    return input
  }
}

function buildWebdavBasicAuthHeader(config) {
  const credentials = `${config.username}:${config.password || ''}`
  return `Basic ${base64Encode(credentials)}`
}

function getProxyUrl(url) {
  try {
    const urlObj = new URL(url)
    // #ifdef H5
    if (import.meta.env.DEV || true) {
      return '/webdav' + urlObj.pathname
    }
    return url
    // #endif

    // #ifndef H5
    return url
    // #endif
  } catch (e) {
    return url
  }
}

function getWebdavClientPath(path) {
  const rawPath = String(path || DEFAULT_PATH).trim() || DEFAULT_PATH
  // #ifdef H5
  return rawPath
  // #endif
  // #ifndef H5
  if (rawPath === '/') return ''
  return rawPath.replace(/^\/+/, '')
  // #endif
}

function joinWebdavPath(base, sub) {
  const trimmedBase = String(base || '').replace(/\/+$/, '')
  const trimmedSub = String(sub || '').replace(/^\/+/, '')
  if (!trimmedBase || trimmedBase === '/') {
    return `/${trimmedSub}`
  }
  return `${trimmedBase}/${trimmedSub}`
}

function shouldRetryWebdavAuth(error) {
  const msg = String(error?.message || '').toLowerCase()
  const statusCode = String(error?.response?.status || '')
  const errorText = `${msg} ${statusCode}`
  return errorText.includes('www-authenticate') || errorText.includes('invalid response: 401')
}

function isWebdavHttpStatusError(error) {
  const msg = String(error?.message || '').toLowerCase()
  const statusCode = String(error?.response?.status || '')
  const errorText = `${msg} ${statusCode}`
  return (
    errorText.includes('401') ||
    errorText.includes('403') ||
    errorText.includes('404') ||
    errorText.includes('405') ||
    errorText.includes('500')
  )
}

function parseBackupFilesFromPropfind(xmlText) {
  const content = String(xmlText || '')
  const matches = [...content.matchAll(/<d:href>([^<]+)<\/d:href>/g)]
  return matches
    .map((m) => decodeURIComponent(String(m[1] || '')))
    .map((href) => href.split('/').filter(Boolean).pop() || '')
    .filter((name) => name.startsWith('baby_records_backup_') && name.endsWith('.json'))
}

function extractTimestamp(filename) {
  const match = filename.match(/baby_records_backup_(\d+)\.json/)
  return match ? parseInt(match[1], 10) : 0
}

function requestWebdavRaw(method, path, config, options = {}) {
  const baseUrl = config.url.replace(/\/+$/, '')
  const clientPath = getWebdavClientPath(path)
  const targetUrl = clientPath ? `${baseUrl}/${clientPath}` : `${baseUrl}/`

  return new Promise((resolve, reject) => {
    uni.request({
      url: targetUrl,
      method,
      sslVerify: false,
      data: options.data,
      header: {
        Authorization: buildWebdavBasicAuthHeader(config),
        Accept: 'text/plain,application/xml,*/*',
        ...(options.headers || {})
      },
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
}

function requestWebdavPropfind(path, config) {
  return requestWebdavRaw('PROPFIND', path, config, {
    headers: {
      Depth: '0',
      Accept: 'text/plain,application/xml'
    }
  })
}

// #ifdef H5
import { createClient } from 'webdav'
// #endif
// #ifndef H5
import { AuthType, createClient } from '@/utils/webdav.js'
// #endif

function getWebdavAuthConfigs(config) {
  const baseConfig = {
    username: config.username,
    password: config.password
  }
  // #ifdef H5
  return [baseConfig]
  // #endif

  // #ifndef H5
  const isJianguoyun = String(config.url || '').toLowerCase().includes('jianguoyun.com')
  const jianguoyunHeaders = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36',
    Accept: '*/*'
  }

  if (isJianguoyun) {
    return [{ ...baseConfig, authType: AuthType.Password, headers: jianguoyunHeaders }]
  }

  return [
    { ...baseConfig, authType: AuthType.Digest },
    { ...baseConfig, authType: AuthType.Password }
  ]
  // #endif
}

async function runWebdavWithFallback(config, operation) {
  const authConfigs = getWebdavAuthConfigs(config)
  let lastError = null
  let preferredError = null

  for (let i = 0; i < authConfigs.length; i += 1) {
    const auth = authConfigs[i]
    try {
      const client = createClient(getProxyUrl(config.url), auth)
      return await operation(client, auth)
    } catch (err) {
      lastError = err
      if (isWebdavHttpStatusError(err)) {
        preferredError = err
      }
      const hasNext = i < authConfigs.length - 1
      if (hasNext && shouldRetryWebdavAuth(err)) {
        continue
      }
      break
    }
  }

  throw preferredError || lastError
}

async function test(options = {}) {
  const config = normalizeConfig(options.config)
  if (!hasWebdavConfig(config)) {
    return [null, new Error('WebDAV config incomplete')]
  }

  const path = String(options.path || config.path || DEFAULT_PATH)

  // #ifndef H5
  try {
    const res = await requestWebdavPropfind(path, config)
    const code = Number(res?.statusCode || 0)
    let status = 'unknown'

    if (code === 200 || code === 207) status = 'ok'
    else if (code === 404) status = 'not_found'
    else if (code === 401) status = 'unauthorized'
    else if (code === 403) status = 'forbidden'

    return [{ status, code, path }, null]
  } catch (err) {
    if (!shouldRetryWebdavAuth(err)) {
      return [null, err]
    }
  }
  // #endif

  try {
    const result = await runWebdavWithFallback(config, async (client) => {
      const clientPath = getWebdavClientPath(path)
      const exists = await client.exists(clientPath)
      return { status: 'ok', exists, path: clientPath }
    })
    return [result, null]
  } catch (err) {
    return [null, err]
  }
}

async function upload(options = {}) {
  const config = normalizeConfig(options.config)
  if (!hasWebdavConfig(config)) {
    return [null, new Error('WebDAV config incomplete')]
  }

  const payload = options.data || {}
  const jsonData = JSON.stringify(payload, null, 2)
  const basePath = String(options.path || config.path || DEFAULT_PATH)
  const fileName = String(options.filename || `baby_records_backup_${Date.now()}.json`)
  const fullPath = joinWebdavPath(basePath, fileName)
  const latestPath = joinWebdavPath(basePath, 'baby_records_latest.json')

  // #ifndef H5
  try {
    const checkRes = await requestWebdavRaw('PROPFIND', basePath, config, {
      headers: { Depth: '0' }
    })

    if (Number(checkRes?.statusCode || 0) === 404) {
      const mkcolRes = await requestWebdavRaw('MKCOL', basePath, config)
      const mkcolCode = Number(mkcolRes?.statusCode || 0)
      if (![200, 201, 204, 405].includes(mkcolCode)) {
        throw new Error(`MKCOL failed: ${mkcolCode}`)
      }
    }

    const putRes = await requestWebdavRaw('PUT', fullPath, config, {
      data: jsonData,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
    const putCode = Number(putRes?.statusCode || 0)
    if (![200, 201, 204].includes(putCode)) {
      throw new Error(`PUT failed: ${putCode}`)
    }

    const latestRes = await requestWebdavRaw('PUT', latestPath, config, {
      data: jsonData,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
    const latestCode = Number(latestRes?.statusCode || 0)
    if (![200, 201, 204].includes(latestCode)) {
      throw new Error(`PUT latest failed: ${latestCode}`)
    }

    return [{ filePath: fullPath, latestPath }, null]
  } catch (err) {
    return [null, err]
  }
  // #endif

  // #ifdef H5
  try {
    const result = await runWebdavWithFallback(config, async (client) => {
      const clientBasePath = getWebdavClientPath(basePath)
      const exists = await client.exists(clientBasePath)
      if (!exists) {
        await client.createDirectory(clientBasePath)
      }

      const fullFilePath = joinWebdavPath(clientBasePath, fileName)
      const latestFilePath = joinWebdavPath(clientBasePath, 'baby_records_latest.json')

      await client.putFileContents(fullFilePath, jsonData, { format: 'text', overwrite: true })
      await client.putFileContents(latestFilePath, jsonData, { format: 'text', overwrite: true })

      return { filePath: fullFilePath, latestPath: latestFilePath }
    })

    return [result, null]
  } catch (err) {
    return [null, err]
  }
  // #endif
}

async function download(options = {}) {
  const config = normalizeConfig(options.config)
  if (!hasWebdavConfig(config)) {
    return [null, new Error('WebDAV config incomplete')]
  }

  const basePath = String(options.path || config.path || DEFAULT_PATH)

  // #ifndef H5
  try {
    const listRes = await requestWebdavRaw('PROPFIND', basePath, config, {
      headers: { Depth: '1' }
    })
    const listCode = Number(listRes?.statusCode || 0)

    if (listCode === 404) {
      return [{ status: 'not_found' }, null]
    }

    if (listCode === 403) {
      const latestPath = joinWebdavPath(basePath, 'baby_records_latest.json')
      const latestRes = await requestWebdavRaw('GET', latestPath, config, {
        headers: { Accept: 'application/json,text/plain,*/*' }
      })
      const latestCode = Number(latestRes?.statusCode || 0)
      if (latestCode !== 200) {
        throw new Error(`GET latest failed: ${latestCode}`)
      }

      const text = typeof latestRes.data === 'string' ? latestRes.data : JSON.stringify(latestRes.data || {})
      return [{ status: 'ok', data: JSON.parse(text), fileName: 'baby_records_latest.json' }, null]
    }

    if (![200, 207].includes(listCode)) {
      throw new Error(`PROPFIND failed: ${listCode}`)
    }

    const backupFiles = parseBackupFilesFromPropfind(listRes?.data)
      .map((name) => ({ basename: name, timestamp: extractTimestamp(name) }))
      .filter((item) => item.timestamp > 0)
      .sort((a, b) => b.timestamp - a.timestamp)

    if (backupFiles.length === 0) {
      return [{ status: 'empty' }, null]
    }

    const latest = backupFiles[0]
    const filePath = joinWebdavPath(basePath, latest.basename)
    const fileRes = await requestWebdavRaw('GET', filePath, config, {
      headers: { Accept: 'application/json,text/plain,*/*' }
    })
    const fileCode = Number(fileRes?.statusCode || 0)
    if (fileCode !== 200) {
      throw new Error(`GET failed: ${fileCode}`)
    }

    const text = typeof fileRes.data === 'string' ? fileRes.data : JSON.stringify(fileRes.data || {})
    return [{ status: 'ok', data: JSON.parse(text), fileName: latest.basename }, null]
  } catch (err) {
    return [null, err]
  }
  // #endif

  // #ifdef H5
  try {
    const result = await runWebdavWithFallback(config, async (client) => {
      const clientBasePath = getWebdavClientPath(basePath)
      const exists = await client.exists(clientBasePath)
      if (!exists) {
        return { status: 'not_found' }
      }

      try {
        const contents = await client.getDirectoryContents(clientBasePath)
        const backupFiles = contents
          .filter((item) => item.basename && item.basename.startsWith('baby_records_backup_') && item.basename.endsWith('.json'))
          .map((item) => ({ basename: item.basename, timestamp: extractTimestamp(item.basename) }))

        if (backupFiles.length === 0) {
          return { status: 'empty' }
        }

        backupFiles.sort((a, b) => b.timestamp - a.timestamp)
        const latestFile = backupFiles[0]
        const filePath = joinWebdavPath(clientBasePath, latestFile.basename)
        const fileContent = await client.getFileContents(filePath, { format: 'text' })
        return { status: 'ok', data: JSON.parse(fileContent), fileName: latestFile.basename }
      } catch (listErr) {
        if (String(listErr?.response?.status) === '403') {
          const latestFilePath = joinWebdavPath(clientBasePath, 'baby_records_latest.json')
          const fileContent = await client.getFileContents(latestFilePath, { format: 'text' })
          return { status: 'ok', data: JSON.parse(fileContent), fileName: 'baby_records_latest.json' }
        }
        throw listErr
      }
    })

    return [result, null]
  } catch (err) {
    return [null, err]
  }
  // #endif
}

export default {
  test,
  upload,
  download
}
