<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 700px; max-width: 90vw; max-height: 80vh;">
      <q-card-section class="row items-center">
        <div class="text-h6">Checksheet History</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-md" style="max-height: 60vh; overflow-y: auto;">
        <!-- Loading State -->
        <div v-if="loading" class="text-center q-pa-md">
          <q-spinner color="primary" size="3em" />
          <div class="text-body2 q-mt-md">Loading history...</div>
        </div>

        <!-- History Timeline -->
        <q-timeline v-else-if="histories.length > 0" color="primary">
          <q-timeline-entry v-for="history in histories" :key="history.id" :title="getActionTitle(history.action)"
            :subtitle="formatDate(history.created_at)" :icon="getActionIcon(history.action)"
            :color="getActionColor(history.action)">
            <!-- User Info -->
            <div class="q-mb-sm">
              <q-chip size="sm" color="grey-3" text-color="dark" icon="person">
                {{ history.user.name }}
              </q-chip>
            </div>

            <!-- Status Change -->
            <div class="row items-center q-gutter-sm q-mb-sm">
              <q-badge :color="getStatusColor(history.from_status)">
                {{ history.from_status }}
              </q-badge>
              <q-icon name="arrow_forward" size="xs" />
              <q-badge :color="getStatusColor(history.to_status)">
                {{ history.to_status }}
              </q-badge>
            </div>

            <!-- Metadata (if exists) -->
            <div v-if="history.metadata" class="q-mt-sm">
              <div class="text-caption text-grey-7">Additional Information:</div>
              <q-list dense bordered class="q-mt-xs">
                <q-item v-for="(value, key) in history.metadata" :key="key">
                  <q-item-section>
                    <q-item-label caption>{{ formatMetadataKey(key) }}</q-item-label>
                    <q-item-label>{{ value }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-timeline-entry>
        </q-timeline>

        <!-- Empty State -->
        <div v-else class="text-center q-pa-xl text-grey-6">
          <q-icon name="history" size="64px" color="grey-4" />
          <div class="text-h6 q-mt-md">No History Available</div>
          <div class="text-body2">This checksheet has no recorded history yet.</div>
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
}

interface CheckSheetHistory {
  id: number;
  check_sheet_id: number;
  user_id: number;
  user: User;
  action: 'completed' | 'reviewed' | 'approved' | 'rejected';
  from_status: string;
  to_status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface Props {
  equipmentId: number | null;
  checksheetId: number | null;
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const $q = useQuasar();

const showDialog = ref(false);
const histories = ref<CheckSheetHistory[]>([]);
const loading = ref(false);

// Watch modelValue to sync with showDialog
watch(
  () => props.modelValue,
  (newValue) => {
    showDialog.value = newValue;
    if (newValue) {
      void fetchHistory();
    }
  },
  { immediate: true }
);

// Watch showDialog to emit update:modelValue
watch(showDialog, (newValue) => {
  emit('update:modelValue', newValue);
});

const fetchHistory = async () => {
  if (!props.checksheetId) return;

  loading.value = true;

  try {
    // Use equipment-scoped API if equipmentId is provided, otherwise use global API
    const url = props.equipmentId
      ? `/api/equipments/${props.equipmentId}/checksheets/${props.checksheetId}/history`
      : `/api/checksheets/${props.checksheetId}/history`;

    const response = await api.get(url);

    histories.value = response.data.histories || [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load checksheet history',
      position: 'bottom',
    });
  } finally {
    loading.value = false;
  }
};

const getActionTitle = (action: string): string => {
  const titles: Record<string, string> = {
    completed: 'Checksheet Completed',
    reviewed: 'Checksheet Reviewed',
    approved: 'Checksheet Approved',
    rejected: 'Checksheet Rejected',
  };
  return titles[action] || action;
};

const getActionIcon = (action: string): string => {
  const icons: Record<string, string> = {
    completed: 'check_circle',
    reviewed: 'rate_review',
    approved: 'verified',
    rejected: 'cancel',
  };
  return icons[action] || 'help';
};

const getActionColor = (action: string): string => {
  const colors: Record<string, string> = {
    completed: 'primary',
    reviewed: 'info',
    approved: 'positive',
    rejected: 'negative',
  };
  return colors[action] || 'grey';
};

const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  const colors: Record<string, string> = {
    draft: 'grey',
    completed: 'primary',
    reviewed: 'info',
    approved: 'positive',
    rejected: 'negative',
  };
  return colors[statusLower] || 'grey';
};

const formatDate = (dateString: string): string => {
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

const formatMetadataKey = (key: string): string => {
  // Convert snake_case to Title Case
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
</script>

<style scoped lang="scss">
.q-timeline {
  padding: 0;
}
</style>
