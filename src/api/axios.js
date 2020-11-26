import axios from 'axios'
import getApi from './api'
import qs from 'qs'
import { Loading, Notification } from 'element-ui'
let globalLoad: any

const instance = axios.create({
  baseURL: process.env.VUE_APP_API_BASEURL,
  withCredentials: true,
  timeout: 5000
})

instance.interceptors.request.use(
  (config) => {
    if (config.headers.loading == undefined || config.headers.loading) {
      globalLoad = Loading.service({ fullscreen: true })
    }
    config.params = Object.assign({}, config.params, {
      loginType: '',
      requestNo: Date.now()
    })
    return config
  },
  (error) => Promise.reject(error)
)

instance.interceptors.response.use(
  (res) => {
    if (res.status !== 200) {
      console.error(res.statusText)
      return Promise.reject(res.data)
    }
    if (globalLoad !== undefined) {
      globalLoad.close()
    }
    return res.data
  },
  (err) => {
    console.log(err)
    if (globalLoad !== undefined) {
      globalLoad.close()
    }
    const { response } = err

    if (response !== undefined && response.status === 401) {
      const {
        headers: { location }
      } = response
      window.open(location)
    }
    Notification.error({
      title: '错误',
      message: '系统异常',
      showClose: false,
      position: 'top-left'
    })
    return Promise.reject(err)
  }
)

export default function fetchData(api: string, data: any = {}, headers: any = {}): any {
  const config = getApi(api)
  let [url, method] = config
  if (!url) throw TypeError('请求的api未在config配置中')

  let options = {
    url,
    method,
    headers
  }
  if (method === 'GET') {
    options.params = data
  }
  if (method === 'POST') {
    options.data = qs.stringify(data)
  }
  return instance.request(options)
}
