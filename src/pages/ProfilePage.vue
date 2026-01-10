<template>
  <q-page padding>
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <q-card>
          <q-card-section>
            <div class="text-h5">Profile</div>
          </q-card-section>

          <q-separator />

          <!-- Avatar Section -->
          <q-card-section>
            <div class="row items-center q-gutter-md">
              <q-avatar size="100px">
                <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" />
                <q-icon v-else name="account_circle" size="100px" />
              </q-avatar>
              <div class="column q-gutter-sm">
                <q-btn outline color="primary" @click="avatarInput?.click()">
                  Change Avatar
                </q-btn>
                <q-btn v-if="authStore.user?.avatar" outline color="negative" @click="deleteAvatar">
                  Delete Avatar
                </q-btn>
                <input ref="avatarInput" type="file" accept="image/*" style="display: none"
                  @change="handleAvatarChange" />
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <!-- User Info Section -->
          <q-card-section>
            <q-form @submit="updateProfile" class="q-gutter-md">
              <q-input v-model="profileForm.name" label="Name" outlined :rules="[(val) => !!val || 'Name is required']">
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>

              <q-input v-model="profileForm.email" type="email" label="Email" outlined :rules="[
                (val) => !!val || 'Email is required',
                (val) => /.+@.+\..+/.test(val) || 'Invalid email format',
              ]">
                <template v-slot:prepend>
                  <q-icon name="email" />
                </template>
              </q-input>

              <q-input v-model="profileForm.phone" label="Phone" outlined>
                <template v-slot:prepend>
                  <q-icon name="phone" />
                </template>
              </q-input>

              <q-input v-model="profileForm.date_of_birth" label="Date of Birth" type="date" outlined>
                <template v-slot:prepend>
                  <q-icon name="cake" />
                </template>
              </q-input>

              <q-input v-model="profileForm.job_start_date" label="Job Start Date" type="date" outlined>
                <template v-slot:prepend>
                  <q-icon name="work" />
                </template>
              </q-input>

              <q-input v-model="profileForm.job_end_date" label="Job End Date" type="date" outlined>
                <template v-slot:prepend>
                  <q-icon name="work_off" />
                </template>
              </q-input>

              <div class="row q-gutter-sm">
                <q-btn label="Update Profile" type="submit" color="primary" :loading="profileLoading" />
                <q-btn label="Cancel" flat @click="resetProfileForm" />
              </div>
            </q-form>
          </q-card-section>

          <q-separator />

          <!-- Change Password Section -->
          <q-card-section>
            <div class="text-h6 q-mb-md">Change Password</div>
            <q-form @submit="changePassword" class="q-gutter-md">
              <q-input v-model="passwordForm.current_password" :type="showCurrentPwd ? 'text' : 'password'"
                label="Current Password" outlined autocomplete="current-password"
                :rules="[(val) => !!val || 'Current password is required']">
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
                <template v-slot:append>
                  <q-icon :name="showCurrentPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                    @click="showCurrentPwd = !showCurrentPwd" />
                </template>
              </q-input>

              <q-input v-model="passwordForm.new_password" :type="showNewPwd ? 'text' : 'password'" label="New Password"
                outlined autocomplete="new-password" :rules="[
                  (val) => !!val || 'New password is required',
                  (val) => val.length >= 8 || 'Password must be at least 8 characters',
                ]">
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
                <template v-slot:append>
                  <q-icon :name="showNewPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                    @click="showNewPwd = !showNewPwd" />
                </template>
              </q-input>

              <q-input v-model="passwordForm.new_password_confirmation" :type="showConfirmPwd ? 'text' : 'password'"
                label="Confirm New Password" outlined autocomplete="new-password" :rules="[
                  (val) => !!val || 'Please confirm your password',
                  (val) => val === passwordForm.new_password || 'Passwords do not match',
                ]">
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
                <template v-slot:append>
                  <q-icon :name="showConfirmPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                    @click="showConfirmPwd = !showConfirmPwd" />
                </template>
              </q-input>

              <div class="row q-gutter-sm">
                <q-btn label="Change Password" type="submit" color="primary" :loading="passwordLoading" />
                <q-btn label="Cancel" flat @click="resetPasswordForm" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { api } from 'boot/axios';

const $q = useQuasar();
const authStore = useAuthStore();

const avatarInput = ref<HTMLInputElement | null>(null);
const profileLoading = ref(false);
const passwordLoading = ref(false);

const showCurrentPwd = ref(false);
const showNewPwd = ref(false);
const showConfirmPwd = ref(false);

const profileForm = reactive({
  name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  job_start_date: '',
  job_end_date: '',
});

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
});

const loadProfile = () => {
  if (authStore.user) {
    profileForm.name = authStore.user.name;
    profileForm.email = authStore.user.email;
    profileForm.phone = authStore.user.phone || '';
    profileForm.date_of_birth = authStore.user.date_of_birth || '';
    profileForm.job_start_date = authStore.user.job_start_date || '';
    profileForm.job_end_date = authStore.user.job_end_date || '';

    console.log('Profile loaded:', profileForm);
  }
};

const resetProfileForm = () => {
  loadProfile();
};

const resetPasswordForm = () => {
  passwordForm.current_password = '';
  passwordForm.new_password = '';
  passwordForm.new_password_confirmation = '';
};

const handleAvatarChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    $q.notify({
      type: 'negative',
      message: 'Please select an image file',
      position: 'bottom',
    });
    return;
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    $q.notify({
      type: 'negative',
      message: 'Image size must be less than 2MB',
      position: 'bottom',
    });
    return;
  }

  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/api/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.user) {
      authStore.setUser(response.data.user);
      $q.notify({
        type: 'positive',
        message: 'Avatar updated successfully',
        position: 'bottom',
      });
    }
  } catch (error: unknown) {
    let errorMessage = 'Failed to update avatar';

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'bottom',
    });
  }
};

const deleteAvatar = () => {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to delete your avatar?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        const response = await api.delete('/api/profile/avatar');

        if (response.data.user) {
          authStore.setUser(response.data.user);
          $q.notify({
            type: 'positive',
            message: 'Avatar deleted successfully',
            position: 'bottom',
          });
        }
      } catch (error: unknown) {
        let errorMessage = 'Failed to delete avatar';

        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as {
            response?: {
              data?: {
                message?: string;
              };
            };
          };

          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
          }
        }

        $q.notify({
          type: 'negative',
          message: errorMessage,
          position: 'bottom',
        });
      }
    })();
  });
};

const updateProfile = async () => {
  profileLoading.value = true;

  try {
    const response = await api.put('/api/profile', {
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      date_of_birth: profileForm.date_of_birth,
      job_start_date: profileForm.job_start_date,
      job_end_date: profileForm.job_end_date,
    });

    if (response.data.user) {
      authStore.setUser(response.data.user);
      $q.notify({
        type: 'positive',
        message: 'Profile updated successfully',
        position: 'bottom',
      });
    }
  } catch (error: unknown) {
    let errorMessage = 'Failed to update profile';

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'bottom',
    });
  } finally {
    profileLoading.value = false;
  }
};

const changePassword = async () => {
  passwordLoading.value = true;

  try {
    await api.put('/api/profile/password', {
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
      new_password_confirmation: passwordForm.new_password_confirmation,
    });

    $q.notify({
      type: 'positive',
      message: 'Password changed successfully',
      position: 'bottom',
    });

    resetPasswordForm();
  } catch (error: unknown) {
    let errorMessage = 'Failed to change password';

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'bottom',
    });
  } finally {
    passwordLoading.value = false;
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<style scoped lang="scss"></style>
