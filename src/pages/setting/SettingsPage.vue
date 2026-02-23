<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md row justify-between items-center">
      <div class="text-h5">Settings</div>
      <q-btn color="primary" label="Save Settings" icon="save" :loading="saving" @click="onSubmit" />
    </div>

    <q-form @submit="onSubmit">
      <!-- IES (Company) Section -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="bg-primary text-white">
          <div class="text-subtitle1 text-weight-bold">IES (Company)</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="formData.ies_name" label="Company Name" outlined dense />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="formData.ies_ceo_name" label="CEO Name" outlined dense />
            </div>
            <div class="col-12">
              <q-input v-model="formData.ies_address" label="Address" outlined dense type="textarea" rows="2" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="formData.ies_contact_number" label="Contact Number" outlined dense />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="formData.ies_email" label="Email" outlined dense type="email" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="formData.ies_vat_code" label="VAT Code" outlined dense />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="formData.ies_website_url" label="Website URL" outlined dense />
            </div>
            <div class="col-12">
              <q-input v-model="formData.ies_slogan" label="Slogan" outlined dense />
            </div>
            <div class="col-12 col-md-6">
              <div class="text-subtitle2 q-mb-xs">Company Logo</div>
              <q-file v-model="iesLogoFile" label="Upload Logo" outlined dense accept="image/*" clearable>
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
              <div v-if="iesLogoPreview" class="q-mt-sm">
                <q-img :src="iesLogoPreview" style="max-width: 200px; max-height: 100px" fit="contain" />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Client Section -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="bg-primary text-white">
          <div class="text-subtitle1 text-weight-bold">Client</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="formData.client_name" label="Client Name" outlined dense />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="formData.client_contact_number" label="Contact Number" outlined dense />
            </div>
            <div class="col-12">
              <q-input v-model="formData.client_address" label="Address" outlined dense type="textarea" rows="2" />
            </div>
            <div class="col-12 col-md-6">
              <div class="text-subtitle2 q-mb-xs">Client Logo</div>
              <q-file v-model="clientLogoFile" label="Upload Logo" outlined dense accept="image/*" clearable>
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
              <div v-if="clientLogoPreview" class="q-mt-sm">
                <q-img :src="clientLogoPreview" style="max-width: 200px; max-height: 100px" fit="contain" />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Project Section -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="bg-primary text-white">
          <div class="text-subtitle1 text-weight-bold">Project</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="formData.project_name" label="Project Name" outlined dense />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="formData.project_code" label="Project Code" outlined dense />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

interface SettingsFormData {
  ies_name: string;
  ies_address: string;
  ies_contact_number: string;
  ies_vat_code: string;
  ies_email: string;
  ies_website_url: string;
  ies_slogan: string;
  ies_ceo_name: string;
  client_name: string;
  client_address: string;
  client_contact_number: string;
  project_name: string;
  project_code: string;
}

const $q = useQuasar();
const saving = ref(false);
const loading = ref(false);

const formData = ref<SettingsFormData>({
  ies_name: '',
  ies_address: '',
  ies_contact_number: '',
  ies_vat_code: '',
  ies_email: '',
  ies_website_url: '',
  ies_slogan: '',
  ies_ceo_name: '',
  client_name: '',
  client_address: '',
  client_contact_number: '',
  project_name: '',
  project_code: '',
});

const iesLogoFile = ref<File | null>(null);
const clientLogoFile = ref<File | null>(null);
const iesLogoPreview = ref<string | null>(null);
const clientLogoPreview = ref<string | null>(null);

watch(iesLogoFile, (file) => {
  if (file) {
    iesLogoPreview.value = URL.createObjectURL(file);
  } else if (!formData.value.ies_name) {
    iesLogoPreview.value = null;
  }
});

watch(clientLogoFile, (file) => {
  if (file) {
    clientLogoPreview.value = URL.createObjectURL(file);
  } else if (!formData.value.client_name) {
    clientLogoPreview.value = null;
  }
});

const fetchSettings = async () => {
  loading.value = true;
  try {
    const response = await api.get('/api/settings');
    const data = response.data.setting;

    formData.value = {
      ies_name: data.ies_name || '',
      ies_address: data.ies_address || '',
      ies_contact_number: data.ies_contact_number || '',
      ies_vat_code: data.ies_vat_code || '',
      ies_email: data.ies_email || '',
      ies_website_url: data.ies_website_url || '',
      ies_slogan: data.ies_slogan || '',
      ies_ceo_name: data.ies_ceo_name || '',
      client_name: data.client_name || '',
      client_address: data.client_address || '',
      client_contact_number: data.client_contact_number || '',
      project_name: data.project_name || '',
      project_code: data.project_code || '',
    };

    if (data.ies_logo_url) {
      iesLogoPreview.value = data.ies_logo_url;
    }
    if (data.client_logo_url) {
      clientLogoPreview.value = data.client_logo_url;
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to load settings',
      position: 'bottom',
    });
  } finally {
    loading.value = false;
  }
};

const onSubmit = async () => {
  saving.value = true;

  try {
    const payload = new FormData();

    Object.entries(formData.value).forEach(([key, value]) => {
      payload.append(key, value ?? '');
    });

    if (iesLogoFile.value) {
      payload.append('ies_logo', iesLogoFile.value);
    }
    if (clientLogoFile.value) {
      payload.append('client_logo', clientLogoFile.value);
    }

    await api.post('/api/settings', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    $q.notify({
      type: 'positive',
      message: 'Settings saved successfully',
      position: 'bottom',
    });

    iesLogoFile.value = null;
    clientLogoFile.value = null;
    await fetchSettings();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to save settings',
      position: 'bottom',
    });
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  void fetchSettings();
});
</script>
