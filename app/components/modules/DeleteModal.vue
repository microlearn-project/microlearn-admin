<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;

withDefaults(
  defineProps<{
    rows: Module[];
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
  await $fetch(`/api/module/soft-delete`, {
    method: "PATCH",
    body: {
      id: id,
    },
  });
};

// Le texte de confirmation
function confirmationLines(rows: Module[]): string[] {
  return rows.map((r) => `« ${r.titre} »`);
}

// Test si la modale est ouverte
const open = ref(false);

watch(open, (newValue) => {
  if (!newValue) {
    // La modale vient d'être fermée (par la croix, Esc, overlay, etc.)
    emit("clear-selection");
  }
});

// Soumission de la suppression
async function onSubmit(rows: Array<any>) {
  try {
    await Promise.all(rows.map((r) => softDelete(String(r.id_module))));
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
    :title="`Supprimer ${count} module${count > 1 ? 's' : ''}`"
    :description="`Êtes-vous sûr ? `"
  >
    <slot />
    <template #body>
      <div class="space-y-4">
        <div v-if="rows.length > 1">
          <p class="font-medium">Les modules suivants seront supprimés :</p>
          <ul class="list-disc pl-5 space-y-1">
            <li v-for="(line, i) in confirmationLines(rows)" :key="i">
              {{ line }}
            </li>
          </ul>
        </div>

        <div v-else>
          <p>
            Le module <strong>« {{ rows[0]?.titre }} »</strong> sera supprimé.
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
