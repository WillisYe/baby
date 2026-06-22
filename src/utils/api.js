let urlDev = 'https://ac016ac0-5001-4578-9218-8d475e137b06-00-2ojs7s7phnq3m.worf.replit.dev/'
let urlProd = 'https://baby-logbook--willisye.replit.app/'

export function getList() {
  return uni.request({
    url: urlDev + `api/babies`,
    method: 'GET',
    data: {}
  })
}

export function addItem(data) {
  return uni.request({
    url: urlDev + `api/babies`,
    method: 'POST',
    data: data,
  })
}

export function editItem(data) {
  uni.request({
    url: urlDev + `api/babies/${data.deviceId}`,
    method: 'PUT',
    data: data
  })
}

export function getItem(deviceId) {
  return uni.request({
    url: urlDev + `api/babies/${deviceId}`,
    method: 'GET',
    data: {}
  })
}

export function deleteItem(deviceId) {
  return uni.request({
    url: urlDev + `api/babies/${deviceId}`,
    method: 'DELETE',
    data: {}
  })
}