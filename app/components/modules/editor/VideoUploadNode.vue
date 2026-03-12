<script setup lang="ts">
import type { NodeViewProps } from "@tiptap/vue-3";
import { NodeViewWrapper } from "@tiptap/vue-3";

const props = defineProps<NodeViewProps>();

const toast = useToast();
const file = ref<File | null>(null);
const loading = ref(false);
const uploadedUrl = ref<string | null>(props.node.attrs.src || null);

const moduleId = computed(() => props.node.attrs.moduleId as string | null);
const coursId  = computed(() => props.node.attrs.coursId  as string | null);

const storagePath = computed(() => {
  if (moduleId.value && coursId.value) {
    return `${moduleId.value}/${coursId.value}`;
  }
  if (moduleId.value) {
    return `${moduleId.value}/temp-${Date.now()}`;
  }
  return `temp-${Date.now()}`;
});

watch(file, async (newFile) => {
  if (!newFile) return;

  const allowedTypes = ["video/mp4", "video/webm"];
  if (!allowedTypes.includes(newFile.type)) {
    toast.add({
      title: "Format non supporté",
      description: "Utilisez un fichier MP4 ou WebM",
      color: "error",
    });
    file.value = null;
    return;
  }

  loading.value = true;

  try {
    const formData = new FormData();
    formData.append("file", newFile);
    formData.append("storagePath", storagePath.value);

    const response = await $fetch<{ url: string; filePath: string }>(
      "/api/cours/video-upload",
      { method: "POST", body: formData }
    );

    uploadedUrl.value = response.url;

    const pos = props.getPos();
    if (typeof pos !== "number") return;

    props.editor
      .chain()
      .focus()
      .setNodeSelection(pos)
      .updateAttributes("videoUpload", { src: response.url })
      .run();

    toast.add({
      title: "Vidéo uploadée",
      description: "La vidéo est prête",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Erreur",
      description: error?.data?.statusMessage || "Impossible d'uploader la vidéo",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <NodeViewWrapper>
    <div v-if="uploadedUrl" class="relative group my-4">
      <video
        :src="uploadedUrl"
        controls
        class="w-full rounded-lg border border-default"
        style="max-height: 400px;"
      />
      <UButton
        icon="i-lucide-trash-2"
        color="error"
        variant="solid"
        size="xs"
        class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        @click="props.deleteNode()"
      />
    </div>

    <UFileUpload
      v-else
      v-model="file"
      accept="video/mp4,video/webm"
      label="Uploader une vidéo"
      description="MP4 ou WebM"
      :preview="false"
      class="min-h-48 my-4"
    >
      <template #leading>
        <UAvatar
          :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-video'"
          size="xl"
          :ui="{ icon: loading ? 'animate-spin' : '' }"
        />
      </template>
    </UFileUpload>
  </NodeViewWrapper>
</template>
