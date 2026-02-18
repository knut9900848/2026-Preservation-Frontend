<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md row justify-between items-center">
      <div class="text-h5">Discipline Item List</div>
      <q-btn color="primary" label="Add Discipline Item" icon="add" @click="onAdd" />
    </div>

    <q-table :rows="disciplineItemList" :columns="columns" row-key="id" :loading="loading"
      v-model:pagination="pagination" @request="onRequest" bordered flat separator="cell" color="primary" square
      table-header-style="background-color: #007bff; color: #fff; font-weight: bold" binary-state-sort hide-pagination
      :rows-per-page-options="[10, 25, 50, 100]">
      <template v-slot:top-right>
        <q-input v-model="filter" placeholder="Search" dense debounce="300" outlined @update:model-value="onSearch">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-discipline="props">
        <q-td :props="props">
          {{ props.row.discipline?.name ?? '-' }}
        </q-td>
      </template>

      <template v-slot:body-cell-is_active="props">
        <q-td :props="props">
          <q-badge :color="props.row.is_active ? 'primary' : 'grey'"
            :label="props.row.is_active ? 'Active' : 'Inactive'" />
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
          <div class="text-h6">{{ isEditing ? 'Edit Discipline Item' : 'Add Discipline Item' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-select v-model="formData.discipline_id" outlined dense :options="disciplineOptions" option-value="id"
              option-label="name" emit-value map-options label="Discipline *" :rules="[
              (val) => val !== null || 'Discipline is required',
            ]" />

            <q-input v-model="formData.name" label="Name *" outlined dense :rules="[
              (val) => (val && val.length > 0) || 'Name is required',
            ]" />

            <q-input v-model="formData.method" label="Method" outlined dense />

            <q-toggle v-model="formData.is_active" label="Active" />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" color="grey" flat @click="showDialog = false" />
              <q-btn label="Save" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

interface Discipline {
  id: number;
  name: string;
  code: string;
}

interface DisciplineItem {
  id: number;
  discipline_id: number;
  discipline?: Discipline | null;
  code: string;
  name: string;
  method: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DisciplineItemFormData {
  discipline_id: number | null;
  name: string;
  method: string;
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
    name: 'discipline',
    label: 'Discipline',
    field: (row: DisciplineItem) => row.discipline?.name ?? '-',
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'method',
    label: 'Method',
    field: 'method',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'is_active',
    label: 'Status',
    field: 'is_active',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'action',
    label: 'ACTION',
    field: 'action',
    align: 'center' as const,
    sortable: false,
  },
];

const disciplineItemList = ref<DisciplineItem[]>([]);
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

const disciplineOptions = ref<Discipline[]>([]);

// Dialog state
const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

// Form data
const formData = ref<DisciplineItemFormData>({
  discipline_id: null,
  name: '',
  method: '',
  is_active: true,
});

const fetchDisciplineItemList = async () => {
  loading.value = true;

  try {
    const response = await api.get('/api/discipline-items', {
      params: {
        page: pagination.value.page,
        per_page: pagination.value.rowsPerPage,
        sort_by: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      },
    });

    disciplineItemList.value = response.data.discipline_items || response.data.data || [];
    pagination.value.rowsNumber = response.data.total || disciplineItemList.value.length;
    pagination.value.rowsPerPage = response.data.per_page || pagination.value.rowsPerPage;
    maxPage.value = Math.ceil(pagination.value.rowsNumber / pagination.value.rowsPerPage) || 1;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load discipline item list',
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
  void fetchDisciplineItemList();
};

const onSearch = () => {
  pagination.value.page = 1;
  void fetchDisciplineItemList();
};

const onPageChange = (newPage: number) => {
  pagination.value.page = newPage;
  void fetchDisciplineItemList();
};

const resetForm = () => {
  formData.value = {
    discipline_id: null,
    name: '',
    method: '',
    is_active: true,
  };
  isEditing.value = false;
  editingId.value = null;
};

const onAdd = () => {
  resetForm();
  showDialog.value = true;
};

const onEdit = (item: DisciplineItem) => {
  isEditing.value = true;
  editingId.value = item.id;
  formData.value = {
    discipline_id: item.discipline_id,
    name: item.name,
    method: item.method || '',
    is_active: item.is_active,
  };
  showDialog.value = true;
};

const onSubmit = async () => {
  try {
    if (isEditing.value && editingId.value) {
      await api.put(`/api/discipline-items/${editingId.value}`, formData.value);
      $q.notify({
        type: 'positive',
        message: 'Discipline item updated successfully',
        position: 'bottom',
      });
    } else {
      await api.post('/api/discipline-items', formData.value);
      $q.notify({
        type: 'positive',
        message: 'Discipline item created successfully',
        position: 'bottom',
      });
    }
    showDialog.value = false;
    resetForm();
    await fetchDisciplineItemList();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };

    let errorMessage = 'Failed to save discipline item';

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

const onDelete = (item: DisciplineItem) => {
  $q.dialog({
    title: 'Confirm',
    message: `Are you sure you want to delete "${item.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/api/discipline-items/${item.id}`);
        $q.notify({
          type: 'positive',
          message: 'Discipline item deleted successfully',
          position: 'bottom',
        });
        await fetchDisciplineItemList();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to delete discipline item',
          position: 'bottom',
        });
      }
    })();
  });
};

const fetchDisciplines = async () => {
  try {
    const response = await api.get('/api/disciplines');
    disciplineOptions.value = response.data.disciplines || response.data.data || [];
  } catch {
    // silently fail - discipline options are non-critical
  }
};

onMounted(() => {
  void fetchDisciplineItemList();
  void fetchDisciplines();
});
</script>
