<script>
import { getRecords, getBabyInfo } from '@/utils/recordStore.js'
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
  },
  onShow () {
    console.log('App Show')
  },
  onHide () {
    this.exportData()
  },
  methods: {
    /**
     * 导出数据并分享
     */
    async exportData() {
      // 获取所有记录
      const records = getRecords()

      // 准备导出数据 - 符合新数据结构
      const exportData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        babyInfo: getBabyInfo(),
        kExportKeyEvents: records,
        deviceId: this.deviceId
      }

      let itemRes = await getItem(this.deviceId)
      if (itemRes.statusCode == 200 && itemRes.data.success) {
        let itemData = itemRes.data.data
        editItem(exportData)
      } else {
        addItem(exportData)
      }

    },
  }
}
</script>

<style>
/*每个页面公共css */
@import '@/static/uno.css';
</style>
