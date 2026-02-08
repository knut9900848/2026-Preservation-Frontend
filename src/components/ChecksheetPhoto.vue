<template>
  <div class="checksheet-photo q-mt-md">
    <div class="text-h6 q-mb-md">Attachments</div>

    <!-- Photo Groups -->
    <div class="q-gutter-md">
      <q-card
        v-for="(group, groupIndex) in photoGroups"
        :key="group.id || `new-${groupIndex}`"
        flat
        bordered
        class="q-pa-md"
      >
        <div class="row items-center q-mb-sm">
          <div class="text-subtitle2 text-grey-8">Photo Group {{ groupIndex + 1 }}</div>
          <q-space />
          <q-btn
            v-if="!disabled && photoGroups.length > 1"
            flat
            dense
            icon="delete"
            color="negative"
            size="sm"
            @click="removeGroup(groupIndex)"
          >
            <q-tooltip>Remove Group</q-tooltip>
          </q-btn>
        </div>

        <!-- File Upload -->
        <div class="q-mb-sm">
          <q-file
            v-if="!disabled"
            v-model="group.files"
            outlined
            dense
            multiple
            accept="image/*"
            :label="`Select images (${group.files.length} selected)`"
            @update:model-value="onFilesChanged(groupIndex)"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
            <template v-slot:append>
              <q-btn
                v-if="group.files.length > 0"
                flat
                dense
                icon="clear"
                size="sm"
                @click.stop="clearFiles(groupIndex)"
              >
                <q-tooltip>Clear</q-tooltip>
              </q-btn>
            </template>
          </q-file>
        </div>

        <!-- Description -->
        <div class="q-mb-sm">
          <q-input
            v-model="group.description"
            outlined
            dense
            label="Description for this group"
            placeholder="Enter description for these photos..."
            :readonly="disabled"
            @blur="updateGroupDescription(group)"
          />
        </div>

        <!-- Preview of selected files (before upload) -->
        <div v-if="group.files.length > 0" class="q-mb-sm">
          <div class="text-caption text-grey-6 q-mb-xs">Selected files:</div>
          <div class="row q-gutter-sm">
            <div v-for="(file, fileIndex) in group.files" :key="fileIndex" class="col-auto">
              <q-chip
                removable
                dense
                color="primary"
                text-color="white"
                @remove="removeFile(groupIndex, fileIndex)"
              >
                <q-icon name="image" size="xs" class="q-mr-xs" />
                {{ file.name }}
              </q-chip>
            </div>
          </div>
        </div>

        <!-- Uploaded Photos Gallery -->
        <div v-if="group.photos.length > 0" class="row q-col-gutter-sm">
          <div
            v-for="photo in group.photos"
            :key="photo.id"
            class="col-6 col-sm-4 col-md-3"
          >
            <q-card flat bordered class="photo-card">
              <q-img
                :src="getPhotoUrl(photo.url)"
                :ratio="1"
                fit="cover"
                class="cursor-pointer"
                @click="openPhotoPreview(photo)"
              >
                <template v-slot:loading>
                  <q-spinner color="primary" size="30px" />
                </template>
              </q-img>
              <q-card-actions class="q-pa-xs" align="right">
                <q-btn
                  flat
                  dense
                  icon="download"
                  color="primary"
                  size="xs"
                  @click="downloadPhoto(photo)"
                >
                  <q-tooltip>Download</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="!disabled"
                  flat
                  dense
                  icon="delete"
                  color="negative"
                  size="xs"
                  @click="deletePhoto(group, photo)"
                >
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </q-card-actions>
            </q-card>
          </div>
        </div>

        <!-- Empty state for group -->
        <div
          v-if="group.photos.length === 0 && group.files.length === 0"
          class="text-center q-pa-md text-grey-5"
        >
          <q-icon name="add_photo_alternate" size="32px" />
          <div class="text-caption">No photos in this group</div>
        </div>
      </q-card>
    </div>

    <!-- Action Buttons -->
    <div v-if="!disabled" class="row q-gutter-sm q-mt-md">
      <q-btn
        flat
        dense
        icon="add_circle"
        color="primary"
        label="Add Photo Group"
        @click="addGroup"
      />
      <q-btn
        flat
        dense
        icon="cloud_upload"
        color="positive"
        label="Upload All"
        :disable="!hasFilesToUpload"
        :loading="uploading"
        @click="uploadAllGroups"
      />
    </div>

    <!-- Empty State (no groups) -->
    <div
      v-if="photoGroups.length === 0"
      class="text-center q-pa-lg text-grey-6"
    >
      <q-icon name="photo_library" size="64px" color="grey-5" />
      <div class="text-body1 q-mt-md">No photo groups yet</div>
      <div class="text-caption">Add a photo group to attach images</div>
      <q-btn
        v-if="!disabled"
        flat
        color="primary"
        label="Add Photo Group"
        icon="add"
        class="q-mt-md"
        @click="addGroup"
      />
    </div>

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
            :src="getPhotoUrl(selectedPhoto.url)"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

interface Photo {
  id: number;
  filename: string;
  url: string;
  size: number;
  description?: string;
  uploaded_at?: string;
}

interface PhotoGroup {
  id?: number;
  files: File[];
  description: string;
  photos: Photo[];
}

interface Props {
  checksheetId: number | null;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  (e: 'updated'): void;
}>();

