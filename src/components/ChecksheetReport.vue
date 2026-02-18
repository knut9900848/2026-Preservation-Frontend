<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 700px; max-width: 90vw; max-height: 80vh;">
      <q-card-section class="row items-center">
        <div class="text-h6">Reports</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-md" style="max-height: 60vh; overflow-y: auto;">
        <!-- Loading State -->
        <div v-if="loading" class="text-center q-pa-md">
          <q-spinner color="primary" size="3em" />
          <div class="text-body2 q-mt-md">Loading reports...</div>
        </div>

        <!-- Reports Table -->
        <q-table
          v-else-if="reports.length > 0"
          :rows="reports"
          :columns="columns"
          row-key="id"
          flat
          bordered
          separator="cell"
          :rows-per-page-options="[0]"
          hide-pagination
        >
          <template v-slot:body-cell-revision_number="props">
            <q-td :props="props">
              <q-badge color="primary" :label="`Rev ${props.row.revision_number}`" />
            </q-td>
          </template>

          <template v-slot:body-cell-file_size="props">
            <q-td :props="props">
              {{ formatFileSize(props.row.file_size) }}
            </q-td>
          </template>

          <template v-slot:body-cell-checksheet_status="props">
            <q-td :props="props">
              <q-badge :color="getStatusColor(props.row.checksheet_status)" :label="props.row.checksheet_status" />
            </q-td>
          </template>

          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                round
                icon="download"
                color="primary"
                @click="downloadReport(props.row)"
              >
                <q-tooltip>Download PDF</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>

        <!-- Empty State -->
        <div v-else class="text-center q-pa-xl text-grey-6">
          <q-icon name="mdi-file-document-outline" size="64px" color="grey-4" />
          <div class="text-h6 q-mt-md">No Reports Yet</div>
          <div class="text-body2">Click the button below to generate the first report.</div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          label="Generate New Report"
          color="primary"
          icon="mdi-file-plus"
          :loading="generating"
          @click="generateNewReport"
        />
        <q-btn label="Close" color="primary" flat v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

interface Report {
  id: number;
  check_sheet_id: number;
  generated_by: number;
  revision_number: number;
  file_path: string;
  file_name: string;
  file_size: number | null;
  checksheet_status: string;
  notes: string | null;
  created_at: string;
  user?: { id: number; name: string };
}

interface Props {
  checksheetId: number | null;
  sheetNumber?: string;
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const $q = useQuasar();

const showDialog = ref(false);
const reports = ref<Report[]>([]);
const loading = ref(false);
const generating = ref(false);

const columns = [
  {
    name: 'revision_number',
    label: 'Revision',
    field: 'revision_number',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'file_name',
    label: 'File Name',
    field: 'file_name',
    align: 'left' as const,
  },
  {
    name: 'file_size',
    label: 'Size',
    field: 'file_size',
    align: 'center' as const,
  },
  {
    name: 'checksheet_status',
    label: 'Status',
    field: 'checksheet_status',
    align: 'center' as const,
  },
  {
    name: 'created_at',
    label: 'Generated At',
    field: 'created_at',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center' as const,
  },
];

watch(
  () => props.modelValue,
  (newValue) => {
    showDialog.value = newValue;
    if (newValue) {
      void fetchReports();
    }
  },
  { immediate: true }
);

watch(showDialog, (newValue) => {
  emit('update:modelValue', newValue);
});

const fetchReports = async () => {
  if (!props.checksheetId) return;

  loading.value = true;
  try {
    const response = await api.get(`/api/checksheets/${props.checksheetId}/reports`);
    reports.value = response.data.reports || response.data.data || response.data || [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load reports',
      position: 'bottom',
    });
  } finally {
    loading.value = false;
  }
};

const generateNewReport = async () => {
  if (!props.checksheetId) return;

  generating.value = true;
  try {
    await api.post(`/api/checksheets/${props.checksheetId}/reports`);

    $q.notify({
      type: 'positive',
      message: 'New report generated successfully',
      position: 'bottom',
    });

    await fetchReports();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to generate report',
      position: 'bottom',
    });
  } finally {
    generating.value = false;
  }
};

const downloadReport = async (report: Report) => {
  if (!props.checksheetId) return;

  try {
    const response = await api.get(
      `/api/checksheets/${props.checksheetId}/reports/${report.id}/download`,
      { responseType: 'blob' }
    );

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to download report',
      position: 'bottom',
    });
  }
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'blue-grey',
    completed: 'blue',
    approved: 'green',
    accepted: 'amber-9',
  };
  return colors[status.toLowerCase()] || 'grey';
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
</script>
