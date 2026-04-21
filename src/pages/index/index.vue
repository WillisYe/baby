<template>
  <view class="content">
    <!-- 宝宝信息卡片 -->
    <view class="baby-info">
      <view class="baby-avatar">👶</view>
      <view class="baby-details">
        <text class="baby-name">{{ babyInfo.name }}</text>
        <text class="baby-age">{{ babyAge.text }}</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="action-item" @click="navigateToRecord('formula')">
        <view class="action-icon">🍼</view>
        <text class="action-text">喂养</text>
      </view>
      <view class="action-item" @click="navigateToRecord('stool')">
        <view class="action-icon">💩</view>
        <text class="action-text">大便</text>
      </view>
      <view class="action-item" @click="navigateToRecord('nutrition')">
        <view class="action-icon">🧪</view>
        <text class="action-text">营养品</text>
      </view>
      <view class="action-item" @click="navigateToRecord('medicine')">
        <view class="action-icon">💊</view>
        <text class="action-text">药品</text>
      </view>
    </view>

    <!-- 最近记录 -->
    <view class="recent-records">
      <view class="section-title">最近记录</view>
      <view class="record-item" v-for="(item, index) in recentRecords" :key="index" @click="showTypeRecords(item)">
        <!-- 左边：类型图标和名称 -->
        <view class="record-left">
          <view class="type-icon">{{ item.icon }}</view>
          <text class="type-name">{{ item.typeName }}</text>
        </view>

        <!-- 中间：时间和内容 -->
        <view class="record-middle">
          <view>
            <text class="record-time">{{ item.relativeTime }}</text>
            <text class="record-time-sub">{{ item.displayText }}</text>
          </view>
          <view>
            <text class="record-stats">今天：</text>
            <text class="record-stats-sub">{{ item.stats.todayCount }}次</text>
            <text class="record-stats">最近24小时：</text>
            <text class="record-stats-sub">{{ item.stats.last24hCount }}次</text>
          </view>
        </view>

        <!-- 右边：加号按钮 -->
        <view class="record-right" @click.stop="addRecord(item.type)">
          <text class="add-btn">+</text>
        </view>
      </view>
    </view>

    <!-- 记录详情弹窗 -->
    <view class="modal-mask" v-if="showRecordModal" @click="closeRecordModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-back" @click="closeRecordModal">‹</text>
          <text class="modal-title">{{ currentTypeRecords.title }}</text>
          <text v-if="currentTypeRecords.showChart && chartData.length > 0"
                class="modal-chart-toggle"
                @click="toggleChartType">
            {{ chartType === 'bar' ? '📈' : '📊' }}
          </text>
        </view>
        <scroll-view class="modal-body" scroll-y>
          <!-- 图表区域 -->
          <view v-if="currentTypeRecords.showChart && chartData.length > 0" class="chart-container">
            <view class="chart-title">每日奶量趋势 (ml)</view>
            <scroll-view class="chart-content scroll-view-x" scroll-x :scroll-left="chartScrollLeft" @scroll="scroll">
              <!--  -->
              <view v-if="chartType === 'bar'" class="bar-chart" :style="{ width: chartData.length * 80 + 'rpx' }">
                <view v-for="(item, index) in chartData" :key="index" class="bar-item">
                  <view class="bar-wrapper">
                    <view class="bar" :style="{ height: getBarHeight(item.amount) + 'rpx' }"></view>
                    <text class="bar-value">{{ item.amount }}</text>
                  </view>
                  <text class="bar-label">{{ item.date }}</text>
                </view>
              </view>
              <!--  -->
              <view v-else class="line-chart" :style="{ width: chartData.length * 80 + 'rpx' }">
                <view class="line-chart-container">
                  <view class="line-chart-y-axis">
                    <text v-for="(value, index) in getYAxisValues()" :key="index" class="y-axis-label">{{ value }}</text>
                  </view>
                  <view class="line-chart-content">
                    <canvas
                      canvas-id="lineCanvas"
                      class="line-canvas"
                      :style="{ width: chartData.length * 80 + 'rpx', height: '200rpx' }"
                      :width="chartData.length * 80"
                      :height="200"
                    ></canvas>
                    <!-- 数据点数值标签 -->
                    <view class="data-point-labels">
                      <text
                        v-for="(point, index) in getLinePointObjects()"
                        :key="index"
                        class="data-point-label"
                        :style="{ left: point.x + 'rpx', top: 185 + 'rpx' }"
                      >{{ chartData[index].amount }}</text>
                    </view>
                    <view class="x-axis-labels">
                      <text v-for="(item, index) in chartData" :key="index" class="x-axis-label">{{ item.date }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          <!-- 记录列表 -->
          <view class="record-group" v-for="(group, date) in currentTypeRecords.groupedRecords" :key="date">
            <view class="group-title" @click="toggleGroup(date)">
              <text>{{ date }}</text>
              <text class="expand-icon">{{ expandedGroups[date] ? '▼' : '▶' }}</text>
            </view>
            <view class="group-records" v-if="expandedGroups[date]">
              <view class="group-record-item" v-for="(record, index) in group" :key="index">
                <text class="record-time-small">{{ record.time }}</text>
                <text class="record-detail-small">{{ record.detail }}</text>
                <view class="record-actions">
                  <text class="action-btn edit-btn" @click.stop="editRecord(record.originalRecord)">编辑</text>
                  <text class="action-btn delete-btn" @click.stop="deleteRecordItem(record.originalRecord)">删除</text>
                </view>
              </view>
            </view>
          </view>
          <view v-if="Object.keys(currentTypeRecords.groupedRecords).length === 0" class="empty-records">
            <text>暂无记录</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 删除确认弹窗 -->
    <view class="delete-confirm-modal" v-if="showDeleteConfirm" @click="cancelDelete">
      <view class="delete-confirm-content" @click.stop>
        <view class="delete-confirm-title">确认删除</view>
        <view class="delete-confirm-message">确定要删除这条记录吗？</view>
        <view class="delete-confirm-buttons">
          <button class="delete-confirm-btn cancel-btn" @click="cancelDelete">取消</button>
          <button class="delete-confirm-btn confirm-btn" @click="confirmDelete">删除</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getRecords, formatRecordDetail, getBabyInfo, calculateAge, deleteRecord, updateRecord } from '@/utils/recordStore.js'
