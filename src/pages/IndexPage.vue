<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">Dashboard</div>
        <div class="text-caption text-grey">Preservation Management Overview</div>
      </div>
      <q-space />
      <q-btn flat round icon="mdi-refresh" :loading="loading" @click="fetchDashboard">
        <q-tooltip>Refresh</q-tooltip>
      </q-btn>
    </div>

    <!-- Summary Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4">
        <q-card class="summary-card equipment-card" flat bordered>
          <q-card-section class="row items-center no-wrap q-pa-lg">
            <div class="card-icon-wrapper bg-blue-1 text-blue">
              <q-icon name="mdi-engine" size="32px" />
            </div>
            <div class="q-ml-lg">
              <div class="text-caption text-grey-7 text-uppercase text-weight-medium ls-wide">
                Total Equipment
              </div>
              <div class="text-h4 text-weight-bold q-mt-xs">
                <template v-if="loading">
                  <q-skeleton type="text" width="60px" />
                </template>
                <template v-else>
                  {{ dashboard.equipment_count.toLocaleString() }}
                </template>
              </div>
            </div>
          </q-card-section>
          <div class="card-accent accent-blue" />
        </q-card>
      </div>

      <div class="col-12 col-sm-4">
        <q-card class="summary-card checksheet-card" flat bordered>
          <q-card-section class="row items-center no-wrap q-pa-lg">
            <div class="card-icon-wrapper bg-purple-1 text-purple">
              <q-icon name="mdi-folder-open" size="32px" />
            </div>
            <div class="q-ml-lg">
              <div class="text-caption text-grey-7 text-uppercase text-weight-medium ls-wide">
                Total Checksheets
              </div>
              <div class="text-h4 text-weight-bold q-mt-xs">
                <template v-if="loading">
                  <q-skeleton type="text" width="60px" />
                </template>
                <template v-else>
                  {{ dashboard.checksheet_total.toLocaleString() }}
                </template>
              </div>
            </div>
          </q-card-section>
          <div class="card-accent accent-purple" />
        </q-card>
      </div>

      <div class="col-12 col-sm-4">
        <q-card class="summary-card overdue-card" flat bordered>
          <q-card-section class="row items-center no-wrap q-pa-lg">
            <div class="card-icon-wrapper bg-red-1 text-red">
              <q-icon name="mdi-alert-circle" size="32px" />
            </div>
            <div class="q-ml-lg">
              <div class="text-caption text-grey-7 text-uppercase text-weight-medium ls-wide">
                Overdue
              </div>
              <div class="text-h4 text-weight-bold q-mt-xs">
                <template v-if="loading">
                  <q-skeleton type="text" width="60px" />
                </template>
                <template v-else>
                  {{ dashboard.checksheet_overdue.toLocaleString() }}
                </template>
              </div>
            </div>
          </q-card-section>
          <div class="card-accent accent-red" />
        </q-card>
      </div>
    </div>

    <!-- Checksheet Status Section -->
    <div class="text-subtitle1 text-weight-bold q-mb-md">Checksheet Status</div>
    <div class="row q-col-gutter-md q-mb-lg">
      <div v-for="status in statusCards" :key="status.key" class="col-6 col-sm-3">
        <q-card class="status-card" flat bordered>
          <q-card-section class="q-pa-lg">
            <div class="row items-center justify-between q-mb-md">
              <q-icon :name="status.icon" :color="status.color" size="24px" />
              <q-badge :color="status.color" :label="status.key" outline class="text-weight-medium" />
            </div>
            <div class="text-h4 text-weight-bold">
              <template v-if="loading">
                <q-skeleton type="text" width="40px" />
              </template>
              <template v-else>
                {{ (dashboard.checksheet_status[status.key] ?? 0).toLocaleString() }}
              </template>
            </div>
            <q-linear-progress v-if="!loading && dashboard.checksheet_total > 0"
              :value="(dashboard.checksheet_status[status.key] ?? 0) / dashboard.checksheet_total" :color="status.color"
              track-color="grey-3" class="q-mt-md" rounded size="6px" />
            <div v-if="!loading && dashboard.checksheet_total > 0" class="text-caption text-grey q-mt-xs">
              {{ getPercentage(dashboard.checksheet_status[status.key] ?? 0) }}% of total
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Weekly Accepted Chart -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle2 text-weight-bold q-mb-md">Weekly Accepted Checksheets</div>
        <div v-if="loading" style="height: 280px;" class="flex flex-center">
          <q-spinner size="40px" color="primary" />
        </div>
        <apexchart v-else type="bar" height="280" :options="weeklyChartOptions" :series="weeklyChartSeries" />
      </q-card-section>
    </q-card>

    <!-- Status Distribution Bar -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle2 text-weight-bold q-mb-md">Status Distribution</div>
        <div v-if="loading" class="row q-col-gutter-sm">
          <div class="col"><q-skeleton type="rect" height="32px" /></div>
        </div>
        <div v-else-if="dashboard.checksheet_total > 0" class="stacked-bar row no-wrap"
          style="height: 32px; border-radius: 8px; overflow: hidden;">
          <div v-for="status in statusCards" :key="status.key" :class="`bg-${status.color}`"
            :style="{ width: getPercentage(dashboard.checksheet_status[status.key] ?? 0) + '%' }"
            class="stacked-bar-segment">
            <q-tooltip>{{ status.key }}: {{ dashboard.checksheet_status[status.key] ?? 0 }}</q-tooltip>
          </div>
        </div>
        <div v-else class="text-center text-grey q-pa-sm">No data</div>
        <div class="row q-mt-md q-gutter-md">
          <div v-for="status in statusCards" :key="status.key" class="row items-center">
            <q-badge :color="status.color" rounded class="q-mr-xs" style="width: 10px; height: 10px;" />
            <span class="text-caption">{{ status.key }}</span>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import { api } from 'boot/axios';
