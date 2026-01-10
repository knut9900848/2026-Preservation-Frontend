<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md row justify-between items-center">
      <div class="text-h5">Equipment List</div>
      <q-btn color="primary" label="Add Equipment" icon="add" @click="onAdd" />
    </div>

    <q-table :rows="equipmentList" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
      @request="onRequest" bordered flat separator="cell" color="primary" square
      table-header-style="background-color: #007bff; color: #fff; font-weight: bold" binary-state-sort hide-pagination>
      <template v-slot:top-right>
        <q-input v-model="filter" placeholder="Search" dense debounce="300" outlined @update:model-value="onSearch">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-is_active="props">
        <q-td :props="props">
          <q-badge :color="props.row.is_active ? 'primary' : 'grey'">
            {{ props.row.is_active ? 'Active' : 'Inactive' }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-action="props">
        <q-td :props="props">
          <q-btn flat round dense size="sm" color="primary" icon="edit" @click="onEdit(props.row)">
            <q-tooltip>Edit</q-tooltip>
          </q-btn>
          <q-btn flat round dense size="sm" color="negative" icon="delete" @click="onDelete(props.row)">
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template v-slot:body-cell-checksheets="props">
        <q-td :props="props">
          <q-btn flat color="primary" label="Checksheets" @click="openChecksheetsModal(props.row)" size="sm">
          </q-btn>
        </q-td>
      </template>

      <template v-slot:body-cell-activities="props">
        <q-td :props="props">
          <q-btn flat color="primary" label="Activities" @click="openActivitiesModal(props.row)" size="sm">
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <div class="row justify-center q-mt-md">
      <q-pagination v-model="pagination.page" :max="maxPage" direction-links @update:model-value="onPageChange" />
    </div>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ isEditing ? 'Edit Equipment' : 'Add Equipment' }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input v-model="formData.tag_no" label="Tag No *" outlined dense
              :rules="[(val) => (val && val.length > 0) || 'Tag number is required']" />

            <q-input v-model="formData.name" label="Equipment Name *" outlined dense
              :rules="[(val) => (val && val.length > 0) || 'Name is required']" />

            <q-select v-model="formData.category_id" :options="categories" label="Category" outlined dense emit-value
              map-options clearable />

            <q-select v-model="formData.sub_category_id" :options="subCategories" label="Sub Category" outlined dense
              emit-value map-options clearable :disable="!formData.category_id" />

            <q-select v-model="formData.supplier_id" :options="suppliers" label="Supplier" outlined dense emit-value
              map-options clearable />

            <q-select v-model="formData.current_location_id" :options="currentLocations" label="Current Location"
              outlined dense emit-value map-options clearable />

            <q-input v-model="formData.serial_number" label="Serial Number" outlined dense />

            <q-input v-model="formData.description" label="Description" type="textarea" rows="3" outlined dense />

            <q-toggle v-model="formData.is_active" label="Active" />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" flat @click="showDialog = false" />
              <q-btn label="Submit" type="submit" color="primary" :loading="loading" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Checksheets Full-Screen Modal -->
    <q-dialog v-model="showChecksheetsModal" maximized>
      <EquipmentCheckSheets :equipment="selectedEquipment" @close="showChecksheetsModal = false" />
    </q-dialog>

    <!-- Activities Full-Screen Modal -->
    <q-dialog v-model="showActivitiesModal" maximized>
      <EquipmentActivitiesPage :equipment="selectedEquipment" @close="showActivitiesModal = false" />
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import EquipmentCheckSheets from './EquipmentChecksheetsPage.vue';
import EquipmentActivitiesPage from './EquipmentActivitiesPage.vue';

interface Equipment {
  id: number;
  name: string;
  tag_no: string;
  category_id: number | null;
  sub_category_id: number | null;
  supplier_id: number | null;
  current_location_id: number | null;
  serial_number: string | null;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Relationship data (nested format)
  category?: { id: number; name: string; code: string };
  sub_category?: { id: number; name: string; code: string };
  supplier?: { id: number; name: string; code: string };
  current_location?: {
    id: number;
    name: string;
    code: string;
    building?: string;
    floor?: string;
    room?: string;
  };
  // Flat field format (from API Resource)
  category_name?: string;
  sub_category_name?: string;
  supplier_name?: string;
  current_location_name?: string;
}

interface EquipmentFormData {
  name: string;
  tag_no: string;
  category_id: number | null;
  sub_category_id: number | null;
  supplier_id: number | null;
  current_location_id: number | null;
  serial_number: string;
  description: string;
  is_active: boolean;
}

