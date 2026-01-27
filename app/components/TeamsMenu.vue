<script setup lang="ts">
defineProps<{
  collapsed?: boolean;
}>();
</script>

<template>
  <div
    class="flex items-center gap-3 px-3 py-2"
    :class="collapsed && 'justify-center'"
  >
    <UAvatar src="/images/logo-utb.png" alt="UTB Learn" size="sm" />

    <span v-if="!collapsed" class="font-medium truncate"> UTB Learn </span>
  </div>
</template>
