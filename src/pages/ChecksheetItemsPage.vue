<template>
  <q-dialog v-model="showDialog" maximized>
    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">Checksheet Number - {{ checksheet?.sheet_number }}</div>
        <q-btn label="Generate Report" color="primary" flat class="q-ml-md" @click="generateReport">
        </q-btn>
        <q-btn label="History" color="info" flat class="q-ml-sm" icon="history" @click="showHistoryDialog = true">
        </q-btn>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-md">
        <!-- Checksheet Information Grid -->
        <div class="row q-col-gutter-md">
          <!-- Project -->
          <div class="col-12 col-md-3">
            <q-input label="Project" model-value="" outlined dense readonly />
          </div>
          <!-- Equipment Name -->
          <div class="col-12 col-md-3">
            <q-input label="Equipment Name" :model-value="checksheet?.equipment?.name || 'N/A'" outlined dense
              readonly />
          </div>
          <!-- Activity Code -->
          <div class="col-12 col-md-3">
            <q-input label="Activity Code" :model-value="checksheet?.activity_code || 'N/A'" outlined dense readonly />
          </div>
          <!-- Tag Number -->
          <div class="col-12 col-md-3">
            <q-input label="Tag Number" :model-value="checksheet?.equipment?.tag_no || 'N/A'" outlined dense readonly />
          </div>
        </div>

        <q-separator class="q-ma-sm" />

        <div class="row q-col-gutter-md">
          <!-- Round -->
          <div class="col-12 col-md-3">
            <q-input label="Round" :model-value="checksheet?.current_round || 'N/A'" outlined dense readonly />
          </div>
          <!-- Frequency -->
          <div class="col-12 col-md-3">
            <q-input label="Frequency" :model-value="checksheet?.frequency || 'N/A'" outlined dense readonly />
          </div>
          <!-- Status -->
          <div class="col-12 col-md-3">
            <q-input label="Status" :model-value="currentStatus" outlined dense readonly />
          </div>
          <!-- Due Date -->
          <div class="col-12 col-md-3">
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
      </q-card-section>

      <q-separator class="q-mb-md" />

      <q-card-section>
        <div class="row">
          <div class="col-12 col-md-9">
            <q-table :rows="items" :columns="columns" row-key="id" :loading="loading" bordered flat
              table-header-style="background-color: #007bff; color: #fff; font-weight: bold" separator="cell"
              color="primary" square :rows-per-page-options="[0]" hide-pagination>
              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <q-radio v-model="props.row.status" :val="0" label="OK" color="primary"
                    :disable="currentStatus?.toLowerCase() !== 'draft'" />
                  <q-radio v-model="props.row.status" :val="1" label="AR" color="negative"
                    :disable="currentStatus?.toLowerCase() !== 'draft'" />
                  <q-radio v-model="props.row.status" :val="2" label="HD" color="warning"
                    :disable="currentStatus?.toLowerCase() !== 'draft'" />
                  <q-radio v-model="props.row.status" :val="3" label="N/A" color="grey"
                    :disable="currentStatus?.toLowerCase() !== 'draft'" />
                </q-td>
              </template>
            </q-table>
            <div class="text-caption text-grey-6 text-right q-mt-sm">
              Status Legend: OK - Okay, AR - Action Required, HD - Holding, N/A - Not Applicable
            </div>

            <q-separator class="q-mb-md" />

            <!-- Workflow Process -->
            <q-card flat bordered>
              <q-card-section>
                <q-stepper v-model="workflowStep" ref="stepper" color="primary" flat>
                  <q-step :name="1" title="Draft" icon="edit" :done="workflowStep > 1">
                    <div class="text-body2">The checksheet is in draft status. Complete the checksheet to proceed.</div>
                    <q-stepper-navigation>
                      <q-btn @click="completeChecksheet" color="primary" label="Complete" />
                    </q-stepper-navigation>
                  </q-step>

                  <q-step :name="2" title="Completed" icon="check_circle" :done="workflowStep > 2">
                    <div class="text-body2">The checksheet has been completed. Review and approve or reject.</div>
                    <q-stepper-navigation>
                      <q-btn @click="reviewChecksheet(true)" color="primary" label="Pass" class="q-mr-sm" />
                      <q-btn @click="rejectChecksheet" color="negative" label="Reject" />
                    </q-stepper-navigation>
                  </q-step>

                  <q-step :name="3" title="Reviewed" icon="rate_review" :done="workflowStep > 3">
                    <div class="text-body2">The checksheet has been reviewed. Final approval required.</div>
                    <q-stepper-navigation>
                      <q-btn @click="approveChecksheet" color="positive" label="Approve" class="q-mr-sm" />
                      <q-btn @click="rejectChecksheet" color="negative" label="Reject" />
                    </q-stepper-navigation>
                  </q-step>

                  <q-step :name="4" title="Approved" icon="verified" :done="workflowStep === 4">
                    <div class="text-body2">The checksheet has been approved. No further action required.</div>
                    <q-stepper-navigation>
                      <q-btn @click="generateNextRound" color="primary" label="Generate Next Round" icon="add_circle" />
                    </q-stepper-navigation>
                  </q-step>
                </q-stepper>
              </q-card-section>
            </q-card>

            <div class="photo q-mt-md">
              <div class="text-h6 q-mb-md">Attachments</div>

              <!-- Upload Area -->
              <div class="q-mb-md">
                <q-file v-model="uploadFiles" outlined dense multiple accept="image/*" label="Select images to upload"
                  @update:model-value="handleFileSelect">
                  <template v-slot:prepend>
                    <q-icon name="attach_file" />
                  </template>
                  <template v-slot:append>
                    <q-btn flat dense icon="cloud_upload" color="primary"
                      :disable="!uploadFiles || uploadFiles.length === 0" @click="uploadPhotos" :loading="uploading">
                      <q-tooltip>Upload</q-tooltip>
                    </q-btn>
                  </template>
                </q-file>
              </div>

              <!-- Photo Gallery -->
              <div v-if="photos.length > 0" class="row q-col-gutter-md">
                <div v-for="photo in photos" :key="photo.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
                  <q-card flat bordered>
                    <q-img :src="photo.url" :ratio="4 / 3" fit="cover" class="cursor-pointer"
                      @click="openPhotoPreview(photo)">
                      <template v-slot:loading>
                        <q-spinner color="primary" size="50px" />
                      </template>
                    </q-img>
                    <q-card-section class="q-pa-sm">
                      <div class="text-caption text-grey-7">{{ photo.filename }}</div>
                      <div class="text-caption text-grey-6">{{ formatFileSize(photo.size) }}</div>
                    </q-card-section>
                    <q-card-actions align="right" class="q-pa-sm">
                      <q-btn flat dense icon="download" color="primary" size="sm" @click="downloadPhoto(photo)">
                        <q-tooltip>Download</q-tooltip>
                      </q-btn>
                      <q-btn flat dense icon="delete" color="negative" size="sm" @click="deletePhoto(photo)">
                        <q-tooltip>Delete</q-tooltip>
                      </q-btn>
                    </q-card-actions>
                  </q-card>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center q-pa-lg text-grey-6">
                <q-icon name="photo_library" size="64px" color="grey-5" />
                <div class="text-body1 q-mt-md">No photos uploaded yet</div>
                <div class="text-caption">Upload images to attach them to this checksheet</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-3 q-pl-md">
            <q-card flat bordered class="q-mb-md">
              <q-card-section class="bg-primary text-white row items-center">
                <div class="text-subtitle2">Assign Technicians</div>
                <q-space />
                <q-btn icon="person_add" flat round dense @click="openAssignTechniciansDialog">
                  <q-tooltip>Assign Technicians</q-tooltip>
                </q-btn>
              </q-card-section>
              <q-card-section>
                <div v-if="assignedTechnicians.length === 0" class="text-grey-6">No technicians assigned</div>
                <q-chip v-else v-for="user in assignedTechnicians" :key="user.id" removable
                  @remove="removeTechnician(user.id)" @click="openUserInfoDialog(user.id)" color="primary"
                  text-color="white" icon="person" clickable>
                  {{ user.name }}
                </q-chip>
              </q-card-section>
            </q-card>
            <q-card flat bordered class="q-mb-md">
              <q-card-section class="bg-primary text-white row items-center">
                <div class="text-subtitle2">Assign Inspectors</div>
                <q-space />
                <q-btn icon="person_add" flat round dense @click="openAssignInspectorsDialog">
                  <q-tooltip>Assign Inspectors</q-tooltip>
                </q-btn>
              </q-card-section>
              <q-card-section>
                <div v-if="assignedInspectors.length === 0" class="text-grey-6">No inspectors assigned</div>
                <q-chip v-else v-for="user in assignedInspectors" :key="user.id" removable
                  @remove="removeInspector(user.id)" @click="openUserInfoDialog(user.id)" color="secondary"
                  text-color="white" icon="person" clickable>
                  {{ user.name }}
                </q-chip>
              </q-card-section>
            </q-card>
            <q-card flat bordered class="q-mb-md">
              <q-card-section class="bg-primary text-white">
                <div class="text-subtitle2">Comments</div>
              </q-card-section>
              <q-card-section>
                <ChecksheetComments commentable-type="App\\Models\\CheckSheet" :commentable-id="checksheet?.id ?? null"
                  :disabled="currentStatus?.toLowerCase() !== 'draft'"
                  v-bind="authStore.user?.id !== undefined ? { currentUserId: authStore.user.id } : {}" />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="row justify-end q-gutter-sm">
        <q-btn label="Print Checksheet" color="primary" flat
          @click="$q.notify({ type: 'info', message: 'Print functionality not implemented yet.', position: 'bottom' })" />
        <q-btn label="Close" color="primary" flat v-close-popup />
      </q-card-section>
    </q-card>

    <!-- Assign Technicians Dialog -->
    <q-dialog v-model="showAssignTechniciansDialog" persistent>
      <q-card style="min-width: 600px; max-height: 80vh">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Assign Technicians to Checksheet</div>
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

          <div v-if="loadingTechnicianUsers" class="text-center q-pa-md">
            <q-spinner color="primary" size="3em" />
          </div>

          <q-list v-else bordered separator>
            <q-item v-for="user in filteredTechnicianUsers" :key="user.id" tag="label" clickable>
              <q-item-section avatar>
                <q-checkbox v-model="selectedTechnicians" :val="user.id" />
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
            <q-btn label="Assign Technicians" color="primary" :loading="savingTechnicians" @click="assignTechnicians" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Assign Inspectors Dialog -->
    <q-dialog v-model="showAssignInspectorsDialog" persistent>
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

          <div v-if="loadingInspectorUsers" class="text-center q-pa-md">
            <q-spinner color="primary" size="3em" />
          </div>

          <q-list v-else bordered separator>
            <q-item v-for="user in filteredInspectorUsers" :key="user.id" tag="label" clickable>
              <q-item-section avatar>
                <q-checkbox v-model="selectedInspectors" :val="user.id" />
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
            <q-btn label="Assign Inspectors" color="primary" :loading="savingInspectors" @click="assignInspectors" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Photo Preview Dialog -->
    <q-dialog v-model="showPhotoPreview">
      <q-card style="min-width: 600px; max-width: 90vw;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedPhoto?.filename }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-img v-if="selectedPhoto" :src="selectedPhoto.url" fit="contain" style="max-height: 70vh;">
            <template v-slot:loading>
              <q-spinner color="primary" size="50px" />
            </template>
          </q-img>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="Download" color="primary" flat @click="downloadPhoto(selectedPhoto!)" />
          <q-btn label="Close" color="grey" flat v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Checksheet History Dialog -->
    <ChecksheetHistory v-model="showHistoryDialog" :equipment-id="checksheet?.equipment_id ?? null"
      :checksheet-id="checksheet?.id ?? null" />

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

