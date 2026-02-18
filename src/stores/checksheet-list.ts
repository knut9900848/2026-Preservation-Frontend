import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useChecksheetListStore = defineStore('checksheet-list', () => {
  const filters = ref({
    search: '',
    status: null as string | null,
    current_round: null as number | null,
    equipment_id: null as number | null,
    activity_id: null as number | null,
    over_due: null as string | null,
    category_id: null as number | null,
    sub_category_id: null as number | null,
    current_location_id: null as number | null,
    supplier_id: null as number | null,
    technician_id: null as number | null,
    sort_by: 'created_at',
    descending: true,
    per_page: 25,
  });

  const pagination = ref({
    sortBy: 'created_at',
    descending: true,
    page: 1,
    rowsPerPage: 25,
    rowsNumber: 0,
  });

  const showFilters = ref(false);

  const resetFilters = () => {
    filters.value = {
      search: '',
      status: null,
      current_round: null,
      equipment_id: null,
      activity_id: null,
      over_due: null,
      category_id: null,
      sub_category_id: null,
      current_location_id: null,
      supplier_id: null,
      technician_id: null,
      sort_by: 'created_at',
      descending: true,
      per_page: 25,
    };
    pagination.value.sortBy = 'created_at';
    pagination.value.descending = true;
    pagination.value.page = 1;
  };

  return { filters, pagination, showFilters, resetFilters };
});
