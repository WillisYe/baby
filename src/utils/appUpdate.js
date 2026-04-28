const UPDATE_CONFIG = {
  // 热更新包地址
  wgtUrl: 'https://baby-3qp.pages.dev/static/h5/__UNI__F1A388D.wgt',
  // 版本信息地址
  versionUrl: 'https://baby-3qp.pages.dev/static/h5/app_version.txt'
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

export function getCurrentVersionInfo() {
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
    if (!UPDATE_CONFIG.versionUrl) {
      reject(new Error('未配置版本信息地址'))
      return
    }

    uni.request({
      url: UPDATE_CONFIG.versionUrl,
      method: 'GET',
      dataType: 'text',
      timeout: 15000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data) {
          const versionName = res.data.trim()
          resolve({
            versionName,
            versionCode: 1, // 简单处理，实际可根据需要解析
            wgtUrl: UPDATE_CONFIG.wgtUrl
          })
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

/**
 * 比较两个版本号的大小
 * @param {string} v1 - 版本号1，格式如 "1.0.1"
 * @param {string} v2 - 版本号2，格式如 "1.0.1"
 * @returns {number} 返回值：
 *   - 负数: v1 < v2
 *   - 0: v1 === v2
 *   - 正数: v1 > v2
 * @example
 * compareVersion('1.0.1', '1.0.2')   // 返回 -1
 * compareVersion('1.2.0', '1.1.9')   // 返回 1
 * compareVersion('1.0.0', '1.0.0')   // 返回 0
 */
function compareVersion(v1, v2) {
    // 将版本号按 '.' 分割成数组，并转换为数字
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    // 获取最大长度，以便处理不同长度的版本号（如 1.0 和 1.0.1）
    const maxLength = Math.max(parts1.length, parts2.length);

    // 逐段比较
    for (let i = 0; i < maxLength; i++) {
        // 如果某一段不存在，则视为 0
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;

        if (num1 !== num2) {
            return num1 - num2;
        }
    }

    // 所有段都相等
    return 0;
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

    const remoteVersionCode = updateInfo.versionName
    const currentVersionCode = currentInfo.versionName
    console.log('%c remoteVersionCode, currentVersionCode', 'color:red; background:yellow;', remoteVersionCode, currentVersionCode)
    if (compareVersion(remoteVersionCode, currentVersionCode) <= 0) {
      if (manual) {
        uni.showToast({ title: '当前已是最新版本', icon: 'success' })
      }
      return
    }

    const confirm = await showUpdatePrompt(`v${remoteVersionCode}`, updateInfo.changelog)
    if (!confirm) {
      return
    }

    await downloadAndInstallUpdate(updateInfo.wgtUrl)
    uni.showLoading({ title: '正在重启...' })
    setTimeout(() => {
      if (typeof plus !== 'undefined' && plus.runtime && plus.runtime.restart) {
        uni.hideLoading();
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
