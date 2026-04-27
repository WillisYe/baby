<script>
import { getRecords, getBabyInfo } from '@/utils/recordStore.js'
import { getList, addItem, editItem } from '@/utils/api.js'
export default {
  data() {
    return {
      sysInfo: {}
    }
  },
  computed:{
    deviceId() {
      return this.sysInfo.deviceId
    }
  },
  async onLaunch () {
    this.sysInfo = await uni.getSystemInfoSync()
    console.log('%c this.sysInfo', 'color:red; background:yellow;', this.sysInfo)
    console.log('%c this.deviceId', 'color:red; background:yellow;', this.deviceId)
    this.exportData()
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
        // babyInfo: getBabyInfo(),
        // kExportKeyEvents: records.slice(0, 1),
        deviceId: this.deviceId
      }

      let listRes = await getList()
      let listData = listRes.data
      console.log('%c listData', 'color:red; background:yellow;', listData)
      let listTemp = listData.map(item => {
        let r = ''
        try {
          r = JSON.parse(item.title)
        } catch (error) {
          r = 'err'
        }
        if (typeof r == 'object') {
          r.id = item.id
        }
        return r
      })
      let list = listTemp.filter(item => typeof item == 'object')

      let cur = list.find(item => item.deviceId == this.deviceId)
      console.log('%c cur', 'color:red; background:yellow;', cur)
      if (cur) {
        editItem(cur.id, cur, exportData)
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
