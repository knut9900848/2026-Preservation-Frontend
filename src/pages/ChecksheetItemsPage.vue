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
          <div class="col-12 col-md-3">
            <q-input label="Project" model-value="" outlined dense readonly />
          </div>
          <!-- Equipment Name -->
          <div class="col-12 col-md-3">
            <q-input
              label="Equipment Name"
              :model-value="checksheet?.equipment?.name ?? 'N/A'"
              outlined
              dense
              readonly
            />
          </div>
          <!-- Activity Code -->
          <div class="col-12 col-md-3">
            <q-input
              label="Activity Code"
              :model-value="checksheet?.activity_code || 'N/A'"
              outlined
              dense
              readonly
            />
          </div>
          <!-- Tag Number -->
          <div class="col-12 col-md-3">
            <q-input
              label="Tag Number"
              :model-value="checksheet?.equipment?.tag_no ?? 'N/A'"
              outlined
              dense
              readonly
            />
          </div>
        </div>

        <q-separator class="q-ma-sm" />

        <div class="row q-col-gutter-md">
          <!-- Round -->
          <div class="col-12 col-md-3">
            <q-input
              label="Round"
              :model-value="checksheet?.current_round || 'N/A'"
              outlined
              dense
              readonly
            />
          </div>
          <!-- Frequency -->
          <div class="col-12 col-md-3">
            <q-input
              label="Frequency"
              :model-value="checksheet?.frequency || 'N/A'"
              outlined
              dense
              readonly
            />
          </div>
          <!-- Status -->
          <div class="col-12 col-md-3">
            <q-input label="Status" :model-value="currentStatus" outlined dense readonly />
          </div>
          <!-- Due Date -->
          <div class="col-12 col-md-3">
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
          <div class="col-12 col-md-9">
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
                    label="HD"
                    color="warning"
                    :disable="currentStatus?.toLowerCase() !== 'draft'"
                  />
                  <q-radio
                    v-model="props.row.status"
                    :val="3"
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
                  <q-badge color="warning" text-color="dark" rounded class="q-pa-sm">
                    <q-icon name="pause_circle" size="xs" class="q-mr-xs" />
                    HD - Holding
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
            <WorkflowProcess
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

            <div class="photo q-mt-md">
              <div class="text-h6 q-mb-md">Attachments</div>

              <!-- Upload Area -->
              <div class="q-mb-md">
                <q-file
                  v-model="uploadFiles"
                  outlined
                  dense
                  multiple
                  accept="image/*"
                  label="Select images to upload"
                  @update:model-value="handleFileSelect"
                >
                  <template v-slot:prepend>
                    <q-icon name="attach_file" />
                  </template>
                  <template v-slot:append>
                    <q-btn
                      flat
                      dense
                      icon="cloud_upload"
                      color="primary"
                      :disable="!uploadFiles || uploadFiles.length === 0"
                      @click="uploadPhotos"
                      :loading="uploading"
                    >
                      <q-tooltip>Upload</q-tooltip>
                    </q-btn>
                  </template>
                </q-file>
              </div>

              <!-- Photo Gallery -->
              <div v-if="photos.length > 0" class="row q-col-gutter-md">
                <div
                  v-for="photo in photos"
                  :key="photo.id"
                  class="col-12 col-sm-6 col-md-4 col-lg-3"
                >
                  <q-card flat bordered>
                    <q-img
                      :src="photo.url"
                      :ratio="4 / 3"
                      fit="cover"
                      class="cursor-pointer"
                      @click="openPhotoPreview(photo)"
                    >
                      <template v-slot:loading>
                        <q-spinner color="primary" size="50px" />
                      </template>
                    </q-img>
                    <q-card-section class="q-pa-sm">
                      <div class="text-caption text-grey-7">{{ photo.filename }}</div>
                      <div class="text-caption text-grey-6">{{ formatFileSize(photo.size) }}</div>
                    </q-card-section>
                    <q-card-actions align="right" class="q-pa-sm">
                      <q-btn
                        flat
                        dense
                        icon="download"
                        color="primary"
                        size="sm"
                        @click="downloadPhoto(photo)"
                      >
                        <q-tooltip>Download</q-tooltip>
                      </q-btn>
                      <q-btn
                        flat
                        dense
                        icon="delete"
                        color="negative"
                        size="sm"
                        @click="deletePhoto(photo)"
                      >
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
            <AssignTechnician
              ref="technicianRef"
              :checksheet-id="checksheet?.id ?? null"
              :initial-users="assignedTechnicians"
              @user-click="openUserInfoDialog"
              @updated="(users) => (assignedTechnicians = users)"
            />
            <AssignInspector
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

    <!-- Photo Preview Dialog -->
    <q-dialog v-model="showPhotoPreview">
      <q-card style="min-width: 600px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedPhoto?.filename }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-img
            v-if="selectedPhoto"
            :src="selectedPhoto.url"
            fit="contain"
            style="max-height: 70vh"
          >
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
import AssignTechnician from 'components/AssignTechnician.vue';
import AssignInspector from 'components/AssignInspector.vue';
import WorkflowProcess from 'components/WorkflowProcess.vue';

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

// Photo upload related
const photos = ref<Photo[]>([]);
const uploadFiles = ref<File[] | null>(null);
const uploading = ref(false);
const showPhotoPreview = ref(false);
const selectedPhoto = ref<Photo | null>(null);

// Workflow related
const workflowStep = ref<number>(1);
const currentStatus = ref<string>('N/A');
const workflowRef = ref<InstanceType<typeof WorkflowProcess> | null>(null);

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

const handleFileSelect = () => {
  // File selected
};

const uploadPhotos = async () => {
  if (!uploadFiles.value || uploadFiles.value.length === 0) return;
  if (!props.checksheet?.id) return;

  uploading.value = true;

  try {
    const formData = new FormData();
    uploadFiles.value.forEach((file) => {
      formData.append('photos[]', file);
    });

    const response = await api.post(`${getBaseApiUrl()}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.photos) {
      photos.value.push(...response.data.photos);
    }

    $q.notify({
      type: 'positive',
      message: `${uploadFiles.value.length} photo(s) uploaded successfully`,
      position: 'bottom',
    });

    uploadFiles.value = null;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to upload photos',
      position: 'bottom',
    });
  } finally {
    uploading.value = false;
  }
};

const openPhotoPreview = (photo: Photo) => {
  selectedPhoto.value = photo;
  showPhotoPreview.value = true;
};

const downloadPhoto = (photo: Photo) => {
  if (!photo) return;

  const link = document.createElement('a');
  link.href = photo.url;
  link.download = photo.filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  $q.notify({
    type: 'positive',
    message: 'Download started',
    position: 'bottom',
    timeout: 1000,
  });
};

const deletePhoto = (photo: Photo) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete "${photo.filename}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!props.checksheet?.id) return;

      try {
        await api.delete(`${getBaseApiUrl()}/photos/${photo.id}`);

        photos.value = photos.value.filter((p) => p.id !== photo.id);

        $q.notify({
          type: 'positive',
          message: 'Photo deleted successfully',
          position: 'bottom',
        });
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to delete photo',
          position: 'bottom',
        });
      }
    })();
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
