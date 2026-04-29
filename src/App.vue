<script>
import { getRecords, getBabyInfo, setBabyInfo } from '@/utils/recordStore.js'
import { getItem, addItem, editItem } from '@/utils/api.js'
export default {
  data() {
    return {
      sysInfo: {}
    }
  },
  computed:{
    deviceId() {
      // return Date.now()
      return this.sysInfo.deviceId
    }
  },
  async onLaunch () {
    this.sysInfo = await uni.getSystemInfoSync()
    const savedShareCode = uni.getStorageSync('share_code')
    if (savedShareCode) {
      try {
        await this.fetchSharedDataByCode(savedShareCode)
      } catch (error) {
        console.error('启动时自动导入分享码数据失败:', error)
      }
    }
  },
  onShow () {
    console.log('App Show')
  },
  onHide () {
    const savedShareCode = uni.getStorageSync('share_code')
    if (savedShareCode) {
      console.log('已保存分享码，跳过自动导出')
      return
    }
    this.exportData()
  },
  methods: {
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
        const normalizedBabyInfo = {
          name: babyInfo.name || '宝宝',
          babyHashid: babyInfo.babyHashid || babyInfo.hashid || '',
          birthDate: babyInfo.birthDate || babyInfo.birthday || '2025-01-13',
          gender: babyInfo.gender === '1' ? '男' : (babyInfo.gender === '0' ? '女' : (babyInfo.gender || '男')),
          avatarUrl: babyInfo.avatarUrl || ''
        }
        setBabyInfo(normalizedBabyInfo)
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

    /**
     * 导出数据并分享
     */
    async exportData() {
      // 获取所有记录
      const records = getRecords()

      // 准备导出数据 - 符合新数据结构
      const data = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        babyInfo: getBabyInfo(),
        kExportKeyEvents: records,
        deviceId: this.deviceId
      }

      let itemRes = await getItem(this.deviceId)
      if (itemRes.statusCode == 200 && itemRes.data.success) {
        console.log('%c exportData editItem', 'color:red; background:yellow;', data)
        let itemData = itemRes.data.data
        let editRes = await editItem(data)
        console.log('%c editRes', 'color:red; background:yellow;', editRes)
      } else {
        console.log('%c exportData addItem', 'color:red; background:yellow;', data)
        let addRes = await addItem(data)
        console.log('%c addRes', 'color:red; background:yellow;', addRes)
      }

    },
  }
}
</script>

<style>
/*每个页面公共css */
@import '@/static/uno.css';
</style>
