<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 500px; max-width: 90vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">User Information</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-md">
        <!-- Loading State -->
        <div v-if="loading" class="text-center q-pa-md">
          <q-spinner color="primary" size="3em" />
          <div class="text-body2 q-mt-md">Loading user information...</div>
        </div>

        <!-- User Info Display -->
        <div v-else-if="userInfo" class="q-gutter-md">
          <!-- Avatar and Name -->
          <div class="row items-center q-gutter-md">
            <q-avatar size="80px" color="primary" text-color="white">
              <q-img v-if="userInfo.avatar" :src="userInfo.avatar" />
              <span v-else class="text-h4">{{ getInitials(userInfo.name) }}</span>
            </q-avatar>
            <div>
              <div class="text-h6">{{ userInfo.name }}</div>
              <div class="text-caption text-grey-7">{{ userInfo.user_type }}</div>
              <q-badge :color="userInfo.is_active ? 'positive' : 'negative'" class="q-mt-xs">
                {{ userInfo.is_active ? 'Active' : 'Inactive' }}
              </q-badge>
            </div>
          </div>

          <q-separator />

          <!-- Contact Information -->
          <div class="q-gutter-sm">
            <div class="text-subtitle2 text-primary q-mb-sm">
              <q-icon name="contacts" class="q-mr-sm" />
              Contact Information
            </div>

            <q-list dense bordered separator>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="email" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Email</q-item-label>
                  <q-item-label>{{ userInfo.email }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="userInfo.phone">
                <q-item-section avatar>
                  <q-icon name="phone" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Phone</q-item-label>
                  <q-item-label>{{ userInfo.phone }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Personal Information -->
          <div class="q-gutter-sm" v-if="userInfo.date_of_birth || userInfo.job_start_date || userInfo.job_end_date">
            <div class="text-subtitle2 text-primary q-mb-sm">
              <q-icon name="person" class="q-mr-sm" />
              Personal Information
            </div>

            <q-list dense bordered separator>
              <q-item v-if="userInfo.date_of_birth">
                <q-item-section avatar>
                  <q-icon name="cake" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Date of Birth</q-item-label>
                  <q-item-label>{{ formatDate(userInfo.date_of_birth) }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="userInfo.job_start_date">
                <q-item-section avatar>
                  <q-icon name="work" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Job Start Date</q-item-label>
                  <q-item-label>{{ formatDate(userInfo.job_start_date) }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="userInfo.job_end_date">
                <q-item-section avatar>
                  <q-icon name="work_off" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Job End Date</q-item-label>
                  <q-item-label>{{ formatDate(userInfo.job_end_date) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Account Information -->
          <div class="q-gutter-sm">
            <div class="text-subtitle2 text-primary q-mb-sm">
              <q-icon name="info" class="q-mr-sm" />
              Account Information
            </div>

            <q-list dense bordered separator>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="event" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Created At</q-item-label>
                  <q-item-label>{{ formatDateTime(userInfo.created_at) }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="userInfo.updated_at">
                <q-item-section avatar>
                  <q-icon name="update" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Last Updated</q-item-label>
                  <q-item-label>{{ formatDateTime(userInfo.updated_at) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>

        <!-- Error State -->
        <div v-else class="text-center q-pa-xl text-grey-6">
          <q-icon name="error" size="64px" color="grey-4" />
          <div class="text-h6 q-mt-md">Failed to Load User Information</div>
          <div class="text-body2">Please try again later.</div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn label="Close" color="primary" flat v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  job_start_date?: string | null;
  job_end_date?: string | null;
  user_type: string;
  is_active: boolean;
  avatar?: string | null;
  created_at: string;
  updated_at?: string;
}

interface Props {
  userId: number | null;
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const $q = useQuasar();

const showDialog = ref(false);
const userInfo = ref<User | null>(null);
const loading = ref(false);

// Watch modelValue to sync with showDialog
watch(
  () => props.modelValue,
  (newValue) => {
    showDialog.value = newValue;
    if (newValue && props.userId) {
      void fetchUserInfo();
    }
  },
  { immediate: true }
);

// Watch showDialog to emit update:modelValue
watch(showDialog, (newValue) => {
  emit('update:modelValue', newValue);
  if (!newValue) {
    // Clear user info when dialog is closed
    userInfo.value = null;
  }
});

const fetchUserInfo = async () => {
  if (!props.userId) return;

  loading.value = true;

  try {
    const response = await api.get(`/api/users/${props.userId}`);
    userInfo.value = response.data.user || response.data.data || null;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load user information',
      position: 'bottom',
    });
    userInfo.value = null;
  } finally {
    loading.value = false;
  }
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
</script>

<style scoped lang="scss">
.q-avatar {
  border: 2px solid #e0e0e0;
}
</style>
