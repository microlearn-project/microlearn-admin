<script setup lang="ts">
import type { NodeViewProps } from "@tiptap/vue-3";
import { NodeViewWrapper } from "@tiptap/vue-3";

const props = defineProps<NodeViewProps>();

const toast = useToast();
const file = ref<File | null>(null);
const loading = ref(false);
const uploadedUrl = ref<string | null>(props.node.attrs.src || null);

const moduleId = computed(() => props.node.attrs.moduleId as string | null);
const coursId = computed(() => props.node.attrs.coursId as string | null);

const storagePath = computed(() => {
  if (moduleId.value && coursId.value) {
    return `${moduleId.value}/${coursId.value}`;
  }
  if (moduleId.value) {
    return `${moduleId.value}/temp-${Date.now()}`;
  }
  return `temp-${Date.now()}`;
});

const progress = ref(0);

watch(file, async (newFile) => {
  if (!newFile) return;

  // Validation format
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

  // Validation taille
  const MAX_SIZE_MB = 50;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  if (newFile.size > MAX_SIZE_BYTES) {
    toast.add({
      title: "Fichier trop volumineux",
      description: `La vidéo ne doit pas dépasser ${MAX_SIZE_MB} MB`,
      color: "error",
    });
    file.value = null;
    return;
  }

  loading.value = true;
  progress.value = 0;

  try {
    // Étape 1 — Demander la signed URL à notre API (leger, pas de fichier)
    const { signedUrl, publicUrl } = await $fetch<{
      signedUrl: string;
      token: string;
      filePath: string;
      publicUrl: string;
    }>("/api/cours/video-signed-url", {
      method: "POST",
      body: {
        fileName: newFile.name,
        fileType: newFile.type,
        fileSize: newFile.size,
        storagePath: storagePath.value,
      },
    });

    // Étape 2 — Upload direct vers Supabase Storage (bypass Vercel)
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          progress.value = Math.round((event.loaded / event.total) * 100);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error("Erreur lors de l'upload vers le storage"));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Erreur réseau")));

      xhr.open("PUT", signedUrl);
      xhr.setRequestHeader("Content-Type", newFile.type);
      xhr.send(newFile);
    });

    // Étape 3 — Mettre à jour l'éditeur avec la Public URL permanente
    uploadedUrl.value = publicUrl;

    const pos = props.getPos();
    if (typeof pos !== "number") return;

    props.editor
      .chain()
      .focus()
      .setNodeSelection(pos)
      .updateAttributes("videoUpload", { src: publicUrl })
      .run();

    toast.add({
      title: "Vidéo uploadée",
      description: "La vidéo est prête",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Erreur",
      description:
        error?.data?.statusMessage ||
        error?.message ||
        "Impossible d'uploader la vidéo",
      color: "error",
    });
  } finally {
    loading.value = false;
    progress.value = 0;
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
        style="max-height: 400px"
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

    <div v-else class="my-4 flex flex-col gap-2">
      <UFileUpload
        v-model="file"
        accept="video/mp4,video/webm"
        label="Uploader une vidéo"
        description="MP4 ou WebM — 50 MB max"
        :preview="false"
        :disabled="loading"
        class="min-h-48"
      >
        <template #leading>
          <UAvatar
            :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-video'"
            size="xl"
            :ui="{ icon: loading ? 'animate-spin' : '' }"
          />
        </template>
      </UFileUpload>

      <!-- Barre de progression -->
      <div v-if="loading" class="flex flex-col gap-1">
        <div class="flex justify-between text-xs text-muted">
          <span>Upload en cours...</span>
          <span>{{ progress }}%</span>
        </div>
        <div class="w-full bg-elevated rounded-full h-1.5 overflow-hidden">
          <div
            class="bg-primary h-1.5 rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
    </div>
  </NodeViewWrapper>
</template>
