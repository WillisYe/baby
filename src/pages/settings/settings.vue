<template>
  <view class="content">
    <!-- 宝宝信息设置 -->
    <view class="settings-section">
      <view class="section-title">宝宝信息</view>
      <view class="setting-item avatar-item" @click="changeBabyAvatar">
        <text class="setting-label">宝宝头像</text>
        <view class="setting-value avatar-value">
          <image v-if="babyInfo.avatarUrl" :src="babyInfo.avatarUrl" class="avatar-preview" mode="aspectFill" />
          <view v-else class="avatar-placeholder">👶</view>
          <view class="arrow-icon">></view>
        </view>
      </view>
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
      <view class="setting-item" @click="useShareCode">
        <text class="setting-label">使用分享码导入</text>
        <view class="setting-value">
          <view class="arrow-icon">></view>
        </view>
      </view>
      <view class="setting-item" @click="copyDeviceId">
        <text class="setting-label">复制 deviceId 分享</text>
        <view class="setting-value">
          <text>{{ deviceId ? '复制' : '未获取' }}</text>
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

    <!-- #ifdef H5 -->
    <!-- 应用下载 -->
    <view class="settings-section">
      <view class="section-title">应用下载</view>
      <view class="setting-item" @click="downloadApp">
        <text class="setting-label">下载 APK</text>
        <view class="setting-value">
          <text>获取最新版本</text>
          <view class="arrow-icon">></view>
        </view>
      </view>
    </view>
    <!-- #endif -->

    <!-- #ifdef APP-PLUS -->
    <!-- 关于 -->
    <view class="settings-section">
      <view class="section-title">关于</view>
      <view class="setting-item" @click="showAbout">
        <text class="setting-label">关于应用</text>
        <view class="setting-value">
          <view class="arrow-icon">></view>
        </view>
      </view>
      <view class="setting-item">
        <text class="setting-label">版本名称</text>
        <view class="setting-value">
          <text>{{ currentInfo.versionName }}</text>
        </view>
      </view>
      <view class="setting-item">
        <text class="setting-label">版本号</text>
        <view class="setting-value">
          <text>{{ currentInfo.versionCode }}</text>
        </view>
      </view>
    </view>
    <!-- #endif -->

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
  import { getItem } from '@/utils/api.js'
  import webdav from '@/utils/webdavService.js'
  import { getCurrentVersionInfo, checkAppHotUpdate } from '@/utils/appUpdate.js'

  export default {
    data() {
      return {
        babyInfo: {
          name: '宝宝',
          babyHashid: '',
          birthDate: '2025-01-13',
          gender: '男',
          avatarUrl: ''
        },
        deviceId: '',
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
        },
        currentInfo: {}
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
      // 加载 deviceId
      try {
        const systemInfo = uni.getSystemInfoSync() || {}
        this.deviceId = systemInfo.deviceId || ''
      } catch (e) {
        this.deviceId = ''
      }
      // 加载 WebDAV 配置
      const savedWebdav = uni.getStorageSync('webdav_config')
      if (savedWebdav) {
        this.webdavConfig = savedWebdav
      }
    },
    async onShow() {
      // #ifdef APP-PLUS
      this.currentInfo = await getCurrentVersionInfo()
      checkAppHotUpdate()
      // #endif
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
       * 更换宝宝头像
       */
      changeBabyAvatar() {
        uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: async (res) => {
            if (res.tempFilePaths && res.tempFilePaths.length > 0) {
              try {
                const avatarUrl = await this.resolveAvatarPath(res.tempFilePaths[0])
                this.babyInfo.avatarUrl = avatarUrl
                console.log('%c avatarUrl', 'color:red; background:yellow;', avatarUrl)
                this.saveBabyInfo()
              } catch (error) {
                console.error('保存宝宝头像失败:', error)
                uni.showToast({
                  title: '保存头像失败',
                  icon: 'none'
                })
              }
            }
          },
          fail: (err) => {
            console.error('选择宝宝头像失败:', err)
          }
        })
      },

      useShareCode() {
        uni.showModal({
          title: '使用分享码导入',
          editable: true,
          placeholderText: '请输入分享码',
          success: async (res) => {
            if (res.confirm && res.content && res.content.trim()) {
              const shareCode = res.content.trim()
              uni.showLoading({ title: '导入中...' })
              try {
                await this.fetchSharedDataByCode(shareCode)
                uni.setStorageSync('share_code', shareCode)
                uni.showToast({ title: '导入成功', icon: 'success' })
              } catch (error) {
                console.error('分享码导入失败:', error)
                uni.showToast({ title: error.message || '分享码导入失败', icon: 'none' })
              } finally {
                uni.hideLoading()
              }
            }
          }
        })
      },

      copyDeviceId() {
        if (!this.deviceId) {
          uni.showToast({ title: '无法获取 deviceId', icon: 'none' })
          return
        }
        uni.setClipboardData({
          data: this.deviceId,
          success: () => {
            uni.showToast({ title: 'deviceId 已复制到剪贴板', icon: 'success' })
          },
          fail: () => {
            uni.showToast({ title: '复制失败，请重试', icon: 'none' })
          }
        })
      },

      async fetchSharedDataByCode(code) {
        if (!code) {
          throw new Error('分享码不能为空')
        }

        const response = await getItem(code)
        if (!response || response.statusCode !== 200) {
          throw new Error('获取分享数据失败')
        }

        const responseData = response.data || {}
        if (typeof responseData.success !== 'undefined' && !responseData.success) {
          throw new Error(responseData.message || '分享码无效')
        }

        const payload = responseData.data || responseData
        if (!payload || Object.keys(payload).length === 0) {
          throw new Error('分享数据为空')
        }

        this.applySharedData(payload)
      },

      applySharedData(payload) {
        let babyInfo = null
        if (payload.babyInfo) {
          babyInfo = payload.babyInfo
        } else if (Array.isArray(payload.kExportKeyBabyInfos) && payload.kExportKeyBabyInfos.length > 0) {
          babyInfo = payload.kExportKeyBabyInfos[0]
        }

        if (babyInfo) {
          this.babyInfo = {
            name: babyInfo.name || '宝宝',
            babyHashid: babyInfo.babyHashid || babyInfo.hashid || '',
            birthDate: babyInfo.birthDate || babyInfo.birthday || '2025-01-13',
            gender: babyInfo.gender === '1' ? '男' : (babyInfo.gender === '0' ? '女' : (babyInfo.gender || '男')),
            avatarUrl: babyInfo.avatarUrl || ''
          }
          setBabyInfo(this.babyInfo)
        }

        let recordList = []
        if (Array.isArray(payload.records)) {
          recordList = payload.records
        } else if (Array.isArray(payload.kExportKeyEvents)) {
          recordList = payload.kExportKeyEvents
        }

        uni.setStorageSync('baby_records', JSON.stringify(recordList || []))
        uni.$emit('recordUpdated')
        uni.$emit('babyInfoUpdated')
      },

      resolveAvatarPath(tempPath) {
        return new Promise((resolve, reject) => {
          if (!tempPath) {
            return reject(new Error('头像路径无效'))
          }

          if (tempPath.startsWith('data:')) {
            return resolve(tempPath)
          }

          if (tempPath.startsWith('blob:')) {
            fetch(tempPath)
              .then(response => response.blob())
              .then(blob => {
                const reader = new FileReader()
                reader.onloadend = () => {
                  if (reader.result) {
                    resolve(reader.result.toString())
                  } else {
                    reject(new Error('读取头像数据失败'))
                  }
                }
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
              .catch(reject)
            return
          }

          // #ifdef APP-PLUS
          uni.saveFile({
            tempFilePath: tempPath,
            success: (saveRes) => {
              resolve(saveRes.savedFilePath || tempPath)
            },
            fail: () => {
              resolve(tempPath)
            }
          })
          // #endif

          // #ifndef APP-PLUS
          resolve(tempPath)
          // #endif
        })
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
          title: `版本号：${this.currentInfo.versionName}，versionCode：${this.currentInfo.versionCode}`,
          icon: 'none'
        });
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
          const [result, error] = await webdav.test({
            config: this.webdavConfig
          })

          uni.hideLoading()

          if (error) {
            throw error
          }

          if (result.status === 'ok') {
            uni.showToast({
              title: '连接成功',
              icon: 'success'
            })
            return
          }

          if (result.status === 'forbidden') {
            uni.showToast({
              title: '✔️ 连接成功（当前目录权限受限）',
              icon: 'none',
              duration: 3000
            })
            return
          }

          if (result.status === 'not_found') {
            uni.showToast({
              title: '路径不存在',
              icon: 'none'
            })
            return
          }

          if (result.status === 'unauthorized') {
            uni.showToast({
              title: '认证失败，请检查用户名和密码',
              icon: 'none'
            })
            return
          }

          uni.showToast({
            title: '连接失败',
            icon: 'none'
          })
        } catch (error) {
          uni.hideLoading()
          console.error('WebDAV 连接测试失败:', error)

          const errorText = String(error?.message || '').toLowerCase()
          let errorMsg = '连接失败'

          if (errorText.includes('401')) {
            errorMsg = '认证失败，请检查用户名和密码'
          } else if (errorText.includes('404')) {
            errorMsg = '路径不存在'
          } else if (errorText.includes('403')) {
            errorMsg = String(this.webdavConfig.url || '').toLowerCase().includes('jianguoyun.com')
              ? '坚果云403：请使用应用密码，并确认地址为 https://dav.jianguoyun.com/dav/'
              : '连接成功但目录无权限，请检查同步路径'
          } else if (errorText.includes('timeout') || errorText.includes('network')) {
            errorMsg = '网络连接超时'
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
          const exportData = this.buildWebdavExportPayload()
          const [result, error] = await webdav.upload({
            config: this.webdavConfig,
            data: exportData
          })

          uni.hideLoading()

          if (error) {
            throw error
          }

          uni.showToast({
            title: '上传成功',
            icon: 'success'
          })
        } catch (error) {
          uni.hideLoading()
          console.error('WebDAV 上传失败:', error)

          const errorText = String(error?.message || '').toLowerCase()
          let errorMsg = '上传失败'

          if (errorText.includes('401')) {
            errorMsg = '认证失败'
          } else if (errorText.includes('403')) {
            errorMsg = '权限不足'
          } else if (errorText.includes('timeout') || errorText.includes('network')) {
            errorMsg = '网络连接失败'
          } else if (errorText.includes('507')) {
            errorMsg = '服务器空间不足'
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
          const [result, error] = await webdav.download({
            config: this.webdavConfig
          })

          uni.hideLoading()

          if (error) {
            throw error
          }

          if (result.status === 'not_found') {
            uni.showToast({
              title: '未找到备份文件',
              icon: 'none'
            })
            return
          }

          if (result.data) {
            this.processWebdavImport(result.data)
            return
          }

          uni.showToast({
            title: '下载失败',
            icon: 'none'
          })
        } catch (error) {
          uni.hideLoading()
          console.error('WebDAV 下载失败:', error)

          const errorText = String(error?.message || '').toLowerCase()
          let errorMsg = '下载失败'

          if (errorText.includes('401')) {
            errorMsg = '认证失败'
          } else if (errorText.includes('404')) {
            errorMsg = '备份文件不存在'
          } else if (errorText.includes('403')) {
            errorMsg = '权限不足'
          } else if (errorText.includes('timeout') || errorText.includes('network')) {
            errorMsg = '网络连接失败'
          }

          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          })
        }
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
      },

      /**
       * 下载 APK 应用
       */
      downloadApp() {
        const apkUrl = '/static/h5/baby.apk'
        uni.showModal({
          title: '下载应用',
          content: '确定要下载最新版本的APP吗？',
          success: (res) => {
            if (res.confirm) {
              // 在浏览器中打开下载链接
              window.open(apkUrl, '_blank')
              uni.showToast({
                title: '开始下载',
                icon: 'success'
              })
            }
          }
        })
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

  .avatar-value {
    gap: 10rpx;
  }

  .avatar-preview {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f0f0f0;
  }

  .avatar-placeholder {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background-color: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    color: #999999;
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
