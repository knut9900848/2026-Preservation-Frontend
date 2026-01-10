<template>
  <q-card class="activities-modal-card">
    <q-card-section class="row items-center">
      <div class="text-h6">Equipment Activities - {{ equipment?.name }} ({{ equipment?.tag_no }})</div>
      <q-space />
      <q-btn icon="close" flat round dense @click="$emit('close')" />
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pt-md" style="height: calc(100vh - 100px); overflow-y: auto;">
      <div class="q-mb-md row justify-between items-center">
        <div class="text-subtitle1">
          Equipment Activities
          <span v-if="selected.length > 0" class="text-caption q-ml-sm">({{ selected.length }} selected)</span>
        </div>
        <div class="row q-gutter-sm">
          <q-btn v-if="selected.length > 0" color="positive" label="Update Activities" icon="add_task"
            @click="onAddActive" />
        </div>
      </div>

      <q-table :rows="activityList" :columns="columns" row-key="id" :loading="loading" bordered flat separator="cell"
        color="primary" square selection="multiple" v-model:selected="selected" :rows-per-page-options="[0]"
        hide-pagination :filter="filter" table-header-style="background-color: #007bff; color: #fff; font-weight: bold">
        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

interface Equipment {
  id: number;
  name: string;
  tag_no: string;
}

interface Activity {
  id: number;
  code: string;
  description: string;
  notes: string | null;
  frequency: number;
  is_active: boolean;
  activity_items_count?: number;
  is_assigned?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Props {
  equipment: Equipment | null;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'close'): void;
}>();

const $q = useQuasar();

const activityList = ref<Activity[]>([]);
const loading = ref(false);
const selected = ref<Activity[]>([]);
const filter = ref('');
const assignedActivityIds = ref<number[]>([]);

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
];

const fetchActivities = async () => {
  if (!props.equipment?.id) return;

  loading.value = true;

  try {
    const response = await api.get(`/api/equipments/${props.equipment.id}/activities`);
    activityList.value = response.data.activities || [];
    assignedActivityIds.value = response.data.assigned_activity_ids || [];

    // Auto-select already assigned activities using the assigned_activity_ids array
    selected.value = activityList.value.filter((activity) =>
      assignedActivityIds.value.includes(activity.id)
    );

  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load activities',
      position: 'bottom',
    });
  } finally {
    loading.value = false;
  }
};

const onAddActive = () => {
  if (!props.equipment?.id) return;

  $q.dialog({
    title: 'Confirm',
    message: `Are you sure you want to attach ${selected.value.length} activity(s) to this equipment?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        loading.value = true;

        const activityIds = selected.value.map((activity) => activity.id);

        console.log('Attaching activities:', activityIds);

        const response = await api.post(
          `/api/equipments/${props.equipment!.id}/attach-activities`,
          {
            activity_ids: activityIds,
          }
        );

        $q.notify({
          type: 'positive',
          message: response.data.message || 'Activities attached successfully',
          position: 'bottom',
        });

        selected.value = [];
        void fetchActivities();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to attach activities',
          position: 'bottom',
        });
      } finally {
        loading.value = false;
      }
    })();
  });
};

watch(
  () => props.equipment,
  (newEquipment) => {
    if (newEquipment) {
      void fetchActivities();
    } else {
      activityList.value = [];
    }
  },
  { immediate: true }
);
</script>