import { useNotificationStore } from 'src/stores/notification';

const apexchart = VueApexCharts;

interface WeeklyAccepted {
  week_start: string;
  week_end: string;
  label: string;
  count: number;
}

interface DashboardData {
  equipment_count: number;
  checksheet_total: number;
  checksheet_overdue: number;
  checksheet_status: Record<string, number>;
  weekly_accepted: WeeklyAccepted[];
}

const loading = ref(true);
const dashboard = ref<DashboardData>({
  equipment_count: 0,
  checksheet_total: 0,
  checksheet_overdue: 0,
  checksheet_status: {},
  weekly_accepted: [],
});

const statusCards = computed(() => [
  { key: 'Draft', icon: 'mdi-file-edit-outline', color: 'blue-grey' },
  { key: 'Completed', icon: 'mdi-check-circle-outline', color: 'blue' },
  { key: 'Approved', icon: 'mdi-shield-check-outline', color: 'green' },
  { key: 'Accepted', icon: 'mdi-star-outline', color: 'amber-9' },
]);

const weeklyChartSeries = computed(() => [
  {
    name: 'Accepted',
    data: dashboard.value.weekly_accepted.map((w) => w.count),
  },
]);

const weeklyChartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    fontFamily: 'inherit',
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '50%',
    },
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: dashboard.value.weekly_accepted.map((w) => w.label),
  },
  yaxis: {
    labels: {
      formatter: (val: number) => Math.floor(val).toString(),
    },
  },
  colors: ['#43A047'],
  grid: {
    borderColor: '#f0f0f0',
    strokeDashArray: 4,
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} checksheets`,
    },
  },
}));

function getPercentage(count: number): string {
  if (dashboard.value.checksheet_total === 0) return '0';
  return ((count / dashboard.value.checksheet_total) * 100).toFixed(1);
}

async function fetchDashboard() {
  loading.value = true;
  try {
    const response = await api.get<DashboardData>('/api/dashboard');
    dashboard.value = response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard:', error);
  } finally {
    loading.value = false;
  }
}

const notificationStore = useNotificationStore();

// 새 알림 발생 시 대시보드 자동 새로고침
watch(
  () => notificationStore.notifications.length,
  (newLen, oldLen) => {
    if (newLen > oldLen) {
      void fetchDashboard();
    }
  },
);

onMounted(() => {
  void fetchDashboard();
});
</script>

<style scoped>
.ls-wide {
  letter-spacing: 0.05em;
}

.card-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  flex-shrink: 0;
}

.summary-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card-accent {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.accent-blue {
  background: linear-gradient(90deg, #1976d2, #42a5f5);
}

.accent-purple {
  background: linear-gradient(90deg, #7b1fa2, #ba68c8);
}

.accent-red {
  background: linear-gradient(90deg, #c62828, #ef5350);
}

.status-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.stacked-bar-segment {
  min-width: 2px;
  transition: width 0.6s ease;
}

/* Dark mode adjustments */
.body--dark .card-icon-wrapper.bg-blue-1 {
  background: rgba(25, 118, 210, 0.15) !important;
}

.body--dark .card-icon-wrapper.bg-purple-1 {
  background: rgba(123, 31, 162, 0.15) !important;
}

.body--dark .card-icon-wrapper.bg-red-1 {
  background: rgba(198, 40, 40, 0.15) !important;
}

.body--dark .summary-card:hover,
.body--dark .status-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
</style>
