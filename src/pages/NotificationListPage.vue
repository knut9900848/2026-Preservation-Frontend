<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold">Notifications</div>
      <div class="row q-gutter-sm">
        <q-btn-toggle
          v-model="filter"
          no-caps
          rounded
          unelevated
          toggle-color="primary"
          :options="[
            { label: 'All', value: 'all' },
            { label: 'Unread', value: 'unread' },
            { label: 'Read', value: 'read' },
          ]"
        />
        <q-btn
          v-if="notificationStore.unreadCount > 0"
          flat no-caps color="primary"
          icon="mdi-check-all"
          label="Mark All Read"
          @click="notificationStore.markAllRead()"
        />
      </div>
    </div>

    <q-table
      :rows="filteredNotifications"
      :columns="columns"
      row-key="id"
      flat bordered
      :rows-per-page-options="[10, 25, 50]"
      :loading="loading"
      @row-click="onRowClick"
      class="cursor-pointer"
    >
      <template #body-cell-action="props">
        <q-td :props="props">
          <div class="row items-center no-wrap q-gutter-xs">
            <q-icon
              :name="getActionIcon(props.row.data.action)"
              :color="getActionColor(props.row.data.action)"
              size="sm"
            />
            <q-badge
              :color="getActionColor(props.row.data.action)"
              :label="getActionLabel(props.row.data.action)"
            />
          </div>
        </q-td>
      </template>

      <template #body-cell-sheet_number="props">
        <q-td :props="props">
          <span :class="{ 'text-weight-bold': !props.row.read_at }">
            {{ props.row.data.sheet_number }}
          </span>
        </q-td>
      </template>

      <template #body-cell-message="props">
        <q-td :props="props">
          {{ props.row.data.message }}
        </q-td>
      </template>

      <template #body-cell-performed_by="props">
        <q-td :props="props">
          {{ props.row.data.performed_by?.name ?? '' }}
        </q-td>
      </template>

      <template #body-cell-created_at="props">
        <q-td :props="props">
          <q-tooltip>{{ new Date(props.row.created_at).toLocaleString() }}</q-tooltip>
          {{ formatTime(props.row.created_at) }}
        </q-td>
      </template>

      <template #body-cell-read_at="props">
        <q-td :props="props">
          <q-icon
            v-if="props.row.read_at"
            name="mdi-check-circle"
            color="green"
            size="sm"
          />
          <q-badge v-else color="blue" label="Unread" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore, type Notification } from 'src/stores/notification';

const notificationStore = useNotificationStore();
const router = useRouter();
const filter = ref<'all' | 'unread' | 'read'>('all');
const loading = ref(false);

const columns = [
  { name: 'action', label: 'Action', field: 'action', align: 'left' as const, sortable: true },
  { name: 'sheet_number', label: 'Sheet Number', field: 'sheet_number', align: 'left' as const, sortable: true },
  { name: 'message', label: 'Message', field: 'message', align: 'left' as const },
  { name: 'performed_by', label: 'Performed By', field: 'performed_by', align: 'left' as const },
  { name: 'created_at', label: 'Time', field: 'created_at', align: 'left' as const, sortable: true },
  { name: 'read_at', label: 'Status', field: 'read_at', align: 'center' as const },
];

const filteredNotifications = computed(() => {
  if (filter.value === 'unread') return notificationStore.notifications.filter((n) => !n.read_at);
  if (filter.value === 'read') return notificationStore.notifications.filter((n) => !!n.read_at);
  return notificationStore.notifications;
});

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

function onRowClick(_evt: Event, row: Notification) {
  void notificationStore.markAsRead(row.id);
  void router.push(`/checksheets/${row.data.checksheet_id}`);
}

onMounted(async () => {
  loading.value = true;
  await notificationStore.fetchNotifications();
  loading.value = false;
});
</script>
