<template>
  <q-dialog v-model="showDialog" maximized>
    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">Checksheet Number - {{ checksheet?.sheet_number }}</div>
        <q-btn label="Generate Report" color="primary" flat class="q-ml-md" @click="generateReport">
        </q-btn>
        <q-btn
          label="History"
          color="info"
          flat
          class="q-ml-sm"
          icon="history"
          @click="showHistoryDialog = true"
        >
        </q-btn>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-md">
        <!-- Checksheet Information Grid -->
        <div class="row q-col-gutter-md">
          <!-- Project -->
          <div class="col-lg-3 col-md-4 col-sm-6">
            <q-input label="Project" model-value="" outlined dense readonly />
          </div>
          <!-- Equipment Name -->
          <div class="col-lg-3 col-md-4 col-sm-6">
            <q-input
              label="Equipment Name"
              :model-value="checksheet?.equipment?.name ?? 'N/A'"
              outlined
              dense
              readonly
            />
          </div>
          <!-- Activity Code -->
          <div class="col-lg-3 col-md-4 col-sm-6">
            <q-input
              label="Activity Code"
              :model-value="checksheet?.activity_code || 'N/A'"
              outlined
              dense
              readonly
            />
          </div>
          <!-- Tag Number -->
          <div class="col-lg-3 col-md-4 col-sm-6">
            <q-input
              label="Tag Number"
              :model-value="checksheet?.equipment?.tag_no ?? 'N/A'"
              outlined
              dense
              readonly
            />
          </div>

          <!-- Round -->
          <div class="col-lg-3 col-md-4 col-sm-6">
            <q-input
              label="Round"
              :model-value="checksheet?.current_round || 'N/A'"
              outlined
              dense
              readonly
            />
          </div>
          <!-- Frequency -->
          <div class="col-lg-3 col-md-4 col-sm-6">
            <q-input
              label="Frequency"
              :model-value="checksheet?.frequency || 'N/A'"
              outlined
              dense
              readonly
            />
          </div>
          <!-- Status -->
          <div class="col-lg-3 col-md-4 col-sm-6">
            <q-input label="Status" :model-value="currentStatus" outlined dense readonly />
          </div>
          <!-- Due Date -->
          <div class="col-lg-3 col-md-4 col-sm-6">
            <q-input label="Due Date" v-model="dueDate" outlined dense readonly>
              <template v-slot:append>
                <q-icon
                  name="event"
                  class="cursor-pointer"
                  :disable="currentStatus?.toLowerCase() !== 'draft'"
                >
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                    :disable="currentStatus?.toLowerCase() !== 'draft'"
                  >
                    <q-date v-model="dueDate" @update:model-value="updateDueDate" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>

      <q-separator class="q-mb-md" />

      <q-card-section>
        <div class="row">
          <div class="col-12 col-lg-9">
            <q-table
              :rows="items"
              :columns="columns"
              row-key="id"
              :loading="loading"
              bordered
              flat
              table-header-style="background-color: #007bff; color: #fff; font-weight: bold"
              separator="cell"
              color="primary"
              square
              :rows-per-page-options="[0]"
              hide-pagination
            >
              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <q-radio
                    v-model="props.row.status"
                    :val="0"
                    label="OK"
                    color="primary"
                    :disable="currentStatus?.toLowerCase() !== 'draft'"
                  />
                  <q-radio
                    v-model="props.row.status"
                    :val="1"
                    label="AR"
                    color="negative"
                    :disable="currentStatus?.toLowerCase() !== 'draft'"
                  />
                  <q-radio
                    v-model="props.row.status"
                    :val="2"
                    label="N/A"
                    color="grey"
                    :disable="currentStatus?.toLowerCase() !== 'draft'"
                  />
                </q-td>
              </template>
            </q-table>
            <div class="q-mt-md q-pa-sm bg-grey-2 rounded-borders">
              <div class="row items-center q-gutter-md">
                <span class="text-caption text-grey-7 text-weight-medium">Status Legend:</span>
                <div class="row items-center q-gutter-sm">
                  <q-badge color="primary" rounded class="q-pa-sm">
                    <q-icon name="check_circle" size="xs" class="q-mr-xs" />
                    OK - Okay
                  </q-badge>
                  <q-badge color="negative" rounded class="q-pa-sm">
                    <q-icon name="warning" size="xs" class="q-mr-xs" />
                    AR - Action Required
                  </q-badge>
                  <q-badge color="grey" rounded class="q-pa-sm">
                    <q-icon name="remove_circle" size="xs" class="q-mr-xs" />
                    N/A - Not Applicable
                  </q-badge>
                </div>
              </div>
            </div>

            <q-separator class="q-mb-md" />

            <!-- Workflow Process -->
            <ChecksheetWorkflowProcess
              ref="workflowRef"
              :checksheet-id="checksheet?.id ?? null"
              :initial-step="workflowStep"
              :initial-status="currentStatus"
              :current-round="checksheet?.current_round ?? 0"
              :items="items"
              @status-changed="emit('statusChanged')"
              @step-changed="handleStepChanged"
              @close-dialog="showDialog = false"
            />

            <ChecksheetPhoto
              :checksheet-id="checksheet?.id ?? null"
              :disabled="currentStatus?.toLowerCase() !== 'draft'"
            />
          </div>
          <div class="col-12 col-lg-3 q-pl-md">
            <ChecksheetAssignTechnician
              ref="technicianRef"
              :checksheet-id="checksheet?.id ?? null"
              :initial-users="assignedTechnicians"
              @user-click="openUserInfoDialog"
              @updated="(users) => (assignedTechnicians = users)"
            />
            <ChecksheetAssignInspector
              ref="inspectorRef"
              :checksheet-id="checksheet?.id ?? null"
              :initial-users="assignedInspectors"
              @user-click="openUserInfoDialog"
              @updated="(users) => (assignedInspectors = users)"
            />
            <q-card flat bordered class="q-mb-md">
              <q-card-section class="bg-primary text-white">
                <div class="text-subtitle2">Comments</div>
              </q-card-section>
              <q-card-section>
                <ChecksheetComments
                  commentable-type="App\\Models\\CheckSheet"
                  :commentable-id="checksheet?.id ?? null"
                  :disabled="currentStatus?.toLowerCase() !== 'draft'"
                  v-bind="
                    authStore.user?.id !== undefined ? { currentUserId: authStore.user.id } : {}
                  "
                />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="row justify-end q-gutter-sm">
        <q-btn
          label="Print Checksheet"
          color="primary"
          flat
          @click="
            $q.notify({
              type: 'info',
              message: 'Print functionality not implemented yet.',
              position: 'bottom',
            })
          "
        />
        <q-btn label="Close" color="primary" flat v-close-popup />
      </q-card-section>
    </q-card>

    <!-- Checksheet History Dialog -->
    <ChecksheetHistory
      v-model="showHistoryDialog"
      :equipment-id="checksheet?.equipment_id ?? null"
      :checksheet-id="checksheet?.id ?? null"
    />

    <!-- User Info Dialog -->
    <UserInfoDialog v-model="showUserInfoDialog" :user-id="selectedUserId" />
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import { useAuthStore } from 'stores/auth';
import ChecksheetComments from 'components/ChecksheetComments.vue';
import ChecksheetHistory from 'components/ChecksheetHistory.vue';
import UserInfoDialog from 'components/UserInfoDialog.vue';
import ChecksheetAssignTechnician from 'components/ChecksheetAssignTechnician.vue';
import ChecksheetAssignInspector from 'components/ChecksheetAssignInspector.vue';
import ChecksheetWorkflowProcess from 'components/ChecksheetWorkflowProcess.vue';
import ChecksheetPhoto from 'components/ChecksheetPhoto.vue';