const $q = useQuasar();

const photoGroups = ref<PhotoGroup[]>([]);
const uploading = ref(false);
const showPhotoPreview = ref(false);
const selectedPhoto = ref<Photo | null>(null);

const hasFilesToUpload = computed(() => {
  return photoGroups.value.some((group) => group.files.length > 0);
});

const API_BASE_URL = 'http://preservation.test';

const getBaseApiUrl = () => `/api/checksheets/${props.checksheetId}`;

const getPhotoUrl = (url: string) => {
  if (!url) return '';
  // If already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Prepend API base URL for relative paths
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const addGroup = () => {
  photoGroups.value.push({
    files: [],
    description: '',
    photos: [],
  });
};

const removeGroup = (index: number) => {
  const group = photoGroups.value[index];
  if (!group) return;

  // If group has saved photos, confirm deletion
  if (group.photos.length > 0) {
    $q.dialog({
      title: 'Confirm Delete',
      message: `This group contains ${group.photos.length} photo(s). Are you sure you want to delete this group and all its photos?`,
      cancel: true,
      persistent: true,
    }).onOk(() => {
      void deleteGroupFromServer(group, index);
    });
  } else {
    photoGroups.value.splice(index, 1);
  }
};

const deleteGroupFromServer = async (group: PhotoGroup, index: number) => {
  if (!props.checksheetId || !group.id) {
    photoGroups.value.splice(index, 1);
    return;
  }

  try {
    await api.delete(`${getBaseApiUrl()}/photo-groups/${group.id}`);
    photoGroups.value.splice(index, 1);

    $q.notify({
      type: 'positive',
      message: 'Photo group deleted successfully',
      position: 'bottom',
    });

    emit('updated');
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to delete photo group',
      position: 'bottom',
    });
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onFilesChanged = (_groupIndex: number) => {
  // Optional: auto-preview or validation
};

const clearFiles = (groupIndex: number) => {
  const group = photoGroups.value[groupIndex];
  if (group) {
    group.files = [];
  }
};

const removeFile = (groupIndex: number, fileIndex: number) => {
  const group = photoGroups.value[groupIndex];
  if (group) {
    group.files.splice(fileIndex, 1);
  }
};

const fetchPhotoGroups = async () => {
  if (!props.checksheetId) return;

  try {
    const response = await api.get(`${getBaseApiUrl()}/photo-groups`);
    const groups = response.data.photo_groups || [];

    photoGroups.value = groups.map((group: { id: number; description: string; photos: Photo[] }) => ({
      id: group.id,
      files: [],
      description: group.description || '',
      photos: group.photos || [],
    }));

    // If no groups exist, add an empty one for convenience
    if (photoGroups.value.length === 0) {
      addGroup();
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load photo groups',
      position: 'bottom',
    });

    // Add empty group on error
    if (photoGroups.value.length === 0) {
      addGroup();
    }
  }
};

const uploadAllGroups = async () => {
  if (!props.checksheetId) return;

  const groupsWithFiles = photoGroups.value.filter((group) => group.files.length > 0);
  if (groupsWithFiles.length === 0) return;

  uploading.value = true;

  try {
    for (const group of photoGroups.value) {
      if (group.files.length === 0) continue;

      const formData = new FormData();
      group.files.forEach((file) => {
        formData.append('photos[]', file);
      });
      formData.append('description', group.description);

      if (group.id) {
        // Update existing group
        formData.append('group_id', group.id.toString());
      }

      const response = await api.post(`${getBaseApiUrl()}/photo-groups`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update group with server response
      if (response.data.photo_group) {
        group.id = response.data.photo_group.id;
        group.photos = response.data.photo_group.photos || [];
        group.files = []; // Clear uploaded files
      }
    }

    $q.notify({
      type: 'positive',
      message: 'All photos uploaded successfully',
      position: 'bottom',
    });

    emit('updated');
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

const updateGroupDescription = async (group: PhotoGroup) => {
  if (!props.checksheetId || !group.id || props.disabled) return;

  try {
    await api.put(`${getBaseApiUrl()}/photo-groups/${group.id}`, {
      description: group.description,
    });

    emit('updated');
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to update description',
      position: 'bottom',
    });
  }
};

const openPhotoPreview = (photo: Photo) => {
  selectedPhoto.value = photo;
  showPhotoPreview.value = true;
};

const downloadPhoto = (photo: Photo) => {
  if (!photo) return;

  const link = document.createElement('a');
  link.href = getPhotoUrl(photo.url);
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

const deletePhoto = (group: PhotoGroup, photo: Photo) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete "${photo.filename}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!props.checksheetId || !group.id) return;

      try {
        await api.delete(`${getBaseApiUrl()}/photo-groups/${group.id}/photos/${photo.id}`);

        group.photos = group.photos.filter((p) => p.id !== photo.id);

        $q.notify({
          type: 'positive',
          message: 'Photo deleted successfully',
          position: 'bottom',
        });

        emit('updated');
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

watch(
  () => props.checksheetId,
  (newId) => {
    if (newId) {
      void fetchPhotoGroups();
    }
  },
  { immediate: true },
);

defineExpose({
  fetchPhotoGroups,
  photoGroups,
});
</script>

<style scoped lang="scss">
.cursor-pointer {
  cursor: pointer;
}

.photo-card {
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.02);
  }
}
</style>