interface FormOption {
  label: string;
  value: number;
  category_id?: number;
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
    name: 'tag_no',
    label: 'Tag No.',
    field: 'tag_no',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'name',
    label: 'Equipment Name',
    field: 'name',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'category',
    label: 'Category',
    field: (row: Equipment) => {
      // Check both nested object and flat field formats
      return row.category?.name || row.category_name || '-';
    },
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'sub_category',
    label: 'Sub Category',
    field: (row: Equipment) => {
      // Check both nested object and flat field formats
      return row.sub_category?.name || row.sub_category_name || '-';
    },
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'supplier',
    label: 'Supplier',
    field: (row: Equipment) => {
      // Check both nested object and flat field formats
      return row.supplier?.name || row.supplier_name || '-';
    },
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'current_location',
    label: 'Current Location',
    field: (row: Equipment) => {
      // Check both nested object and flat field formats
      return row.current_location?.name || row.current_location_name || '-';
    },
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'is_active',
    label: 'Status',
    field: 'is_active',
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'activities',
    label: 'Activities',
    field: 'action',
    align: 'center' as const,
    sortable: false,
  },
  {
    name: 'checksheets',
    label: 'Checksheets',
    field: 'action',
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

const equipmentList = ref<Equipment[]>([]);
const loading = ref(false);
const filter = ref('');
const pagination = ref({
  sortBy: 'created_at',
  descending: true,
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
});
const maxPage = ref(1);

// Dialog state
const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

// Form data
const formData = ref<EquipmentFormData>({
  name: '',
  tag_no: '',
  category_id: null,
  sub_category_id: null,
  supplier_id: null,
  current_location_id: null,
  serial_number: '',
  description: '',
  is_active: true,
});

// Form options
const categories = ref<FormOption[]>([]);
const subCategories = ref<FormOption[]>([]);
const suppliers = ref<FormOption[]>([]);
const currentLocations = ref<FormOption[]>([]);

// Activities modal state
const showChecksheetsModal = ref(false);
const selectedEquipment = ref<Equipment | null>(null);

const showActivitiesModal = ref(false);

// Fetch form options
const fetchFormOptions = async () => {
  try {
    const response = await api.get('/api/equipments/form-options');

    categories.value = response.data.categories.map(
      (c: { id: number; name: string }) => ({
        label: c.name,
        value: c.id,
      })
    );

    suppliers.value = response.data.suppliers.map(
      (s: { id: number; name: string }) => ({
        label: s.name,
        value: s.id,
      })
    );

    currentLocations.value = response.data.current_locations.map(
      (l: { id: number; name: string }) => ({
        label: l.name,
        value: l.id,
      })
    );
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load form options',
      position: 'bottom',
    });
  }
};

// Fetch sub-categories by category
const fetchSubCategories = async (categoryId: number) => {
  try {
    const response = await api.get(`/api/equipments/categories/${categoryId}/sub-categories`);

    subCategories.value = response.data.sub_categories.map(
      (s: { id: number; name: string }) => ({
        label: s.name,
        value: s.id,
      })
    );
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    subCategories.value = [];
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load sub-categories',
      position: 'bottom',
    });
  }
};

// Watch category changes to fetch sub-categories
watch(
  () => formData.value.category_id,
  async (newCategoryId) => {
    formData.value.sub_category_id = null;

    if (newCategoryId) {
      await fetchSubCategories(newCategoryId);
    } else {
      subCategories.value = [];
    }
  }
);

// Fetch equipment list
const fetchEquipmentList = async () => {
  loading.value = true;

  try {
    const response = await api.get('/api/equipments', {
      params: {
        page: pagination.value.page,
        per_page: pagination.value.rowsPerPage,
        sort_by: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      },
    });

    equipmentList.value = response.data.equipment || [];
    pagination.value.rowsNumber = response.data.total || 0;
    maxPage.value = response.data.last_page || 1;
  } catch (error: unknown) {
    equipmentList.value = [];
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load equipment list',
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
  pagination.value = {
    ...pagination.value,
    ...props.pagination,
  };
  void fetchEquipmentList();
};

const onSearch = () => {
  pagination.value.page = 1;
  void fetchEquipmentList();
};

const onPageChange = () => {
  void fetchEquipmentList();
};

const resetForm = () => {
  formData.value = {
    name: '',
    tag_no: '',
    category_id: null,
    sub_category_id: null,
    supplier_id: null,
    current_location_id: null,
    serial_number: '',
    description: '',
    is_active: true,
  };
  isEditing.value = false;
  editingId.value = null;
  subCategories.value = [];
};

const onAdd = () => {
  resetForm();
  showDialog.value = true;
};

const onEdit = async (equipment: Equipment) => {
  isEditing.value = true;
  editingId.value = equipment.id;

  formData.value = {
    name: equipment.name,
    tag_no: equipment.tag_no,
    category_id: equipment.category_id,
    sub_category_id: equipment.sub_category_id,
    supplier_id: equipment.supplier_id,
    current_location_id: equipment.current_location_id,
    serial_number: equipment.serial_number || '',
    description: equipment.description || '',
    is_active: equipment.is_active,
  };

  // Load sub-categories if category is selected
  if (equipment.category_id) {
    await fetchSubCategories(equipment.category_id);
  }

  showDialog.value = true;
};

const onSubmit = async () => {
  loading.value = true;

  try {
    if (isEditing.value && editingId.value) {
      await api.put(`/api/equipments/${editingId.value}`, formData.value);

      $q.notify({
        type: 'positive',
        message: 'Equipment updated successfully',
        position: 'bottom',
      });
    } else {
      await api.post('/api/equipments', formData.value);

      $q.notify({
        type: 'positive',
        message: 'Equipment created successfully',
        position: 'bottom',
      });
    }

    showDialog.value = false;
    resetForm();
    await fetchEquipmentList();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };

    let errorMessage = 'Failed to save equipment';

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
  } finally {
    loading.value = false;
  }
};

const onDelete = (equipment: Equipment) => {
  $q.dialog({
    title: 'Confirm',
    message: `Are you sure you want to delete ${equipment.name}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/api/equipments/${equipment.id}`);
        $q.notify({
          type: 'positive',
          message: 'Equipment deleted successfully',
          position: 'bottom',
        });
        await fetchEquipmentList();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to delete equipment',
          position: 'bottom',
        });
      }
    })();
  });
};

// Activities modal functions
const openChecksheetsModal = (equipment: Equipment) => {
  selectedEquipment.value = equipment;
  showChecksheetsModal.value = true;
};

const openActivitiesModal = (equipment: Equipment) => {
  selectedEquipment.value = equipment;
  showActivitiesModal.value = true;
};

onMounted(() => {
  void fetchFormOptions();
  void fetchEquipmentList();
});
</script>
