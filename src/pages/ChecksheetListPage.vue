<template>
  <q-page padding>
    <div class="q-mb-md row justify-between items-center">
      <div class="text-h5">Checksheet Management</div>
      <div class="q-gutter-sm">
        <q-btn icon="download" label="Excel" color="green-7" outline dense :loading="exporting"
          @click="exportExcel">
          <q-tooltip>Export to Excel</q-tooltip>
        </q-btn>
        <q-btn :icon="showFilters ? 'filter_list_off' : 'filter_list'" :label="showFilters ? 'Hide Filters' : 'Filters'"
          :color="activeFilterCount > 0 ? 'primary' : 'grey-7'" outline dense @click="showFilters = !showFilters">
          <q-badge v-if="activeFilterCount > 0" color="red" floating>{{ activeFilterCount }}</q-badge>
        </q-btn>
      </div>
    </div>

    <!-- Filters -->
      <q-card v-if="showFilters" flat bordered class="q-mb-md">
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
                <q-icon name="clear" class="cursor-pointer" @click="
                  filters.search = '';
                fetchChecksheets();
                " />
              </template>
            </q-input>
          </div>

          <!-- Status Filter -->
          <div class="col-12 col-md-3">
            <q-select v-model="filters.status" outlined dense :options="statusOptions" label="Status" clearable
              @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="filter_list" />
              </template>
            </q-select>
          </div>

          <!-- Round Filter -->
          <div class="col-12 col-md-3">
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
                  <q-item-section class="text-grey"> No equipment found </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Activity Filter -->
          <div class="col-12 col-md-3">
            <q-input v-model.number="filters.activity_id" outlined dense type="number" label="Activity ID" clearable
              @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="assignment" />
              </template>
            </q-input>
          </div>

          <!-- Over Due Filter -->
          <div class="col-12 col-md-3">
            <q-select v-model="filters.over_due" outlined dense :options="overDueOptions" label="Over Due" clearable
              @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="event_busy" />
              </template>
            </q-select>
          </div>

          <!-- Category Filter -->
          <div class="col-12 col-md-3">
            <q-select v-model="filters.category_id" outlined dense :options="categoryOptions" option-value="id"
              option-label="name" emit-value map-options label="Category" clearable
              @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="category" />
              </template>
            </q-select>
          </div>

          <!-- Sub Category Filter -->
          <div class="col-12 col-md-3">
            <q-select v-model="filters.sub_category_id" outlined dense :options="subCategoryOptions" option-value="id"
              option-label="name" emit-value map-options label="Sub Category" clearable
              @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="label" />
              </template>
            </q-select>
          </div>

          <!-- Location Filter -->
          <div class="col-12 col-md-3">
            <q-select v-model="filters.current_location_id" outlined dense :options="locationOptions" option-value="id"
              option-label="name" emit-value map-options label="Location" clearable
              @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="location_on" />
              </template>
            </q-select>
          </div>

          <!-- Supplier Filter -->
          <div class="col-12 col-md-3">
            <q-select v-model="filters.supplier_id" outlined dense :options="supplierOptions" option-value="id"
              option-label="name" emit-value map-options label="Supplier" clearable
              @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="local_shipping" />
              </template>
            </q-select>
          </div>

          <!-- Technician Filter -->
          <div class="col-12 col-md-3">
            <q-select v-model="filters.technician_id" outlined dense :options="technicianOptions" option-value="id"
              option-label="name" emit-value map-options label="Technician" clearable use-input input-debounce="300"
              @filter="filterTechnician" @update:model-value="fetchChecksheets">
              <template v-slot:prepend>
                <q-icon name="engineering" />
              </template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey"> No technician found </q-item-section>
                </q-item>
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
      square v-model:pagination="pagination" :rows-per-page-options="[10, 25, 50, 100]" @request="onRequest">
      <template v-slot:body-cell-sheet_number="props">
        <q-td :props="props">
          <div class="text-primary text-weight-medium cursor-pointer"
            @click="router.push(`/checksheets/${props.row.id}`)">
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
          <div class="text-weight-medium">{{ props.row.equipment_name || 'N/A' }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-activity="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.row.activity_code || 'N/A' }}</div>
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
          <q-badge v-if="isOverDue(props.row)" color="negative"> Y </q-badge>
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

    </q-table>

    <!-- User Info Dialog -->
    <UserInfoDialog v-model="showUserInfoDialog" :user-id="selectedUserId" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { api } from 'boot/axios';
import { useChecksheetListStore } from 'stores/checksheet-list';
import UserInfoDialog from 'components/UserInfoDialog.vue';

const router = useRouter();

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
  activity_id: number;
  sheet_number: string;
  activity_code: string;
  activity_description?: string;
  equipment_name?: string;
  equipment_tag_no?: string;
  category?: { id: number; name: string } | null;
  sub_category?: { id: number; name: string } | null;
  location?: { id: number; name: string } | null;
  supplier?: { id: number; name: string } | null;
  status: string;
  current_round: number;
  frequency?: string;
  due_date?: string;
  notes?: string;
  technicians?: User[];
  inspectors?: User[];
  created_at: string;
  updated_at?: string;
}

interface NamedOption {
  id: number;
  name: string;
}


const $q = useQuasar();
const store = useChecksheetListStore();
const { filters, pagination, showFilters } = storeToRefs(store);

