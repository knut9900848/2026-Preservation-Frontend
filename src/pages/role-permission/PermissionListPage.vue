<template>
  <q-page padding>
    <div class="q-mb-md row justify-between items-center">
      <div class="text-h5">Permission Management</div>
      <q-btn color="primary" label="Add Permission" icon="add" @click="openAddDialog" />
    </div>

    <q-table :rows="permissions" :columns="columns" row-key="id" :loading="loading" bordered flat
      table-header-style="background-color: #007bff; color: #fff; font-weight: bold" separator="cell" color="primary"
      square :filter="filter">
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat color="primary" icon="edit" size="sm" @click="openEditDialog(props.row)">
            <q-tooltip>Edit</q-tooltip>
          </q-btn>
          <q-btn flat color="negative" icon="delete" size="sm" @click="deletePermission(props.row)">
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Add/Edit Permission Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editMode ? 'Edit Permission' : 'Add Permission' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="savePermission" class="q-gutter-md">
            <q-input v-model="form.name" label="Permission Name" outlined dense
              hint="e.g., create-users, edit-posts, view-reports"
              :rules="[(val) => !!val || 'Permission name is required']" />

            <q-input v-model="form.guard_name" label="Guard Name" outlined dense hint="Default: web"
              :rules="[(val) => !!val || 'Guard name is required']" />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" flat color="grey" v-close-popup />
              <q-btn label="Save" type="submit" color="primary" :loading="saving" />
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

interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at?: string;
  updated_at?: string;
}

interface PermissionForm {
  name: string;
  guard_name: string;
}

const $q = useQuasar();

const permissions = ref<Permission[]>([]);
const loading = ref(false);
const filter = ref('');
const showDialog = ref(false);
const editMode = ref(false);
const saving = ref(false);
const editingPermissionId = ref<number | null>(null);

const form = ref<PermissionForm>({
  name: '',
  guard_name: 'web',
});

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
    label: 'Permission Name',
    field: 'name',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'guard_name',
    label: 'Guard',
    field: 'guard_name',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'created_at',
    label: 'Created At',
    field: 'created_at',
    sortable: true,
    align: 'center' as const,
    format: (val: string) => {
      if (!val) return '';
      return new Date(val).toLocaleDateString();
    },
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center' as const,
  },
];

const fetchPermissions = async () => {
  loading.value = true;

  try {
    const response = await api.get('/api/permissions');
    permissions.value = response.data.data || response.data.permissions || [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load permissions',
      position: 'bottom',
    });
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  editMode.value = false;
  editingPermissionId.value = null;
  form.value = {
    name: '',
    guard_name: 'web',
  };
  showDialog.value = true;
};

const openEditDialog = (permission: Permission) => {
  editMode.value = true;
  editingPermissionId.value = permission.id;
  form.value = {
    name: permission.name,
    guard_name: permission.guard_name,
  };
  showDialog.value = true;
};

const savePermission = async () => {
  saving.value = true;

  try {
    if (editMode.value && editingPermissionId.value) {
      await api.put(`/api/permissions/${editingPermissionId.value}`, form.value);
      $q.notify({
        type: 'positive',
        message: 'Permission updated successfully',
        position: 'bottom',
      });
    } else {
      await api.post('/api/permissions', form.value);
      $q.notify({
        type: 'positive',
        message: 'Permission created successfully',
        position: 'bottom',
      });
    }

    showDialog.value = false;
    void fetchPermissions();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to save permission',
      position: 'bottom',
    });
  } finally {
    saving.value = false;
  }
};

const deletePermission = (permission: Permission) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete permission "${permission.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/api/permissions/${permission.id}`);
        $q.notify({
          type: 'positive',
          message: 'Permission deleted successfully',
          position: 'bottom',
        });
        void fetchPermissions();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to delete permission',
          position: 'bottom',
        });
      }
    })();
  });
};

onMounted(() => {
  void fetchPermissions();
});
</script>
