/**
 * 记录数据管理工具
 * 使用本地存储实现跨页面数据共享
 */

const RECORD_STORAGE_KEY = 'baby_records'
const BABY_INFO_KEY = 'baby_info'

/**
 * 获取所有记录
 * @returns {Array} 记录列表
 */
export function getRecords() {
  try {
    const records = uni.getStorageSync(RECORD_STORAGE_KEY)
    return records ? JSON.parse(records) : []
  } catch (e) {
    console.error('获取记录失败:', e)
    return []
  }
}

/**
 * 获取宝宝信息
 * @returns {Object} 宝宝信息
 */
export function getBabyInfo() {
  try {
    const babyInfo = uni.getStorageSync(BABY_INFO_KEY)
    return babyInfo || {
      name: '宝宝',
      babyHashid: '',
      birthDate: '2025-01-13',
      gender: '男'
    }
  } catch (e) {
    console.error('获取宝宝信息失败:', e)
    return {
      name: '宝宝',
      babyHashid: '',
      birthDate: '2025-01-13',
      gender: '男'
    }
  }
}

/**
 * 设置宝宝信息
 * @param {Object} babyInfo - 宝宝信息对象
 */
export function setBabyInfo(babyInfo) {
  try {
    uni.setStorageSync(BABY_INFO_KEY, babyInfo)
    return true
  } catch (e) {
    console.error('设置宝宝信息失败:', e)
    return false
  }
}

/**
 * 添加新记录
 * @param {Object} record - 记录对象
 */
export function addRecord(record) {
  try {
    const records = getRecords()
    const babyInfo = getBabyInfo()

    // 解析用户选择的时间
    let eventTime = Date.now() / 1000
    let dateString = formatDate(new Date())
    if (record.date && record.time) {
      dateString = record.date
      const dateTimeStr = `${record.date} ${record.time}:00`
      eventTime = new Date(dateTimeStr).getTime() / 1000
    } else if (record.time) {
      // 兼容旧格式，只有时分
      const [hours, minutes] = record.time.split(':').map(Number)
      const now = new Date()
      now.setHours(hours, minutes, 0, 0)
      eventTime = now.getTime() / 1000
    }

    // 构建符合新数据结构的记录
    const newRecord = {
      babyHashid: babyInfo.babyHashid || generateHashId(),
      name: babyInfo.name,
      dateString: dateString,
      eventType: record.eventType,
      eventTime: eventTime.toFixed(1),
      valueName: record.valueName,
      value: record.value || '',
      note: record.note || '',
      hashid: generateHashId(),
      uploaded: 0,
      adduserid: null,
      addusername: null
    }

    records.unshift(newRecord) // 添加到数组开头
    uni.setStorageSync(RECORD_STORAGE_KEY, JSON.stringify(records))
    return newRecord
  } catch (e) {
    console.error('添加记录失败:', e)
    return null
  }
}

/**
 * 获取最近N条记录
 * @param {Number} limit - 限制数量
 * @returns {Array} 记录列表
 */
export function getRecentRecords(limit = 10) {
  const records = getRecords()
  return records.slice(0, limit)
}

/**
 * 根据类型获取记录
 * @param {String} type - 记录类型 (feeding/stool/nutrition/medicine)
 * @returns {Array} 指定类型的记录
 */
export function getRecordsByType(type) {
  const records = getRecords()
  return records.filter(record => record.eventType === type)
}

/**
 * 获取指定类型记录中的唯一字段值，按最近记录顺序返回
 * @param {String} type - 记录类型 (feeding/stool/nutrition/medicine)
 * @param {String} field - 字段名称
 * @returns {Array} 唯一值列表
 */
export function getDistinctFieldValues(type, field) {
  const records = getRecords()
  const seen = new Set()
  const values = []
  for (const record of records) {
    if (record.eventType !== type) continue
    if (!record[field]) continue
    const value = record[field].toString()
    if (seen.has(value)) continue
    seen.add(value)
    values.push(value)
  }
  return values
}

/**
 * 删除记录
 * @param {String} recordHashid - 记录hashid
 */
export function deleteRecord(recordHashid) {
  try {
    const records = getRecords()
    const filteredRecords = records.filter(record => record.hashid !== recordHashid)
    uni.setStorageSync(RECORD_STORAGE_KEY, JSON.stringify(filteredRecords))
    return true
  } catch (e) {
    console.error('删除记录失败:', e)
    return false
  }
}

/**
 * 更新记录
 * @param {String} recordHashid - 记录hashid
 * @param {Object} updatedRecord - 更新的记录数据
 */
export function updateRecord(recordHashid, updatedRecord) {
  try {
    const records = getRecords()
    const index = records.findIndex(record => record.hashid === recordHashid)
    if (index === -1) {
      console.error('未找到要更新的记录')
      return false
    }

    // 解析用户选择的时间
    let eventTime = records[index].eventTime
    let dateString = records[index].dateString
    if (updatedRecord.date && updatedRecord.time) {
      dateString = updatedRecord.date
      const dateTimeStr = `${updatedRecord.date} ${updatedRecord.time}:00`
      eventTime = new Date(dateTimeStr).getTime() / 1000
    } else if (updatedRecord.time) {
      // 兼容旧格式，只有时分
      const [hours, minutes] = updatedRecord.time.split(':').map(Number)
      const now = new Date()
      now.setHours(hours, minutes, 0, 0)
      eventTime = now.getTime() / 1000
    }

    // 更新记录
    const updated = {
      ...records[index],
      dateString: dateString,
      eventTime: eventTime.toFixed(1),
      valueName: updatedRecord.valueName || records[index].valueName,
      value: updatedRecord.value || records[index].value,
      note: updatedRecord.note || records[index].note
    }

    records[index] = updated
    uni.setStorageSync(RECORD_STORAGE_KEY, JSON.stringify(records))
    return updated
  } catch (e) {
    console.error('更新记录失败:', e)
    return false
  }
}

