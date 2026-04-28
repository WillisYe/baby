export function getList() {
  return uni.request({
    url: `https://ac016ac0-5001-4578-9218-8d475e137b06-00-2ojs7s7phnq3m.worf.replit.dev/api/babies`,
    method: 'GET',
    data: {}
  })
}

export function addItem(data) {
  return uni.request({
    url: `https://ac016ac0-5001-4578-9218-8d475e137b06-00-2ojs7s7phnq3m.worf.replit.dev/api/babies`,
    method: 'POST',
    data: data,
  })
}

export function editItem(data) {
  uni.request({
    url: `https://ac016ac0-5001-4578-9218-8d475e137b06-00-2ojs7s7phnq3m.worf.replit.dev/api/babies/${data.deviceId}`,
    method: 'PUT',
    data: data
  })
}

export function getItem(deviceId) {
  return uni.request({
    url: `https://ac016ac0-5001-4578-9218-8d475e137b06-00-2ojs7s7phnq3m.worf.replit.dev/api/babies/${deviceId}`,
    method: 'GET',
    data: {}
  })
}