import { checkAppHotUpdate } from '@/utils/appUpdate.js'

export default {
  data() {
    return {
      recentRecords: [],
      showRecordModal: false,
      currentTypeRecords: {
        title: '',
        records: [],
        groupedRecords: {},
        showChart: false
      },
      chartType: 'bar', // 'bar' 或 'line'
      chartData: [], // 图表数据
      old: {
        scrollLeft: 0
      },
      chartScrollLeft: 0,
      expandedGroups: {}, // 记录分组展开状态
      babyInfo: {
        name: '宝宝',
        birthDate: '2025-01-13'
      },
      babyAge: {
        days: 0,
        text: '计算中...'
      },
      // 类型定义
      typeConfig: {
        formula: {
          name: '配方奶',
          icon: '🍼',
          eventType: 'feeding'
        },
        solid: {
          name: '辅食',
          icon: '🥣',
          eventType: 'feeding'
        },
        stool: {
          name: '大便',
          icon: '💩',
          eventType: 'stool'
        },
        nutrition: {
          name: '营养品',
          icon: '🧪',
          eventType: 'nutrition'
        },
        medicine: {
          name: '药品',
          icon: '💊',
          eventType: 'medicine'
        },
        diaper: {
          name: '尿片',
          icon: '🩲',
          eventType: 'diaper'
        }
      },
      // 删除确认弹窗
      showDeleteConfirm: false,
      deleteRecordData: null
    }
  },
  onLoad() {
    this.babyInfo = getBabyInfo()
    this.calculateBabyAge()
    this.loadRecentRecords()
    // 监听记录更新事件
    uni.$on('recordUpdated', () => {
      this.loadRecentRecords()
    })
    // 监听宝宝信息更新事件
    uni.$on('babyInfoUpdated', () => {
      this.babyInfo = getBabyInfo()
      this.calculateBabyAge()
    })
  },
  onShow() {
    // #ifdef APP-plus
    checkAppHotUpdate()
    // #endif
    // 每次页面显示时计算宝宝年龄
    this.calculateBabyAge()
    this.loadRecentRecords()
  },
  onUnload() {
    // 页面卸载时移除事件监听
    uni.$off('recordUpdated')
  },
  methods: {
    /**
     * 计算宝宝年龄
     */
    calculateBabyAge() {
      if (this.babyInfo.birthDate) {
        this.babyAge = calculateAge(this.babyInfo.birthDate)
      }
    },

    loadRecentRecords() {
      const allRecords = getRecords()
      // console.log('%c allRecords', 'color:red; background:yellow;', allRecords)
      const result = []

      // 遍历每个类型，获取最新的记录
      Object.keys(this.typeConfig).forEach(type => {
        const config = this.typeConfig[type]

        // 筛选该类型的记录
        const typeRecords = allRecords.filter(record => {
          if (type === 'formula') {
            return record.eventType === 'feeding' && record.valueName === '配方奶'
          } else if (type === 'solid') {
            return record.eventType === 'feeding' && record.valueName === '辅食'
          } else {
            return record.eventType === config.eventType
          }
        })

        // 按时间排序，取最新的
        typeRecords.sort((a, b) => parseFloat(b.eventTime) - parseFloat(a.eventTime))

        if (typeRecords.length > 0) {
          const latestRecord = typeRecords[0]
          const relativeTime = this.formatRelativeTime(latestRecord.eventTime)

          // 根据类型构建不同的显示文本
          let displayText = ''
          let typeName = config.name

          if (type === 'formula' || type === 'solid') {
            // 喂养：时间后显示数量
            if (latestRecord.value) {
              displayText += `(${latestRecord.value}ml)`
            }
          } else {
            if (latestRecord.valueName) {
              displayText += `(${latestRecord.valueName})`
            } else if (latestRecord.note) {
              displayText += `(${latestRecord.note})`
            }
          }

          const stats = this.calculateStats(typeRecords, type)

          result.push({
            type: type,
            typeName: typeName,
            icon: config.icon,
            eventType: config.eventType,
            relativeTime,
            displayText,
            stats: stats,
            record: latestRecord,
            latestRecordTime: +latestRecord.eventTime
          })
        } else {
          // 如果没有记录，也显示该项，但显示空数据
          result.push({
            type: type,
            typeName: config.name,
            icon: config.icon,
            eventType: config.eventType,
            relativeTime: '暂无记录',
            stats: {
              todayCount: 0,
              last24hCount: 0
            },
            record: null,
            latestRecordTime: 0
          })
        }
      })
      this.recentRecords = result.sort((a, b) => parseFloat(b.latestRecordTime) - parseFloat(a.latestRecordTime))
    },

    /**
     * 格式化相对时间
     */
    formatRelativeTime(eventTime) {
      if (!eventTime) return ''

      try {
        const timestamp = parseFloat(eventTime) * 1000
        const now = Date.now()
        const diff = now - timestamp

        // 小于1分钟
        if (diff < 60000) {
          return '刚刚'
        }

        // 小于1小时
        if (diff < 3600000) {
          const minutes = Math.floor(diff / 60000)
          return `${minutes}分钟前`
        }

        // 小于24小时
        if (diff < 86400000) {
          const hours = Math.floor(diff / 3600000)
          const minutes = Math.floor((diff % 3600000) / 60000)
          return minutes > 0 ? `${hours}小时${minutes}分钟前` : `${hours}小时前`
        }

        // 超过24小时显示几天前
        const days = Math.floor(diff / 86400000)
        if (days < 7) {
          return `${days}天前`
        }

        // 超过7天显示具体日期
        const date = new Date(timestamp)
        const month = date.getMonth() + 1
        const day = date.getDate()
        return `${month}月${day}日`
      } catch (e) {
        console.error('格式化时间失败:', e)
        return ''
      }
    },

    /**
     * 计算统计信息
     */
    calculateStats(records, type) {
      const now = Date.now()
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const yesterdayStart = new Date(todayStart)
      yesterdayStart.setDate(yesterdayStart.getDate() - 1)

      let todayCount = 0
      let last24hCount = 0

      records.forEach(record => {
        try {
          const timestamp = parseFloat(record.eventTime) * 1000

          // 今天次数
          if (timestamp >= todayStart.getTime()) {
            todayCount++
          }

          // 最近24小时次数
          if (timestamp >= now - 86400000) {
            last24hCount++
          }
        } catch (e) {
          console.error('计算统计失败:', e)
        }
      })

      return {
        todayCount: todayCount,
        last24hCount: last24hCount
      }
    },

    /**
     * 添加记录
     */
    addRecord(type) {
      const config = this.typeConfig[type]
      if (config) {
        // 对于feeding类型，需要传递subType来区分配方奶和辅食
        const subType = type === 'formula' ? 'formula' : (type === 'solid' ? 'solid' : '')
        let url = `/pages/record/record?tab=${config.eventType}`
        if (subType) {
          url += `&subType=${subType}`
        }
        uni.navigateTo({
          url: url
        })
      }
    },

    /**
     * 显示该类型的所有记录
     */
    showTypeRecords(item) {
      const config = this.typeConfig[item.type]
      if (!config) return

      // 获取该类型的所有记录
      const allRecords = getRecords()
      let typeRecords = []

      if (item.type === 'formula') {
        typeRecords = allRecords.filter(record =>
          record.eventType === 'feeding' && record.valueName === '配方奶'
        )
      } else if (item.type === 'solid') {
        typeRecords = allRecords.filter(record =>
          record.eventType === 'feeding' && record.valueName === '辅食'
        )
      } else {
        typeRecords = allRecords.filter(record =>
          record.eventType === config.eventType
        )
      }

      // 按时间排序（倒序）
      typeRecords.sort((a, b) => parseFloat(b.eventTime) - parseFloat(a.eventTime))

      // 格式化记录数据，同时保留原始记录用于分组
      const formattedRecords = typeRecords.map(record => ({
        time: this.formatRecordTime(record.eventTime),
        detail: formatRecordDetail(record),
        originalRecord: record
      }))

      // 按日期分组
      const groupedRecords = this.groupRecordsByDate(formattedRecords, item.type)

      // 计算图表数据（仅配方奶显示图表）
      const showChart = item.type === 'formula'
      const chartData = showChart ? this.calculateChartData(typeRecords) : []

      this.currentTypeRecords = {
        title: config.name,
        records: typeRecords,
        formattedRecords: formattedRecords,
        groupedRecords: groupedRecords,
        showChart: showChart
      }

      console.log('%c currentTypeRecords', 'color:red; background:yellow;', this.currentTypeRecords)

      // 设置图表数据
      this.chartData = chartData
      this.chartType = 'bar' // 默认显示柱状图
      this.chartScrollLeft = chartData.length * 80

      // 初始化分组展开状态，默认展开最近一天
      this.expandedGroups = {}
      const dates = Object.keys(groupedRecords)
      if (dates.length > 0) {
        // 找到最近的日期（有记录的最晚日期）
        const latestDate = dates.reduce((latest, current) => {
          const latestTime = this.parseDateString(latest).getTime()
          const currentTime = this.parseDateString(current).getTime()
          return currentTime > latestTime ? current : latest
        })
        dates.forEach(date => {
          this.expandedGroups[date] = date === latestDate
        })
      }

      this.showRecordModal = true
      this.$nextTick(() => {
        this.chartScrollLeft = chartData.length * 80
        if (this.chartType === 'line') {
          this.drawLineChart()
        }
      })
    },

    /**
     * 关闭记录详情弹窗
     */
    closeRecordModal() {
      this.showRecordModal = false
    },

    /**
     * 格式化记录时间（HH:mm格式）
     */
    formatRecordTime(eventTime) {
      if (!eventTime) return ''

      try {
        const timestamp = parseFloat(eventTime) * 1000
        const date = new Date(timestamp)
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
      } catch (e) {
        console.error('格式化记录时间失败:', e)
        return ''
      }
    },

    /**
     * 按日期分组记录
     */
    groupRecordsByDate(records, type) {
      const grouped = {}

      records.forEach((record, index) => {
        // 提取日期部分（去掉时间）
        const eventTime = record.originalRecord.eventTime
        const dateStr = this.formatRecordDate(eventTime)

        if (!grouped[dateStr]) {
          grouped[dateStr] = {
            records: [],
            count: 0,
            totalValue: 0
          }
        }

        // 只保存time和detail和originalRecord
        grouped[dateStr].records.push({
          time: record.time,
          detail: record.detail,
          originalRecord: record.originalRecord
        })
        grouped[dateStr].count++

        // 提取数值（如果有的话）
        const valueMatch = record.detail.match(/(\d+)/)
        if (valueMatch) {
          grouped[dateStr].totalValue += parseInt(valueMatch[1])
        }
      })

      // 格式化分组标题
      const result = {}
      Object.keys(grouped).forEach(date => {
        const group = grouped[date]
        const countText = `${group.count}次`
        const valueText = ['formula','solid'].includes(type) ? `，${group.totalValue}ml` : ''
        const displayDate = this.formatGroupDate(date)
        result[`${displayDate} ${countText}${valueText}`] = group.records
      })

      return result
    },

    /**
     * 格式化分组日期显示（用于分组标题）
     */
    formatGroupDate(dateStr) {
      try {
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return this.formatDateToMMDD(date)
      } catch (e) {
        console.error('格式化分组日期失败:', e)
        return dateStr
      }
    },

    /**
     * 格式化记录日期（YYYY-MM-DD格式，用于分组）
     */
    formatRecordDate(eventTime) {
      if (!eventTime) return ''

      try {
        const timestamp = parseFloat(eventTime) * 1000
        const date = new Date(timestamp)
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        return `${year}-${month}-${day}`
      } catch (e) {
        console.error('格式化记录日期失败:', e)
        return ''
      }
    },

    /**
     * 将日期格式化为MM-DD
     */
    formatDateToMMDD(date) {
      const now = new Date()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')

      // 如果是今天或昨天，显示对应文字
      const dateStr = date.toDateString()
      if (dateStr === now.toDateString()) {
        return '今天'
      }

      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (dateStr === yesterday.toDateString()) {
        return '昨天'
      }

      return `${month}-${day}`
    },

    /**
     * 解析日期字符串为Date对象
     */
    parseDateString(dateStr) {
      // 提取日期部分（去掉次数和单位信息）
      const datePart = dateStr.split(' ')[0]

      const now = new Date()
      if (datePart === '今天') {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (datePart === '昨天') {
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      } else if (datePart.includes('-')) {
        // 处理 MM-DD 或 YYYY-MM-DD 格式
        const parts = datePart.split('-').map(Number)
        if (parts.length === 2) {
          // MM-DD 格式，使用当前年份
          const [month, day] = parts
          return new Date(now.getFullYear(), month - 1, day)
        } else if (parts.length === 3) {
          // YYYY-MM-DD 格式
          const [year, month, day] = parts
          return new Date(year, month - 1, day)
        }
      }
      // 默认返回今天
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    },

    /**
     * 切换分组展开状态
     */
    toggleGroup(date) {
      this.$set(this.expandedGroups, date, !this.expandedGroups[date])
    },

    /**
     * 切换图表类型
     */
    toggleChartType() {
      this.chartType = this.chartType === 'bar' ? 'line' : 'bar'
      this.chartScrollLeft = this.old.scrollLeft
      this.$nextTick(() => {
        this.chartScrollLeft = this.chartData.length * 80
        if (this.chartType === 'line') {
          this.drawLineChart()
        }
      })
    },

    /**
     * 绘制折线图到 Canvas
     */
    drawLineChart() {
      if (!this.chartData || this.chartData.length === 0) return

      const width = uni.upx2px(this.chartData.length * 80)
      const height = uni.upx2px(200)

      const ctx = uni.createCanvasContext('lineCanvas', this)
      if (!ctx) return

      const points = this.getLinePointObjects(width, height)
      if (!points.length) return

      // 背景清空
      ctx.clearRect(0, 0, width, height)

      // 绘制折线
      ctx.beginPath()
      ctx.setStrokeStyle('#4CD964')
      ctx.setLineWidth(2)
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()

      // 绘制数据点
      ctx.setFillStyle('#4CD964')
      points.forEach(point => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.draw()
    },

    /**
     * 计算图表数据（每日奶量）
     */
    calculateChartData(records) {
      // 按日期统计每天的奶量
      const dailyData = {}

      records.forEach(record => {
        if (!record.value || isNaN(parseFloat(record.value))) return

        const timestamp = parseFloat(record.eventTime) * 1000
        const date = new Date(timestamp)
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`

        if (!dailyData[dateStr]) {
          dailyData[dateStr] = 0
        }
        dailyData[dateStr] += parseFloat(record.value)
      })

      // 转换为数组，按日期排序
      const chartData = Object.keys(dailyData)
        .map(date => ({
          date: date,
          amount: dailyData[date]
        }))
        .sort((a, b) => {
          const [aMonth, aDay] = a.date.split('/').map(Number)
          const [bMonth, bDay] = b.date.split('/').map(Number)
          return aMonth - bMonth || aDay - bDay
        })

      // 保留最近30天的数据
      return chartData.slice(-30)
    },

    /**
     * 获取柱状图高度
     */
    getBarHeight(amount) {
      if (!this.chartData || this.chartData.length === 0) return 0

      const maxAmount = Math.max(...this.chartData.map(item => item.amount))
      const maxHeight = 140 // 最大高度 rpx
      return (amount / maxAmount) * maxHeight
    },

    /**
     * 获取 Y 轴刻度值
     */
    getYAxisValues() {
      if (!this.chartData || this.chartData.length === 0) return []

      const maxAmount = Math.max(...this.chartData.map(item => item.amount))
      const step = Math.ceil(maxAmount / 5 / 50) * 50 // 向上取整到50的倍数

      const values = []
      for (let i = 0; i <= maxAmount; i += step) {
        values.push(i)
      }

      // 反转数组，使Y轴从上到下显示从大到小的数字
      return values.reverse()
    },

    /**
     * 获取折线图的点坐标
     */
    getLinePointObjects(canvasWidth = 0, canvasHeight = 200) {
      if (!this.chartData || this.chartData.length === 0) return []

      const maxAmount = Math.max(...this.chartData.map(item => item.amount), 1)
      const paddingTop = 20
      const paddingBottom = 20
      const chartHeight = canvasHeight - paddingTop - paddingBottom
      const xStep = canvasWidth > 0 ? canvasWidth / Math.max(this.chartData.length, 1) : 80

      return this.chartData.map((item, index) => {
        const x = index * xStep + xStep / 2 // 每个数据点居中
        const y = paddingTop + (1 - item.amount / maxAmount) * chartHeight
        return {
          x,
          y: Number.isFinite(y) ? y : canvasHeight - paddingBottom
        }
      })
    },

    linePointString() {
      return this.getLinePointObjects().map(point => `${point.x},${point.y}`).join(' ')
    },

    navigateToRecord(type) {
      const config = this.typeConfig[type]
      if (config) {
        uni.navigateTo({
          url: `/pages/record/record?tab=${config.eventType}`
        })
      }
    },

    scroll: function(e) {
      console.log(e)
      this.old.scrollLeft = e.detail.scrollLeft
    },

    /**
     * 编辑记录
     */
    editRecord(record) {
      // 跳转到记录页面，传递记录数据用于编辑
      const config = this.typeConfig[this.currentTypeRecords.title === '配方奶' ? 'formula' : this.currentTypeRecords.title === '辅食' ? 'solid' : Object.keys(this.typeConfig).find(key => this.typeConfig[key].name === this.currentTypeRecords.title)]
      if (config) {
        // 构建编辑参数
        const editData = {
          hashid: record.hashid,
          eventType: record.eventType,
          valueName: record.valueName,
          value: record.value,
          note: record.note,
          date: record.dateString,
          time: this.formatRecordTime(record.eventTime)
        }
        uni.navigateTo({
          url: `/pages/record/record?tab=${config.eventType}&edit=${encodeURIComponent(JSON.stringify(editData))}`
        })
      }
    },

    /**
     * 删除记录
     */
    deleteRecordItem(record) {
      this.deleteRecordData = record
      this.showDeleteConfirm = true
    },

    /**
     * 确认删除
     */
    confirmDelete() {
      if (this.deleteRecordData && deleteRecord(this.deleteRecordData.hashid)) {
        uni.showToast({ title: '删除成功', icon: 'success' })
        // 重新加载数据
        this.loadRecentRecords()
        // 如果当前有详情弹窗打开，重新显示该类型的记录
        if (this.showRecordModal) {
          this.showTypeRecords(this.recentRecords.find(item => item.typeName === this.currentTypeRecords.title))
        }
      } else {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
      this.cancelDelete()
    },

    /**
     * 取消删除
     */
    cancelDelete() {
      this.showDeleteConfirm = false
      this.deleteRecordData = null
    },
  }
}
</script>

<style>
.content {
  padding: 15px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 124px);
}

.baby-info {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.baby-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80rpx;
}

.baby-details {
  flex: 1;
}

.baby-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10rpx;
  display: block;
}

.baby-age {
  font-size: 28rpx;
  color: #999999;
}

.quick-actions {
  display: flex;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.action-icon {
  font-size: 60rpx;
  margin-bottom: 10rpx;
}

.action-text {
  font-size: 24rpx;
  color: #666666;
}

.recent-records {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100rpx;
  flex-shrink: 0;
}

.type-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
}

.type-name {
  font-size: 22rpx;
  color: #666666;
}

.record-middle {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 10rpx;
}

.record-time {
  font-size: 28rpx;
  font-weight: 500;
  color: #000;
  margin-bottom: 8rpx;
}

.record-time-sub {
  font-size: 28rpx;
  font-weight: 400;
  color: #666;
  margin-bottom: 8rpx;
  margin-left: 12rpx;
}

.record-stats {
  font-size: 22rpx;
  color: #666;
}
.record-stats-sub {
  font-size: 22rpx;
  color: #000;
  margin-right: 10rpx;
}

.record-right {
  width: 80rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.add-btn {
  width: 60rpx;
  height: 60rpx;
  line-height: 56rpx;
  text-align: center;
  font-size: 40rpx;
  color: #4CD964;
  border: 2rpx solid #4CD964;
  border-radius: 50%;
  background-color: transparent;
  display: inline-block;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ffffff;
  z-index: 9999;
}

.modal-content {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
}

.modal-back {
  font-size: 60rpx;
  color: #333333;
  line-height: 1;
  padding: 0 10rpx;
  cursor: pointer;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  flex: 1;
  text-align: center;
}

.modal-chart-toggle {
  font-size: 40rpx;
  line-height: 1;
  padding: 0 10rpx;
  cursor: pointer;
}

.modal-close {
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
  padding: 0 10rpx;
}

.modal-body {
  flex: 1;
  padding: 30rpx 20rpx;
  overflow-y: auto;
  box-sizing: border-box;
}

/* 图表样式 */
.chart-container {
  background-color: #f8f8f8;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
}

.chart-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 20rpx;
  text-align: center;
}

.chart-content {
  min-height: 200rpx;
}

.scroll-view-x {
  width: 100%;
  white-space: nowrap;
}

/* 柱状图样式 */
.bar-chart {
  display: inline-flex;
  justify-content: flex-start;
  align-items: flex-end;
  height: 200rpx;
  padding: 20rpx 0;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80rpx;
  flex-shrink: 0;
  margin-right: 0;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 140rpx;
  width: 100%;
}

.bar {
  width: 40rpx;
  background: linear-gradient(180deg, #4CD964 0%, #2AAE68 100%);
  border-radius: 4rpx 4rpx 0 0;
  transition: height 0.3s ease;
}

.bar-value {
  font-size: 20rpx;
  color: #666666;
  margin-top: 8rpx;
}

.bar-label {
  font-size: 20rpx;
  color: #999999;
  margin-top: 8rpx;
}

/* 折线图样式 */
.line-chart {
  display: inline-flex;
  height: 200rpx;
  padding: 20rpx 0;
}

.line-chart-container {
  display: flex;
  height: 200rpx;
  padding: 10rpx 0;
}

.line-chart-y-axis {
  width: 60rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 10rpx;
}

.y-axis-label {
  font-size: 20rpx;
  color: #999999;
  text-align: right;
}

.line-chart-content {
  flex: 1;
  position: relative;
  padding-bottom: 30rpx;
}

.data-point-labels {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 30rpx;
  pointer-events: none;
}

.data-point-label {
  position: absolute;
  font-size: 20rpx;
  /* color: #4CD964; */
  color: #666;
  font-weight: bold;
  text-align: center;
  transform: translate(-50%, -120%);
}

.x-axis-labels {
  display: flex;
  justify-content: flex-start;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.x-axis-label {
  font-size: 20rpx;
  color: #999999;
  width: 80rpx;
  flex-shrink: 0;
  text-align: center;
}

.line-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.line-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.line-path {
  fill: none;
  stroke: #4CD964;
  stroke-width: 2rpx;
}

.record-group {
  margin-bottom: 40rpx;
}

.group-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.expand-icon {
  font-size: 24rpx;
  color: #999999;
  transition: transform 0.2s ease;
}

.group-records {
  margin-left: 20rpx;
}

.group-record-item {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.group-record-item:last-child {
  border-bottom: none;
}

.record-time-small {
  font-size: 26rpx;
  color: #999999;
  width: 90rpx;
  flex-shrink: 0;
}

.record-detail-small {
  flex: 1;
  font-size: 28rpx;
  color: #666666;
  margin-left: 20rpx;
}

.record-actions {
  display: flex;
  margin-left: 20rpx;
}

.action-btn {
  font-size: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  margin-left: 10rpx;
  cursor: pointer;
}

.edit-btn {
  color: #4CD964;
  border: 1rpx solid #4CD964;
}

.delete-btn {
  color: #FF3B30;
  border: 1rpx solid #FF3B30;
}

.empty-records {
  text-align: center;
  padding: 120rpx 0;
  color: #999999;
  font-size: 30rpx;
}

/* 删除确认弹窗样式 */
.delete-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.delete-confirm-content {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 40rpx;
  width: 600rpx;
  max-width: 80%;
}

.delete-confirm-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
  margin-bottom: 20rpx;
}

.delete-confirm-message {
  font-size: 30rpx;
  color: #666666;
  text-align: center;
  margin-bottom: 40rpx;
  line-height: 1.5;
}

.delete-confirm-buttons {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.delete-confirm-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 8rpx;
  font-size: 32rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666666;
}

.confirm-btn {
  background-color: #FF3B30;
  color: #ffffff;
}
</style>
