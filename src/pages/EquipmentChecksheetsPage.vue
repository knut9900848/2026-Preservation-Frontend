<template>
  <q-card class="checksheets-modal-card">
    <q-card-section class="row items-center">
      <div class="text-h6">Checksheets - {{ equipment?.name }} ({{ equipment?.tag_no }})</div>
      <q-space />
      <q-btn icon="close" flat round dense @click="$emit('close')" />
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pt-md" style="height: calc(100vh - 100px); overflow-y: auto;">
      <div class="q-mb-md row justify-between items-center">
        <div class="text-subtitle1">
          Checksheets
        </div>
      </div>

      <q-table :rows="checkSheets" :columns="checksheetColumns" row-key="id" :loading="loading" bordered flat
        table-header-style="background-color: #007bff; color: #fff; font-weight: bold" separator="cell" color="primary"
        square>
        <template v-slot:body-cell-technicians="props">
          <q-td :props="props">
            {{props.row.technicians?.map((t: { name: string }) => t.name).join(', ') || 'None'}}
          </q-td>
        </template>
        <template v-slot:body-cell-inspectors="props">
          <q-td :props="props">
            {{props.row.inspectors?.map((i: { name: string }) => i.name).join(', ') || 'None'}}
          </q-td>
        </template>
        <template v-slot:body-cell-checksheet="props">
          <q-td :props="props" class="row justify-center">
            <q-btn flat color="primary" label="View Checksheet" @click="openChecksheetItems(props.row)" size="sm" />
          </q-td>
        </template>
      </q-table>
    </q-card-section>

    <EquipmentChecksheetItemsPage v-model="showItemsDialog" :equipment="equipment" :checksheet="selectedChecksheet"
      @status-changed="fetchChecksheets" />
  </q-card>
</template>e2

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import EquipmentChecksheetItemsPage from './EquipmentChecksheetItemsPage.vue';

interface Equipment {
  id: number;
  name: string;
  tag_no: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Checksheet {
  id: number;
  equipment_id: number;
  sheet_number: string;
  activity_code: string;
  current_round?: number;
  due_date?: string;
  status?: string;
  notes?: string;
  technicians?: User[];
  inspectors?: User[];
  created_at?: string;
  updated_at?: string;
}

interface Props {
  equipment: Equipment | null;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'close'): void;
}>();

const $q = useQuasar();

const checkSheets = ref<Checksheet[]>([]);
const loading = ref(false);
const showItemsDialog = ref(false);
const selectedChecksheet = ref<Checksheet | null>(null);

const checksheetColumns = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'sheet_number',
    label: 'Sheet Number',
    field: 'sheet_number',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'activity_code',
    label: 'Activity Code',
    field: 'activity_code',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'current_round',
    label: 'Current Round',
    field: 'current_round',
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'total',
    label: 'Total',
    field: 'total',
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'done',
    label: 'Done',
    field: 'done',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'action Required',
    label: 'Action Required',
    field: 'action_required',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'holding',
    label: 'Holding',
    field: 'holding',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'not_applicable',
    label: 'N/A',
    field: 'Not_applicable',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'technicians',
    label: 'Assigned Technicians',
    field: 'technicians',
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'inspectors',
    label: 'Assigned Inspectors',
    field: 'inspectors',
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'checksheet',
    label: 'Show Checksheet',
    field: 'checksheet',
    align: 'center' as const,
    sortable: false,
  },
];

const fetchChecksheets = async () => {
  if (!props.equipment?.id) return;

  loading.value = true;

  try {
    const response = await api.get(`/api/equipments/${props.equipment.id}/checksheets`);
    checkSheets.value = response.data.check_sheets || [];

    console.log('Fetched checksheets:', checkSheets.value);

  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load checksheets',
      position: 'bottom',
    });
  } finally {
    loading.value = false;
  }
};

const openChecksheetItems = (checksheet: Checksheet) => {
  selectedChecksheet.value = checksheet;
  showItemsDialog.value = true;
};

// Watch for equipment changes to fetch checksheets
watch(
  () => props.equipment,
  (newEquipment) => {
    if (newEquipment) {
      void fetchChecksheets();
    }
  },
  { immediate: true }
);
</script>