const authStore = useAuthStore();

interface Equipment {
  id?: number;
  name?: string;
  tag_no?: string;
}

interface Checksheet {
  id: number;
  equipment_id: number;
  sheet_number: string;
  activity_code: string;
  current_round?: number;
  frequency?: string;
  status?: string;
  due_date?: string;
  equipment?: Equipment;
  technicians?: User[];
  inspectors?: User[];
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface ChecksheetItem {
  id: number;
  equipment_id: number;
  check_sheet_id: number;
  activity: string | null;
  description: string | null;
  status: number;
  remarks: string | null;
  order: number;
}

interface Props {
  checksheet: Checksheet | null;
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'statusChanged'): void;
}>();

const $q = useQuasar();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// API base URL helper
const getBaseApiUrl = () => `/api/checksheets/${props.checksheet?.id}`;

const items = ref<ChecksheetItem[]>([]);
const loading = ref(false);
const assignedTechnicians = ref<User[]>([]);
const assignedInspectors = ref<User[]>([]);
const showHistoryDialog = ref(false);
const showUserInfoDialog = ref(false);
const selectedUserId = ref<number | null>(null);
const dueDate = ref<string>('');

// Workflow related
const workflowStep = ref<number>(1);
const currentStatus = ref<string>('N/A');
const workflowRef = ref<InstanceType<typeof ChecksheetWorkflowProcess> | null>(null);