const authStore = useAuthStore();

interface Equipment {
  id: number;
  name: string;
  tag_no: string;
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

interface Photo {
  id: number;
  filename: string;
  url: string;
  size: number;
  uploaded_at?: string;
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

const items = ref<ChecksheetItem[]>([]);
const loading = ref(false);
const assignedTechnicians = ref<User[]>([]);
const assignedInspectors = ref<User[]>([]);
const technicianUsers = ref<User[]>([]);
const inspectorUsers = ref<User[]>([]);
const loadingTechnicianUsers = ref(false);
const loadingInspectorUsers = ref(false);
const savingTechnicians = ref(false);
const savingInspectors = ref(false);
const showAssignTechniciansDialog = ref(false);
const showAssignInspectorsDialog = ref(false);
const showHistoryDialog = ref(false);
const showUserInfoDialog = ref(false);
const selectedUserId = ref<number | null>(null);
const userFilter = ref('');
const selectedTechnicians = ref<number[]>([]);
const selectedInspectors = ref<number[]>([]);
const dueDate = ref<string>('');

// Photo upload related
const photos = ref<Photo[]>([]);
const uploadFiles = ref<File[] | null>(null);
const uploading = ref(false);
const showPhotoPreview = ref(false);
const selectedPhoto = ref<Photo | null>(null);

// Workflow related
const workflowStep = ref<number>(1);
const currentStatus = ref<string>('N/A');

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

const filteredTechnicianUsers = computed(() => {
  if (!userFilter.value) return technicianUsers.value;
  const search = userFilter.value.toLowerCase();
  return technicianUsers.value.filter((u: User) =>
    u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
  );
});

const filteredInspectorUsers = computed(() => {
  if (!userFilter.value) return inspectorUsers.value;
  const search = userFilter.value.toLowerCase();
  return inspectorUsers.value.filter((u: User) =>
    u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
  );
});

const fetchChecksheetItems = async () => {
  if (!props.checksheet?.id) return;

  loading.value = true;

  try {
    const response = await api.get(`/api/checksheets/${props.checksheet.id}/checksheet-items`);

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

const fetchTechnicianUsers = async () => {
  loadingTechnicianUsers.value = true;

  try {
    const response = await api.get('/api/checksheets/users-by-role', {
      params: { role: 'technician' }
    });
    technicianUsers.value = response.data.users || [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load technician users',
      position: 'bottom',
    });
  } finally {
    loadingTechnicianUsers.value = false;
  }
};

const fetchInspectorUsers = async () => {
  loadingInspectorUsers.value = true;

  try {
    const response = await api.get('/api/checksheets/users-by-role', {
      params: { role: 'inspector' }
    });
    inspectorUsers.value = response.data.users || response.data.data || [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load inspector users',
      position: 'bottom',
    });
  } finally {
    loadingInspectorUsers.value = false;
  }
};

const openAssignTechniciansDialog = async () => {
  userFilter.value = '';

  if (technicianUsers.value.length === 0) {
    await fetchTechnicianUsers();
  }

  selectedTechnicians.value = assignedTechnicians.value.map((u) => u.id);
  showAssignTechniciansDialog.value = true;
};

const assignTechnicians = async () => {
  if (!props.checksheet?.id) return;

  savingTechnicians.value = true;

  try {
    const response = await api.post(`/api/checksheets/${props.checksheet.id}/assign-technicians`, {
      technicians: selectedTechnicians.value,
    });

    if (response.data.technicians) {
      assignedTechnicians.value = response.data.technicians;
    }

    $q.notify({
      type: 'positive',
      message: 'Technicians assigned successfully',
      position: 'bottom',
    });

    showAssignTechniciansDialog.value = false;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to assign technicians',
      position: 'bottom',
    });
  } finally {
    savingTechnicians.value = false;
  }
};

