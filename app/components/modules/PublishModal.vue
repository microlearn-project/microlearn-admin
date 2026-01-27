<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;

const props = defineProps<{
  module: Module;
}>();

// Définir les événements émis
const emit = defineEmits<{
  (e: "published"): void;
}>();

const toast = useToast();
const open = defineModel<boolean>('open', { default: false });
const loading = ref(false);

// Fonction de publication
const publishModule = async (id: string) => {
  loading.value = true;
  try {
    await $fetch(`/api/module/publish`, {
      method: "PATCH",
      body: {
        id: id,
      },
    });

    toast.add({
      title: "Succès",
      description: `Module « ${props.module.titre} » publié avec succès`,
      color: "success",
    });

    emit("published");
    open.value = false;
  } catch (err: any) { 

    const message = err?.data?.message || err?.statusMessage || err?.message || "";

    toast.add({
      title: "Erreur",
      description: message || "Impossible de publier le module",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Fonction pour soumettre
async function onSubmit() {
  await publishModule(props.module.id_module);
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Publier le module"
    description="Confirmer la publication de ce module"
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <div class="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-info" class="text-primary mt-0.5 shrink-0" />
            <div class="space-y-2">
              <p class="font-medium text-sm">
                Vous êtes sur le point de publier le module :
              </p>
              <p class="text-lg font-bold">
                « {{ module.titre }} »
              </p>
              <div class="text-sm text-muted space-y-1 mt-2">
                <p>• Durée de lecture : {{ module.duree_lecture }}</p>
                <p>• Créé le : {{ new Date(module.created_at).toLocaleDateString('fr-FR') }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-alert-triangle" class="text-warning mt-0.5 shrink-0" />
            <div class="text-sm">
              <p class="font-medium mb-1">Attention</p>
              <p class="text-muted">
                Une fois publié, le module sera visible par les utilisateurs concernés.
                La date de publication sera enregistrée automatiquement.
              </p>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <UButton
            label="Annuler"
            color="neutral"
            variant="subtle"
            :disabled="loading"
            @click="open = false"
          />
          <UButton
            label="Publier"
            color="primary"
            variant="solid"
            icon="i-lucide-upload"
            :loading="loading"
            @click="onSubmit"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
