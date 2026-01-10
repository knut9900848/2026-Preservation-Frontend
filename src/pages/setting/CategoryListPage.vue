<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md row justify-between items-center">
      <div class="text-h5">Category List</div>
      <q-btn color="primary" label="Add Category" icon="add" @click="onAddCategory" />
    </div>

    <q-table :rows="categoryList" :columns="columns" row-key="id" :loading="loading" v-model:pagination="pagination"
      @request="onRequest" bordered flat class="category-table" separator="cell" color="primary" square
      table-header-style="background-color: #007bff; color: #fff; font-weight: bold" binary-state-sort hide-pagination
      :rows-per-page-options="[10, 25, 50, 100]">
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

    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">{{ isEditing ? 'Edit Category' : 'Add Category' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input v-model="formData.name" label="Category Name *" outlined dense :rules="[
              (val) => (val && val.length > 0) || 'Name is required',
            ]" />

            <q-input v-model="formData.code" label="Code *" outlined dense :rules="[
              (val) => (val && val.length > 0) || 'Code is required',
            ]" />

            <q-input v-model="formData.description" label="Description" outlined dense type="textarea" rows="3" />

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

interface Category {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CategoryFormData {
  name: string;
  code: string;
  description: string;
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
    name: 'name',
    label: 'Category Name',
    field: 'name',
    sortable: true,
    align: 'left' as const,
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

const categoryList = ref<Category[]>([]);
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

const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const formData = ref<CategoryFormData>({
  name: '',
  code: '',
  description: '',
  is_active: true,
});

const fetchCategoryList = async () => {
  loading.value = true;

  try {
    const response = await api.get('/api/categories', {
      params: {
        page: pagination.value.page,
        per_page: pagination.value.rowsPerPage,
        sort_by: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      },
    });

    categoryList.value = response.data.categories;
    pagination.value.rowsNumber = response.data.total || response.data.categories.length;
    pagination.value.rowsPerPage = response.data.per_page || pagination.value.rowsPerPage;
    maxPage.value = Math.ceil(pagination.value.rowsNumber / pagination.value.rowsPerPage) || 1;
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to load category list',
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
  void fetchCategoryList();
};

const onSearch = () => {
  pagination.value.page = 1;
  void fetchCategoryList();
};

const onPageChange = (newPage: number) => {
  pagination.value.page = newPage;
  void fetchCategoryList();
};

const resetForm = () => {
  formData.value = {
    name: '',
    code: '',
    description: '',
    is_active: true,
  };
  isEditing.value = false;
  editingId.value = null;
};

const onAddCategory = () => {
  resetForm();
  showDialog.value = true;
};

const onEdit = (category: Category) => {
  isEditing.value = true;
  editingId.value = category.id;
  formData.value = {
    name: category.name,
    code: category.code,
    description: category.description || '',
    is_active: category.is_active,
  };
  showDialog.value = true;
};

const onSubmit = async () => {
  try {
    if (isEditing.value && editingId.value) {
      await api.put(`/api/categories/${editingId.value}`, formData.value);
      $q.notify({
        type: 'positive',
        message: 'Category updated successfully',
        position: 'bottom',
      });
    } else {
      await api.post('/api/categories', formData.value);
      $q.notify({
        type: 'positive',
        message: 'Category created successfully',
        position: 'bottom',
      });
    }
    showDialog.value = false;
    await fetchCategoryList();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to save category',
      position: 'bottom',
    });
  }
};

const onDelete = (category: Category) => {
  $q.dialog({
    title: 'Confirm',
    message: `Are you sure you want to delete ${category.name}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/api/categories/${category.id}`);
        $q.notify({
          type: 'positive',
          message: 'Category deleted successfully',
          position: 'bottom',
        });
        await fetchCategoryList();
      } catch {
        $q.notify({
          type: 'negative',
          message: 'Failed to delete category',
          position: 'bottom',
        });
      }
    })();
  });
};

onMounted(() => {
  void fetchCategoryList();
});
</script>
