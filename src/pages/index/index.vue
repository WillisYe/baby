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
          <text class="modal-title">{{ currentTypeRecords.title }}</text>
          <text class="modal-close" @click="closeRecordModal">×</text>
        </view>
        <scroll-view class="modal-body" scroll-y>
          <view class="record-group" v-for="(group, date) in currentTypeRecords.groupedRecords" :key="date">
            <text class="group-title">{{ date }}</text>
            <view class="group-records">
              <view class="group-record-item" v-for="(record, index) in group" :key="index">
                <text class="record-time-small">{{ record.time }}</text>
                <text class="record-detail-small">{{ record.detail }}</text>
              </view>
            </view>
          </view>
          <view v-if="Object.keys(currentTypeRecords.groupedRecords).length === 0" class="empty-records">
            <text>暂无记录</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import { getRecords, formatRecordDetail, getBabyInfo, calculateAge } from '@/utils/recordStore.js'

export default {
  data() {
    return {
      recentRecords: [],
      showRecordModal: false,
      currentTypeRecords: {
        title: '',
        records: [],
        groupedRecords: {}
      },
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
        }
      }
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
  },
  onShow() {
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
      console.log('%c item.type', 'color:red; background:yellow;', item.type)
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

      this.currentTypeRecords = {
        title: config.name,
        records: typeRecords,
        formattedRecords: formattedRecords,
        groupedRecords: groupedRecords
      }
      this.showRecordModal = true
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

        // 只保存time和detail
        grouped[dateStr].records.push({
          time: record.time,
          detail: record.detail
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
        result[`${date} ${countText}${valueText}`] = group.records
      })

      return result
    },

    /**
     * 格式化记录日期（MM-DD格式）
     */
    formatRecordDate(eventTime) {
      if (!eventTime) return ''

      try {
        const timestamp = parseFloat(eventTime) * 1000
        const date = new Date(timestamp)
        return this.formatDateToMMDD(date)
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
     * 关闭记录详情弹窗
     */
    closeRecordModal() {
      this.showRecordModal = false
    },

    navigateToRecord(type) {
      const config = this.typeConfig[type]
      if (config) {
        uni.navigateTo({
          url: `/pages/record/record?tab=${config.eventType}`
        })
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

.modal-title {
  font-size: 36rpx;
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
  flex: 1;
  padding: 30rpx 20rpx;
  overflow-y: auto;
}

.record-group {
  margin-bottom: 40rpx;
}

.group-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
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

.empty-records {
  text-align: center;
  padding: 120rpx 0;
  color: #999999;
  font-size: 30rpx;
}
</style>
