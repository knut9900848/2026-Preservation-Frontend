<template>
  <q-page padding>
    <div class="q-mb-md row justify-between items-center">
      <div class="text-h5">Checksheet Management</div>
    </div>

    <!-- Filters -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Search -->
          <div class="col-12 col-md-3">
            <q-input v-model="filters.search" outlined dense placeholder="Search checksheets..." debounce="500"
              @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append v-if="filters.search">
                <q-icon name="clear" class="cursor-pointer" @click="filters.search = ''; fetchChecksheets()" />
              </template>
            </q-input>
          </div>

          <!-- Status Filter -->
          <div class="col-12 col-md-2">
            <q-select v-model="filters.status" outlined dense :options="statusOptions" label="Status" clearable
              @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="filter_list" />
              </template>
            </q-select>
          </div>

          <!-- Round Filter -->
          <div class="col-12 col-md-2">
            <q-input v-model.number="filters.current_round" outlined dense type="number" label="Round" clearable
              @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="replay" />
              </template>
            </q-input>
          </div>

          <!-- Equipment Filter -->
          <div class="col-12 col-md-3">
            <q-select v-model="filters.equipment_id" outlined dense :options="equipmentOptions" option-value="id"
              option-label="name" emit-value map-options label="Equipment" clearable use-input input-debounce="300"
              @filter="filterEquipment" @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="precision_manufacturing" />
              </template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No equipment found
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Activity Filter -->
          <div class="col-12 col-md-2">
            <q-input v-model.number="filters.activity_id" outlined dense type="number" label="Activity ID" clearable
              @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="assignment" />
              </template>
            </q-input>
          </div>

          <!-- Over Due Filter -->
          <div class="col-12 col-md-2">
            <q-select v-model="filters.over_due" outlined dense :options="overDueOptions" label="Over Due" clearable
              @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="event_busy" />
              </template>
            </q-select>
          </div>
        </div>

        <!-- Clear All Filters -->
        <div class="row q-mt-sm">
          <q-btn flat dense color="primary" icon="clear_all" label="Clear All Filters" @click="clearFilters" />
        </div>
      </q-card-section>
    </q-card>

    <!-- Checksheet Table -->
    <q-table :rows="checksheets" :columns="columns" row-key="id" :loading="loading" bordered flat
      table-header-style="background-color: #007bff; color: #fff; font-weight: bold" separator="cell" color="primary"
      square :pagination="pagination" @request="onRequest">
      <template v-slot:body-cell-sheet_number="props">
        <q-td :props="props">
          <div class="text-primary text-weight-medium cursor-pointer" @click="openChecksheetDialog(props.row)">
            {{ props.row.sheet_number }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="getStatusColor(props.row.status)">
            {{ props.row.status }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-equipment="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.row.equipment?.name || 'N/A' }}</div>
          <div class="text-caption text-grey-7">{{ props.row.equipment?.tag_no || '' }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-activity="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.row.activity?.code || 'N/A' }}</div>
          <div class="text-caption text-grey-7">{{ props.row.activity?.description || '' }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-current_round="props">
        <q-td :props="props">
          <q-chip size="sm" color="info" text-color="white">
            Round {{ props.row.current_round }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-due_date="props">
        <q-td :props="props">
          <div v-if="props.row.due_date">
            {{ formatDate(props.row.due_date) }}
          </div>
          <div v-else class="text-grey-6">Not set</div>
        </q-td>
      </template>

      <template v-slot:body-cell-over_due="props">
        <q-td :props="props">
          <q-badge v-if="isOverDue(props.row)" color="negative">
            Y
          </q-badge>
          <div v-else class="text-grey-6">-</div>
        </q-td>
      </template>

      <template v-slot:body-cell-technicians="props">
        <q-td :props="props">
          <div v-if="props.row.technicians && props.row.technicians.length > 0">
            <q-chip v-for="tech in props.row.technicians.slice(0, 2)" :key="tech.id" size="sm" color="primary"
              text-color="white" icon="person" clickable @click="openUserInfoDialog(tech.id)">
              {{ tech.name }}
            </q-chip>
            <q-chip v-if="props.row.technicians.length > 2" size="sm" color="grey-5" text-color="white">
              +{{ props.row.technicians.length - 2 }}
            </q-chip>
          </div>
          <div v-else class="text-grey-6">None</div>
        </q-td>
      </template>

      <template v-slot:body-cell-inspectors="props">
        <q-td :props="props">
          <div v-if="props.row.inspectors && props.row.inspectors.length > 0">
            <q-chip v-for="inspector in props.row.inspectors.slice(0, 2)" :key="inspector.id" size="sm"
              color="secondary" text-color="white" icon="person" clickable @click="openUserInfoDialog(inspector.id)">
              {{ inspector.name }}
            </q-chip>
            <q-chip v-if="props.row.inspectors.length > 2" size="sm" color="grey-5" text-color="white">
              +{{ props.row.inspectors.length - 2 }}
            </q-chip>
          </div>
          <div v-else class="text-grey-6">None</div>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat color="primary" icon="visibility" size="sm" @click="openChecksheetDialog(props.row)">
            <q-tooltip>View Details</q-tooltip>
          </q-btn>
          <q-btn flat color="info" icon="history" size="sm" @click="openHistoryDialog(props.row)">
            <q-tooltip>View History</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Checksheet Items Dialog -->
    <ChecksheetItemsPage v-model="showChecksheetDialog" :checksheet="selectedChecksheet"
      @status-changed="fetchChecksheets" />

    <!-- Checksheet History Dialog -->
    <ChecksheetHistory v-model="showHistoryDialog" :equipment-id="null"
      :checksheet-id="selectedChecksheet?.id ?? null" />

    <!-- User Info Dialog -->
    <UserInfoDialog v-model="showUserInfoDialog" :user-id="selectedUserId" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import ChecksheetItemsPage from './ChecksheetItemsPage.vue';
import ChecksheetHistory from 'components/ChecksheetHistory.vue';
import UserInfoDialog from 'components/UserInfoDialog.vue';

interface Equipment {
  id: number;
  name: string;
  tag_no: string;
}

interface Activity {
  id: number;
  code: string;
  description: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Checksheet {
  id: number;
  equipment_id: number;
  activity_id: number;
  sheet_number: string;
  activity_code: string;
  status: string;
  current_round: number;
  frequency?: string;
  due_date?: string;
  notes?: string;
  equipment?: Equipment;
  activity?: Activity;
  technicians?: User[];
  inspectors?: User[];
  created_at: string;
  updated_at?: string;
}

interface Filters {
  search: string;
  status: string | null;
  current_round: number | null;
  equipment_id: number | null;
  activity_id: number | null;
  over_due: string | null;
  sort_by: string;
  descending: boolean;
  per_page: number;
}

const $q = useQuasar();

const checksheets = ref<Checksheet[]>([]);
const loading = ref(false);
const showChecksheetDialog = ref(false);
const showHistoryDialog = ref(false);
const showUserInfoDialog = ref(false);
const selectedChecksheet = ref<Checksheet | null>(null);
const selectedUserId = ref<number | null>(null);

const filters = ref<Filters>({
  search: '',
  status: null,
  current_round: null,
  equipment_id: null,
  activity_id: null,
  over_due: null,
  sort_by: 'created_at',
  descending: true,
  per_page: 25,
});

const pagination = ref({
  sortBy: 'created_at',
  descending: true,
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
});

const statusOptions = ['Draft', 'Completed', 'Reviewed', 'Approved'];
const overDueOptions = ['Yes', 'No'];

const equipmentOptions = ref<Equipment[]>([]);
const allEquipment = ref<Equipment[]>([]);

const columns = [
  {
    name: 'sheet_number',
    label: 'Sheet Number',
    field: 'sheet_number',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'equipment',
    label: 'Equipment',
    field: 'equipment',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'activity',
    label: 'Activity',
    field: 'activity',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'current_round',
    label: 'Round',
    field: 'current_round',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'due_date',
    label: 'Due Date',
    field: 'due_date',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'over_due',
    label: 'Over Due',
    field: 'over_due',
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'technicians',
    label: 'Technicians',
    field: 'technicians',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'inspectors',
    label: 'Inspectors',
    field: 'inspectors',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center' as const,
  },
];

const fetchChecksheets = async () => {
  loading.value = true;

  try {
    const params: Record<string, string | number | boolean> = {
      page: pagination.value.page,
      per_page: pagination.value.rowsPerPage,
      sort_by: pagination.value.sortBy || 'created_at',
      descending: pagination.value.descending,
    };

    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.current_round) params.current_round = filters.value.current_round;
    if (filters.value.equipment_id) params.equipment_id = filters.value.equipment_id;
    if (filters.value.activity_id) params.activity_id = filters.value.activity_id;

    const response = await api.get('/api/checksheets', { params });

    let sheets = response.data.check_sheets || [];

    console.log('Fetched checksheets:', sheets);

    // Apply client-side over_due filter
    if (filters.value.over_due) {
      const shouldShowOverDue = filters.value.over_due === 'Yes';
      sheets = sheets.filter((sheet: Checksheet) => {
        const isSheetOverDue = isOverDue(sheet);
        return shouldShowOverDue ? isSheetOverDue : !isSheetOverDue;
      });
    }

    checksheets.value = sheets;
    pagination.value.rowsNumber = response.data.total || 0;
    pagination.value.page = response.data.current_page || 1;
    pagination.value.rowsPerPage = response.data.per_page || 25;
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

const fetchEquipment = async () => {
  try {
    const response = await api.get('/api/equipments');
    allEquipment.value = response.data.equipments || response.data.data || [];
    equipmentOptions.value = allEquipment.value;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load equipment',
      position: 'bottom',
    });
  }
};

const filterEquipment = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    if (val === '') {
      equipmentOptions.value = allEquipment.value;
    } else {
      const needle = val.toLowerCase();
      equipmentOptions.value = allEquipment.value.filter(
        (eq) =>
          eq.name.toLowerCase().includes(needle) ||
          eq.tag_no.toLowerCase().includes(needle)
      );
    }
  });
};

const onRequest = (requestProp: {
  pagination: {
    sortBy: string;
    descending: boolean;
    page: number;
    rowsPerPage: number;
    rowsNumber?: number;
  };
  filter?: string;
  getCellValue: (col: unknown, row: unknown) => unknown;
}) => {
  const { page, rowsPerPage, sortBy, descending } = requestProp.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy;
  pagination.value.descending = descending;
  void fetchChecksheets();
};

const clearFilters = () => {
  filters.value = {
    search: '',
    status: null,
    current_round: null,
    equipment_id: null,
    activity_id: null,
    over_due: null,
    sort_by: 'created_at',
    descending: true,
    per_page: 25,
  };

  pagination.value.sortBy = 'created_at';
  pagination.value.descending = true;
  pagination.value.page = 1;

  void fetchChecksheets();
};

const openChecksheetDialog = (checksheet: Checksheet) => {
  selectedChecksheet.value = checksheet;
  showChecksheetDialog.value = true;
};

const openHistoryDialog = (checksheet: Checksheet) => {
  selectedChecksheet.value = checksheet;
  showHistoryDialog.value = true;
};

const openUserInfoDialog = (userId: number) => {
  selectedUserId.value = userId;
  showUserInfoDialog.value = true;
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
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const isOverDue = (checksheet: Checksheet): boolean => {
  // Only show overdue if status is not approved
  if (checksheet.status?.toLowerCase() === 'approved') {
    return false;
  }

  // Check if due_date exists and is in the past
  if (!checksheet.due_date) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight for date-only comparison

  const dueDate = new Date(checksheet.due_date);
  dueDate.setHours(0, 0, 0, 0); // Reset time to midnight for date-only comparison

  return today > dueDate;
};

onMounted(() => {
  void fetchChecksheets();
  void fetchEquipment();
});
</script>

<style scoped lang="scss">
.cursor-pointer {
  cursor: pointer;
}
</style>