const handleStepChanged = (payload: { step: number; status: string }) => {
  workflowStep.value = payload.step;
  currentStatus.value = payload.status;
};

const columns = [
  {
    name: 'id',
    label: 'ID.',
    field: 'id',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'activity',
    label: 'Activity',
    field: 'activity',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'description',
    label: 'Description',
    field: 'description',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'comment',
    label: 'Comment',
    field: 'comment',
    sortable: false,
    align: 'center' as const,
  },
];

const fetchChecksheetItems = async () => {
  if (!props.checksheet?.id) return;

  loading.value = true;

  try {
    const response = await api.get(`${getBaseApiUrl()}/checksheet-items`);

    items.value = response.data.check_sheet_items || [];

    // Load assigned technicians and inspectors from checksheet
    assignedTechnicians.value = response.data.technicians || props.checksheet?.technicians || [];
    assignedInspectors.value = response.data.inspectors || props.checksheet?.inspectors || [];

    // Initialize due date
    dueDate.value = props.checksheet?.due_date || '';

    // Initialize current status
    currentStatus.value = props.checksheet?.status || 'N/A';

    // Initialize workflow step based on status
    const status = props.checksheet?.status?.toLowerCase();
    if (status === 'approved') {
      workflowStep.value = 4;
    } else if (status === 'reviewed') {
      workflowStep.value = 3;
    } else if (status === 'completed') {
      workflowStep.value = 2;
    } else {
      workflowStep.value = 1;
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load checksheet items',
      position: 'bottom',
    });
  } finally {
    loading.value = false;
  }
};

const openUserInfoDialog = (userId: number) => {
  selectedUserId.value = userId;
  showUserInfoDialog.value = true;
};

const updateDueDate = async () => {
  if (!props.checksheet?.id) return;

  try {
    await api.put(`${getBaseApiUrl()}/updateDueDate`, {
      due_date: dueDate.value,
    });

    emit('statusChanged');

    $q.notify({
      type: 'positive',
      message: 'Due date updated successfully',
      position: 'bottom',
      timeout: 1000,
    });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to update due date',
      position: 'bottom',
    });
  }
};

const generateReport = async () => {
  if (!props.checksheet?.id) return;

  try {
    $q.notify({
      type: 'info',
      message: 'Generating report...',
      position: 'bottom',
    });

    const response = await api.get(`${getBaseApiUrl()}/report`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Checksheet_${props.checksheet.sheet_number}_Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    $q.notify({
      type: 'positive',
      message: 'Report generated successfully',
      position: 'bottom',
    });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to generate report',
      position: 'bottom',
    });
  }
};

watch(
  () => props.checksheet,
  (newChecksheet) => {
    if (newChecksheet && props.modelValue) {
      void fetchChecksheetItems();
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && props.checksheet) {
      void fetchChecksheetItems();
    }
  },
);
</script>

<style scoped lang="scss">
.cursor-pointer {
  cursor: pointer;
}
</style>
