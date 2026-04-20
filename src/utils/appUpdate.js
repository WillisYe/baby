const UPDATE_CONFIG = {
  // TODO: 替换为实际热更新配置地址
  checkUrl: 'https://baby-3qp.pages.dev/static/h5/app-update.js'
}

function isAppPlus() {
  return true
  // #ifdef APP-PLUS
  return true
  // #endif
  // #ifndef APP-PLUS
  return false
  // #endif
}

function getCurrentVersionInfo() {
  return new Promise((resolve) => {
    if (!isAppPlus() || typeof plus === 'undefined' || !plus.runtime || !plus.runtime.getProperty) {
      resolve({ versionName: '', versionCode: 0 })
      return
    }

    plus.runtime.getProperty(plus.runtime.appid, (info) => {
      const versionCode = parseInt(String(info.versionCode || '0'), 10) || 0
      resolve({
        versionName: String(info.version || ''),
        versionCode
      })
    })
  })
}

function fetchUpdateInfo() {
  return new Promise((resolve, reject) => {
    if (!UPDATE_CONFIG.checkUrl) {
      reject(new Error('未配置热更新检查地址'))
      return
    }

    uni.request({
      url: UPDATE_CONFIG.checkUrl,
      method: 'GET',
      dataType: 'json',
      timeout: 15000,
      success: (res) => {
        console.log('%c res', 'color:red; background:yellow;', res)
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data) {
          resolve(res.data)
        } else {
          reject(new Error(`检查更新失败: 状态 ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(`检查更新失败: ${err.errMsg || err.message || '网络错误'}`))
      }
    })
  })
}

function installUpdate(tempFilePath) {
  return new Promise((resolve, reject) => {
    if (typeof plus === 'undefined' || !plus.runtime || !plus.runtime.install) {
      reject(new Error('当前平台不支持热更新安装'))
      return
    }

    plus.runtime.install(
      tempFilePath,
      { force: true },
      () => {
        resolve()
      },
      (error) => {
        reject(new Error(`安装失败: ${error.message || JSON.stringify(error)}`))
      }
    )
  })
}

async function downloadAndInstallUpdate(wgtUrl) {
  return new Promise((resolve, reject) => {
    if (!wgtUrl) {
      reject(new Error('未配置更新包地址'))
      return
    }

    uni.showLoading({ title: '正在下载更新包...' })

    uni.downloadFile({
      url: wgtUrl,
      success: async (downloadResult) => {
        if (downloadResult.statusCode === 200 && downloadResult.tempFilePath) {
          try {
            await installUpdate(downloadResult.tempFilePath)
            uni.hideLoading()
            resolve()
          } catch (installError) {
            uni.hideLoading()
            reject(installError)
          }
        } else {
          uni.hideLoading()
          reject(new Error(`下载失败，状态码 ${downloadResult.statusCode}`))
        }
      },
      fail: (downloadError) => {
        uni.hideLoading()
        reject(new Error(`下载失败: ${downloadError.errMsg || downloadError.message || '网络错误'}`))
      }
    })
  })
}

function showUpdatePrompt(remoteVersionName, changelog) {
  return new Promise((resolve) => {
    const message = [`检测到新版本：${remoteVersionName}`]
    if (changelog) {
      message.push(`更新内容：${changelog}`)
    }

    uni.showModal({
      title: '发现热更包',
      content: message.join('\n'),
      confirmText: '立即更新',
      cancelText: '稍后再说',
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

export async function checkAppHotUpdate(options = {}) {
  const manual = options.manual === true

  if (!isAppPlus()) {
    if (manual) {
      uni.showToast({ title: '当前非 APP 端，无法检查热更新', icon: 'none' })
    }
    return
  }

  try {
    const currentInfo = await getCurrentVersionInfo()
    console.log('%c currentInfo', 'color:red; background:yellow;', currentInfo)
    const updateInfo = await fetchUpdateInfo()

    if (!updateInfo || !updateInfo.wgtUrl) {
      throw new Error('无效的更新信息')
    }

    const remoteVersionCode = parseInt(String(updateInfo.versionCode || updateInfo.version || 0), 10) || 0
    const currentVersionCode = parseInt(String(currentInfo.versionCode || '0'), 10) || 0

    if (remoteVersionCode <= currentVersionCode) {
      if (manual) {
        uni.showToast({ title: '当前已是最新版本', icon: 'success' })
      }
      return
    }

    const confirm = await showUpdatePrompt(updateInfo.versionName || updateInfo.version || `v${remoteVersionCode}`, updateInfo.changelog)
    if (!confirm) {
      return
    }

    await downloadAndInstallUpdate(updateInfo.wgtUrl)
    uni.showToast({ title: '更新完成，正在重启', icon: 'success' })
    setTimeout(() => {
      if (typeof plus !== 'undefined' && plus.runtime && plus.runtime.restart) {
        plus.runtime.restart()
      }
    }, 800)
  } catch (error) {
    console.error('热更检查失败:', error)
    if (manual) {
      uni.showToast({ title: `检查更新失败: ${error.message || '请稍后重试'}`, icon: 'none', duration: 3000 })
    }
  }
}
