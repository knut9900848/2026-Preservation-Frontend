<template>
  <q-card flat bordered>
    <q-card-section>
      <q-stepper v-model="workflowStep" ref="stepper" color="primary" flat>
        <q-step :name="1" title="Draft" icon="edit" :done="workflowStep > 1">
          <div class="text-body2">
            The checksheet is in draft status. Complete the checksheet to proceed.
          </div>
          <q-stepper-navigation>
            <q-btn @click="completeChecksheet" color="primary" label="Complete" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="2" title="Completed" icon="check_circle" :done="workflowStep > 2">
          <div class="text-body2">
            The checksheet has been completed. Review and approve or reject.
          </div>
          <q-stepper-navigation>
            <q-btn
              @click="reviewChecksheet(true)"
              color="primary"
              label="Pass"
              class="q-mr-sm"
            />
            <q-btn @click="rejectChecksheet" color="negative" label="Reject" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="3" title="Reviewed" icon="rate_review" :done="workflowStep > 3">
          <div class="text-body2">
            The checksheet has been reviewed. Final approval required.
          </div>
          <q-stepper-navigation>
            <q-btn
              @click="approveChecksheet"
              color="positive"
              label="Approve"
              class="q-mr-sm"
            />
            <q-btn @click="rejectChecksheet" color="negative" label="Reject" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="4" title="Approved" icon="verified" :done="workflowStep === 4">
          <div class="text-body2">
            The checksheet has been approved. No further action required.
          </div>
          <q-stepper-navigation>
            <q-btn
              @click="generateNextRound"
              color="primary"
              label="Generate Next Round"
              icon="add_circle"
            />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

interface ChecksheetItem {
  id: number;
  status: number;
  remarks: string | null;
}

interface Props {
  checksheetId: number | null;
  initialStep?: number;
  initialStatus?: string;
  currentRound?: number;
  items?: ChecksheetItem[];
}

const props = withDefaults(defineProps<Props>(), {
  initialStep: 1,
  initialStatus: 'Draft',
  currentRound: 0,
  items: () => [],
});

const emit = defineEmits<{
  (e: 'statusChanged'): void;
  (e: 'stepChanged', payload: { step: number; status: string }): void;
  (e: 'closeDialog'): void;
}>();

const $q = useQuasar();

const workflowStep = ref<number>(props.initialStep);
const currentStatus = ref<string>(props.initialStatus);

// Watch for prop changes
watch(
  () => props.initialStep,
  (newStep) => {
    workflowStep.value = newStep;
  }
);

watch(
  () => props.initialStatus,
  (newStatus) => {
    currentStatus.value = newStatus;
  }
);

const getBaseApiUrl = () => `/api/checksheets/${props.checksheetId}`;

const completeChecksheet = async () => {
  if (!props.checksheetId) return;

  try {
    await api.put(`${getBaseApiUrl()}/complete`, {
      status: 'completed',
      checksheet_items: props.items.map((item) => ({
        id: item.id,
        status: item.status,
        remarks: item.remarks,
      })),
    });

    workflowStep.value = 2;
    currentStatus.value = 'Completed';

    emit('stepChanged', { step: 2, status: 'Completed' });
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
  if (!props.checksheetId) return;

  try {
    await api.put(`${getBaseApiUrl()}/review`, {
      status: approve ? 'reviewed' : 'draft',
    });

    workflowStep.value = approve ? 3 : 1;
    currentStatus.value = approve ? 'Reviewed' : 'Draft';

    emit('stepChanged', { step: approve ? 3 : 1, status: approve ? 'Reviewed' : 'Draft' });
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
  if (!props.checksheetId) return;

  try {
    await api.put(`${getBaseApiUrl()}/approve`, {
      status: 'approved',
    });

    workflowStep.value = 4;
    currentStatus.value = 'Approved';

    emit('stepChanged', { step: 4, status: 'Approved' });
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
  if (!props.checksheetId) return;

  $q.dialog({
    title: 'Confirm Rejection',
    message: 'Are you sure you want to reject this checksheet? It will be reset to draft status.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!props.checksheetId) return;

      try {
        await api.put(`${getBaseApiUrl()}/reject`, {
          status: 'draft',
        });

        workflowStep.value = 1;
        currentStatus.value = 'Draft';

        emit('stepChanged', { step: 1, status: 'Draft' });
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
  if (!props.checksheetId) return;

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
    message: `Are you sure you want to generate the next round checksheet? This will create Round ${(props.currentRound || 0) + 1}.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!props.checksheetId) return;

      try {
        const response = await api.post(`${getBaseApiUrl()}/generate-next-round`);

        $q.notify({
          type: 'positive',
          message: `Next round checksheet (Round ${response.data.new_round}) generated successfully`,
          position: 'bottom',
        });

        emit('statusChanged');
        emit('closeDialog');
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

// Expose method to update step/status from parent
const updateWorkflow = (step: number, status: string) => {
  workflowStep.value = step;
  currentStatus.value = status;
};

defineExpose({
  updateWorkflow,
});
</script>
