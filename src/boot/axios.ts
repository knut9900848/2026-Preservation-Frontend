import { boot } from 'quasar/wrappers';
import axios, { type AxiosInstance } from 'axios';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// API 기본 URL 설정
const api = axios.create({
  baseURL: 'http://preservation.test',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// localStorage에 저장된 토큰을 axios 헤더에 설정
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default boot(({ app }) => {
  // Vue 앱에서 this.$axios 및 this.$api로 사용 가능
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
