export function getList() {
  return uni.request({
    url: 'https://23f73a75-107e-4b2c-a176-ccc3b2fb897d-00-uvz4sj1qxm8v.spock.replit.dev/api/todos',
    method: 'GET',
    data: {}
  })
}

export function addItem(data) {
  return uni.request({
    url: 'https://23f73a75-107e-4b2c-a176-ccc3b2fb897d-00-uvz4sj1qxm8v.spock.replit.dev/api/todos',
    method: 'POST',
    data: {"title":JSON.stringify(data),"priority":"medium"},
  })
}

export function editItem(id, cur, data) {
  uni.request({
    url: `https://23f73a75-107e-4b2c-a176-ccc3b2fb897d-00-uvz4sj1qxm8v.spock.replit.dev/api/todos/${id}`,
    method: 'PUT',
    data: {
      ...cur,
      title: JSON.stringify(data)
    }
  })
}