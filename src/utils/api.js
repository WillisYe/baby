export function getList() {
  return uni.request({
    url: `https://baby-logbook--willisye.replit.app/api/babies`,
    method: 'GET',
    data: {}
  })
}

export function addItem(data) {
  return uni.request({
    url: `https://baby-logbook--willisye.replit.app/api/babies`,
    method: 'POST',
    data: data,
  })
}

export function editItem(data) {
  uni.request({
    url: `https://baby-logbook--willisye.replit.app/api/babies/${data.deviceId}`,
    method: 'PUT',
    data: data
  })
}

export function getItem(deviceId) {
  return uni.request({
    url: `https://baby-logbook--willisye.replit.app/api/babies/${deviceId}`,
    method: 'GET',
    data: {}
  })
}