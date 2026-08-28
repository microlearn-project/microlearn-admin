<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Tag = Tables<"tag">;

withDefaults(
  defineProps<{
    rows: Tag[];
    count?: number;
  }>(),
  {
    count: 0,
  }
);

const emit = defineEmits<{
  (e: "deleted"): void;
  (e: "clear-selection"): void;
}>();

const toast = useToast();
const open = defineModel<boolean>("open", { default: false });

// La suppression forcée (DELETE /tags/:id/force) est restreinte à SUPERADMIN
// côté API — sans ce garde, un ADMIN/FORMATEUR se prenait un 403 brut sans
// explication en cliquant "Supprimer quand même".
const { hasRole } = useAuth();
const canForceDelete = computed(() => hasRole("SUPERADMIN"));

// État de la modale de confirmation (tag utilisé dans des modules)
const confirmModal = ref(false);
const affectedModules = ref<{ id_module: string; titre: string }[]>([]);
const tagToForceDelete = ref<Tag | null>(null);
const forceLoading = ref(false);

watch(open, (newValue) => {
  if (!newValue) {
    emit("clear-selection");
  }
});

// Suppression d'un tag (vérifie d'abord s'il est utilisé)
async function deleteTag(tag: Tag) {
  const result = await $fetch<{
    requiresConfirmation: boolean;
    modules?: { id_module: string; titre: string }[];
  }>("/api/tag/soft-delete", {
    method: "PATCH",
    body: { id: tag.id_tag },
  });

  if (result.requiresConfirmation && result.modules?.length) {
    // Tag utilisé → ouvrir la modale de confirmation
    affectedModules.value = result.modules;
    tagToForceDelete.value = tag;
    confirmModal.value = true;
    return false; // pas encore supprimé
  }

  return true; // supprimé directement
}

// Soumission principale (suppression simple ou multiple)
async function onSubmit(rows: Tag[]) {
  const deleted: Tag[] = [];
  const needsConfirm: Tag[] = [];

  try {
    for (const tag of rows) {
      const done = await deleteTag(tag);
      if (done) {
        deleted.push(tag);
      } else {
        needsConfirm.push(tag);
      }
    }

    if (deleted.length > 0) {
      toast.add({
        title: `${deleted.length} catégorie(s) supprimée(s)`,
        color: "success",
      });
      emit("deleted");
    }

    // Si au moins un tag nécessite confirmation, on garde la modale ouverte
    if (needsConfirm.length === 0) {
      emit("clear-selection");
      open.value = false;
    }
  } catch (err) {
    toast.add({
      title: "Erreur",
      description: (err as Error).message,
      color: "error",
    });
  }
}

// Confirmer la suppression forcée (désassociation + hard-delete)
async function onConfirmForceDelete() {
  if (!tagToForceDelete.value) return;

  forceLoading.value = true;

  try {
    await $fetch("/api/tag/force-delete", {
      method: "POST",
      body: { id: tagToForceDelete.value.id_tag },
    });

    toast.add({
      title: "Catégorie supprimée",
      description: `« ${tagToForceDelete.value.designation} » et ses associations ont été supprimées`,
      color: "success",
    });

    emit("deleted");
    emit("clear-selection");
    confirmModal.value = false;
    open.value = false;
  } catch (err) {
    toast.add({
      title: "Erreur",
      description: (err as Error).message,
      color: "error",
    });
  } finally {
    forceLoading.value = false;
    tagToForceDelete.value = null;
    affectedModules.value = [];
  }
}

// Annuler la suppression forcée
function onCancelForceDelete() {
  confirmModal.value = false;
  tagToForceDelete.value = null;
  affectedModules.value = [];
  open.value = false;
  emit("clear-selection");
}

function clear_selection() {
  open.value = false;
  emit("clear-selection");
}

function confirmationLines(rows: Tag[]): string[] {
  return rows.map((r) => `« ${r.designation} »`);
}
</script>

