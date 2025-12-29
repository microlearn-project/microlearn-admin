<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Role = Tables<"role">;

withDefaults(
  defineProps<{
    rows: Role[];
    count?: number;
  }>(),
  {
    count: 0,
  }
);

// Définir les événements émis
const emit = defineEmits<{
  (e: "deleted"): void;
  (e: "clear-selection"): void;
}>();

const toast = useToast();

// Fonction de suppression douce
const softDelete = async (id: string) => {
  await $fetch(`/api/role/soft-delete`, {
    method: "PATCH",
    body: {
      id: id,
    },
  });
};

// Test si la modale est ouverte
const open = ref(false);

watch(open, (newValue) => {
  if (!newValue) {
    // La modale vient d'être fermée
    emit("clear-selection");
  }
});

// Soumission de la suppression
async function onSubmit(rows: Array<any>) {
  try {
    await Promise.all(rows.map((r) => softDelete(String(r.id_tag))));
    toast.add({ title: `${rows.length} rôle(s) supprimé(s)` });
    emit("deleted");
    emit("clear-selection");
  } catch (err) {
    toast.add({
      title: "Erreur",
      description: (err as Error).message,
      color: "error",
    });
  }
  open.value = false;
}

// Le texte de confirmation
function confirmationLines(rows: Role[]): string[] {
  return rows.map((r) => `« ${r.designation} »`);
}

// Fonction pour nettoyer la sélection
function clear_selection() {
  // Fermer la modale
  open.value = false;
  // Désélectionner toutes les lignes
  emit("clear-selection");
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Supprimer ${count} rôles${count > 1 ? 's' : ''}`"
    :description="`Êtes-vous sûr ? `"
  >
    <slot />
    <template #body>
      <div class="space-y-4">
        <div v-if="rows.length > 1">
          <p class="font-medium">
            Les rôles suivants seront supprimés (action réversible) :
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li v-for="(line, i) in confirmationLines(rows)" :key="i">
              {{ line }}
            </li>
          </ul>
        </div>

        <div v-else>
          <p>
            Le rôle <strong>« {{ rows[0]?.designation }} »</strong> sera
            supprimé. Cette action est réversible.
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
</template>
