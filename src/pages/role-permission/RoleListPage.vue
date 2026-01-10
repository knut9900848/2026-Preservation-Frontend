<template>
  <q-page padding>
    <div class="q-mb-md row justify-between items-center">
      <div class="text-h5">Role Management</div>
      <q-btn color="primary" label="Add Role" icon="add" @click="openAddDialog" />
    </div>

    <q-table :rows="roles" :columns="columns" row-key="id" :loading="loading" bordered flat
      table-header-style="background-color: #007bff; color: #fff; font-weight: bold" separator="cell" color="primary"
      square :filter="filter">
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-permissions_count="props">
        <q-td :props="props">
          <q-badge color="info">
            {{ props.row.permissions_count || 0 }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat color="info" icon="vpn_key" size="sm" @click="openPermissionsDialog(props.row)">
            <q-tooltip>Manage Permissions</q-tooltip>
          </q-btn>
          <q-btn flat color="primary" icon="edit" size="sm" @click="openEditDialog(props.row)">
            <q-tooltip>Edit</q-tooltip>
          </q-btn>
          <q-btn flat color="negative" icon="delete" size="sm" @click="deleteRole(props.row)">
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Add/Edit Role Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editMode ? 'Edit Role' : 'Add Role' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveRole" class="q-gutter-md">
            <q-input v-model="form.name" label="Role Name" outlined dense
              :rules="[(val) => !!val || 'Role name is required']" />

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

    <!-- Permissions Assignment Dialog -->
    <q-dialog v-model="showPermissionsDialog" persistent>
      <q-card style="min-width: 600px; max-height: 80vh">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Manage Permissions - {{ selectedRole?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-md" style="max-height: 50vh; overflow-y: auto;">
          <div class="q-mb-md">
            <q-input borderless dense debounce="300" v-model="permissionFilter" placeholder="Search permissions">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div v-if="loadingPermissions" class="text-center q-pa-md">
            <q-spinner color="primary" size="3em" />
          </div>

          <q-list v-else bordered separator>
            <q-item v-for="permission in filteredPermissions" :key="permission.id" tag="label" clickable>
              <q-item-section avatar>
                <q-checkbox v-model="selectedPermissions" :val="permission.id" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ permission.name }}</q-item-label>
                <q-item-label caption v-if="permission.guard_name">Guard: {{ permission.guard_name }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row justify-end q-gutter-sm">
            <q-btn label="Cancel" flat color="grey" v-close-popup />
            <q-btn label="Save Permissions" color="primary" :loading="savingPermissions" @click="saveRolePermissions" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at?: string;
  updated_at?: string;
}

interface RoleForm {
  name: string;
  guard_name: string;
}

const $q = useQuasar();

const roles = ref<Role[]>([]);
const permissions = ref<Permission[]>([]);
const loading = ref(false);
const loadingPermissions = ref(false);
const filter = ref('');
const permissionFilter = ref('');
const showDialog = ref(false);
const showPermissionsDialog = ref(false);
const editMode = ref(false);
const saving = ref(false);
const savingPermissions = ref(false);
const editingRoleId = ref<number | null>(null);
const selectedRole = ref<Role | null>(null);
const selectedPermissions = ref<number[]>([]);

const form = ref<RoleForm>({
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
    label: 'Role Name',
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
    name: 'permissions_count',
    label: 'Permissions',
    field: 'permissions_count',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center' as const,
  },
];

const filteredPermissions = computed(() => {
  if (!permissionFilter.value) return permissions.value;
  const search = permissionFilter.value.toLowerCase();
  return permissions.value.filter((p) =>
    p.name.toLowerCase().includes(search)
  );
});

const fetchRoles = async () => {
  loading.value = true;

  try {
    const response = await api.get('/api/roles');
    roles.value = response.data.data || response.data.roles || [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load roles',
      position: 'bottom',
    });
  } finally {
    loading.value = false;
  }
};

const fetchAllPermissions = async () => {
  loadingPermissions.value = true;

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
    loadingPermissions.value = false;
  }
};

const openAddDialog = () => {
  editMode.value = false;
  editingRoleId.value = null;
  form.value = {
    name: '',
    guard_name: 'web',
  };
  showDialog.value = true;
};

const openEditDialog = (role: Role) => {
  editMode.value = true;
  editingRoleId.value = role.id;
  form.value = {
    name: role.name,
    guard_name: role.guard_name,
  };
  showDialog.value = true;
};

const openPermissionsDialog = async (role: Role) => {
  selectedRole.value = role;
  permissionFilter.value = '';

  // Fetch all permissions if not already loaded
  if (permissions.value.length === 0) {
    await fetchAllPermissions();
  }

  // Fetch role's current permissions
  try {
    const response = await api.get(`/api/roles/${role.id}`);
    const rolePermissions = response.data.permissions || [];
    selectedPermissions.value = rolePermissions.map((p: Permission) => p.id);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load role permissions',
      position: 'bottom',
    });
  }

  showPermissionsDialog.value = true;
};

const saveRole = async () => {
  saving.value = true;

  try {
    if (editMode.value && editingRoleId.value) {
      await api.put(`/api/roles/${editingRoleId.value}`, form.value);
      $q.notify({
        type: 'positive',
        message: 'Role updated successfully',
        position: 'bottom',
      });
    } else {
      await api.post('/api/roles', form.value);
      $q.notify({
        type: 'positive',
        message: 'Role created successfully',
        position: 'bottom',
      });
    }

    showDialog.value = false;
    void fetchRoles();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to save role',
      position: 'bottom',
    });
  } finally {
    saving.value = false;
  }
};

const saveRolePermissions = async () => {
  if (!selectedRole.value) return;

  savingPermissions.value = true;

  try {
    await api.post(`/api/roles/${selectedRole.value.id}/assign-permissions`, {
      permissions: selectedPermissions.value,
    });

    $q.notify({
      type: 'positive',
      message: 'Permissions updated successfully',
      position: 'bottom',
    });

    showPermissionsDialog.value = false;
    void fetchRoles();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to update permissions',
      position: 'bottom',
    });
  } finally {
    savingPermissions.value = false;
  }
};

const deleteRole = (role: Role) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete role "${role.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/api/roles/${role.id}`);
        $q.notify({
          type: 'positive',
          message: 'Role deleted successfully',
          position: 'bottom',
        });
        void fetchRoles();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to delete role',
          position: 'bottom',
        });
      }
    })();
  });
};

onMounted(() => {
  void fetchRoles();
});
</script>
