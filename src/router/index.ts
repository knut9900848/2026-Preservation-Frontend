import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // 라우터 가드 추가
  Router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    const isAuthenticated = !!token;

    // 로그인 페이지로 이동하려는 경우
    if (to.path === '/login') {
      // 이미 로그인된 상태라면 홈으로 리다이렉트
      if (isAuthenticated) {
        next('/');
      } else {
        next();
      }
    }
    // 로그인 페이지가 아닌 경우
    else {
      // 로그인되지 않은 상태라면 로그인 페이지로 리다이렉트
      if (!isAuthenticated) {
        next('/login');
      } else {
        next();
      }
    }
  });

  return Router;
});
