<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Agent = Tables<"agent">;

const props = defineProps<{
  count: number;
  rows: Agent[];
}>();

const emit = defineEmits<{
  (e: "deleted"): void;
  (e: "clear-selection"): void;
}>();

const toast = useToast();
const open = ref(false);
const loading = ref(false);

async function deleteAgents() {
  if (props.rows.length === 0) return;

  loading.value = true;

  try {
    for (const agent of props.rows) {
      await $fetch("/api/agent/soft-delete", {
        method: "PATCH",
        body: { id: agent.id_agent },
      });
    }

    toast.add({
      title: "Succès",
      description: `${props.rows.length} agent(s) supprimé(s)`,
      color: "success",
    });

    open.value = false;
    emit("deleted");
    emit("clear-selection");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.statusMessage || "Erreur lors de la suppression",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}  

watch(open, (newValue) => {
  if (!newValue) {
    // La modale vient d'être fermée (par la croix, Esc, overlay, etc.)
    emit("clear-selection")
  }
})
</script>

<template>
  <div @click="open = true">
    <slot />
  </div>

  <UModal v-model:open="open" title="Supprimer les agents" :description="`Confirmer la suppression`">
    <template #body>
      <div class="space-y-4">
        <div class="flex items-start gap-3 p-4 bg-error/10 border border-error/20 rounded-lg">
          <UIcon name="i-lucide-alert-triangle" class="text-error text-xl mt-0.5" />
          <div>
            <p class="font-medium">Êtes-vous sûr de vouloir supprimer {{ count }} agent(s) ?</p>
            <p class="text-sm text-muted mt-1">
              Cette action désactivera les agents et les marquera comme supprimés.
              Leurs données historiques seront conservées.
            </p>
          </div>
        </div>

        <!-- Liste des agents à supprimer -->
        <div v-if="rows.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="agent in rows"
            :key="agent.id_agent"
            class="flex items-center gap-3 p-2 bg-muted/20 rounded-lg"
          >
            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
              {{ agent.prenom[0] }}{{ agent.nom[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ agent.prenom }} {{ agent.nom }}</p>
              <p class="text-xs text-muted truncate">{{ agent.email }}</p>
            </div>
            <code class="text-xs text-muted">{{ agent.code_agent }}</code>
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
          label="Supprimer"
          color="error"
          :loading="loading"
          @click="deleteAgents"
        />
      </div>
    </template>
  </UModal>
</template>