const removeTechnician = (userId: number) => {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to remove this technician from the checksheet?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!props.checksheet?.id) return;

      try {
        const response = await api.post(`/api/checksheets/${props.checksheet.id}/revoke-technicians`, {
          technicians: [userId],
        });

        if (response.data.technicians) {
          assignedTechnicians.value = response.data.technicians;
        }

        $q.notify({
          type: 'positive',
          message: 'Technician removed successfully',
          position: 'bottom',
        });
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to remove technician',
          position: 'bottom',
        });
      }
    })();
  });
};

const openUserInfoDialog = (userId: number) => {
  selectedUserId.value = userId;
  showUserInfoDialog.value = true;
};

const openAssignInspectorsDialog = async () => {
  userFilter.value = '';

  if (inspectorUsers.value.length === 0) {
    await fetchInspectorUsers();
  }

  selectedInspectors.value = assignedInspectors.value.map((u) => u.id);
  showAssignInspectorsDialog.value = true;
};

const assignInspectors = async () => {
  if (!props.checksheet?.id) return;

  savingInspectors.value = true;

  try {
    const response = await api.post(`/api/checksheets/${props.checksheet.id}/assign-inspectors`, {
      inspectors: selectedInspectors.value,
    });

    if (response.data.inspectors) {
      assignedInspectors.value = response.data.inspectors;
    }

    $q.notify({
      type: 'positive',
      message: 'Inspectors assigned successfully',
      position: 'bottom',
    });

    showAssignInspectorsDialog.value = false;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to assign inspectors',
      position: 'bottom',
    });
  } finally {
    savingInspectors.value = false;
  }
};

