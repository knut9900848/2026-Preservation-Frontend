import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'boot/axios';

export interface NotificationData {
  action: string;
  sheet_number: string;
  checksheet_id: number;
  performed_by: { id: number; name: string };
  message: string;
}

export interface Notification {
  id: string;
  type: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);

  async function fetchNotifications() {
    try {
      const response = await api.get('/api/notifications');
      notifications.value = response.data.data ?? response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }

  async function fetchUnreadCount() {
    try {
      const response = await api.get('/api/notifications/unread-count');
      unreadCount.value = response.data.unread_count ?? response.data;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }

  async function markAllRead() {
    try {
      await api.put('/api/notifications/read-all');
      notifications.value.forEach((n) => {
        if (!n.read_at) n.read_at = new Date().toISOString();
      });
      unreadCount.value = 0;
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  }

  async function markAsRead(id: string) {
    try {
      await api.put(`/api/notifications/${id}/read`);
      const n = notifications.value.find((n) => n.id === id);
      if (n && !n.read_at) {
        n.read_at = new Date().toISOString();
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async function onNewEvent() {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAllRead,
    markAsRead,
    onNewEvent,
  };
});
