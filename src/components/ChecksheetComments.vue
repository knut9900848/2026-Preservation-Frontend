<template>
  <div class="checksheet-comments">
    <!-- Comment Input -->
    <div class="q-mb-md">
      <q-input
        v-model="newCommentContent"
        type="textarea"
        outlined
        dense
        :placeholder="replyingTo ? `Reply to ${replyingTo.user.name}...` : 'Write a comment...'"
        :rows="3"
        :disable="disabled"
      >
        <template v-slot:prepend v-if="replyingTo">
          <q-chip
            removable
            @remove="cancelReply"
            color="primary"
            text-color="white"
            size="sm"
          >
            Replying to {{ replyingTo.user.name }}
          </q-chip>
        </template>
        <template v-slot:append>
          <q-btn
            flat
            dense
            icon="send"
            color="primary"
            :disable="!newCommentContent.trim() || disabled"
            @click="addComment"
            :loading="saving"
          >
            <q-tooltip>{{ replyingTo ? 'Send Reply' : 'Send Comment' }}</q-tooltip>
          </q-btn>
        </template>
      </q-input>
    </div>

    <!-- Comments List -->
    <div v-if="loading" class="text-center q-pa-md">
      <q-spinner color="primary" size="3em" />
    </div>

    <div v-else-if="topLevelComments.length > 0" class="comments-list">
      <CommentItem
        v-for="comment in topLevelComments"
        :key="comment.id"
        :comment="comment"
        v-bind="currentUserId !== undefined ? { currentUserId } : {}"
        :disabled="disabled"
        @reply="handleReply"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center q-pa-md text-grey-6">
      <q-icon name="comment" size="48px" color="grey-4" />
      <div class="text-body2 q-mt-sm">No comments yet</div>
      <div class="text-caption">Be the first to add a comment</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import CommentItem from './CommentItem.vue';

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
  commentableType: string; // e.g., 'App\\Models\\CheckSheet'
  commentableId: number | null;
  disabled?: boolean;
  currentUserId?: number;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  (e: 'commentAdded'): void;
  (e: 'commentDeleted'): void;
  (e: 'commentUpdated'): void;
}>();

const $q = useQuasar();

const comments = ref<Comment[]>([]);
const newCommentContent = ref('');
const saving = ref(false);
const loading = ref(false);
const replyingTo = ref<Comment | null>(null);

// Get only top-level comments (no parent_id), sorted by newest first
const topLevelComments = computed(() => {
  return comments.value
    .filter((c) => !c.parent_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
});

const fetchComments = async () => {
  if (!props.commentableId) return;

  loading.value = true;

  try {
    const response = await api.get('/api/comments', {
      params: {
        commentable_type: props.commentableType,
        commentable_id: props.commentableId,
      },
    });

    comments.value = response.data.comments || [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load comments',
      position: 'bottom',
    });
  } finally {
    loading.value = false;
  }
};

const addComment = async () => {
  if (!newCommentContent.value.trim() || !props.commentableId) return;

  saving.value = true;

  try {
    const payload = {
      commentable_type: props.commentableType,
      commentable_id: props.commentableId,
      content: newCommentContent.value.trim(),
      ...(replyingTo.value && { parent_id: replyingTo.value.id }),
    };

    await api.post('/api/comments', payload);

    // Refresh comments to get the updated nested structure
    await fetchComments();

    newCommentContent.value = '';
    replyingTo.value = null;

    $q.notify({
      type: 'positive',
      message: replyingTo.value ? 'Reply added successfully' : 'Comment added successfully',
      position: 'bottom',
      timeout: 1000,
    });

    emit('commentAdded');
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to add comment',
      position: 'bottom',
    });
  } finally {
    saving.value = false;
  }
};

const handleReply = (comment: Comment) => {
  replyingTo.value = comment;
  newCommentContent.value = '';
};

const cancelReply = () => {
  replyingTo.value = null;
  newCommentContent.value = '';
};

const handleEdit = async (comment: Comment, newContent: string) => {
  try {
    await api.put(`/api/comments/${comment.id}`, {
      content: newContent,
    });

    // Refresh comments to get the updated data
    await fetchComments();

    $q.notify({
      type: 'positive',
      message: 'Comment updated successfully',
      position: 'bottom',
      timeout: 1000,
    });

    emit('commentUpdated');
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to update comment',
      position: 'bottom',
    });
  }
};

const handleDelete = (commentId: number) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this comment? All replies will also be deleted.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/api/comments/${commentId}`);

        // Refresh comments to remove deleted comment and its replies
        await fetchComments();

        $q.notify({
          type: 'positive',
          message: 'Comment deleted successfully',
          position: 'bottom',
          timeout: 1000,
        });

        emit('commentDeleted');
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Failed to delete comment',
          position: 'bottom',
        });
      }
    })();
  });
};

// Expose fetchComments method to parent
defineExpose({
  fetchComments,
});

// Auto-fetch comments when component mounts
onMounted(() => {
  void fetchComments();
});
</script>

<style scoped lang="scss">
.checksheet-comments {
  .comments-list {
    max-height: 500px;
    overflow-y: auto;
  }
}
</style>
