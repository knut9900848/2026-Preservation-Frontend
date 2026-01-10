<template>
  <q-page padding>
    <div class="q-mb-md row justify-between items-center">
      <div class="text-h5">User Management</div>
      <q-btn color="primary" label="Add User" icon="add" @click="openAddDialog" />
    </div>

    <q-table :rows="users" :columns="columns" row-key="id" :loading="loading" bordered flat
      table-header-style="background-color: #007bff; color: #fff; font-weight: bold" separator="cell" color="primary"
      square :filter="filter">
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-is_active="props">
        <q-td :props="props">
          <q-badge :color="props.row.is_active ? 'positive' : 'negative'">
            {{ props.row.is_active ? 'Active' : 'Inactive' }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat color="info" icon="admin_panel_settings" size="sm" @click="openRolesDialog(props.row)">
            <q-tooltip>Manage Roles</q-tooltip>
          </q-btn>
          <q-btn flat color="secondary" icon="vpn_key" size="sm" @click="openPermissionsDialog(props.row)">
            <q-tooltip>Manage Permissions</q-tooltip>
          </q-btn>
          <q-btn flat color="primary" icon="edit" size="sm" @click="openEditDialog(props.row)">
            <q-tooltip>Edit</q-tooltip>
          </q-btn>
          <q-btn flat color="negative" icon="delete" size="sm" @click="deleteUser(props.row)">
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Roles Assignment Dialog -->
    <q-dialog v-model="showRolesDialog" persistent>
      <q-card style="min-width: 600px; max-height: 80vh">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Manage Roles - {{ selectedUser?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-md" style="max-height: 50vh; overflow-y: auto;">
          <div class="q-mb-md">
            <q-input borderless dense debounce="300" v-model="roleFilter" placeholder="Search roles">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div v-if="loadingRoles" class="text-center q-pa-md">
            <q-spinner color="primary" size="3em" />
          </div>

          <q-list v-else bordered separator>
            <q-item v-for="role in filteredRoles" :key="role.id" tag="label" clickable>
              <q-item-section avatar>
                <q-checkbox v-model="selectedRoles" :val="role.id" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ role.name }}</q-item-label>
                <q-item-label caption v-if="role.guard_name">Guard: {{ role.guard_name }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row justify-end q-gutter-sm">
            <q-btn label="Cancel" flat color="grey" v-close-popup />
            <q-btn label="Save Roles" color="primary" :loading="savingRoles" @click="saveUserRoles" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Permissions Assignment Dialog -->
    <q-dialog v-model="showPermissionsDialog" persistent>
      <q-card style="min-width: 600px; max-height: 80vh">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Manage Direct Permissions - {{ selectedUser?.name }}</div>
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
            <q-btn label="Save Permissions" color="primary" :loading="savingPermissions" @click="saveUserPermissions" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Add/Edit User Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editMode ? 'Edit User' : 'Add User' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveUser" class="q-gutter-md">
            <q-input v-model="form.name" label="Name" outlined dense :rules="[(val) => !!val || 'Name is required']" />

            <q-input v-model="form.email" label="Email" type="email" outlined dense
              :rules="[(val) => !!val || 'Email is required', (val) => /.+@.+\..+/.test(val) || 'Invalid email format']" />

            <q-input v-model="form.phone" label="Phone" outlined dense />

            <q-input v-model="form.date_of_birth" label="Date of Birth" type="date" outlined dense />

            <q-input v-model="form.job_start_date" label="Job Start Date" type="date" outlined dense />

            <q-input v-model="form.job_end_date" label="Job End Date" type="date" outlined dense />

            <q-input v-if="!editMode" v-model="form.password" label="Password" type="password" outlined dense
              :rules="[(val) => !!val || 'Password is required', (val) => val.length >= 8 || 'Password must be at least 8 characters']" />

            <q-input v-if="editMode && showPasswordField" v-model="form.password" label="New Password" type="password"
              outlined dense hint="Leave blank to keep current password"
              :rules="[(val) => !val || val.length >= 8 || 'Password must be at least 8 characters']" />

            <q-btn v-if="editMode && !showPasswordField" flat color="primary" label="Change Password"
              @click="showPasswordField = true" />

            <q-toggle v-model="form.is_active" label="Active" />

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
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  job_start_date: string | null;
  job_end_date: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Role {
  id: number;
  name: string;
  guard_name: string;
}

interface Permission {
  id: number;
  name: string;
  guard_name: string;
}

interface UserForm {
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  job_start_date: string;
  job_end_date: string;
  password: string;
  is_active: boolean;
}

const $q = useQuasar();

const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const permissions = ref<Permission[]>([]);
const loading = ref(false);
const loadingRoles = ref(false);
const loadingPermissions = ref(false);
const filter = ref('');
const roleFilter = ref('');
const permissionFilter = ref('');
const showDialog = ref(false);
const showRolesDialog = ref(false);
const showPermissionsDialog = ref(false);
const editMode = ref(false);
const saving = ref(false);
const savingRoles = ref(false);
const savingPermissions = ref(false);
const showPasswordField = ref(false);
const editingUserId = ref<number | null>(null);
const selectedUser = ref<User | null>(null);
const selectedRoles = ref<number[]>([]);
const selectedPermissions = ref<number[]>([]);

const form = ref<UserForm>({
  name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  job_start_date: '',
  job_end_date: '',
  password: '',
  is_active: true,
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
    label: 'Name',
    field: 'name',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'email',
    label: 'Email',
    field: 'email',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'phone',
    label: 'Phone',
    field: 'phone',
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'job_start_date',
    label: 'Job Start Date',
    field: 'job_start_date',
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
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center' as const,
  },
];

const filteredRoles = computed(() => {
  if (!roleFilter.value) return roles.value;
  const search = roleFilter.value.toLowerCase();
  return roles.value.filter((r) =>
    r.name.toLowerCase().includes(search)
  );
});

const filteredPermissions = computed(() => {
  if (!permissionFilter.value) return permissions.value;
  const search = permissionFilter.value.toLowerCase();
  return permissions.value.filter((p) =>
    p.name.toLowerCase().includes(search)
  );
});

const fetchUsers = async () => {
  loading.value = true;

  try {
    const response = await api.get('/api/users');
    users.value = response.data.users || response.data.data || [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load users',
      position: 'bottom',
    });
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  editMode.value = false;
  editingUserId.value = null;
  showPasswordField.value = false;
  form.value = {
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    job_start_date: '',
    job_end_date: '',
    password: '',
    is_active: true,
  };
  showDialog.value = true;
};

const openEditDialog = (user: User) => {
  editMode.value = true;
  editingUserId.value = user.id;
  showPasswordField.value = false;
  form.value = {
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    date_of_birth: user.date_of_birth || '',
    job_start_date: user.job_start_date || '',
    job_end_date: user.job_end_date || '',
    password: '',
    is_active: user.is_active,
  };
  showDialog.value = true;
};

const saveUser = async () => {
  saving.value = true;

  try {
    const payload: Record<string, string | boolean> = {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      date_of_birth: form.value.date_of_birth,
      job_start_date: form.value.job_start_date,
      job_end_date: form.value.job_end_date,
      is_active: form.value.is_active,
    };

    // Only include password if it's provided
    if (form.value.password) {
      payload.password = form.value.password;
    }

    if (editMode.value && editingUserId.value) {
      // Update existing user
      await api.put(`/api/users/${editingUserId.value}`, payload);
      $q.notify({
        type: 'positive',
        message: 'User updated successfully',
        position: 'bottom',
      });
    } else {
      // Create new user
      await api.post('/api/users', payload);
      $q.notify({
        type: 'positive',
        message: 'User created successfully',
        position: 'bottom',
      });
    }

    showDialog.value = false;
    void fetchUsers();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to save user',
      position: 'bottom',
    });
  } finally {
    saving.value = false;
  }
};

