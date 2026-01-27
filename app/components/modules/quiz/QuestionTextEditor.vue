<script setup lang="ts">
/**
 * Éditeur WYSIWYG simplifié pour le texte des questions
 * Supporte: gras, italique, souligné, barré
 */

const content = defineModel<string>({ default: "" });

defineProps<{
  placeholder?: string;
  minHeight?: number;
}>();
</script>

<template>
  <div class="border border-default rounded-lg overflow-hidden">
    <UEditor
      v-model="content"
      :placeholder="placeholder || 'Saisissez le texte de la question...'"
      :min-height="minHeight || 100"
      class="prose prose-sm prose-neutral dark:prose-invert max-w-none"
    >
      <template #default="{ editor }">
        <!-- Toolbar minimaliste -->
        <div class="flex items-center gap-1 p-2 border-b border-default bg-muted/30">
          <UTooltip text="Gras (Ctrl+B)">
            <UButton
              icon="i-lucide-bold"
              size="xs"
              :color="editor?.isActive('bold') ? 'primary' : 'neutral'"
              :variant="editor?.isActive('bold') ? 'solid' : 'ghost'"
              @click="editor?.chain().focus().toggleBold().run()"
            />
          </UTooltip>

          <UTooltip text="Italique (Ctrl+I)">
            <UButton
              icon="i-lucide-italic"
              size="xs"
              :color="editor?.isActive('italic') ? 'primary' : 'neutral'"
              :variant="editor?.isActive('italic') ? 'solid' : 'ghost'"
              @click="editor?.chain().focus().toggleItalic().run()"
            />
          </UTooltip>

          <UTooltip text="Souligné (Ctrl+U)">
            <UButton
              icon="i-lucide-underline"
              size="xs"
              :color="editor?.isActive('underline') ? 'primary' : 'neutral'"
              :variant="editor?.isActive('underline') ? 'solid' : 'ghost'"
              @click="editor?.chain().focus().toggleUnderline().run()"
            />
          </UTooltip>

          <UTooltip text="Barré">
            <UButton
              icon="i-lucide-strikethrough"
              size="xs"
              :color="editor?.isActive('strike') ? 'primary' : 'neutral'"
              :variant="editor?.isActive('strike') ? 'solid' : 'ghost'"
              @click="editor?.chain().focus().toggleStrike().run()"
            />
          </UTooltip>

          <div class="w-px h-4 bg-default mx-1" />

          <UTooltip text="Code">
            <UButton
              icon="i-lucide-code"
              size="xs"
              :color="editor?.isActive('code') ? 'primary' : 'neutral'"
              :variant="editor?.isActive('code') ? 'solid' : 'ghost'"
              @click="editor?.chain().focus().toggleCode().run()"
            />
          </UTooltip>
        </div>
      </template>
    </UEditor>
  </div>
</template>

<style scoped>
:deep(.ProseMirror) {
  padding: 0.75rem;
  min-height: v-bind('`${minHeight || 100}px`');
  outline: none;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: var(--color-gray-400);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
