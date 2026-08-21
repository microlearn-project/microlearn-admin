<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Document = Tables<"document"> & {
  module: {
    id_module: string;
    titre: string;
  } | null;
};

const props = defineProps<{
  document: Document | null;
}>();

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  (e: "deleted"): void;
}>();

const toast = useToast();
const loading = ref(false);
const loadingUsage = ref(false);

// Données d'utilisation du document
const usage = ref<{
  coursUsingDocument: { id_cours: string; titre: string; ordre: number }[];
  coursCount: number;
} | null>(null);

// Charger les infos d'utilisation quand le modal s'ouvre
watch(open, async (isOpen) => {
  if (isOpen && props.document) {
    await loadUsage();
  } else {
    usage.value = null;
  }
});

async function loadUsage() {
  if (!props.document) return;

  loadingUsage.value = true;
  try {
    const data = await $fetch(`/api/document/usage/${props.document.id_document}`);
    usage.value = data as any;
  } catch (err) { 
    usage.value = { coursUsingDocument: [], coursCount: 0 };
  } finally {
    loadingUsage.value = false;
  }
}

// Nom réel du fichier plutôt que le chemin de stockage (un UUID)
function getFileName(doc: Document): string {
  if (doc.nom_original) return doc.nom_original;
  try {
    const parts = doc.fichier.split("/");
    const last = parts[parts.length - 1];
    return last ? decodeURIComponent(last) : doc.fichier;
  } catch {
    return doc.fichier;
  }
}

// Supprimer le document
async function deleteDocument() {
  if (!props.document) return;

  loading.value = true;
  try {
    const result = await $fetch("/api/document/delete", {
      method: "DELETE",
      body: { id: props.document.id_document },
    });

    const coursImpacted = (result as any).coursImpacted || 0;

    toast.add({
      title: "Document supprimé",
      description: coursImpacted > 0
        ? `Le document a été retiré de ${coursImpacted} cours`
        : "Le document a été supprimé avec succès",
      color: "success",
    });

    open.value = false;
    emit("deleted");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.statusMessage || "Impossible de supprimer le document",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Supprimer le document" :description="document ? `Suppression du document ${getFileName(document)}` : ''">
    <template #body>
      <div v-if="document" class="space-y-4">
        <!-- Info du document -->
        <div class="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
          <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <UIcon name="i-lucide-file" class="text-primary text-xl" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium truncate">{{ getFileName(document) }}</p>
            <p v-if="document.module" class="text-sm text-muted">
              Module : {{ document.module.titre }}
            </p>
          </div>
        </div>

        <!-- Avertissement principal -->
        <div class="flex items-start gap-3 p-4 bg-error/10 border border-error/20 rounded-lg">
          <UIcon name="i-lucide-alert-triangle" class="text-error text-xl mt-0.5 shrink-0" />
          <div>
            <p class="font-medium">Êtes-vous sûr de vouloir supprimer ce document ?</p>
            <p class="text-sm text-muted mt-1">
              Cette action est irréversible. Le fichier sera supprimé du stockage.
            </p>
          </div>
        </div>

        <!-- Chargement des infos d'utilisation -->
        <div v-if="loadingUsage" class="flex items-center justify-center py-4">
          <UIcon name="i-lucide-loader-circle" class="animate-spin text-2xl text-muted" />
          <span class="ml-2 text-muted">Vérification des dépendances...</span>
        </div>

        <!-- Cours impactés -->
        <div v-else-if="usage && usage.coursCount > 0" class="space-y-3">
          <div class="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <UIcon name="i-lucide-link" class="text-warning text-xl mt-0.5 shrink-0" />
            <div>
              <p class="font-medium">
                Ce document est utilisé dans {{ usage.coursCount }} cours
              </p>
              <p class="text-sm text-muted mt-1">
                La suppression retirera automatiquement ce document des cours suivants :
              </p>
            </div>
          </div>

          <!-- Liste des cours -->
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="cours in usage.coursUsingDocument"
              :key="cours.id_cours"
              class="flex items-center gap-3 p-3 bg-muted/20 rounded-lg"
            >
              <span class="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {{ cours.ordre }}
              </span>
              <span class="text-sm font-medium truncate">{{ cours.titre }}</span>
            </div>
          </div>
        </div>

        <!-- Aucune dépendance -->
        <div v-else-if="usage && usage.coursCount === 0" class="flex items-start gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
          <UIcon name="i-lucide-check-circle" class="text-success text-xl mt-0.5 shrink-0" />
          <div>
            <p class="font-medium">Aucune dépendance détectée</p>
            <p class="text-sm text-muted mt-1">
              Ce document n'est associé à aucun cours. Il peut être supprimé en toute sécurité.
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          label="Annuler"
          color="neutral"
          variant="outline"
          :disabled="loading"
          @click="open = false"
        />
        <UButton
          label="Supprimer définitivement"
          color="error"
          icon="i-lucide-trash-2"
          :loading="loading"
          :disabled="loadingUsage"
          @click="deleteDocument"
        />
      </div>
    </template>
  </UModal>
</template>
