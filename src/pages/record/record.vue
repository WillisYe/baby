<template>
  <view class="content">
    <!-- 记录类型选择 -->
    <view v-if="showTabs" class="record-tabs">
      <view
        v-for="tab in recordTabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @click="currentTab = tab.value"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 记录表单 -->
    <view class="record-form">
      <!-- 喂养记录 -->
      <view v-if="currentTab === 'feeding'" class="form-section">
        <view class="form-item">
          <text class="label">喂养类型</text>
          <view class="radio-group">
            <label class="radio-item" v-for="type in feedingTypes" :key="type.value">
              <radio :value="type.value" :checked="form.feedingType === type.value" @click="form.feedingType = type.value" />
              <text>{{ type.label }}</text>
            </label>
          </view>
        </view>
        <view class="form-item">
          <text class="label">数量</text>
          <view class="input-group">
            <input type="number" v-model="form.value" placeholder="请输入数量" />
            <text class="unit">ml</text>
          </view>
        </view>
      </view>

      <!-- 大便记录 -->
      <view v-if="currentTab === 'stool'" class="form-section">
        <view class="form-item">
          <text class="label">大便量</text>
          <view class="radio-group">
            <label class="radio-item" v-for="type in stoolTypes" :key="type.value">
              <radio :value="type.value" :checked="form.stoolType === type.value" @click="form.stoolType = type.value" />
              <text>{{ type.label }}</text>
            </label>
          </view>
        </view>
        <view class="form-item">
          <text class="label">大便颜色</text>
          <view class="radio-group">
            <label class="radio-item" v-for="color in stoolColors" :key="color.value">
              <radio :value="color.value" :checked="form.stoolColor === color.value" @click="form.stoolColor = color.value" />
              <text>{{ color.label }}</text>
            </label>
          </view>
        </view>
      </view>

      <!-- 营养品记录 -->
      <view v-if="currentTab === 'nutrition'" class="form-section">
        <view class="form-item">
          <text class="label">营养品名称</text>
          <input type="text" v-model="form.valueName" placeholder="请输入营养品名称" />
        </view>
      </view>

      <!-- 药品记录 -->
      <view v-if="currentTab === 'medicine'" class="form-section">
        <view class="form-item">
          <text class="label">药品名称</text>
          <input type="text" v-model="form.valueName" placeholder="请输入药品名称" />
        </view>
      </view>

      <!-- 共用字段 -->
      <view class="common-fields">
        <view class="form-item">
          <text class="label">时间</text>
          <picker mode="time" :value="form.time" @change="onTimeChange">
            <view class="picker-content">
              <text :class="{'placeholder': !form.time}">{{ form.time || '请选择时间' }}</text>
            </view>
          </picker>
        </view>
        <view class="form-item">
          <text class="label">备注</text>
          <textarea v-model="form.note" placeholder="请输入备注" style="height: 120rpx;"></textarea>
        </view>
      </view>

      <!-- 提交按钮 -->
      <button class="submit-btn" @click="submitRecord">提交记录</button>
    </view>
  </view>
</template>

<script>
import { addRecord } from '@/utils/recordStore.js'

