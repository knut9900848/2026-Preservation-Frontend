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
import { Platform, useQuasar } from 'quasar';
import { api } from 'boot/axios';
import { useAuthStore } from 'src/stores/auth';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

// 다크모드 설정 적용
onMounted(() => {
  const savedDarkMode = localStorage.getItem('darkMode');
  const isDarkMode = savedDarkMode !== null ? savedDarkMode === 'true' : false;
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
    // CSRF 쿠키 요청 (Laravel Sanctum) - 모바일(Capacitor)에서는 불필요
    if (!Platform.is.capacitor) {
      await api.get('/sanctum/csrf-cookie');
    }

    // 로그인 요청
    const response = await api.post('/api/login', {
      email: email.value,
      password: password.value,
    });

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
    } else {
      console.warn('No user data in response!');
    }

    // 홈페이지로 리다이렉트
    await router.push('/');
  } catch (error: unknown) {
    // 로그인 실패
    let errorMessage = '로그인에 실패했습니다.';

    if (error && typeof error === 'object') {
      const err = error as {
        message?: string;
        code?: string;
        response?: {
          status?: number;
          data?: {
            message?: string;
          };
        };
      };

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status) {
        errorMessage = `서버 오류 (${err.response.status})`;
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = `네트워크 오류 - API: ${api.defaults.baseURL}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'bottom',
      timeout: 10000,
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
