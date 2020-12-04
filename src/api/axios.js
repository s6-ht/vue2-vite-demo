import axios from 'axios'
import {getApi} from './api'
import qs from 'qs'

const instance = axios.create({
  baseURL: process.env.VUE_APP_API_BASEURL,
  withCredentials: true,
  timeout: 5000
})

instance.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => Promise.reject(error)
)

instance.interceptors.response.use(
  (res) => {
    if (res.status !== 200) {
      return Promise.reject(res.data)
    }
    return res.data
  },
  (err) => {
    return Promise.reject(err)
  }
)

export default function axiosData(api, data = {}, headers = {}) {
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