<template>
  <!-- Modale principale de suppression -->
  <UModal
    v-model:open="open"
    :title="`Supprimer ${count} catégorie${count > 1 ? 's' : ''}`"
    description="Êtes-vous sûr ?"
  >
    <slot />
    <template #body>
      <div class="space-y-4">
        <div v-if="rows.length > 1">
          <p class="font-medium">
            Les catégories suivantes seront supprimées :
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li v-for="(line, i) in confirmationLines(rows)" :key="i">
              {{ line }}
            </li>
          </ul>
        </div>

        <div v-else>
          <p>
            La catégorie <strong>« {{ rows[0]?.designation }} »</strong> sera
            supprimée.
          </p>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <UButton
            label="Annuler"
            color="neutral"
            variant="subtle"
            @click="clear_selection()"
          />
          <UButton
            label="Supprimer"
            color="error"
            variant="solid"
            loading-auto
            @click="onSubmit(rows)"
          />
        </div>
      </div>
    </template>
  </UModal>

  <!-- Modale de confirmation (tag utilisé dans des modules) -->
  <UModal
    v-model:open="confirmModal"
    title="Cette catégorie est utilisée"
    :ui="{ content: 'sm:max-w-lg' }"
    :description="`La catégorie « ${tagToForceDelete?.designation} » est associée à des modules. Voulez-vous la supprimer quand même ?`"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Avertissement -->
        <div class="flex items-start gap-3 p-4 bg-error/10 border border-error/20 rounded-lg">
          <UIcon name="i-lucide-triangle-alert" class="text-error text-xl mt-0.5 shrink-0" />
          <div>
            <p class="font-medium text-error">
              « {{ tagToForceDelete?.designation }} » est associée à
              {{ affectedModules.length }} module{{ affectedModules.length > 1 ? 's' : '' }}
            </p>
            <p class="text-sm text-muted mt-1">
              En confirmant, l'association avec ces modules sera supprimée
              et la catégorie sera définitivement effacée.
            </p>
          </div>
        </div>

        <!-- Liste des modules affectés -->
        <div>
          <p class="text-sm font-medium mb-2">Modules affectés :</p>
          <ul class="space-y-1 max-h-48 overflow-y-auto">
            <li
              v-for="module in affectedModules"
              :key="module.id_module"
              class="flex items-center gap-2 p-2 bg-elevated rounded-lg text-sm"
            >
              <UIcon name="i-lucide-book-open" class="text-muted shrink-0" />
              <span class="truncate">{{ module.titre }}</span>
            </li>
          </ul>
        </div>

        <!-- Info supplémentaire -->
        <div
          v-if="canForceDelete"
          class="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm"
        >
          <UIcon name="i-lucide-info" class="text-warning mt-0.5 shrink-0" />
          <p class="text-muted">
            Cette action est <strong>irréversible</strong>. Les modules listés
            ci-dessus ne seront pas supprimés — uniquement l'association avec
            cette catégorie sera retirée.
          </p>
        </div>

        <!-- Non-SUPERADMIN : la suppression forcée est restreinte côté API -->
        <div
          v-else
          class="flex items-start gap-2 p-3 bg-info/10 border border-info/20 rounded-lg text-sm"
        >
          <UIcon name="i-lucide-shield-alert" class="text-info mt-0.5 shrink-0" />
          <p class="text-muted">
            Seul un <strong>SUPERADMIN</strong> peut forcer la suppression
            d'une catégorie encore utilisée. Retirez-la d'abord des modules
            listés ci-dessus, ou contactez un SUPERADMIN.
          </p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <UButton
            :label="canForceDelete ? 'Annuler' : 'Fermer'"
            color="neutral"
            variant="outline"
            :disabled="forceLoading"
            @click="onCancelForceDelete"
          />
          <UButton
            v-if="canForceDelete"
            label="Supprimer quand même"
            color="error"
            variant="solid"
            icon="i-lucide-trash-2"
            :loading="forceLoading"
            @click="onConfirmForceDelete"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
