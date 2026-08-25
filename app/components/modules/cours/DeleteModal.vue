<script setup lang="ts">
import type { Tables } from "~/types/database.types";

// documents n'est plus une colonne de la table cours (dérivé côté API,
// cours_document) — omis ici pour rester compatible avec l'objet enrichi
// que Step2Cours.vue transmet.
type Cours = Omit<Tables<"cours">, "documents">;

const props = defineProps<{
  cours: Cours;
}>();

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  (e: "deleted"): void;
}>();

const toast = useToast();
const deleting = ref(false);

async function onDelete() {
  deleting.value = true;

  try {
    await $fetch("/api/cours/soft-delete", {
      method: "PATCH",
      body: {
        id: props.cours.id_cours,
      },
    });

    toast.add({
      title: "Succès",
      description: "Cours supprimé",
      color: "success",
    });

    open.value = false;
    emit("deleted");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.statusMessage || "Impossible de supprimer le cours",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Supprimer le cours">
    <template #body>
      <div class="space-y-4">
        <div class="flex items-start gap-4">
          <div
            class="shrink-0 w-12 h-12 rounded-full bg-error/10 flex items-center justify-center"
          >
            <UIcon name="i-lucide-trash-2" class="text-2xl text-error" />
          </div>
          <div>
            <p class="font-medium">
              Êtes-vous sûr de vouloir supprimer ce cours ?
            </p>
            <p class="text-sm text-muted mt-1">
              Le cours "<strong>{{ cours.titre }}</strong>" sera supprimé. Cette action est irréversible.
            </p>
          </div>
        </div>

        <div class="bg-warning/10 border border-warning/20 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-triangle-alert" class="text-warning mt-0.5" />
            <p class="text-sm">
              Si un quiz est associé à ce cours, il sera également supprimé.
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <UButton
            label="Annuler"
            color="neutral"
            variant="outline"
            :disabled="deleting"
            @click="open = false"
          />
          <UButton
            label="Supprimer"
            color="error"
            icon="i-lucide-trash-2"
            :loading="deleting"
            @click="onDelete"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
