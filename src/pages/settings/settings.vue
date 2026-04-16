<template>
  <view class="content">
    <!-- 宝宝信息设置 -->
    <view class="settings-section">
      <view class="section-title">宝宝信息</view>
      <view class="setting-item" @click="editName">
        <text class="setting-label">宝宝姓名</text>
        <view class="setting-value">
          <text>{{ babyInfo.name }}</text>
          <view class="arrow-icon">></view>
        </view>
      </view>
      <view class="setting-item" @click="editBirthDate">
        <text class="setting-label">出生日期</text>
        <view class="setting-value">
          <text>{{ babyInfo.birthDate }}</text>
          <view class="arrow-icon">></view>
        </view>
      </view>
      <view class="setting-item" @click="editGender">
        <text class="setting-label">性别</text>
        <view class="setting-value">
          <text>{{ babyInfo.gender }}</text>
          <view class="arrow-icon">></view>
        </view>
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="settings-section">
      <view class="section-title">数据管理</view>
      <view class="setting-item" @click="exportData" v-if="false">
        <text class="setting-label">导出数据</text>
        <view class="setting-value">
          <view class="arrow-icon">></view>
        </view>
      </view>
      <view class="setting-item" @click="importData">
        <text class="setting-label">导入数据</text>
        <view class="setting-value">
          <view class="arrow-icon">></view>
        </view>
      </view>
      <view class="setting-item" @click="clearData" style="color: #ff3b30" v-if="false">
        <text class="setting-label">清空数据</text>
        <view class="setting-value">
          <view class="arrow-icon">></view>
        </view>
      </view>
    </view>

    <!-- WebDAV 云同步 -->
    <view class="settings-section">
      <view class="section-title">WebDAV 云同步</view>
      <view class="setting-item" @click="showWebdavConfig">
        <text class="setting-label">WebDAV 设置</text>
        <view class="setting-value">
          <text>{{ webdavConfigured ? '已配置' : '未配置' }}</text>
          <view class="arrow-icon">></view>
        </view>
      </view>
      <view class="setting-item" @click="testWebdavConnection" v-if="webdavConfigured">
        <text class="setting-label">测试连接</text>
        <view class="setting-value">
          <view class="arrow-icon">></view>
        </view>
      </view>
      <view class="setting-item" @click="uploadToWebdav" v-if="webdavConfigured">
        <text class="setting-label">上传到 WebDAV</text>
        <view class="setting-value">
          <view class="arrow-icon">></view>
        </view>
      </view>
      <view class="setting-item" @click="downloadFromWebdav" v-if="webdavConfigured">
        <text class="setting-label">从 WebDAV 下载</text>
        <view class="setting-value">
          <view class="arrow-icon">></view>
        </view>
      </view>
    </view>

    <!-- 关于 -->
    <view class="settings-section" v-if="false">
      <view class="section-title">关于</view>
      <view class="setting-item" @click="showAbout">
        <text class="setting-label">关于应用</text>
        <view class="setting-value">
          <view class="arrow-icon">></view>
        </view>
      </view>
      <view class="setting-item">
        <text class="setting-label">版本</text>
        <view class="setting-value">
          <text>1.0.0</text>
        </view>
      </view>
    </view>

    <!-- WebDAV 配置弹窗 -->
    <view class="modal-mask" v-if="showWebdavModal" @click="closeWebdavModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">WebDAV 配置</text>
          <text class="modal-close" @click="closeWebdavModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="label">服务器地址</text>
            <input type="text" v-model="tempWebdavConfig.url" placeholder="https://example.com/webdav" />
          </view>
          <view class="form-item">
            <text class="label">用户名</text>
            <input type="text" v-model="tempWebdavConfig.username" placeholder="请输入用户名" />
          </view>
          <view class="form-item">
            <text class="label">密码</text>
            <input type="password" v-model="tempWebdavConfig.password" placeholder="请输入密码" />
          </view>
          <view class="form-item">
            <text class="label">存储路径</text>
            <input type="text" v-model="tempWebdavConfig.path" placeholder="/baby_records" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeWebdavModal">取消</button>
          <button class="btn-confirm" @click="saveWebdavConfigFromModal">
            保存
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  import { getRecords, getBabyInfo, importRecords, setBabyInfo } from '@/utils/recordStore.js'
  // #ifdef H5
  import { createClient } from "webdav";
  // #endif
  // #ifndef H5
  import { AuthType, createClient } from "@/utils/webdav.js";
  // #endif

  export default {
    data() {
      return {
        babyInfo: {
          name: '宝宝',
          babyHashid: '',
          birthDate: '2025-01-13',
          gender: '男'
        },
        webdavConfig: {
          url: '',
          username: '',
          password: '',
          path: '/baby_records'
        },
        showWebdavModal: false,
        tempWebdavConfig: {
          url: '',
          username: '',
          password: '',
          path: '/baby_records'
        }
      }
    },
    computed: {
      webdavConfigured() {
        return this.webdavConfig.url && this.webdavConfig.username
      }
    },
    onLoad() {
      // 加载宝宝信息
      this.babyInfo = getBabyInfo()
      console.log('%c this.babyInfo', 'color:red; background:yellow;', this.babyInfo)
      // 加载 WebDAV 配置
      const savedWebdav = uni.getStorageSync('webdav_config')
      if (savedWebdav) {
        this.webdavConfig = savedWebdav
      }
    },
    methods: {
      editName() {
        uni.showModal({
          title: '编辑宝宝姓名',
          editable: true,
          placeholderText: '请输入宝宝姓名',
          content: this.babyInfo.name,
          success: (res) => {
            if (res.confirm && res.content && res.content.trim()) {
              this.babyInfo.name = res.content.trim()
              this.saveBabyInfo()
            }
          }
        })
      },

      editBirthDate() {
        uni.showModal({
          title: '编辑出生日期',
          editable: true,
          placeholderText: '格式：2025-01-13',
          content: this.babyInfo.birthDate,
          success: (res) => {
            if (res.confirm && res.content && res.content.trim()) {
              const dateStr = res.content.trim()
              // 验证日期格式 YYYY-MM-DD
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/
              if (dateRegex.test(dateStr)) {
                this.babyInfo.birthDate = dateStr
                this.saveBabyInfo()
              } else {
                uni.showToast({
                  title: '日期格式错误',
                  icon: 'none'
                })
              }
            }
          }
        })
      },

      editGender() {
        uni.showActionSheet({
          itemList: ['男', '女'],
          success: (res) => {
            if (res.tapIndex === 0) {
              this.babyInfo.gender = '男'
            } else if (res.tapIndex === 1) {
              this.babyInfo.gender = '女'
            }
            this.saveBabyInfo()
          }
        })
      },

      saveBabyInfo() {
        uni.setStorageSync('baby_info', this.babyInfo)
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        })
        // 通知首页更新年龄显示
        uni.$emit('babyInfoUpdated')
      },
      /**
       * 导出数据并分享
       */
      exportData() {
        // #ifdef APP-PLUS
        uni.showLoading({
          title: '导出中...'
        })

        // 获取所有记录
        const records = getRecords()

        // 准备导出数据 - 符合新数据结构
        const exportData = {
          version: '1.0.0',
          exportTime: new Date().toISOString(),
          babyInfo: this.babyInfo,
          kExportKeyEvents: records
        }

        // 转换为JSON字符串
        const jsonData = JSON.stringify(exportData, null, 2)

        // 写入临时文件
        const fileName = `baby_records_${Date.now()}.json`
        const filePath = `_doc/${fileName}`

        plus.io.resolveLocalFileSystemURL('_doc', (entry) => {
          entry.getFile(fileName, { create: true }, (fileEntry) => {
            fileEntry.createWriter((writer) => {
              writer.write(jsonData)
              writer.onwriteend = () => {
                uni.hideLoading()

                // 分享文件
                this.shareFile(filePath, fileName)
              }
            }, (e) => {
              uni.hideLoading()
              uni.showToast({
                title: '导出失败',
                icon: 'none'
              })
              console.error('创建文件写入器失败:', e)
            })
          }, (e) => {
            uni.hideLoading()
            uni.showToast({
              title: '导出失败',
              icon: 'none'
            })
            console.error('创建文件失败:', e)
          })
        }, (e) => {
          uni.hideLoading()
          uni.showToast({
            title: '导出失败',
            icon: 'none'
          })
          console.error('获取目录失败:', e)
        })
        // #endif

        // #ifndef APP-PLUS
        // H5环境下直接下载
        const records = getRecords()
        const exportData = {
          version: '1.0.0',
          exportTime: new Date().toISOString(),
          babyInfo: this.babyInfo,
          kExportKeyEvents: records
        }
        const jsonData = JSON.stringify(exportData, null, 2)
        const blob = new Blob([jsonData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `baby_records_${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
        uni.showToast({
          title: '导出成功',
          icon: 'success'
        })
        // #endif
      },

      /**
       * 分享文件到其他应用
       */
      shareFile(filePath, fileName) {
        // #ifdef APP-PLUS
        plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
          plus.share.sendWithSystem({
            type: 'file',
            content: '宝宝生活记录数据',
            pictures: [entry.toLocalURL()],
            thumbs: [entry.toLocalURL()]
          }, () => {
            console.log('分享成功')
          }, (e) => {
            console.error('分享失败:', e)
            uni.showToast({
              title: '分享失败',
              icon: 'none'
            })
          })
        }, (e) => {
          uni.showToast({
            title: '分享失败',
            icon: 'none'
          })
          console.error('解析文件失败:', e)
        })
        // #endif
      },

      /**
       * 导入数据
       */
      importData() {
        uni.showModal({
          title: '导入数据',
          content: '',
          editable: true,
          placeholderText: '请粘贴JSON格式的备份数据',
          success: (res) => {
            if (res.confirm && res.content && res.content.trim()) {
              uni.showLoading({
                title: '导入中...'
              })

              try {
                const data = JSON.parse(res.content)
                this.processImportData(data)
              } catch (e) {
                uni.hideLoading()
                uni.showToast({
                  title: '数据格式错误',
                  icon: 'none'
                })
                console.error('解析JSON失败:', e)
              }
            }
          }
        })
      },

      /**
       * 处理导入的数据
       */
      processImportData(object) {
        let data = {}
        for (const key in object) {
          if (!Object.hasOwn(object, key)) continue;

          const element = object[key];
          try {
            let list = JSON.parse(element)
            if (list.length) {
              data[key] = list
            }
          } catch (error) {
            console.log('JSON解析失败', key);
          }

        }
        // 支持新的数据结构格式
        const allRecords = []
        let successCount = 0

        // 1. 处理宝宝信息
        if (data.kExportKeyBabyInfos && Array.isArray(data.kExportKeyBabyInfos) && data.kExportKeyBabyInfos.length > 0) {
          const babyInfo = data.kExportKeyBabyInfos[0]
          this.babyInfo = {
            name: babyInfo.name || '宝宝',
            babyHashid: babyInfo.hashid || '',
            birthDate: babyInfo.birthday || '2025-01-13',
            gender: babyInfo.gender === '1' ? '男' : (babyInfo.gender === '0' ? '女' : '男'),
            dueDate: babyInfo.dueDate || null
          }
          uni.setStorageSync('baby_info', this.babyInfo)
        }

        // 2. 处理配方奶记录 (kExportKeyFormulas) → 转换为 feeding 类型
        if (data.kExportKeyFormulas && Array.isArray(data.kExportKeyFormulas)) {
          data.kExportKeyFormulas.forEach(item => {
            const feedingRecord = {
              babyHashid: item.babyHashid || '',
              name: item.name || '宝宝',
              dateString: item.dateString || '',
              eventType: 'feeding',
              eventTime: item.formulaFedTime || '',
              valueName: '配方奶',
              value: item.formulaFedAmount || '',
              note: item.note || '',
              hashid: item.hashid || '',
              uploaded: item.uploaded || 0,
              adduserid: item.adduserid || null,
              addusername: item.addusername || null
            }
            allRecords.push(feedingRecord)
          })
        }

        // 3. 处理大便记录 (kExportKeyCraps) → 转换为 stool 类型
        if (data.kExportKeyCraps && Array.isArray(data.kExportKeyCraps)) {
          data.kExportKeyCraps.forEach(item => {
            // 大便量映射：1:量少 2:量中等 3:量多
            const amountMap = {
              '1': '量少',
              '2': '量中等',
              '3': '量多'
            }
            // 大便颜色映射：1:黑色 2:黄色 3:绿色 4:棕色 5:红色 6:白色
            const colorMap = {
              '1': '黑色',
              '2': '黄色',
              '3': '绿色',
              '4': '棕色',
              '5': '红色',
              '6': '白色'
            }

            const crapAmountText = amountMap[item.crapAmount] || ''
            const crapColorText = colorMap[item.crapColor] || ''
            const valueName = crapAmountText ? (crapColorText ? `${crapAmountText} ${crapColorText}` : crapAmountText) : crapColorText

            const stoolRecord = {
              babyHashid: item.babyHashid || '',
              name: item.name || '宝宝',
              dateString: item.dateString || '',
              eventType: 'stool',
              eventTime: item.crapTime || '',
              valueName: valueName,
              value: '',
              note: item.note || '',
              hashid: item.hashid || '',
              uploaded: item.uploaded || 0,
              adduserid: item.adduserid || null,
              addusername: item.addusername || null
            }
            allRecords.push(stoolRecord)
          })
        }

        // 4. 处理事件记录 (kExportKeyEvents) - 药品、营养品等
        if (data.kExportKeyEvents && Array.isArray(data.kExportKeyEvents)) {
          data.kExportKeyEvents.forEach(item => {
            const eventRecord = {
              babyHashid: item.babyHashid || '',
              name: item.name || '宝宝',
              dateString: item.dateString || '',
              eventType: item.eventType || '',
              eventTime: item.eventTime || '',
              valueName: item.valueName || '',
              value: item.value || '',
              note: item.note || '',
              hashid: item.hashid || '',
              uploaded: item.uploaded || 0,
              adduserid: item.adduserid || null,
              addusername: item.addusername || null
            }
            allRecords.push(eventRecord)
          })
        }

        // 检查是否有数据
        if (allRecords.length === 0) {
          uni.hideLoading()
          uni.showToast({
            title: '数据格式错误或为空',
            icon: 'none'
          })
          return
        }

        // 导入记录
        successCount = importRecords(allRecords)

        uni.hideLoading()

        uni.showToast({
          title: `成功导入${successCount}条记录`,
          icon: 'success'
        })

        // 发送数据更新通知
        uni.$emit('recordUpdated')
      },

      clearData() {
        uni.showModal({
          title: '确认清空',
          content: '确定要清空所有数据吗？此操作不可恢复。',
          success: (res) => {
            if (res.confirm) {
              uni.clearStorageSync()
              this.babyInfo = {
                name: '宝宝',
                babyHashid: '',
                birthDate: '2025-01-13',
                gender: '男'
              }
              uni.$emit('recordUpdated')
              uni.showToast({
                title: '数据已清空',
                icon: 'success'
              });
            }
          }
        });
      },
      showAbout() {
        uni.showToast({
          title: '关于应用',
          icon: 'none'
        });
      },

      /**
       * 将 WebDAV URL 转换为代理 URL（解决 CORS 问题）
       */
      getProxyUrl(url) {
        try {
          // 判断是否在开发环境
          // #ifdef H5
          // 开发环境使用代理
          const urlObj = new URL(url)
          if (import.meta.env.DEV || true) {
            return '/webdav' + urlObj.pathname
          } else {
            return url
          }
          // #endif

          // #ifndef H5
          // 非 H5 环境（APP、小程序等）直接返回原 URL
          return url
          // #endif
        } catch (e) {
          console.error('URL 转换失败:', e)
          return url
        }
      },

      /**
       * 构建 WebDAV 认证配置列表
       */
      getWebdavAuthConfigs() {
        const baseClientConfig = {
          username: this.webdavConfig.username,
          password: this.webdavConfig.password,
        }
        const isJianguoyun = String(this.webdavConfig.url || '').toLowerCase().includes('jianguoyun.com')

        // #ifdef H5
        return [baseClientConfig]
        // #endif

        // #ifndef H5
        const jianguoyunHeaders = {
          // 坚果云对部分非浏览器端请求较敏感，补齐常见头提升兼容性
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36',
          'Accept': '*/*'
        }
        // 坚果云在当前 APP 端实现中 Digest 兼容性较差，优先（且仅）走 Password。
        if (isJianguoyun) {
          return [{ ...baseClientConfig, authType: AuthType.Password, headers: jianguoyunHeaders }]
        }
        // 其他服务优先 Digest（部分 WebDAV 服务器仅接受 Digest），失败后回退 Password。
        return [
          { ...baseClientConfig, authType: AuthType.Digest },
          { ...baseClientConfig, authType: AuthType.Password }
        ]
        // #endif
      },

      /**
       * 判断是否需要尝试下一种认证方式
       */
      shouldRetryWebdavAuth(error) {
        const msg = String(error?.message || '').toLowerCase()
        const statusCode = String(error?.response?.status || '')
        const errorText = `${msg} ${statusCode}`
        return (
          errorText.includes('www-authenticate') ||
          errorText.includes('invalid response: 401')
        )
      },

      /**
       * 是否为可识别的 HTTP 状态错误
       */
      isWebdavHttpStatusError(error) {
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
      },

      base64Encode(input) {
        try {
          // #ifdef H5
          return btoa(input)
          // #endif
          // #ifndef H5
          return plus.io.convertLocalFileSystemURL ? btoa(input) : btoa(input)
          // #endif
        } catch (e) {
          // 兼容某些运行环境缺少 btoa 的场景
          return Buffer.from(input, 'utf-8').toString('base64')
        }
      },

      buildWebdavBasicAuthHeader() {
        const credentials = `${this.webdavConfig.username}:${this.webdavConfig.password || ''}`
        return `Basic ${this.base64Encode(credentials)}`
      },

      requestWebdavPropfind(path) {
        const targetUrl = `${this.webdavConfig.url.replace(/\/+$/, '')}/${this.getWebdavClientPath(path)}`
        return new Promise((resolve, reject) => {
          uni.request({
            url: targetUrl,
            method: 'PROPFIND',
            sslVerify: false,
            header: {
              Authorization: this.buildWebdavBasicAuthHeader(),
              Depth: '0',
              Accept: 'text/plain,application/xml'
            },
            success: (res) => resolve(res),
            fail: (err) => reject(err)
          })
        })
      },

      requestWebdavRaw(method, path, options = {}) {
        const baseUrl = this.webdavConfig.url.replace(/\/+$/, '')
        const clientPath = this.getWebdavClientPath(path)
        const targetUrl = clientPath ? `${baseUrl}/${clientPath}` : `${baseUrl}/`
        return new Promise((resolve, reject) => {
          uni.request({
            url: targetUrl,
            method,
            sslVerify: false,
            data: options.data,
            header: {
              Authorization: this.buildWebdavBasicAuthHeader(),
              Accept: 'text/plain,application/xml,*/*',
              ...(options.headers || {})
            },
            success: (res) => resolve(res),
            fail: (err) => reject(err)
          })
        })
      },

      parseBackupFilesFromPropfind(xmlText) {
        const content = String(xmlText || '')
        const matches = [...content.matchAll(/<d:href>([^<]+)<\/d:href>/g)]
        return matches
          .map(m => decodeURIComponent(String(m[1] || '')))
          .map(href => href.split('/').filter(Boolean).pop() || '')
          .filter(name => name.startsWith('baby_records_backup_') && name.endsWith('.json'))
      },

      buildWebdavExportPayload() {
        let records = getRecords()
        // 兼容历史数据结构：某些场景本地可能存成 { records } 或 { kExportKeyEvents }
        if (!Array.isArray(records) || records.length === 0) {
          const rawLocal = uni.getStorageSync('baby_records')
          let parsedLocal = rawLocal
          if (typeof rawLocal === 'string') {
            try {
              parsedLocal = JSON.parse(rawLocal)
            } catch (e) {
              parsedLocal = null
            }
          }
          if (parsedLocal && typeof parsedLocal === 'object') {
            if (Array.isArray(parsedLocal.records) && parsedLocal.records.length > 0) {
              records = parsedLocal.records
            } else if (Array.isArray(parsedLocal.kExportKeyEvents) && parsedLocal.kExportKeyEvents.length > 0) {
              records = parsedLocal.kExportKeyEvents
            }
          }
        }
        if (!Array.isArray(records)) {
          records = []
        }
        return {
          version: '1.0.0',
          exportTime: new Date().toISOString(),
          babyInfo: this.babyInfo,
          // 统一保留新旧字段，保证 H5/App 上传内容结构一致
          records: records,
          kExportKeyEvents: records
        }
      },

      /**
       * 兼容不同端的 WebDAV 路径格式
       * APP 端在 baseURL 含路径前缀时（如 /dav/），应优先使用相对路径避免前缀被绝对路径覆盖。
       */
      getWebdavClientPath(path) {
        const rawPath = String(path || '/').trim() || '/'
        // #ifdef H5
        return rawPath
        // #endif
        // #ifndef H5
        if (rawPath === '/') {
          return ''
        }
        return rawPath.replace(/^\/+/, '')
        // #endif
      },

      /**
       * 使用多认证方式执行 WebDAV 操作
       */
      async runWebdavWithFallback(operation) {
        const authConfigs = this.getWebdavAuthConfigs()
        let lastError = null
        let preferredError = null

        for (let i = 0; i < authConfigs.length; i++) {
          const config = authConfigs[i]
          try {
            const client = createClient(
              this.getProxyUrl(this.webdavConfig.url),
              config
            )
            return await operation(client, config)
          } catch (err) {
            lastError = err
            if (this.isWebdavHttpStatusError(err)) {
              preferredError = err
            }
            const hasNext = i < authConfigs.length - 1
            if (hasNext && this.shouldRetryWebdavAuth(err)) {
              continue
            }
            break
          }
        }

        // 避免 Digest 解析异常覆盖真实的 HTTP 状态错误
        throw (preferredError || lastError)
      },

      async checkWebdavAccessByClient(client, path) {
        const clientPath = this.getWebdavClientPath(path)
        try {
          const exists = await client.exists(clientPath)
          return { ok: true, exists }
        } catch (err) {
          const errText = `${String(err?.message || '')} ${String(err?.response?.status || '')}`
          if (!errText.includes('403')) {
            throw err
          }
        }

        // 某些 WebDAV 服务会拒绝 exists 使用的方法，改用目录读取再次验证连通性。
        try {
          await client.getDirectoryContents(clientPath)
          return { ok: true, exists: true, by: 'list' }
        } catch (listErr) {
          throw listErr
        }
      },

      /**
       * 显示 WebDAV 配置对话框
       */
      showWebdavConfig() {
        // 复制当前配置到临时配置
        this.tempWebdavConfig = {
          url: this.webdavConfig.url,
          username: this.webdavConfig.username,
          password: this.webdavConfig.password,
          path: this.webdavConfig.path
        }
        // 显示弹窗
        this.showWebdavModal = true
      },

      /**
       * 关闭 WebDAV 配置弹窗
       */
      closeWebdavModal() {
        this.showWebdavModal = false
      },

      /**
       * 从弹窗保存 WebDAV 配置
       */
      saveWebdavConfigFromModal() {
        // 验证必填项
        if (!this.tempWebdavConfig.url || !this.tempWebdavConfig.url.trim()) {
          uni.showToast({
            title: '请输入服务器地址',
            icon: 'none'
          })
          return
        }

        if (!this.tempWebdavConfig.username || !this.tempWebdavConfig.username.trim()) {
          uni.showToast({
            title: '请输入用户名',
            icon: 'none'
          })
          return
        }

        // 保存配置
        this.webdavConfig = {
          url: this.tempWebdavConfig.url.trim(),
          username: this.tempWebdavConfig.username.trim(),
          password: this.tempWebdavConfig.password || '',
          path: this.tempWebdavConfig.path.trim() || '/baby_records'
        }

        uni.setStorageSync('webdav_config', this.webdavConfig)
        this.closeWebdavModal()

        uni.showToast({
          title: '配置已保存',
          icon: 'success'
        })
      },

      /**
       * 测试 WebDAV 连接
       */
      async testWebdavConnection() {
        uni.showLoading({
          title: '测试连接中...'
        })

        try {
          const testPath = this.webdavConfig.path || '/baby_records'

          // #ifndef H5
          // APP 端优先使用原生 PROPFIND 进行连通性验证，规避 webdav.js 在部分服务的兼容问题。
          try {
            const res = await this.requestWebdavPropfind(testPath)
            const code = Number(res?.statusCode || 0)
            if (code === 200 || code === 207) {
              uni.hideLoading()
              uni.showToast({
                title: '连接成功',
                icon: 'success'
              })
              return
            }
            if (code === 404) {
              uni.hideLoading()
              uni.showToast({
                title: '路径不存在',
                icon: 'none'
              })
              return
            }
            if (code === 401) {
              uni.hideLoading()
              uni.showToast({
                title: '认证失败，请检查用户名和密码',
                icon: 'none'
              })
              return
            }
            if (code === 403) {
              uni.hideLoading()
              uni.showToast({
                title: '连接成功（当前目录权限受限）',
                icon: 'success',
                duration: 3000
              })
              return
            }
          } catch (appErr) {
            // 忽略原生探测异常，继续走通用探测兜底
          }
          // #endif

          let exists = false

          try {
            const result = await this.runWebdavWithFallback((client) => this.checkWebdavAccessByClient(client, testPath))
            exists = !!result.exists
          } catch (pathError) {
            const pathErrorText = `${String(pathError?.message || '')} ${String(pathError?.response?.status || '')}`
            if (pathErrorText.includes('403') && testPath !== '/') {
              // 目标目录权限受限时，继续探测根目录可达性，区分“目录权限问题”和“连接问题”。
              await this.runWebdavWithFallback((client) => this.checkWebdavAccessByClient(client, '/'))
              uni.hideLoading()
              uni.showToast({
                title: '连接成功（当前目录权限受限）',
                icon: 'success',
                duration: 3000
              })
              return
            }
            throw pathError
          }

          uni.hideLoading()

          if (exists) {
            uni.showToast({
              title: '连接成功',
              icon: 'success'
            })
          } else {
            uni.showToast({
              title: '连接成功（目录不存在）',
              icon: 'success'
            })
          }
        } catch (error) {
          const rawErrorMsg = String(error?.message || '')
          const statusCode = String(error?.response?.status || '')
          const errorText = `${rawErrorMsg} ${statusCode}`

          // 对测试连接而言，403 说明服务可达且认证成功，仅当前目录权限受限。
          if (errorText.includes('403')) {
            uni.hideLoading()
            uni.showToast({
              title: '连接成功（目录权限受限）',
              icon: 'success',
              duration: 3000
            })
            return
          }

          uni.hideLoading()
          console.error('WebDAV 连接测试失败:', error)

          let errorMsg = '连接失败'

          if (errorText) {
            if (errorText.includes('401')) {
              errorMsg = '认证失败，请检查用户名和密码'
            } else if (errorText.includes('404')) {
              errorMsg = '路径不存在'
            } else if (errorText.includes('403')) {
              const isJianguoyun = String(this.webdavConfig.url || '').toLowerCase().includes('jianguoyun.com')
              errorMsg = isJianguoyun
                ? '坚果云403：请使用应用密码，并确认地址为 https://dav.jianguoyun.com/dav/'
                : '连接成功但目录无权限，请检查同步路径'
            } else if (errorText.includes('timeout') || errorText.toLowerCase().includes('network')) {
              errorMsg = '网络连接超时'
            }
          }

          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          })
        }
      },

      /**
       * 上传数据到 WebDAV
       */
      uploadToWebdav() {
        uni.showModal({
          title: '确认上传',
          content: '确定要上传数据到 WebDAV 吗？',
          success: (res) => {
            if (res.confirm) {
              this.performWebdavUpload()
            }
          }
        })
      },

      /**
       * 执行 WebDAV 上传
       */
      async performWebdavUpload() {
        uni.showLoading({
          title: '上传中...'
        })

        try {
          // #ifndef H5
          const exportData = this.buildWebdavExportPayload()
          const jsonData = JSON.stringify(exportData, null, 2)
          const basePath = this.webdavConfig.path || '/baby_records'
          const fileName = `baby_records_backup_${Date.now()}.json`
          const fullPath = `${basePath.replace(/\/+$/, '')}/${fileName}`
          const latestPath = `${basePath.replace(/\/+$/, '')}/baby_records_latest.json`

          // 目录不存在时尝试创建（MKCOL）
          const checkRes = await this.requestWebdavRaw('PROPFIND', basePath, { headers: { Depth: '0' } })
          if (Number(checkRes?.statusCode) === 404) {
            const mkcolRes = await this.requestWebdavRaw('MKCOL', basePath)
            const mkcolCode = Number(mkcolRes?.statusCode || 0)
            if (![200, 201, 204, 405].includes(mkcolCode)) {
              throw new Error(`MKCOL failed: ${mkcolCode}`)
            }
          }

          const putRes = await this.requestWebdavRaw('PUT', fullPath, {
            data: jsonData,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          })
          const putCode = Number(putRes?.statusCode || 0)
          if (![200, 201, 204].includes(putCode)) {
            throw new Error(`PUT failed: ${putCode}`)
          }

          // 维护固定文件，兼容禁止目录列举（PROPFIND Depth:1 返回 403）的服务端。
          const latestRes = await this.requestWebdavRaw('PUT', latestPath, {
            data: jsonData,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          })
          const latestCode = Number(latestRes?.statusCode || 0)
          if (![200, 201, 204].includes(latestCode)) {
            throw new Error(`PUT latest failed: ${latestCode}`)
          }

          uni.hideLoading()
          uni.showToast({
            title: '上传成功',
            icon: 'success'
          })
          return
          // #endif

          await this.runWebdavWithFallback(async (client) => {
            const exportData = this.buildWebdavExportPayload()
            const jsonData = JSON.stringify(exportData, null, 2)
            const fileName = `baby_records_backup_${Date.now()}.json`
            const fullPath = `${this.getWebdavClientPath(this.webdavConfig.path || '/baby_records')}/${fileName}`

            // 检查目录是否存在，不存在则创建
            const basePath = this.webdavConfig.path || '/baby_records'
            const clientBasePath = this.getWebdavClientPath(basePath)
            const exists = await client.exists(clientBasePath)
            if (!exists) {
              await client.createDirectory(clientBasePath)
            }

            // 上传文件
            await client.putFileContents(fullPath, jsonData, {
              format: 'text',
              overwrite: true
            })
          })

          uni.hideLoading()

          uni.showToast({
            title: '上传成功',
            icon: 'success'
          })
        } catch (error) {
          uni.hideLoading()
          console.error('WebDAV 上传失败:', error)

          let errorMsg = '上传失败'
          if (error.message) {
            if (error.message.includes('401')) {
              errorMsg = '认证失败'
            } else if (error.message.includes('403')) {
              errorMsg = '权限不足'
            } else if (error.message.includes('timeout') || error.message.includes('network')) {
              errorMsg = '网络连接失败'
            } else if (error.message.includes('507')) {
              errorMsg = '服务器空间不足'
            }
          }

          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          })
        }
      },

      /**
       * 从 WebDAV 下载数据
       */
      downloadFromWebdav() {
        uni.showModal({
          title: '确认下载',
          content: '确定要从 WebDAV 下载数据吗？这将覆盖本地数据。',
          success: (res) => {
            if (res.confirm) {
              this.performWebdavDownload()
            }
          }
        })
      },

      /**
       * 执行 WebDAV 下载
       */
      async performWebdavDownload() {
        uni.showLoading({
          title: '下载中...'
        })

        try {
          // #ifndef H5
          const basePath = this.webdavConfig.path || '/baby_records'
          const listRes = await this.requestWebdavRaw('PROPFIND', basePath, { headers: { Depth: '1' } })
          const listCode = Number(listRes?.statusCode || 0)
          if (listCode === 404) {
            uni.hideLoading()
            uni.showToast({
              title: '备份目录不存在',
              icon: 'none'
            })
            return
          }
          if (listCode === 403) {
            // 服务端禁止目录列举时，回退读取固定最新备份文件。
            const latestPath = `${basePath.replace(/\/+$/, '')}/baby_records_latest.json`
            const latestRes = await this.requestWebdavRaw('GET', latestPath, {
              headers: { Accept: 'application/json,text/plain,*/*' }
            })
            const latestCode = Number(latestRes?.statusCode || 0)
            if (latestCode !== 200) {
              throw new Error(`GET latest failed: ${latestCode}`)
            }

            uni.hideLoading()
            try {
              const text = typeof latestRes.data === 'string' ? latestRes.data : JSON.stringify(latestRes.data || {})
              const data = JSON.parse(text)
              this.processWebdavImport(data)
            } catch (e) {
              uni.showToast({
                title: '数据格式错误',
                icon: 'none'
              })
              console.error('解析 JSON 失败:', e)
            }
            return
          }
          if (![200, 207].includes(listCode)) {
            throw new Error(`PROPFIND failed: ${listCode}`)
          }

          const backupFiles = this.parseBackupFilesFromPropfind(listRes?.data)
            .map(name => ({ basename: name, timestamp: this.extractTimestamp(name) }))
            .filter(item => item.timestamp > 0)
            .sort((a, b) => b.timestamp - a.timestamp)

          if (backupFiles.length === 0) {
            uni.hideLoading()
            uni.showToast({
              title: '没有找到备份文件',
              icon: 'none'
            })
            return
          }

          const latest = backupFiles[0]
          const filePath = `${basePath.replace(/\/+$/, '')}/${latest.basename}`
          const fileRes = await this.requestWebdavRaw('GET', filePath, {
            headers: { Accept: 'application/json,text/plain,*/*' }
          })
          const fileCode = Number(fileRes?.statusCode || 0)
          if (fileCode !== 200) {
            throw new Error(`GET failed: ${fileCode}`)
          }

          uni.hideLoading()
          try {
            const text = typeof fileRes.data === 'string' ? fileRes.data : JSON.stringify(fileRes.data || {})
            const data = JSON.parse(text)
            this.processWebdavImport(data)
          } catch (e) {
            uni.showToast({
              title: '数据格式错误',
              icon: 'none'
            })
            console.error('解析 JSON 失败:', e)
          }
          return
          // #endif

          const result = await this.runWebdavWithFallback(async (client) => {
            const basePath = this.webdavConfig.path || '/baby_records'
            const clientBasePath = this.getWebdavClientPath(basePath)

            // 检查目录是否存在
            const exists = await client.exists(clientBasePath)
            if (!exists) {
              return { status: 'not_found' }
            }

            // 获取目录内容
            const contents = await client.getDirectoryContents(clientBasePath)

            // 筛选出备份文件
            const backupFiles = contents
              .filter(item => item.basename.startsWith('baby_records_backup_') && item.basename.endsWith('.json'))
              .map(item => ({
                href: item.href || item.filename,
                basename: item.basename,
                timestamp: this.extractTimestamp(item.basename)
              }))

            if (backupFiles.length === 0) {
              return { status: 'empty' }
            }

            // 按时间戳降序排序，取最新的
            backupFiles.sort((a, b) => b.timestamp - a.timestamp)

            // 下载最新的文件
            const latestFile = backupFiles[0]
            const filePath = `${clientBasePath}/${latestFile.basename}`
            const fileContent = await client.getFileContents(filePath, { format: 'text' })
            return { status: 'ok', fileContent }
          })

          uni.hideLoading()

          if (result.status === 'not_found') {
            uni.showToast({
              title: '备份目录不存在',
              icon: 'none'
            })
            return
          }

          if (result.status === 'empty') {
            uni.showToast({
              title: '没有找到备份文件',
              icon: 'none'
            })
            return
          }

          // 解析并导入数据
          try {
            const data = JSON.parse(result.fileContent)
            this.processWebdavImport(data)
          } catch (e) {
            uni.showToast({
              title: '数据格式错误',
              icon: 'none'
            })
            console.error('解析 JSON 失败:', e)
          }
        } catch (error) {
          uni.hideLoading()
          console.error('WebDAV 下载失败:', error)

          let errorMsg = '下载失败'
          if (error.message) {
            if (error.message.includes('401')) {
              errorMsg = '认证失败'
            } else if (error.message.includes('404')) {
              errorMsg = '备份文件不存在'
            } else if (error.message.includes('403')) {
              errorMsg = '权限不足'
            } else if (error.message.includes('timeout') || error.message.includes('network')) {
              errorMsg = '网络连接失败'
            }
          }

          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          })
        }
      },

      /**
       * 从文件名中提取时间戳
       */
      extractTimestamp(filename) {
        const match = filename.match(/baby_records_backup_(\d+)\.json/)
        return match ? parseInt(match[1]) : 0
      },

      /**
       * 处理 WebDAV 导入的数据
       */
      processWebdavImport(data) {
        try {
          // 导入宝宝信息
          if (data.babyInfo) {
            this.babyInfo = data.babyInfo
            uni.setStorageSync('baby_info', this.babyInfo)
          }

          // 导入记录（兼容 records / kExportKeyEvents 两种字段）
          const importList = Array.isArray(data.records)
            ? data.records
            : (Array.isArray(data.kExportKeyEvents) ? data.kExportKeyEvents : [])

          if (importList.length > 0) {
            const successCount = importRecords(importList)
            uni.showToast({
              title: `成功导入${successCount}条记录`,
              icon: 'success'
            })
            // 发送数据更新通知
            uni.$emit('recordUpdated')
            uni.$emit('babyInfoUpdated')
          } else {
            uni.showToast({
              title: '导入数据格式错误',
              icon: 'none'
            })
          }
        } catch (e) {
          uni.showToast({
            title: '导入数据失败',
            icon: 'none'
          })
          console.error('处理 WebDAV 导入失败:', e)
        }
      }
    }
  }
</script>

<style>
  .content {
    padding: 15px;
    background-color: #f5f5f5;
    min-height: calc(100vh - 124px);
  }

  .settings-section {
    background-color: #ffffff;
    border-radius: 10rpx;
    margin-bottom: 20rpx;
    overflow: hidden;
  }

  .section-title {
    font-size: 28rpx;
    font-weight: 500;
    color: #999999;
    padding: 20rpx;
    background-color: #f8f8f8;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25rpx 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }

  .setting-item:last-child {
    border-bottom: none;
  }

  .setting-label {
    font-size: 28rpx;
    color: #333333;
  }

  .setting-value {
    display: flex;
    align-items: center;
  }

  .setting-value text {
    font-size: 26rpx;
    color: #999999;
    margin-right: 10rpx;
  }

  .arrow-icon {
    font-size: 24rpx;
    color: #cccccc;
  }

  /* WebDAV 配置弹窗样式 */
  .modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-content {
    width: 90%;
    max-width: 600rpx;
    background-color: #ffffff;
    border-radius: 16rpx;
    overflow: hidden;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
    flex-shrink: 0;
  }

  .modal-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
  }

  .modal-close {
    font-size: 48rpx;
    color: #999999;
    line-height: 1;
    padding: 0 10rpx;
  }

  .modal-body {
    padding: 30rpx;
    overflow-y: auto;
    flex: 1;
  }

  .modal-body .form-item {
    margin-bottom: 30rpx;
  }

  .modal-body .label {
    display: block;
    font-size: 28rpx;
    font-weight: 500;
    color: #333333;
    margin-bottom: 15rpx;
  }

  .modal-body input {
    width: 100%;
    box-sizing: border-box;
    border: 1rpx solid #e0e0e0;
    border-radius: 8rpx;
    padding: 20rpx;
    font-size: 28rpx;
    min-height: 80rpx;
  }

  .modal-footer {
    display: flex;
    padding: 30rpx;
    border-top: 1rpx solid #f0f0f0;
    flex-shrink: 0;
  }

  .btn-cancel,
  .btn-confirm {
    flex: 1;
    padding: 20rpx;
    border-radius: 8rpx;
    font-size: 28rpx;
    text-align: center;
    margin: 0 10rpx;
  }

  .btn-cancel {
    background-color: #f5f5f5;
    color: #666666;
  }

  .btn-confirm {
    background-color: #4cd964;
    color: #ffffff;
  }
</style>
