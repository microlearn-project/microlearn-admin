<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Document = Tables<"document">;

const props = defineProps<{
  documents: Document[];
}>();

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  (e: "deleted"): void;
}>();

const toast = useToast();
const loading = ref(false);
const loadingUsage = ref(false);

// Usage par document (nombre de cours impactés) — chargé à l'ouverture,
// même logique que DocumentsDeleteModal mais agrégée pour plusieurs fichiers.
const usageByDocument = ref<Record<string, number>>({});

watch(open, async (isOpen) => {
  if (isOpen) {
    await loadUsage();
  } else {
    usageByDocument.value = {};
  }
});

async function loadUsage() {
  loadingUsage.value = true;
  try {
    const results = await Promise.all(
      props.documents.map(async (doc) => {
        try {
          const data = await $fetch<{ coursCount: number }>(
            `/api/document/usage/${doc.id_document}`
          );
          return [doc.id_document, data.coursCount] as const;
        } catch {
          return [doc.id_document, 0] as const;
        }
      })
    );
    usageByDocument.value = Object.fromEntries(results);
  } finally {
    loadingUsage.value = false;
  }
}

const totalCoursImpacted = computed(() =>
  Object.values(usageByDocument.value).reduce((sum, n) => sum + n, 0)
);
const documentsInUse = computed(
  () => Object.values(usageByDocument.value).filter((n) => n > 0).length
);

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

async function deleteDocuments() {
  if (props.documents.length === 0) return;

  loading.value = true;
  try {
    let totalCoursImpacted = 0;
    for (const doc of props.documents) {
      const result = await $fetch<{ coursImpacted?: number }>(
        "/api/document/delete",
        { method: "DELETE", body: { id: doc.id_document } }
      );
      totalCoursImpacted += result.coursImpacted || 0;
    }

    toast.add({
      title: "Documents supprimés",
      description:
        totalCoursImpacted > 0
          ? `${props.documents.length} document(s) supprimé(s), ${totalCoursImpacted} cours mis à jour`
          : `${props.documents.length} document(s) supprimé(s)`,
      color: "success",
    });

    open.value = false;
    emit("deleted");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.message || "Impossible de supprimer les documents",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Supprimer les documents"
    :description="`Suppression de ${documents.length} document(s)`"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Avertissement principal -->
        <div class="flex items-start gap-3 p-4 bg-error/10 border border-error/20 rounded-lg">
          <UIcon name="i-lucide-alert-triangle" class="text-error text-xl mt-0.5 shrink-0" />
          <div>
            <p class="font-medium">
              Êtes-vous sûr de vouloir supprimer {{ documents.length }} document(s) ?
            </p>
            <p class="text-sm text-muted mt-1">
              Cette action est irréversible. Les fichiers seront supprimés du stockage.
            </p>
          </div>
        </div>

        <!-- Chargement des infos d'utilisation -->
        <div v-if="loadingUsage" class="flex items-center justify-center py-4">
          <UIcon name="i-lucide-loader-circle" class="animate-spin text-2xl text-muted" />
          <span class="ml-2 text-muted">Vérification des dépendances...</span>
        </div>

        <!-- Dépendances détectées -->
        <div
          v-else-if="documentsInUse > 0"
          class="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg"
        >
          <UIcon name="i-lucide-link" class="text-warning text-xl mt-0.5 shrink-0" />
          <div>
            <p class="font-medium">
              {{ documentsInUse }} document(s) sur {{ documents.length }} sont utilisés
            </p>
            <p class="text-sm text-muted mt-1">
              La suppression retirera automatiquement ces documents de
              {{ totalCoursImpacted }} cours au total.
            </p>
          </div>
        </div>

        <div
          v-else
          class="flex items-start gap-3 p-4 bg-success/10 border border-success/20 rounded-lg"
        >
          <UIcon name="i-lucide-check-circle" class="text-success text-xl mt-0.5 shrink-0" />
          <p class="text-sm">Aucun de ces documents n'est associé à un cours.</p>
        </div>

        <!-- Liste des documents -->
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="doc in documents"
            :key="doc.id_document"
            class="flex items-center gap-3 p-2 bg-muted/20 rounded-lg"
          >
            <UIcon name="i-lucide-file" class="text-primary shrink-0" />
            <span class="text-sm font-medium truncate flex-1">
              {{ getFileName(doc) }}
            </span>
            <UBadge
              v-if="!loadingUsage && usageByDocument[doc.id_document]"
              color="warning"
              variant="subtle"
              size="xs"
            >
              {{ usageByDocument[doc.id_document] }} cours
            </UBadge>
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
          @click="deleteDocuments"
        />
      </div>
    </template>
  </UModal>
</template>