const checksheets = ref<Checksheet[]>([]);
const loading = ref(false);
const exporting = ref(false);
const showUserInfoDialog = ref(false);
const selectedUserId = ref<number | null>(null);

const activeFilterCount = computed(() => {
  const f = filters.value;
  let count = 0;
  if (f.search) count++;
  if (f.status) count++;
  if (f.current_round) count++;
  if (f.equipment_id) count++;
  if (f.activity_id) count++;
  if (f.over_due) count++;
  if (f.category_id) count++;
  if (f.sub_category_id) count++;
  if (f.current_location_id) count++;
  if (f.supplier_id) count++;
  if (f.technician_id) count++;
  return count;
});

const statusOptions = ['Draft', 'Completed', 'Approved', 'Accepted', 'Rejected'];
const overDueOptions = ['Yes', 'No'];

const equipmentOptions = ref<Equipment[]>([]);
const allEquipment = ref<Equipment[]>([]);
const categoryOptions = ref<NamedOption[]>([]);
const subCategoryOptions = ref<NamedOption[]>([]);
const locationOptions = ref<NamedOption[]>([]);
const supplierOptions = ref<NamedOption[]>([]);
const technicianOptions = ref<User[]>([]);
const allTechnicians = ref<User[]>([]);

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
    name: 'equipment_tag_no',
    label: 'Tag No.',
    field: 'equipment_tag_no',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'equipment',
    label: 'Equipment',
    field: 'equipment_name',
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
    name: 'category',
    label: 'Category',
    field: (row: Checksheet) => row.category?.name ?? '-',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'sub_category',
    label: 'Sub Category',
    field: (row: Checksheet) => row.sub_category?.name ?? '-',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'location',
    label: 'Location',
    field: (row: Checksheet) => row.location?.name ?? '-',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'supplier',
    label: 'Supplier',
    field: (row: Checksheet) => row.supplier?.name ?? '-',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'frequency',
    label: 'Frequency',
    field: 'frequency',
    sortable: false,
    align: 'center' as const,
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
    if (filters.value.category_id) params.category_id = filters.value.category_id;
    if (filters.value.sub_category_id) params.sub_category_id = filters.value.sub_category_id;
    if (filters.value.current_location_id) params.current_location_id = filters.value.current_location_id;
    if (filters.value.supplier_id) params.supplier_id = filters.value.supplier_id;
    if (filters.value.technician_id) params.technician_id = filters.value.technician_id;

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

const fetchFilterOptions = async () => {
  try {
    const [catRes, subCatRes, locRes, supRes, techRes] = await Promise.all([
      api.get('/api/categories'),
      api.get('/api/sub-categories'),
      api.get('/api/current-locations'),
      api.get('/api/suppliers'),
      api.get('/api/users'),
    ]);
    categoryOptions.value = catRes.data.categories || catRes.data.data || [];
    subCategoryOptions.value = subCatRes.data.sub_categories || subCatRes.data.data || [];
    locationOptions.value = locRes.data.current_locations || locRes.data.data || [];
    supplierOptions.value = supRes.data.suppliers || supRes.data.data || [];
    allTechnicians.value = techRes.data.users || techRes.data.data || [];
    technicianOptions.value = allTechnicians.value;
  } catch {
    // silently fail - filter options are non-critical
  }
};

const filterTechnician = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    if (val === '') {
      technicianOptions.value = allTechnicians.value;
    } else {
      const needle = val.toLowerCase();
      technicianOptions.value = allTechnicians.value.filter(
        (t) => t.name.toLowerCase().includes(needle),
      );
    }
  });
};

const filterEquipment = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    if (val === '') {
      equipmentOptions.value = allEquipment.value;
    } else {
      const needle = val.toLowerCase();
      equipmentOptions.value = allEquipment.value.filter(
        (eq) => eq.name.toLowerCase().includes(needle) || eq.tag_no.toLowerCase().includes(needle),
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
  store.resetFilters();
  void fetchChecksheets();
};

const exportExcel = async () => {
  exporting.value = true;
  try {
    const params: Record<string, string | number | boolean> = {};

    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.current_round) params.current_round = filters.value.current_round;
    if (filters.value.equipment_id) params.equipment_id = filters.value.equipment_id;
    if (filters.value.activity_id) params.activity_id = filters.value.activity_id;
    if (filters.value.category_id) params.category_id = filters.value.category_id;
    if (filters.value.sub_category_id) params.sub_category_id = filters.value.sub_category_id;
    if (filters.value.current_location_id) params.current_location_id = filters.value.current_location_id;
    if (filters.value.supplier_id) params.supplier_id = filters.value.supplier_id;
    if (filters.value.technician_id) params.technician_id = filters.value.technician_id;

    const response = await api.get('/api/checksheets/export', {
      params,
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'] as string | undefined;
    let filename = 'checksheets.xlsx';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match?.[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    $q.notify({
      type: 'positive',
      message: 'Excel file downloaded successfully',
      position: 'bottom',
    });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to export Excel file',
      position: 'bottom',
    });
  } finally {
    exporting.value = false;
  }
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
  void fetchFilterOptions();
});
</script>

<style scoped lang="scss">
.cursor-pointer {
  cursor: pointer;
}
</style>
