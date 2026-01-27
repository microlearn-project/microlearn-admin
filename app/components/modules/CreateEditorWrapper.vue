<script setup lang="ts">
const props = defineProps<{
  moduleId?: string
}>()

const content = defineModel<string>({ default: "" })
</script>

<template>
  <ClientOnly>
    <LazyModulesCreateEditor v-model="content" :module-id="moduleId" />
    <template #fallback>
      <div class="border border-default rounded-lg p-8 flex items-center justify-center min-h-125">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-muted">Chargement de l'éditeur...</p>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>