const removeInspector = (userId: number) => {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to remove this inspector from the checksheet?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!props.checksheet?.id) return;

      try {
        const response = await api.post(`/api/checksheets/${props.checksheet.id}/revoke-inspectors`, {
          inspectors: [userId],
        });

        if (response.data.inspectors) {
          assignedInspectors.value = response.data.inspectors;
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

const updateDueDate = async () => {
  if (!props.checksheet?.id) return;

  try {
    await api.put(`/api/checksheets/${props.checksheet.id}/updateDueDate`, {
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

const generateReport = () => {
  $q.notify({
    type: 'info',
    message: 'Generate report functionality not implemented yet',
    position: 'bottom',
  });
};

const handleFileSelect = () => {
  // File selected
};

const uploadPhotos = () => {
  $q.notify({
    type: 'info',
    message: 'Photo upload functionality not implemented yet',
    position: 'bottom',
  });
};

const openPhotoPreview = (photo: Photo) => {
  selectedPhoto.value = photo;
  showPhotoPreview.value = true;
};

const downloadPhoto = (photo: Photo) => {
  window.open(photo.url, '_blank');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const deletePhoto = (_photo: Photo) => {
  $q.notify({
    type: 'info',
    message: 'Photo delete functionality not implemented yet',
    position: 'bottom',
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const completeChecksheet = async () => {
  if (!props.checksheet?.id) return;

  try {
    await api.put(`/api/checksheets/${props.checksheet.id}/complete`, {
      status: 'completed',
      checksheet_items: items.value.map((item) => ({
        id: item.id,
        status: item.status,
        remarks: item.remarks,
      })),
    });

    workflowStep.value = 2;
    currentStatus.value = 'Completed';

    emit('statusChanged');

    $q.notify({
      type: 'positive',
      message: 'Checksheet completed successfully',
      position: 'bottom',
    });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to complete checksheet',
      position: 'bottom',
    });
  }
};

const reviewChecksheet = async (approve: boolean) => {
  if (!props.checksheet?.id) return;

  try {
    await api.put(`/api/checksheets/${props.checksheet.id}/review`, {
      status: approve ? 'reviewed' : 'draft',
    });

    workflowStep.value = approve ? 3 : 1;
    currentStatus.value = approve ? 'Reviewed' : 'Draft';

    emit('statusChanged');

    $q.notify({
      type: 'positive',
      message: approve ? 'Checksheet reviewed successfully' : 'Checksheet rejected to draft',
      position: 'bottom',
    });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to review checksheet',
      position: 'bottom',
    });
  }
};

const approveChecksheet = async () => {
  if (!props.checksheet?.id) return;

  try {
    await api.put(`/api/checksheets/${props.checksheet.id}/approve`, {
      status: 'approved',
    });

    workflowStep.value = 4;
    currentStatus.value = 'Approved';

    emit('statusChanged');

    $q.notify({
      type: 'positive',
      message: 'Checksheet approved successfully',
      position: 'bottom',
    });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to approve checksheet',
      position: 'bottom',
    });
  }
};

const rejectChecksheet = () => {
  if (!props.checksheet?.id) return;

  $q.dialog({
    title: 'Confirm Rejection',
    message: 'Are you sure you want to reject this checksheet? It will be reset to draft status.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!props.checksheet?.id) return;

      try {
        await api.put(`/api/checksheets/${props.checksheet.id}/reject`, {
          status: 'draft',
        });

        workflowStep.value = 1;
        currentStatus.value = 'Draft';

        emit('statusChanged');

        $q.notify({
          type: 'warning',
          message: 'Checksheet rejected and reset to draft',
          position: 'bottom',
        });
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to reject checksheet',
          position: 'bottom',
        });
      }
    })();
  });
};

const generateNextRound = () => {
  if (!props.checksheet?.id) return;

  if (currentStatus.value?.toLowerCase() !== 'approved') {
    $q.notify({
      type: 'warning',
      message: 'Only approved checksheets can generate next round',
      position: 'bottom',
    });
    return;
  }

  $q.dialog({
    title: 'Confirm Next Round Generation',
    message: `Are you sure you want to generate the next round checksheet? This will create Round ${(props.checksheet.current_round || 0) + 1}.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!props.checksheet?.id) return;

      try {
        const response = await api.post(`/api/checksheets/${props.checksheet.id}/generate-next-round`);

        $q.notify({
          type: 'positive',
          message: `Next round checksheet (Round ${response.data.new_round}) generated successfully`,
          position: 'bottom',
        });

        emit('statusChanged');
        showDialog.value = false;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to generate next round',
          position: 'bottom',
        });
      }
    })();
  });
};

watch(
  () => props.checksheet,
  (newChecksheet) => {
    if (newChecksheet && props.modelValue) {
      void fetchChecksheetItems();
    }
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && props.checksheet) {
      void fetchChecksheetItems();
    }
  }
);
</script>

<style scoped lang="scss">
.cursor-pointer {
  cursor: pointer;
}
</style>
