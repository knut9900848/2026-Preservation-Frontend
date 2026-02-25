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

        <!-- 알림 벨 -->
        <q-btn flat dense round icon="notifications">
          <q-badge v-if="notificationStore.unreadCount > 0" color="red" floating>
            {{ notificationStore.unreadCount }}
          </q-badge>
          <q-menu style="min-width: 320px; max-width: 400px;">
            <q-list>
              <q-item-label header class="row items-center justify-between">
                <span class="text-weight-bold">Notifications</span>
                <q-btn
                  v-if="notificationStore.notifications.length > 0"
                  flat dense no-caps size="sm" color="primary"
                  label="Mark all read"
                  @click="notificationStore.markAllRead()"
                />
              </q-item-label>
              <q-separator />
              <div v-if="notificationStore.notifications.length === 0" class="q-pa-md text-center text-grey">
                No notifications
              </div>
              <q-item
                v-for="n in notificationStore.notifications"
                :key="n.id"
                clickable v-close-popup
                :class="{ 'bg-blue-1': !n.read_at }"
                @click="handleNotificationClick(n)"
              >
                <q-item-section avatar>
                  <q-icon
                    :name="getActionIcon(n.data.action)"
                    :color="getActionColor(n.data.action)"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    <span class="text-weight-medium">{{ n.data.sheet_number }}</span>
                    {{ getActionLabel(n.data.action) }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ n.data.performed_by?.name ?? '' }} · {{ formatTime(n.created_at) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="getActionColor(n.data.action)" :label="getActionLabel(n.data.action)" />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="router.push('/notifications')" class="text-center">
                <q-item-section>
                  <q-item-label class="text-primary text-weight-medium">View all notifications</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
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
          <q-item clickable to="/setting/general" class="q-pl-lg">
            <q-item-section avatar>
              <q-icon name="mdi-tune" />
            </q-item-section>
            <q-item-section>
              <q-item-label>General</q-item-label>
            </q-item-section>
          </q-item>

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

          <q-item clickable to="/setting/disciplines" class="q-pl-lg">
            <q-item-section avatar>
              <q-icon name="mdi-hammer-wrench" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Disciplines</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/setting/discipline-items" class="q-pl-lg">
            <q-item-section avatar>
              <q-icon name="mdi-format-list-checks" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Discipline Items</q-item-label>
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
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { useNotificationStore, type Notification } from 'src/stores/notification';
import { api } from 'boot/axios';
import { getEcho } from 'boot/echo';

const leftDrawerOpen = ref(false);
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const router = useRouter();
const $q = useQuasar();

// 다크모드 설정 (localStorage에서 불러오기, 기본값은 false - 라이트모드)
const isDarkMode = ref(
  localStorage.getItem('darkMode') !== null
    ? localStorage.getItem('darkMode') === 'true'
    : false
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
  const echo = getEcho();
  if (echo) {
    for (const ch of channelNames) {
      echo.leave(ch);
    }
  }
  authStore.logout();
  void router.push('/login');
}

// 알림 헬퍼 함수
const actionMap: Record<string, { icon: string; color: string; label: string }> = {
  completed: { icon: 'mdi-check-circle-outline', color: 'blue', label: 'Completed' },
  approved: { icon: 'mdi-shield-check-outline', color: 'green', label: 'Approved' },
  accepted: { icon: 'mdi-star-outline', color: 'amber-9', label: 'Accepted' },
  rejected: { icon: 'mdi-close-circle-outline', color: 'red', label: 'Rejected' },
};

function getActionIcon(action: string): string {
  return actionMap[action]?.icon ?? 'mdi-information-outline';
}

function getActionColor(action: string): string {
  return actionMap[action]?.color ?? 'grey';
}

function getActionLabel(action: string): string {
  return actionMap[action]?.label ?? action;
}

function formatTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

function handleNotificationClick(n: Notification) {
  void notificationStore.markAsRead(n.id);
  void router.push(`/checksheets/${n.data.checksheet_id}`);
}

// Echo 채널 구독
const channelNames: string[] = [];

function subscribeToChannel() {
  const echo = getEcho();
  const roles = authStore.user?.roles;
  if (!echo || !roles || roles.length === 0) {
    console.warn('[Echo] Cannot subscribe: echo=', !!echo, 'roles=', roles);
    return;
  }

  for (const role of roles) {
    const ch = `role.${role}`;
    channelNames.push(ch);
    console.log('[Echo] Subscribing to private channel:', ch);
    echo.private(ch).listen('.workflow.changed', (event: Record<string, unknown>) => {
      console.log('[Echo] Received workflow.changed event:', event);
      const e = event as { sheet_number?: string; message?: string; action?: string; performed_by?: { name: string } };
      $q.notify({
        type: 'info',
        message: e.message ?? e.sheet_number ?? '',
        caption: `by ${e.performed_by?.name ?? ''}`,
        position: 'top-right',
        timeout: 5000,
        icon: getActionIcon(e.action ?? ''),
      });
      void notificationStore.onNewEvent();
    });
  }
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
      return; // 로그아웃 시 채널 구독 불필요
    }
  }

  // roles가 없으면 API에서 다시 가져오기 시도
  if (authStore.user && (!authStore.user.roles || authStore.user.roles.length === 0)) {
    try {
      const response = await api.get('/api/user');
      if (response.data.user) {
        authStore.setUser(response.data.user);
      }
    } catch {
      // 무시
    }
  }

  // 알림 초기 조회
  void notificationStore.fetchNotifications();
  void notificationStore.fetchUnreadCount();

  // roles가 이미 있으면 바로 구독
  if (authStore.user?.roles && authStore.user.roles.length > 0) {
    subscribeToChannel();
  }
});

// roles가 나중에 로드되면 구독
watch(
  () => authStore.user?.roles,
  (roles) => {
    if (roles && roles.length > 0 && channelNames.length === 0) {
      subscribeToChannel();
    }
  },
);

onUnmounted(() => {
  const echo = getEcho();
  if (echo) {
    for (const ch of channelNames) {
      echo.leave(ch);
    }
  }
});
</script>
