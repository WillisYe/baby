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

const LATEST_FILENAME = 'baby_records_latest.json'

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
  const latestPath = joinWebdavPath(basePath, LATEST_FILENAME)

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

    const latestRes = await requestWebdavRaw('PUT', latestPath, config, {
      data: jsonData,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
    const latestCode = Number(latestRes?.statusCode || 0)
    if (![200, 201, 204].includes(latestCode)) {
      throw new Error(`PUT latest failed: ${latestCode}`)
    }

    return [{ latestPath }, null]
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

      const latestFilePath = joinWebdavPath(clientBasePath, LATEST_FILENAME)
      await client.putFileContents(latestFilePath, jsonData, { format: 'text', overwrite: true })
      return { latestPath: latestFilePath }
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
  const latestPath = joinWebdavPath(basePath, LATEST_FILENAME)

  // #ifndef H5
  try {
    const latestRes = await requestWebdavRaw('GET', latestPath, config, {
      headers: { Accept: 'application/json,text/plain,*/*' }
    })
    const latestCode = Number(latestRes?.statusCode || 0)
    if (latestCode === 404) {
      return [{ status: 'not_found' }, null]
    }
    if (latestCode !== 200) {
      throw new Error(`GET latest failed: ${latestCode}`)
    }

    const text = typeof latestRes.data === 'string' ? latestRes.data : JSON.stringify(latestRes.data || {})
    return [{ status: 'ok', data: JSON.parse(text), fileName: LATEST_FILENAME }, null]
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

      const latestFilePath = joinWebdavPath(clientBasePath, LATEST_FILENAME)
      const fileContent = await client.getFileContents(latestFilePath, { format: 'text' })
      return { status: 'ok', data: JSON.parse(fileContent), fileName: LATEST_FILENAME }
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
