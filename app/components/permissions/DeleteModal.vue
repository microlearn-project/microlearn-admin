<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type UserRole = Tables<"user_role"> & {
  agent: {
    id_agent: string;
    code_agent: string;
    nom: string;
    prenom: string;
    email: string;
  };
  role: {
    id_role: string;
    designation: string;
  };
};

const props = defineProps<{
  count: number;
  rows: UserRole[];
  mode?: "revoke" | "delete";
}>();

const emit = defineEmits<{
  (e: "done"): void;
  (e: "clear-selection"): void;
}>();

const toast = useToast();
const open = ref(false);
const loading = ref(false);

const isDeleteMode = computed(() => props.mode === "delete");

async function execute() {
  if (props.rows.length === 0) return;

  loading.value = true;

  try {
    for (const ur of props.rows) {
      if (isDeleteMode.value) {
        await $fetch("/api/user-role/delete", {
          method: "DELETE",
          body: { id: ur.id_user_role },
        });
      } else {
        await $fetch("/api/user-role/revoke", {
          method: "PATCH",
          body: { id: ur.id_user_role },
        });
      }
    }

    toast.add({
      title: "Succès",
      description: isDeleteMode.value
        ? `${props.rows.length} attribution(s) supprimée(s)`
        : `${props.rows.length} attribution(s) révoquée(s)`,
      color: "success",
    });

    open.value = false;
    emit("done");
    emit("clear-selection");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.statusMessage || "Erreur lors de l'opération",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div @click="open = true">
    <slot />
  </div>

  <UModal
    v-model:open="open"
    :title="isDeleteMode ? 'Supprimer les attributions' : 'Révoquer les attributions'"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Avertissement -->
        <div
          class="flex items-start gap-3 p-4 rounded-lg"
          :class="isDeleteMode ? 'bg-error/10 border border-error/20' : 'bg-warning/10 border border-warning/20'"
        >
          <UIcon
            name="i-lucide-triangle-alert"
            :class="isDeleteMode ? 'text-error' : 'text-warning'"
            class="text-xl mt-0.5"
          />
          <div>
            <p class="font-medium">
              {{ isDeleteMode
                ? `Supprimer définitivement ${count} attribution(s) ?`
                : `Révoquer ${count} attribution(s) ?`
              }}
            </p>
            <p class="text-sm text-muted mt-1">
              {{ isDeleteMode
                ? "Cette action est irréversible. Les historiques seront perdus."
                : "Les agents perdront immédiatement leurs accès liés à ces rôles."
              }}
            </p>
          </div>
        </div>

        <!-- Liste des attributions -->
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="ur in rows"
            :key="ur.id_user_role"
            class="flex items-center gap-3 p-3 bg-muted/20 rounded-lg"
          >
            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
              {{ ur.agent.prenom[0] }}{{ ur.agent.nom[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ ur.agent.prenom }} {{ ur.agent.nom }}</p>
              <p class="text-xs text-muted">{{ ur.role.designation }}</p>
            </div>
            <UBadge
              :color="ur.valide ? 'success' : 'error'"
              variant="subtle"
              size="xs"
            >
              {{ ur.valide ? "Actif" : "Révoqué" }}
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
          :label="isDeleteMode ? 'Supprimer' : 'Révoquer'"
          :color="isDeleteMode ? 'error' : 'warning'"
          :loading="loading"
          @click="execute"
        />
      </div>
    </template>
  </UModal>
</template>
