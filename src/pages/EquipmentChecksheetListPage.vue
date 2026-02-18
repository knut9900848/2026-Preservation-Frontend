<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn icon="arrow_back" flat round dense @click="router.back()" class="q-mr-sm">
        <q-tooltip>Back</q-tooltip>
      </q-btn>
      <div class="text-h6">
        Checksheets - {{ equipment?.name }} ({{ equipment?.tag_no }})
      </div>
    </div>

    <q-separator class="q-mb-md" />

    <q-table
      :rows="checkSheets"
      :columns="checksheetColumns"
      row-key="id"
      :loading="loading"
      bordered
      flat
      table-header-style="background-color: #007bff; color: #fff; font-weight: bold"
      separator="cell"
      color="primary"
      square
    >
      <template v-slot:body-cell-technicians="props">
        <q-td :props="props">
          {{ props.row.technicians?.map((t: { name: string }) => t.name).join(', ') || 'None' }}
        </q-td>
      </template>
      <template v-slot:body-cell-inspectors="props">
        <q-td :props="props">
          {{ props.row.inspectors?.map((i: { name: string }) => i.name).join(', ') || 'None' }}
        </q-td>
      </template>
      <template v-slot:body-cell-checksheet="props">
        <q-td :props="props" class="row justify-center">
          <q-btn
            flat
            color="primary"
            label="View Checksheet"
            @click="openChecksheetItems(props.row)"
            size="sm"
          />
        </q-td>
      </template>
    </q-table>

  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

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

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const equipmentId = Number(route.params.id);
const equipment = ref<Equipment | null>(null);
const checkSheets = ref<Checksheet[]>([]);
const loading = ref(false);

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

const fetchEquipment = async () => {
  try {
    const response = await api.get(`/api/equipments/${equipmentId}`);
    equipment.value = response.data.equipment || response.data.data || response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load equipment',
      position: 'bottom',
    });
  }
};

const fetchChecksheets = async () => {
  if (!equipmentId) return;

  loading.value = true;

  try {
    const response = await api.get(`/api/equipments/${equipmentId}/checksheets`);
    checkSheets.value = response.data.check_sheets || [];
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
  void router.push(`/checksheets/${checksheet.id}`);
};

onMounted(() => {
  void fetchEquipment();
  void fetchChecksheets();
});
</script>
