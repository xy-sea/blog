import axios from 'axios';

const Axios = axios.create();
Axios.defaults.timeout = 8000;
Axios.defaults.withCredentials = true;
Axios.defaults.dataType = 'JSON';

// 请求拦截器
Axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
Axios.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(response);
    }
  },
  (error) => {
    if (error.response.status) {
      switch (error.response.status) {
        case 404:
          console.log('网络请求不存在');
          break;
        case 500:
          console.log('网络接口失败');
          break;
        // 其他错误，直接抛出错误提示
        default:
      }
      return Promise.reject(error.response);
    }
    return Promise.reject(error.response);
  }
);

export default Axios;
