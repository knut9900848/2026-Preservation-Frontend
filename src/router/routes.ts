import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'profile', component: () => import('pages/ProfilePage.vue') },
      { path: 'equipments', component: () => import('pages/EquipmentListPage.vue') },
      { path: 'checksheets', component: () => import('pages/ChecksheetListPage.vue') },
      { path: 'setting/activities', component: () => import('pages/setting/ActivityListPage.vue') },
      {
        path: 'setting/suppliers',
        component: () => import('pages/setting/SupplierListPage.vue'),
      },
      {
        path: 'setting/locations',
        component: () => import('pages/setting/CurrentLocationListPage.vue'),
      },
      {
        path: 'setting/categories',
        component: () => import('pages/setting/CategoryListPage.vue'),
      },
      {
        path: 'setting/sub-categories',
        component: () => import('pages/setting/SubCategoryListPage.vue'),
      },
      {
        path: 'setting/users',
        component: () => import('pages/UserListPage.vue'),
      },
      {
        path: 'role-permission/roles',
        component: () => import('pages/role-permission/RoleListPage.vue'),
      },
      {
        path: 'role-permission/permissions',
        component: () => import('pages/role-permission/PermissionListPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
