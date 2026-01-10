import { defineStore } from 'pinia';
import { ref } from 'vue';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  job_start_date?: string | null;
  job_end_date?: string | null;
  user_type: string;
  is_active?: boolean;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));

  // localStorage에서 user 정보 가져오기
  const storedUser = localStorage.getItem('user');
  const user = ref<User | null>(
    storedUser ? JSON.parse(storedUser) : null
  );

  const isAuthenticated = () => {
    return !!token.value;
  };

  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  };

  const setUser = (userData: User) => {
    user.value = userData;
    // localStorage에 user 정보 저장
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    setUser,
    logout,
  };
});
