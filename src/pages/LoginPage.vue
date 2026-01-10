<template>
  <div class="login-page flex flex-center" style="min-height: 100vh">
    <q-card class="login-card q-pa-md" :style="{ background: cardBackground }">
      <q-card-section>
        <div class="row items-center justify-center q-mb-md">
          <img src="../assets/logo_c.png" alt="IES Logo" class="login-logo" />
          <div class="q-ml-lg q-mt-sm text-left">
            <div class="text-h7 text-weight-bold">PRESERVATION</div>
            <div class="text-h7 text-weight-bold">MANAGEMENT SYSTEM</div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input v-model="email" type="email" label="Email" outlined :rules="[
            (val) => !!val || 'Email is required',
            (val) => /.+@.+\..+/.test(val) || 'Invalid email format',
          ]">
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input v-model="password" :type="isPwd ? 'password' : 'text'" label="Password" outlined
            :rules="[(val) => !!val || 'Password is required']">
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
            </template>
          </q-input>

          <div>
            <q-btn label="Login" type="submit" color="primary" class="full-width" :loading="loading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import { useAuthStore } from 'src/stores/auth';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

// 다크모드 설정 적용
onMounted(() => {
  const savedDarkMode = localStorage.getItem('darkMode');
  const isDarkMode = savedDarkMode !== null ? savedDarkMode === 'true' : true;
  $q.dark.set(isDarkMode);
});

// 다크모드 상태에 따른 카드 배경색
const cardBackground = computed(() => {
  return $q.dark.isActive
    ? 'rgba(30, 30, 30, 0.95)'
    : 'rgba(255, 255, 255, 0.95)';
});

const email = ref('');
const password = ref('');
const isPwd = ref(true);
const loading = ref(false);

const onSubmit = async () => {
  loading.value = true;

  try {
    // CSRF 쿠키 요청 (Laravel Sanctum)
    await api.get('/sanctum/csrf-cookie');

    // 로그인 요청
    const response = await api.post('/api/login', {
      email: email.value,
      password: password.value,
    });

    // 로그인 성공
    console.log('=== Login Response ===');
    console.log('Full response:', response.data);
    console.log('Token:', response.data.token);
    console.log('User:', response.data.user);

    $q.notify({
      type: 'positive',
      message: '로그인에 성공했습니다.',
      position: 'bottom',
    });

    // 토큰과 사용자 정보를 Pinia store에 저장
    if (response.data.token) {
      authStore.setToken(response.data.token);
      console.log('Token saved to store');
      // axios 인스턴스에 토큰 설정
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }

    // 사용자 정보 저장
    if (response.data.user) {
      authStore.setUser(response.data.user);
      console.log('User saved to store:', authStore.user);
      console.log('localStorage user after save:', localStorage.getItem('user'));
    } else {
      console.warn('No user data in response!');
    }

    // 홈페이지로 리다이렉트
    await router.push('/');
  } catch (error: unknown) {
    // 로그인 실패
    let errorMessage = '로그인에 실패했습니다.';

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
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-page {
  background-image: url('../assets/login_bg.svg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-card {
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(10px);
}

.login-logo {
  height: 50px;
  width: auto;
  object-fit: contain;
}
</style>
