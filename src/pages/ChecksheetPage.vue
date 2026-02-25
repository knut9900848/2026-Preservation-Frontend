<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn icon="arrow_back" flat round dense @click="router.back()" class="q-mr-sm">
        <q-tooltip>Back</q-tooltip>
      </q-btn>
      <div class="text-h6">Checksheet Number - {{ checksheet?.sheet_number }}</div>
      <q-btn label="Report" color="primary" flat class="q-ml-md" icon="mdi-file-document" @click="showReportDialog = true" />
      <q-btn label="History" color="info" flat class="q-ml-sm" icon="history" @click="showHistoryDialog = true" />
    </div>

    <q-separator class="q-mb-md" />

    <!-- Checksheet Information Grid -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-lg-3 col-md-4 col-sm-6">
        <q-input label="Equipment Name" :model-value="checksheet?.equipment_name ?? 'N/A'" outlined dense readonly />
      </div>
      <div class="col-lg-3 col-md-4 col-sm-6">
        <q-input label="Activity Code" :model-value="checksheet?.activity_code || 'N/A'" outlined dense readonly />
      </div>
      <div class="col-lg-3 col-md-4 col-sm-6">
        <q-input label="Tag Number" :model-value="checksheet?.equipment_tag_no ?? 'N/A'" outlined dense readonly />
      </div>

      <div class="col-lg-3 col-md-4 col-sm-6">
        <q-input label="Round" :model-value="checksheet?.current_round || 'N/A'" outlined dense readonly />
      </div>
      <div class="col-lg-3 col-md-4 col-sm-6">
        <q-input label="Frequency" :model-value="checksheet?.frequency || 'N/A'" outlined dense readonly />
      </div>
      <div class="col-lg-3 col-md-4 col-sm-6">
        <q-input label="Status" :model-value="currentStatus" outlined dense readonly />
      </div>
      <div class="col-lg-3 col-md-4 col-sm-6">
        <q-input label="Due Date" v-model="dueDate" outlined dense readonly>
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer" :disable="currentStatus?.toLowerCase() !== 'draft'">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale"
                :disable="currentStatus?.toLowerCase() !== 'draft'">
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

    <q-separator class="q-mb-md" />

    <div class="row">
      <div class="col-12 col-lg-9">
        <!-- Instruction -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-xs">Preservation Instruction</div>
          <q-input v-model="instruction" type="textarea" outlined dense autogrow rows="2"
            placeholder="Enter instruction..." :readonly="currentStatus?.toLowerCase() !== 'draft'" />
        </div>

        <q-table :rows="items" :columns="columns" row-key="id" :loading="loading" bordered flat
          table-header-style="background-color: #007bff; color: #fff; font-weight: bold" separator="cell"
          color="primary" square :rows-per-page-options="[0]" hide-pagination>
          <template v-slot:body-cell-remarks="props">
            <q-td :props="props">
              <q-input v-model="props.row.remarks" type="textarea" outlined dense autogrow
                :readonly="currentStatus?.toLowerCase() !== 'draft'" />
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-radio v-model="props.row.status" :val="0" label="Y" color="primary"
                :disable="currentStatus?.toLowerCase() !== 'draft'" />
              <q-radio v-model="props.row.status" :val="1" label="AR" color="negative"
                :disable="currentStatus?.toLowerCase() !== 'draft'" />
              <q-radio v-model="props.row.status" :val="2" label="N/A" color="grey"
                :disable="currentStatus?.toLowerCase() !== 'draft'" />
              <q-radio v-model="props.row.status" :val="3" label="H" color="amber"
                :disable="currentStatus?.toLowerCase() !== 'draft'" />
            </q-td>
          </template>
        </q-table>
        <div class="q-mt-md q-pa-sm rounded-borders">
          <div class="row items-center q-gutter-md">
            <span class="text-caption text-primary text-weight-medium">Status Legend:</span>
            <div class="row items-center q-gutter-sm">
              <q-badge color="primary" rounded class="q-pa-sm">
                <q-icon name="check_circle" size="xs" class="q-mr-xs" />
                Y - Yes
              </q-badge>
              <q-badge color="negative" rounded class="q-pa-sm">
                <q-icon name="warning" size="xs" class="q-mr-xs" />
                AR - Action Required
              </q-badge>
              <q-badge color="grey" rounded class="q-pa-sm">
                <q-icon name="remove_circle" size="xs" class="q-mr-xs" />
                N/A - Not Applicable
              </q-badge>
              <q-badge color="amber" rounded class="q-pa-sm">
                <q-icon name="pause_circle" size="xs" class="q-mr-xs" />
                H - Holding
              </q-badge>
            </div>
          </div>
        </div>

        <q-separator class="q-mb-md" />

        <!-- Workflow Process -->
        <ChecksheetWorkflowProcess ref="workflowRef" :checksheet-id="checksheet?.id ?? null"
          :initial-step="workflowStep" :initial-status="currentStatus" :current-round="checksheet?.current_round ?? 0"
          :items="items" :instruction="instruction" @status-changed="fetchChecksheetDetail"
          @step-changed="handleStepChanged" @close-dialog="router.back()" />

        <ChecksheetPhoto :checksheet-id="checksheet?.id ?? null" :disabled="currentStatus?.toLowerCase() !== 'draft'" />
      </div>
      <div class="col-12 col-lg-3 sidebar-col">
        <ChecksheetAssignTechnician ref="technicianRef" :checksheet-id="checksheet?.id ?? null"
          :initial-users="assignedTechnicians" @user-click="openUserInfoDialog"
          @updated="(users) => (assignedTechnicians = users)" />
        <ChecksheetAssignInspector ref="inspectorRef" :checksheet-id="checksheet?.id ?? null"
          :initial-users="assignedInspectors" @user-click="openUserInfoDialog"
          @updated="(users) => (assignedInspectors = users)" />
        <q-card flat bordered class="q-mb-md">
          <q-card-section class="bg-primary text-white">
            <div class="text-subtitle2">Comments</div>
          </q-card-section>
          <q-card-section>
            <ChecksheetComments commentable-type="App\\Models\\CheckSheet" :commentable-id="checksheet?.id ?? null"
              :disabled="currentStatus?.toLowerCase() !== 'draft'" v-bind="authStore.user?.id !== undefined ? { currentUserId: authStore.user.id } : {}
                " />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-separator class="q-mt-md" />

    <div class="row justify-end q-gutter-sm q-mt-md">
      <q-btn label="Print Checksheet" color="primary" flat @click="
        $q.notify({
          type: 'info',
          message: 'Print functionality not implemented yet.',
          position: 'bottom',
        })
        " />
      <q-btn label="Back to List" color="primary" flat @click="router.push('/checksheets')" />
    </div>

    <!-- Checksheet History Dialog -->
    <ChecksheetHistory v-model="showHistoryDialog" :checksheet-id="checksheet?.id ?? null" />

    <!-- Report Dialog -->
    <ChecksheetReport
      v-model="showReportDialog"
      :checksheet-id="checksheet?.id ?? null"
      :sheet-number="checksheet?.sheet_number ?? ''"
    />

    <!-- User Info Dialog -->
    <UserInfoDialog v-model="showUserInfoDialog" :user-id="selectedUserId" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