const deleteUser = (user: User) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete user "${user.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/api/users/${user.id}`);
        $q.notify({
          type: 'positive',
          message: 'User deleted successfully',
          position: 'bottom',
        });
        void fetchUsers();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to delete user',
          position: 'bottom',
        });
      }
    })();
  });
};

const fetchAllRoles = async () => {
  loadingRoles.value = true;

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
    loadingRoles.value = false;
  }
};

const openRolesDialog = async (user: User) => {
  selectedUser.value = user;
  roleFilter.value = '';

  // Fetch all roles if not already loaded
  if (roles.value.length === 0) {
    await fetchAllRoles();
  }

  // Fetch user's current roles
  try {
    const response = await api.get(`/api/users/${user.id}/roles`);
    const userRoles = response.data.roles || [];
    selectedRoles.value = userRoles.map((r: Role) => r.id);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load user roles',
      position: 'bottom',
    });
  }

  showRolesDialog.value = true;
};

const saveUserRoles = async () => {
  if (!selectedUser.value) return;

  savingRoles.value = true;

  console.log('Selected roles to assign:', selectedRoles.value);
  console.log('Selected user:', selectedUser.value);
  console.log('savingRoles state:', savingRoles.value);

  try {
    await api.post(`/api/users/${selectedUser.value.id}/assign-roles`, {
      roles: selectedRoles.value,
    });

    $q.notify({
      type: 'positive',
      message: 'Roles updated successfully',
      position: 'bottom',
    });

    showRolesDialog.value = false;
    void fetchUsers();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to update roles',
      position: 'bottom',
    });
  } finally {
    savingRoles.value = false;
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

const openPermissionsDialog = async (user: User) => {
  selectedUser.value = user;
  permissionFilter.value = '';

  // Fetch all permissions if not already loaded
  if (permissions.value.length === 0) {
    await fetchAllPermissions();
  }

  // Fetch user's current direct permissions
  try {
    const response = await api.get(`/api/users/${user.id}/roles`);
    const userPermissions = response.data.permissions || [];
    selectedPermissions.value = userPermissions.map((p: Permission) => p.id);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load user permissions',
      position: 'bottom',
    });
  }

  showPermissionsDialog.value = true;
};

const saveUserPermissions = async () => {
  if (!selectedUser.value) return;

  savingPermissions.value = true;

  try {
    await api.post(`/api/users/${selectedUser.value.id}/assign-permissions`, {
      permissions: selectedPermissions.value,
    });

    $q.notify({
      type: 'positive',
      message: 'Permissions updated successfully',
      position: 'bottom',
    });

    showPermissionsDialog.value = false;
    void fetchUsers();
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

onMounted(() => {
  void fetchUsers();
});
</script>
