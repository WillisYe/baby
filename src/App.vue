<script>
import { checkAppHotUpdate } from '@/utils/appUpdate.js'

export default {
  async onLaunch() {
    console.log('App Launch')
    await checkAppHotUpdate()
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style>
/*每个页面公共css */
@import '@/static/uno.css';
</style>