export default {
  data() {
    return {
      currentTab: 'feeding',
      showTabs: true,
      recordTabs: [
        { label: '喂养', value: 'feeding' },
        { label: '大便', value: 'stool' },
        { label: '营养品', value: 'nutrition' },
        { label: '药品', value: 'medicine' },
        { label: '尿片', value: 'diaper' }
      ],
      feedingTypes: [
        { label: '配方奶', value: 'formula' },
        { label: '辅食', value: 'solid' }
      ],
      stoolTypes: [
        { label: '量少', value: '1' },
        { label: '量中等', value: '2' },
        { label: '量多', value: '3' },
      ],
      stoolColors: [
        { label: '黑色', value: '1' },
        { label: '黄色', value: '2' },
        { label: '绿色', value: '3' },
        { label: '棕色', value: '4' },
        { label: '红色', value: '5' },
        { label: '白色', value: '6' },
      ],
      form: {
        feedingType: 'formula',
        stoolType: '2',
        stoolColor: '2',
        valueName: '',
        value: '',
        time: new Date().toLocaleTimeString().substring(0, 5),
        note: ''
      }
    }
  },
  onLoad(options) {
    // 如果有tab参数，设置当前tab并隐藏tab栏
    if (options.tab) {
      this.currentTab = options.tab
      this.showTabs = false

      // 如果是feeding类型且有subType参数，设置对应的喂养类型
      if (options.tab === 'feeding' && options.subType) {
        this.form.feedingType = options.subType
      }
    }
  },
  methods: {
    validateForm() {
      // 时间校验 - 所有类型都需要
      if (!this.form.time || this.form.time.trim() === '') {
        uni.showToast({
          title: '请选择时间',
          icon: 'none'
        })
        return false
      }

      // 喂养记录校验
      if (this.currentTab === 'feeding') {
        if (!this.form.value || this.form.value.trim() === '') {
          uni.showToast({
            title: '请输入数量',
            icon: 'none'
          })
          return false
        }
        const amount = parseFloat(this.form.value)
        if (isNaN(amount) || amount <= 0) {
          uni.showToast({
            title: '数量必须大于0',
            icon: 'none'
          })
          return false
        }
      }

      // 大便记录校验
      if (this.currentTab === 'stool') {
        if (!this.form.stoolType) {
          uni.showToast({
            title: '请选择大便量',
            icon: 'none'
          })
          return false
        }
        if (!this.form.stoolColor) {
          uni.showToast({
            title: '请选择大便颜色',
            icon: 'none'
          })
          return false
        }
      }

      // 营养品记录校验
      if (this.currentTab === 'nutrition') {
        if (!this.form.valueName || this.form.valueName.trim() === '') {
          uni.showToast({
            title: '请输入营养品名称',
            icon: 'none'
          })
          return false
        }
      }

      // 药品记录校验
      if (this.currentTab === 'medicine') {
        if (!this.form.valueName || this.form.valueName.trim() === '') {
          uni.showToast({
            title: '请输入药品名称',
            icon: 'none'
          })
          return false
        }
      }

      return true
    },

    submitRecord() {
      // 表单校验
      if (!this.validateForm()) {
        return
      }

      // 构建记录对象
      const record = {
        eventType: this.currentTab,
        valueName: this.getValueName(),
        value: this.form.value,
        time: this.form.time,
        note: this.form.note,
      }

      record.type = this.currentTab === 'feeding' ? this.form.feedingType : this.currentTab

      // 保存到全局存储
      const result = addRecord(record)

      if (result) {
        uni.showToast({
          title: '记录成功',
          icon: 'success'
        })

        // 重置表单
        this.resetForm()

        // 通知其他页面数据已更新（可选）
        uni.$emit('recordUpdated', record)

        // 跳转到首页
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/index/index'
          })
        }, 500)
      } else {
        uni.showToast({
          title: '记录失败，请重试',
          icon: 'none'
        })
      }
    },
    resetForm() {
      this.form = {
        feedingType: 'formula',
        stoolType: '2',
        stoolColor: '2',
        valueName: '',
        value: '',
        time: new Date().toLocaleTimeString().substring(0, 5),
        note: ''
      }
    },
    getValueName() {
      if (this.currentTab === 'feeding') {
        return this.form.feedingType === 'formula' ? '配方奶' : '辅食';
      } else if (this.currentTab === 'stool') {
        let type = this.stoolTypes.find(item => item.value === this.form.stoolType);
        let color = this.stoolColors.find(item => item.value === this.form.stoolColor);
        return `${type.label} ${color.label}`;

      }
      return this.form.valueName
    },

    onTimeChange(e) {
      this.form.time = e.detail.value
    },
  }
}
</script>

<style>
.content {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: calc(100vh - 124px);
}

.record-tabs {
  display: flex;
  background-color: #ffffff;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  font-size: 28rpx;
  color: #666666;
  border-bottom: 3rpx solid transparent;
}

.tab-item.active {
  color: #4CD964;
  border-bottom-color: #4CD964;
  font-weight: 500;
}

.record-form {
  background-color: #ffffff;
  border-radius: 10rpx;
  padding: 20rpx;
}

.form-section {
  margin-bottom: 20rpx;
}

.common-fields {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 10rpx;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
}

.radio-item {
  margin-right: 30rpx;
  margin-bottom: 10rpx;
  display: flex;
  align-items: center;
}

.radio-item text {
  margin-left: 5rpx;
  font-size: 26rpx;
  color: #666666;
}

.input-group {
  display: flex;
  align-items: center;
}

.input-group input {
  flex: 1;
  border: 1rpx solid #e0e0e0;
  border-radius: 5rpx;
  padding: 15rpx;
  font-size: 26rpx;
}

.unit {
  margin-left: 10rpx;
  font-size: 26rpx;
  color: #999999;
}

input, textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1rpx solid #e0e0e0;
  border-radius: 5rpx;
  padding: 15rpx;
  font-size: 26rpx;
  min-height: 80rpx;
  line-height: 1.5;
}

.picker-content {
  width: 100%;
  box-sizing: border-box;
  min-height: 80rpx;
  display: flex;
  align-items: center;
  border: 1rpx solid #e0e0e0;
  border-radius: 5rpx;
  padding: 15rpx;
  font-size: 26rpx;
}

.picker-content .placeholder {
  color: #999999;
}

.submit-btn {
  width: 100%;
  background-color: #4CD964;
  color: #ffffff;
  font-size: 32rpx;
  padding: 10rpx 20rpx;
  border-radius: 10rpx;
  margin-top: 30rpx;
}
</style>