<script setup lang="ts">
import type { NodeViewProps } from "@tiptap/vue-3";
import { NodeViewWrapper } from "@tiptap/vue-3";

const props = defineProps<NodeViewProps>();

const toast = useToast();
const file = ref<File | null>(null);
const loading = ref(false);

watch(file, async (newFile) => {
  if (!newFile) return;

  // Vérifier la taille (max 5MB)
  if (newFile.size > 5 * 1024 * 1024) {
    toast.add({
      title: "Erreur",
      description: "L'image ne doit pas dépasser 5 MB",
      color: "error",
    });
    file.value = null;
    return;
  }

  loading.value = true;

  try {
    // Convertir en base64 (stockage temporaire, pas d'upload)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(newFile);
    });

    // Obtenir la position du node
    const pos = props.getPos();
    if (typeof pos !== "number") {
      loading.value = false;
      return;
    }

    // Remplacer le node d'upload par l'image en base64 (temporaire)
    // L'upload vers le storage se fera lors de la sauvegarde du module
    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + 1 })
      .setImage({ src: base64 })
      .run();

    toast.add({
      title: "Image ajoutée",
      description: "L'image sera uploadée lors de la sauvegarde",
      color: "success",
    });
  } catch (error: any) { 
    toast.add({
      title: "Erreur",
      description: "Impossible de lire l'image",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <NodeViewWrapper>
    <UFileUpload
      v-model="file"
      accept="image/*"
      label="Uploader une image"
      description="PNG, JPG, GIF ou WebP (max. 5MB)"
      :preview="false"
      class="min-h-48"
    >
      <template #leading>
        <UAvatar
          :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-image'"
          size="xl"
          :ui="{ icon: loading ? 'animate-spin' : '' }"
        />
      </template>
    </UFileUpload>
  </NodeViewWrapper>
</template>
