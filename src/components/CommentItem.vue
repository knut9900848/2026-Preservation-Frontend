<template>
  <div class="comment-item" :class="{ 'is-reply': isReply }">
    <q-card flat :bordered="!isReply" class="q-mb-sm">
      <q-card-section class="q-pa-md">
        <div class="row items-start q-gutter-md">
          <!-- Avatar -->
          <q-avatar color="primary" text-color="white" :size="isReply ? '32px' : '40px'">
            {{ getInitials(comment.user.name) }}
          </q-avatar>

          <!-- Comment Content -->
          <div class="col">
            <!-- User Info and Date -->
            <div class="row items-center q-mb-xs">
              <span class="text-weight-medium">{{ comment.user.name }}</span>
              <q-separator vertical class="q-mx-sm" />
              <span class="text-caption text-grey-6">{{ formatDate(comment.created_at) }}</span>
              <span v-if="comment.updated_at && comment.updated_at !== comment.created_at" class="text-caption text-grey-5 q-ml-xs">
                (edited)
              </span>
            </div>

            <!-- Comment Text (Edit Mode) -->
            <div v-if="isEditing" class="q-mt-sm">
              <q-input
                v-model="editContent"
                type="textarea"
                outlined
                dense
                :rows="3"
                autofocus
              />
              <div class="row q-gutter-sm q-mt-sm">
                <q-btn
                  size="sm"
                  color="primary"
                  label="Save"
                  :disable="!editContent.trim()"
                  @click="saveEdit"
                />
                <q-btn
                  size="sm"
                  flat
                  label="Cancel"
                  @click="cancelEdit"
                />
              </div>
            </div>

            <!-- Comment Text (View Mode) -->
            <div v-else class="q-mt-sm">
              <div class="text-body2" style="white-space: pre-wrap;">{{ comment.content }}</div>

              <!-- Action Buttons -->
              <div class="row q-gutter-sm q-mt-sm">
                <q-btn
                  v-if="!disabled"
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="reply"
                  label="Reply"
                  @click="$emit('reply', comment)"
                />
                <q-btn
                  v-if="canEdit"
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="edit"
                  label="Edit"
                  @click="startEdit"
                />
                <q-btn
                  v-if="canDelete"
                  flat
                  dense
                  size="sm"
                  color="negative"
                  icon="delete"
                  label="Delete"
                  @click="$emit('delete', comment.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Nested Replies -->
    <div v-if="comment.replies && comment.replies.length > 0" class="replies-container">
      <CommentItem
        v-for="reply in sortedReplies"
        :key="reply.id"
        :comment="reply"
        v-bind="currentUserId !== undefined ? { currentUserId } : {}"
        :disabled="disabled"
        :is-reply="true"
        @reply="$emit('reply', $event)"
        @edit="$emit('edit', $event, $event.content)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Comment {
  id: number;
  commentable_type: string;
  commentable_id: number;
  user_id: number;
  user: User;
  content: string;
  parent_id: number | null;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  replies?: Comment[];
}

interface Props {
  comment: Comment;
  currentUserId?: number;
  disabled?: boolean;
  isReply?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  isReply: false,
});

const isEditing = ref(false);
const editContent = ref('');

const canEdit = computed(() => {
  if (!props.currentUserId) return false;
  return props.comment.user_id === props.currentUserId && !props.disabled;
});

const canDelete = computed(() => {
  if (!props.currentUserId) return false;
  return props.comment.user_id === props.currentUserId;
});

const sortedReplies = computed(() => {
  if (!props.comment.replies) return [];
  return [...props.comment.replies].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
});

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const startEdit = () => {
  editContent.value = props.comment.content;
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  editContent.value = '';
};

const emit = defineEmits<{
  (e: 'reply', comment: Comment): void;
  (e: 'edit', comment: Comment, newContent: string): void;
  (e: 'delete', commentId: number): void;
}>();

const saveEdit = () => {
  if (!editContent.value.trim()) return;

  emit('edit', props.comment, editContent.value.trim());
  isEditing.value = false;
};
</script>

<style scoped lang="scss">
.comment-item {
  &.is-reply {
    margin-left: 40px;

    .q-card {
      background-color: rgba(0, 0, 0, 0.02);
    }
  }

  .replies-container {
    margin-top: 8px;
  }
}
</style>
