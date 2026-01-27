<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;

const props = defineProps<{
  module: Module;
}>();

const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{
  (e: "added"): void;
}>();

const toast = useToast();

/* ---------------------------------------------------
   1. Gestion des fichiers sélectionnés
----------------------------------------------------*/
const selectedFiles = ref<File[]>([]);
const uploading = ref(false);

// Fonction appelée quand l'utilisateur sélectionne des fichiers
function onFileSelect(files: File[]) {
  selectedFiles.value = files;
}

// Fonction pour retirer un fichier de la liste
function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
}

/* ---------------------------------------------------
   2. Upload des fichiers
----------------------------------------------------*/
async function uploadDocuments() {
  if (selectedFiles.value.length === 0) {
    toast.add({
      title: "Erreur",
      description: "Veuillez sélectionner au moins un fichier",
      color: "error",
    });
    return;
  }

  uploading.value = true;

  try {
    // Créer un FormData pour chaque fichier
    const uploadPromises = selectedFiles.value.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id_module", props.module.id_module);

      return $fetch("/api/module/documents/upload", {
        method: "POST",
        body: formData,
      });
    });

    await Promise.all(uploadPromises);

    toast.add({
      title: "Succès",
      description: `${selectedFiles.value.length} document(s) ajouté(s)`,
      color: "success",
    });

    emit("added");
    selectedFiles.value = [];
    open.value = false;
  } catch (err: any) {
    const message =
      err?.data?.message || err?.statusMessage || err?.message || "";

    toast.add({
      title: "Erreur",
      description: message || "Impossible d'uploader les documents",
      color: "error",
    });
  } finally {
    uploading.value = false;
  }
}

/* ---------------------------------------------------
   3. Formater la taille du fichier
----------------------------------------------------*/
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Ajouter des documents"
    description="Sélectionnez les documents à ajouter au module"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Zone de sélection de fichiers -->
        <div class="space-y-2">
          <label class="block text-sm font-medium">
            Sélectionner des fichiers
          </label>

          <UInput
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
            @change="
              (e: any) => {
                const files = Array.from(e.target.files || []) as File[];
                onFileSelect(files);
              }
            "
          />

          <p class="text-xs text-muted">
            Formats acceptés : PDF, Word, Excel, PowerPoint, Images, Texte
          </p>
        </div>

        <!-- Liste des fichiers sélectionnés -->
        <div v-if="selectedFiles.length > 0" class="space-y-2">
          <label class="block text-sm font-medium">
            Fichiers sélectionnés ({{ selectedFiles.length }})
          </label>

          <div class="space-y-2 max-h-75 overflow-y-auto">
            <div
              v-for="(file, index) in selectedFiles"
              :key="index"
              class="flex items-center justify-between p-3 border border-default rounded-lg bg-elevated/50"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <UIcon name="i-lucide-file" class="text-muted shrink-0" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium truncate">{{ file.name }}</p>
                  <p class="text-xs text-muted">
                    {{ formatFileSize(file.size) }}
                  </p>
                </div>
              </div>
              <UButton
                icon="i-lucide-x"
                color="error"
                variant="ghost"
                size="xs"
                @click="removeFile(index)"
              />
            </div>
          </div>
        </div>

        <!-- Message si aucun fichier sélectionné -->
        <div
          v-else
          class="text-center py-8 border-2 border-dashed border-default rounded-lg"
        >
          <UIcon
            name="i-lucide-cloud-upload"
            class="mx-auto mb-2 text-4xl text-muted"
          />
          <p class="text-sm text-muted">Aucun fichier sélectionné</p>
        </div>

        <!-- Boutons d'action -->
        <div class="flex justify-end gap-2 pt-4 border-t border-default">
          <UButton
            label="Annuler"
            color="neutral"
            variant="subtle"
            :disabled="uploading"
            @click="
              open = false;
              selectedFiles = [];
            "
          />
          <UButton
            label="Uploader"
            color="primary"
            variant="solid"
            icon="i-lucide-upload"
            :loading="uploading"
            :disabled="selectedFiles.length === 0"
            @click="uploadDocuments"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
