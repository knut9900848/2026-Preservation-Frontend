<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="bg-primary text-white row items-center">
      <div class="text-subtitle2">Assign Inspectors</div>
      <q-space />
      <q-btn icon="person_add" flat round dense @click="openAssignDialog">
        <q-tooltip>Assign Inspectors</q-tooltip>
      </q-btn>
    </q-card-section>
    <q-card-section>
      <div v-if="assignedUsers.length === 0" class="text-grey-6">No inspectors assigned</div>
      <q-chip v-else v-for="user in assignedUsers" :key="user.id" removable
        @remove="removeUser(user.id)" @click="$emit('userClick', user.id)" color="secondary"
        text-color="white" icon="person" clickable>
        {{ user.name }}
      </q-chip>
    </q-card-section>
  </q-card>

  <!-- Assign Inspectors Dialog -->
  <q-dialog v-model="showAssignDialog" persistent>
    <q-card style="min-width: 600px; max-height: 80vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Assign Inspectors to Checksheet</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-md" style="max-height: 50vh; overflow-y: auto;">
        <div class="q-mb-md">
          <q-input borderless dense debounce="300" v-model="userFilter" placeholder="Search users">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <div v-if="loadingUsers" class="text-center q-pa-md">
          <q-spinner color="primary" size="3em" />
        </div>

        <q-list v-else bordered separator>
          <q-item v-for="user in filteredUsers" :key="user.id" tag="label" clickable>
            <q-item-section avatar>
              <q-checkbox v-model="selectedUsers" :val="user.id" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ user.name }}</q-item-label>
              <q-item-label caption>{{ user.email }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row justify-end q-gutter-sm">
          <q-btn label="Cancel" flat color="grey" v-close-popup />
          <q-btn label="Assign Inspectors" color="primary" :loading="saving" @click="assignUsers" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Props {
  checksheetId: number | null;
  initialUsers?: User[];
}

const props = withDefaults(defineProps<Props>(), {
  initialUsers: () => [],
});

const emit = defineEmits<{
  (e: 'userClick', userId: number): void;
  (e: 'updated', users: User[]): void;
}>();

const $q = useQuasar();

const assignedUsers = ref<User[]>([...props.initialUsers]);
const allUsers = ref<User[]>([]);
const loadingUsers = ref(false);
const saving = ref(false);
const showAssignDialog = ref(false);
const userFilter = ref('');
const selectedUsers = ref<number[]>([]);

const filteredUsers = computed(() => {
  if (!userFilter.value) return allUsers.value;
  const search = userFilter.value.toLowerCase();
  return allUsers.value.filter((u: User) =>
    u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
  );
});

const fetchUsers = async () => {
  loadingUsers.value = true;

  try {
    const response = await api.get('/api/checksheets/users-by-role?role=inspector');
    allUsers.value = response.data.users || response.data.data || [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load inspector users',
      position: 'bottom',
    });
  } finally {
    loadingUsers.value = false;
  }
};

const openAssignDialog = async () => {
  userFilter.value = '';

  if (allUsers.value.length === 0) {
    await fetchUsers();
  }

  selectedUsers.value = assignedUsers.value.map((u) => u.id);
  showAssignDialog.value = true;
};

const assignUsers = async () => {
  if (!props.checksheetId) return;

  saving.value = true;

  try {
    const response = await api.post(`/api/checksheets/${props.checksheetId}/assign-inspectors`, {
      inspectors: selectedUsers.value,
    });

    if (response.data.inspectors) {
      assignedUsers.value = response.data.inspectors;
      emit('updated', response.data.inspectors);
    }

    $q.notify({
      type: 'positive',
      message: 'Inspectors assigned successfully',
      position: 'bottom',
    });

    showAssignDialog.value = false;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to assign inspectors',
      position: 'bottom',
    });
  } finally {
    saving.value = false;
  }
};

const removeUser = (userId: number) => {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to remove this inspector from the checksheet?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!props.checksheetId) return;

      try {
        const response = await api.post(`/api/checksheets/${props.checksheetId}/revoke-inspectors`, {
          inspectors: [userId],
        });

        if (response.data.inspectors) {
          assignedUsers.value = response.data.inspectors;
          emit('updated', response.data.inspectors);
        }

        $q.notify({
          type: 'positive',
          message: 'Inspector removed successfully',
          position: 'bottom',
        });
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to remove inspector',
          position: 'bottom',
        });
      }
    })();
  });
};

// Update assigned users when initialUsers prop changes
const updateAssignedUsers = (users: User[]) => {
  assignedUsers.value = [...users];
};

defineExpose({
  updateAssignedUsers,
});
</script>
