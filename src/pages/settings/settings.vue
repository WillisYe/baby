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

    <!-- 应用设置 -->
    <view class="settings-section" v-if="false">
      <view class="section-title">应用设置</view>
      <view class="setting-item">
        <text class="setting-label">通知提醒</text>
        <view class="setting-value">
          <switch checked="true" />
        </view>
      </view>
      <view class="setting-item">
        <text class="setting-label">自动备份</text>
        <view class="setting-value">
          <switch checked="false" />
        </view>
      </view>
      <view class="setting-item" @click="selectTheme">
        <text class="setting-label">主题</text>
        <view class="setting-value">
          <text>默认</text>
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
      <view class="setting-item" @click="clearData" style="color: #ff3b30;" v-if="false">
        <text class="setting-label">清空数据</text>
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
  </view>
</template>

<script>
import { getRecords, getBabyInfo, importRecords, setBabyInfo } from '@/utils/recordStore.js'

export default {
  data() {
    return {
      babyInfo: {
        name: '宝宝',
        babyHashid: '',
        birthDate: '2025-01-13',
        gender: '男'
      }
    }
  },
  onLoad() {
    // 加载宝宝信息
    this.babyInfo = getBabyInfo()
    console.log('%c this.babyInfo', 'color:red; background:yellow;', this.babyInfo)
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
    selectTheme() {
      uni.showToast({
        title: '选择主题',
        icon: 'none'
      });
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
</style>