import ChecksheetReport from 'components/ChecksheetReport.vue';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();

interface Checksheet {
  id: number;
  equipment_id: number;
  sheet_number: string;
  activity_code: string;
  equipment_name?: string;
  equipment_tag_no?: string;
  current_round?: number;
  frequency?: string;
  status?: string;
  due_date?: string;
  instruction?: string | null;
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
  description: string | null;
  status: number;
  remarks: string | null;
  order: number;
}

const checksheet = ref<Checksheet | null>(null);
const items = ref<ChecksheetItem[]>([]);
const loading = ref(false);
const assignedTechnicians = ref<User[]>([]);
const assignedInspectors = ref<User[]>([]);
const showHistoryDialog = ref(false);
const showReportDialog = ref(false);
const showUserInfoDialog = ref(false);
const selectedUserId = ref<number | null>(null);
const dueDate = ref<string>('');
const instruction = ref<string>('');

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
    name: 'description',
    label: 'Description',
    field: 'description',
    sortable: false,
    align: 'left' as const,
    style: 'white-space: normal',
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    sortable: false,
    align: 'center' as const,
  },
  {
    name: 'remarks',
    label: 'Remarks',
    field: 'remarks',
    sortable: false,
    align: 'left' as const,
    style: 'min-width: 250px',
  },
];

const checksheetId = Number(route.params.id);

const fetchChecksheetDetail = async () => {
  if (!checksheetId) return;

  loading.value = true;

  console.log('Fetching checksheet detail for ID:', checksheetId);

  try {
    const response = await api.get(`/api/checksheets/${checksheetId}`);
    const data = response.data.check_sheet || response.data.data || response.data;

    checksheet.value = data;

    // Fetch checksheet items
    const itemsResponse = await api.get(`/api/checksheets/${checksheetId}/checksheet-items`);
    items.value = itemsResponse.data.check_sheet_items || [];

    // Load assigned technicians and inspectors
    assignedTechnicians.value = itemsResponse.data.technicians || data.technicians || [];
    assignedInspectors.value = itemsResponse.data.inspectors || data.inspectors || [];

    // Initialize fields
    dueDate.value = data.due_date || '';
    instruction.value = data.instruction || '';
    currentStatus.value = data.status || 'N/A';

    // Initialize workflow step based on status
    const status = data.status?.toLowerCase();
    if (status === 'accepted') {
      workflowStep.value = 4;
    } else if (status === 'approved') {
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
      message: err.response?.data?.message || 'Failed to load checksheet',
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
  if (!checksheet.value?.id) return;

  try {
    await api.put(`/api/checksheets/${checksheet.value.id}/updateDueDate`, {
      due_date: dueDate.value,
    });

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

onMounted(() => {
  void fetchChecksheetDetail();
});
</script>

<style scoped lang="scss">
.cursor-pointer {
  cursor: pointer;
}

.sidebar-col {
  @media (min-width: $breakpoint-lg-min) {
    padding-left: 16px;
  }
}
</style>