/**
 * 清空所有记录
 */
export function clearRecords() {
  try {
    uni.removeStorageSync(RECORD_STORAGE_KEY)
    return true
  } catch (e) {
    console.error('清空记录失败:', e)
    return false
  }
}

/**
 * 生成hash id
 * @returns {String} hash id
 */
function generateHashId() {
  return 'ffffffff-f480-0bf5-ffff-ffffef05ac4a-' +
    Math.random().toString(36).substr(2, 32) +
    '=' +
    Date.now()
}

/**
 * 格式化日期为YYYY-MM-DD格式
 * @param {Date} date - 日期对象
 * @returns {String} 格式化后的日期
 */
function formatDate(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 计算出生天数
 * @param {String} birthDate - 出生日期，格式：YYYY-MM-DD
 * @returns {Object} 包含天数和年龄信息
 *   - days: 总天数
 *   - years: 年数
 *   - months: 月数
 *   - daysAge: 天数（不足一年的部分）
 */
export function calculateAge(birthDate) {
  if (!birthDate) {
    return {
      days: 0,
      years: 0,
      months: 0,
      daysAge: 0,
      text: '0天'
    }
  }

  try {
    // 解析出生日期
    const birth = new Date(birthDate)
    const now = new Date()

    // 验证日期有效性
    if (isNaN(birth.getTime())) {
      console.error('无效的出生日期:', birthDate)
      return {
        days: 0,
        years: 0,
        months: 0,
        daysAge: 0,
        text: '日期格式错误'
      }
    }

    // 计算时间差（毫秒）
    const diff = now - birth

    // 计算总天数
    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24))

    // 计算年龄
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44))
    const daysAge = Math.floor((diff % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24))

    // 格式化显示文本
    let text = ''
    if (totalDays === 0) {
      text = '刚出生'
    } else if (totalDays < 7) {
      text = `${totalDays}天`
    } else if (totalDays < 30) {
      text = `${Math.floor(totalDays / 7)}周${totalDays % 7}天`
    } else if (totalDays < 365) {
      text = `${months}个月${daysAge}天`
    } else {
      const remainingMonths = Math.floor((totalDays % 365) / 30.44)
      const remainingDays = Math.floor((totalDays % 365) % 30.44)
      if (remainingMonths > 0 || remainingDays > 0) {
        text = `${years}岁${remainingMonths}个月${remainingDays}天`
      } else {
        text = `${years}岁`
      }
    }

    return {
      days: totalDays,
      years: years,
      months: months,
      daysAge: daysAge,
      text: text
    }
  } catch (e) {
    console.error('计算出生天数失败:', e)
    return {
      days: 0,
      years: 0,
      months: 0,
      daysAge: 0,
      text: '计算错误'
    }
  }
}

/**
 * 格式化记录显示文本
 * @param {Object} record - 记录对象
 * @returns {String} 格式化后的文本
 */
export function formatRecordDetail(record) {
  switch (record.eventType) {
    case 'feeding':
      return `${record.value || ''}ml`
    case 'stool':
      return record.valueName || ''
    case 'nutrition':
      return record.valueName || ''
    case 'medicine':
      return record.valueName || ''
    case 'diaper':
      return record.valueName || record.note || ''
    default:
      return record.note || ''
  }
}

/**
 * 获取事件类型标签
 * @param {String} eventType - 事件类型
 * @returns {String} 类型标签
 */
export function getEventTypeLabel(eventType) {
  const labels = {
    feeding: '喂养',
    stool: '大便',
    nutrition: '营养品',
    medicine: '药品',
    diaper: '尿片'
  }
  return labels[eventType] || eventType
}

/**
 * 格式化时间显示
 * @param {String} eventTime - 事件时间（字符串格式时间戳）
 * @returns {String} 格式化后的时间
 */
export function formatTime(eventTime) {
  if (!eventTime) return ''

  try {
    const timestamp = parseFloat(eventTime) * 1000
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    // 今天
    if (diff < 86400000 && date.getDate() === now.getDate()) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }

    // 昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.getDate() === yesterday.getDate()) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }

    // 其他日期
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hours}:${minutes}`
  } catch (e) {
    console.error('格式化时间失败:', e)
    return ''
  }
}

/**
 * 批量导入记录
 * @param {Array} records - 记录数组
 * @returns {Number} 成功导入的记录数
 */
export function importRecords(records) {
  try {
    const existingRecords = getRecords()
    let successCount = 0

    records.forEach(record => {
      if (record.hashid) {
        // 检查是否已存在
        const exists = existingRecords.some(r => r.hashid === record.hashid)
        if (!exists) {
          existingRecords.unshift(record)
          successCount++
        }
      }
    })

    // 按时间排序
    existingRecords.sort((a, b) => {
      return parseFloat(b.eventTime) - parseFloat(a.eventTime)
    })

    uni.setStorageSync(RECORD_STORAGE_KEY, JSON.stringify(existingRecords))
    return successCount
  } catch (e) {
    console.error('导入记录失败:', e)
    return 0
  }
}

