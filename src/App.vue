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
    const savedShareCode = uni.getStorageSync('share_code')
    if (savedShareCode) {
      console.log('已保存分享码，跳过自动导出')
      return
    }
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
