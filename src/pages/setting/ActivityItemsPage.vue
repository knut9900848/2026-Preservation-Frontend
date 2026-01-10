<template>
  <q-card class="activity-items-modal-card">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">Activity Items - {{ activity?.code }} ({{ activity?.description }})</div>
      <q-space />
      <q-btn icon="close" flat round @click="$emit('close')" />
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pt-md" style="height: calc(100vh - 100px); overflow-y: auto;">
      <div class="q-mb-md row justify-between items-center">
        <div class="text-subtitle1">Activity Items</div>
        <q-btn color="primary" label="Add Item" icon="add" @click="onAdd" />
      </div>

      <q-table :rows="activityItemList" :columns="columns" row-key="id" :loading="loading" bordered flat
        class="activity-items-table">
        <template v-slot:body-cell-is_active="props">
          <q-td :props="props">
            <q-badge :color="props.row.is_active ? 'primary' : 'grey'">
              {{ props.row.is_active ? 'Active' : 'Inactive' }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <q-btn flat round dense color="primary" icon="edit" size="sm" @click="onEdit(props.row)">
              <q-tooltip>Edit</q-tooltip>
            </q-btn>
            <q-btn flat round dense color="negative" icon="delete" size="sm" @click="onDelete(props.row)">
              <q-tooltip>Delete</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card-section>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">{{ isEditing ? 'Edit Activity Item' : 'Add Activity Item' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input v-model="formData.description" label="Description" outlined dense type="textarea" rows="3" />

            <q-input v-model.number="formData.order" label="Order" type="number" outlined dense :rules="[
              (val) => val >= 0 || 'Order must be 0 or greater',
            ]" />

            <q-toggle v-model="formData.is_active" label="Active" />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" color="grey" flat @click="showDialog = false" />
              <q-btn label="Save" type="submit" color="primary" :loading="loading" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

interface Activity {
  id: number;
  code: string;
  description: string;
}

interface ActivityItem {
  id: number;
  activity_id: number;
  description: string | null;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ActivityItemFormData {
  description: string;
  order: number;
  is_active: boolean;
}

interface Props {
  activity: Activity | null;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'close'): void;
}>();

const $q = useQuasar();

const activityItemList = ref<ActivityItem[]>([]);
const loading = ref(false);

// Dialog state
const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

// Form data
const formData = ref<ActivityItemFormData>({
  description: '',
  order: 0,
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
    name: 'description',
    label: 'Description',
    field: 'description',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'order',
    label: 'Order',
    field: 'order',
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
    name: 'action',
    label: 'ACTION',
    field: 'action',
    align: 'center' as const,
    sortable: false,
  },
];

const fetchActivityItems = async () => {
  if (!props.activity?.id) return;

  loading.value = true;

  try {
    const response = await api.get(`/api/activity-items`, {
      params: {
        activity_id: props.activity.id,
      },
    });
    activityItemList.value = response.data.activity_items || response.data.data || [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load activity items',
      position: 'bottom',
    });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  formData.value = {
    description: '',
    order: 0,
    is_active: true,
  };
  isEditing.value = false;
  editingId.value = null;
};

const onAdd = () => {
  resetForm();
  showDialog.value = true;
};

const onEdit = (item: ActivityItem) => {
  isEditing.value = true;
  editingId.value = item.id;
  formData.value = {
    description: item.description || '',
    order: item.order,
    is_active: item.is_active,
  };
  showDialog.value = true;
};

const onSubmit = async () => {
  if (!props.activity?.id) return;

  loading.value = true;

  try {
    const payload = {
      ...formData.value,
      activity_id: props.activity.id,
    };

    if (isEditing.value && editingId.value) {
      await api.put(`/api/activity-items/${editingId.value}`, payload);
      $q.notify({
        type: 'positive',
        message: 'Activity item updated successfully',
        position: 'bottom',
      });
    } else {
      await api.post('/api/activity-items', payload);
      $q.notify({
        type: 'positive',
        message: 'Activity item created successfully',
        position: 'bottom',
      });
    }

    showDialog.value = false;
    resetForm();
    await fetchActivityItems();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };

    let errorMessage = 'Failed to save activity item';

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

const onDelete = (item: ActivityItem) => {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to delete this activity item?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/api/activity-items/${item.id}`);
        $q.notify({
          type: 'positive',
          message: 'Activity item deleted successfully',
          position: 'bottom',
        });
        await fetchActivityItems();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to delete activity item',
          position: 'bottom',
        });
      }
    })();
  });
};

// Watch for activity changes to fetch items
watch(
  () => props.activity,
  (newActivity) => {
    if (newActivity) {
      void fetchActivityItems();
    }
  },
  { immediate: true }
);
</script>
