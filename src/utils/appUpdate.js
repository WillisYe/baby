const UPDATE_CONFIG = {
  // 热更新包固定地址（使用 .apk 后缀避免 Cloudflare Pages 将 .wgt 识别为网页资源）
  wgtUrl: 'https://baby-3qp.pages.dev/static/h5/__UNI__F1A388D.wgt.apk',
  // 版本信息文件地址
  versionFileUrl: 'https://baby-3qp.pages.dev/static/h5/app_version.txt.apk'
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
    uni.request({
      url: UPDATE_CONFIG.versionFileUrl,
      method: 'GET',
      dataType: 'text',
      timeout: 15000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data) {
          const remoteVersionName = String(res.data).trim()
          if (remoteVersionName) {
            resolve({
              versionName: remoteVersionName,
              versionCode: parseInt(remoteVersionName.replace(/\./g, ''), 10) || 0,
              wgtUrl: UPDATE_CONFIG.wgtUrl,
              changelog: '新版本更新'
            })
          } else {
            reject(new Error('版本文件内容为空'))
          }
        } else {
          reject(new Error(`获取版本信息失败: 状态 ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(`获取版本信息失败: ${err.errMsg || err.message || '网络错误'}`))
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
