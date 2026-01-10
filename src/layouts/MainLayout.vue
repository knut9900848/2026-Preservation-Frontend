<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <div class="row items-center no-wrap">
            <img src="~assets/logo_w.png" alt="Logo" style="height: 30px; margin-right: 12px;" />
          </div>
        </q-toolbar-title>

        <q-btn flat dense round :icon="isDarkMode ? 'light_mode' : 'dark_mode'" @click="toggleDarkMode">
          <q-tooltip>{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</q-tooltip>
        </q-btn>

        <q-btn flat dense v-if="authStore.user">
          <div class="row items-center no-wrap">
            <q-icon name="account_circle" size="sm" class="q-mr-xs" />
            <div class="text-weight-medium">{{ authStore.user.name }}</div>
          </div>
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable v-close-popup to="/profile">
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>Profile</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item-label header>
          PRESERVATION MANAGEMENT SYSTEM
        </q-item-label>

        <q-item clickable to="/" exact>
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Home</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/equipments">
          <q-item-section avatar>
            <q-icon name="mdi-engine" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Equipments</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/checksheets">
          <q-item-section avatar>
            <q-icon name="mdi-folder-open" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Checksheets</q-item-label>
          </q-item-section>
        </q-item>

        <q-expansion-item icon="mdi-cog" label="Setting" expand-separator default-opened>
          <q-item clickable to="/setting/activities" class="q-pl-lg">
            <q-item-section avatar>
              <q-icon name="mdi-transit-transfer" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Activities</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/setting/suppliers" class="q-pl-lg">
            <q-item-section avatar>
              <q-icon name="business" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Suppliers</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/setting/locations" class="q-pl-lg">
            <q-item-section avatar>
              <q-icon name="place" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Current Locations</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/setting/categories" class="q-pl-lg">
            <q-item-section avatar>
              <q-icon name="mdi-sitemap" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Categories</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/setting/sub-categories" class="q-pl-lg">
            <q-item-section avatar>
              <q-icon name="mdi-file-tree" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Sub Categories</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/setting/users" class="q-pl-lg">
            <q-item-section avatar>
              <q-icon name="mdi-account-multiple" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Users</q-item-label>
            </q-item-section>
          </q-item>
        </q-expansion-item>

        <q-expansion-item icon="mdi-account-star" label="Role &amp; Permission" expand-separator default-opened>
          <q-item clickable to="/role-permission/roles" class="q-pl-lg">
            <q-item-section avatar>
              <q-icon name="mdi-account-switch" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Roles</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/role-permission/permissions" class="q-pl-lg">
            <q-item-section avatar>
              <q-icon name="mdi-key" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Permissions</q-item-label>
            </q-item-section>
          </q-item>
        </q-expansion-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { api } from 'boot/axios';

const leftDrawerOpen = ref(false);
const authStore = useAuthStore();
const router = useRouter();
const $q = useQuasar();

// 다크모드 설정 (localStorage에서 불러오기, 기본값은 true - 다크모드)
const isDarkMode = ref(
  localStorage.getItem('darkMode') !== null
    ? localStorage.getItem('darkMode') === 'true'
    : true
);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  $q.dark.set(isDarkMode.value);
  localStorage.setItem('darkMode', String(isDarkMode.value));
}

function handleLogout() {
  authStore.logout();
  void router.push('/login');
}

// 컴포넌트 마운트 시 다크모드 설정 및 사용자 정보 가져오기
onMounted(async () => {
  // 다크모드 설정 적용
  $q.dark.set(isDarkMode.value);

  // 사용자 정보가 없고 토큰이 있으면 API에서 사용자 정보 가져오기
  if (authStore.token && !authStore.user) {
    try {
      console.log('Fetching user from API...');
      const response = await api.get('/api/user');
      console.log('API response:', response.data);
      if (response.data.user) {
        authStore.setUser(response.data.user);
        console.log('User saved:', authStore.user);
      }
    } catch (error) {
      console.error('API Error:', error);
      // 토큰이 유효하지 않으면 로그아웃
      authStore.logout();
      void router.push('/login');
    }
  }
});
</script>
