<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md row justify-between items-center">
      <div class="text-h5">Activity List</div>
      <q-btn color="primary" label="Add Activity" icon="add" @click="onAdd" />
    </div>

    <q-table :rows="activityList" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
      @request="onRequest" bordered flat class="activity-table" separator="cell" color="primary" square
      table-header-style="background-color: #007bff; color: #fff; font-weight: bold" binary-state-sort hide-pagination
      :rows-per-page-options="[0]">
      <template v-slot:top-right>
        <q-input v-model="filter" placeholder="Search" dense debounce="300" outlined @update:model-value="onSearch">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-is_active="props">
        <q-td :props="props">
          <q-badge :color="props.row.is_active ? 'primary' : 'grey'"
            :label="props.row.is_active ? 'Active' : 'Inactive'" />
        </q-td>
      </template>

      <template v-slot:body-cell-items="props">
        <q-td :props="props">
          <q-btn flat color="primary" label="Items" @click="openItemsModal(props.row)" size="sm" />
        </q-td>
      </template>

      <template v-slot:body-cell-action="props">
        <q-td :props="props">
          <q-btn flat dense color="primary" label="Edit" @click="onEdit(props.row)" class="q-mr-sm" />
          <q-btn flat dense color="negative" label="Delete" @click="onDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <div class="row justify-center q-mt-md">
      <q-pagination v-model="pagination.page" :max="maxPage" direction-links @update:model-value="onPageChange" />
    </div>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">{{ isEditing ? 'Edit Activity' : 'Add Activity' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input v-model="formData.code" label="Code *" outlined dense :rules="[
              (val) => (val && val.length > 0) || 'Code is required',
            ]" />

            <q-input v-model="formData.description" label="Description *" outlined dense :rules="[
              (val) => (val && val.length > 0) || 'Description is required',
            ]" />

            <q-input v-model.number="formData.frequency" label="Frequency (days)" type="number" outlined dense :rules="[
              (val) => val >= 0 || 'Frequency must be 0 or greater',
            ]" />

            <q-input v-model="formData.notes" label="Notes" outlined dense type="textarea" rows="3" />

            <q-toggle v-model="formData.is_active" label="Active" />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" color="grey" flat @click="showDialog = false" />
              <q-btn label="Save" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Activity Items Full-Screen Modal -->
    <q-dialog v-model="showItemsModal" full-width full-height>
      <ActivityItemsPage :activity="selectedActivity" @close="showItemsModal = false" />
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import ActivityItemsPage from './ActivityItemsPage.vue';

interface Activity {
  id: number;
  equipment_id: number;
  code: string;
  description: string;
  notes: string | null;
  frequency: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ActivityFormData {
  code: string;
  description: string;
  notes: string;
  frequency: number;
  is_active: boolean;
}

const $q = useQuasar();

const columns = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'code',
    label: 'Code',
    field: 'code',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'description',
    label: 'Description',
    field: 'description',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'frequency',
    label: 'Frequency (days)',
    field: 'frequency',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'is_active',
    label: 'Status',
    field: 'is_active',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'items',
    label: 'Items',
    field: 'items',
    align: 'center' as const,
    sortable: false,
  },
  {
    name: 'action',
    label: 'ACTION',
    field: 'action',
    align: 'center' as const,
    sortable: false,
  },
];

const activityList = ref<Activity[]>([]);
const loading = ref(false);
const filter = ref('');
const pagination = ref({
  sortBy: 'id',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});
const maxPage = ref(1);

// Dialog state
const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

// Form data
const formData = ref<ActivityFormData>({
  code: '',
  description: '',
  notes: '',
  frequency: 0,
  is_active: true,
});

// Activity Items modal state
const showItemsModal = ref(false);
const selectedActivity = ref<Activity | null>(null);

// Fetch activity list
const fetchActivityList = async () => {
  loading.value = true;

  try {
    const response = await api.get('/api/activities', {
      params: {
        page: pagination.value.page,
        per_page: pagination.value.rowsPerPage,
        sort_by: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      },
    });

    activityList.value = response.data.activities || response.data.data || [];
    pagination.value.rowsNumber = response.data.total || activityList.value.length;
    pagination.value.rowsPerPage = response.data.per_page || pagination.value.rowsPerPage;
    maxPage.value = Math.ceil(pagination.value.rowsNumber / pagination.value.rowsPerPage) || 1;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load activity list',
      position: 'bottom',
    });
  } finally {
    loading.value = false;
  }
};

const onRequest = (props: {
  pagination: {
    sortBy: string;
    descending: boolean;
    page: number;
    rowsPerPage: number;
  };
}) => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy;
  pagination.value.descending = descending;
  void fetchActivityList();
};

const onSearch = () => {
  pagination.value.page = 1;
  void fetchActivityList();
};

const onPageChange = (newPage: number) => {
  pagination.value.page = newPage;
  void fetchActivityList();
};

const resetForm = () => {
  formData.value = {
    code: '',
    description: '',
    notes: '',
    frequency: 0,
    is_active: true,
  };
  isEditing.value = false;
  editingId.value = null;
};

const onAdd = () => {
  resetForm();
  showDialog.value = true;
};

const onEdit = (activity: Activity) => {
  isEditing.value = true;
  editingId.value = activity.id;
  formData.value = {
    code: activity.code,
    description: activity.description,
    notes: activity.notes || '',
    frequency: activity.frequency,
    is_active: activity.is_active,
  };
  showDialog.value = true;
};

const onSubmit = async () => {
  try {
    if (isEditing.value && editingId.value) {
      await api.put(`/api/activities/${editingId.value}`, formData.value);
      $q.notify({
        type: 'positive',
        message: 'Activity updated successfully',
        position: 'bottom',
      });
    } else {
      await api.post('/api/activities', formData.value);
      $q.notify({
        type: 'positive',
        message: 'Activity created successfully',
        position: 'bottom',
      });
    }
    showDialog.value = false;
    resetForm();
    await fetchActivityList();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };

    let errorMessage = 'Failed to save activity';

    // Check for validation errors
    if (err.response?.data?.errors) {
      const errors = Object.values(err.response.data.errors).flat();
      errorMessage = errors.join(', ');
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'bottom',
    });
  }
};

const onDelete = (activity: Activity) => {
  $q.dialog({
    title: 'Confirm',
    message: `Are you sure you want to delete ${activity.code}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/api/activities/${activity.id}`);
        $q.notify({
          type: 'positive',
          message: 'Activity deleted successfully',
          position: 'bottom',
        });
        await fetchActivityList();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to delete activity',
          position: 'bottom',
        });
      }
    })();
  });
};

// Activity Items modal functions
const openItemsModal = (activity: Activity) => {
  selectedActivity.value = activity;
  showItemsModal.value = true;
};

onMounted(() => {
  void fetchActivityList();
});
</script>
