<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;

const props = defineProps<{
  module: Module;
}>();

const emit = defineEmits<{
  (e: "next"): void;
  (e: "refresh"): void;
}>();

const toast = useToast();

/* ---------------------------------------------------
   1. Validation du formulaire
----------------------------------------------------*/
const schema = z.object({
  titre: z.string().min(3).max(255),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  titre: props.module.titre,
});

// Description gérée séparément (éditeur WYSIWYG)
const description = ref(props.module.description);

/* ---------------------------------------------------
   2. Modals pour gérer les associations
----------------------------------------------------*/
const showCategoriesModal = ref(false);
const showServicesModal = ref(false);
const showDocumentsModal = ref(false);

/* ---------------------------------------------------
   3. Soumission
----------------------------------------------------*/
const submitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!description.value || description.value.trim() === "") {
    toast.add({
      title: "Erreur",
      description: "La description est requise",
      color: "error",
    });
    return;
  }

  submitting.value = true;

  try {
    await $fetch(`/api/module/update`, {
      method: "PATCH",
      body: {
        id: props.module.id_module,
        titre: event.data.titre,
        description: description.value,
      },
    });

    toast.add({
      title: "Succès",
      description: "Détails du module mis à jour",
      color: "success",
    });

    emit("refresh");
    emit("next");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.message || "Impossible de mettre à jour le module",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold mb-2">Détails du module</h2>
      <p class="text-muted">
        Modifiez les informations principales et gérez les associations.
      </p>
    </div>

    <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
      <!-- Titre -->
      <UFormField label="Titre du module" name="titre" required>
        <UInput v-model="state.titre" size="xl" class="w-full" />
      </UFormField>

      <!-- Description -->
      <UFormField label="Description" required>
        <ModulesCreateEditor v-model="description" :module-id="module.id_module" />
      </UFormField>

      <!-- Durée (calculée automatiquement à partir des cours) -->
      <UFormField label="Durée de lecture estimée">
        <div class="flex items-center gap-2 text-muted">
          <UIcon name="i-lucide-clock" />
          <span>{{ module.duree_lecture }}</span>
          <span class="text-xs">(calculée à partir des cours de l'étape 2)</span>
        </div>
      </UFormField>

      <!-- Associations -->
      <div class="space-y-4 pt-4 border-t border-default">
        <h3 class="font-semibold">Associations</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Catégories -->
          <div class="border border-default rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-tags" class="text-primary" />
                <span class="font-medium">Catégories</span>
              </div>
            </div>
            <UButton
              label="Gérer"
              color="neutral"
              variant="outline"
              block
              @click="showCategoriesModal = true"
            />
          </div>

          <!-- Départements -->
          <div class="border border-default rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-briefcase" class="text-primary" />
                <span class="font-medium">Départements</span>
              </div>
            </div>
            <UButton
              label="Gérer"
              color="neutral"
              variant="outline"
              block
              @click="showServicesModal = true"
            />
          </div>

          <!-- Documents -->
          <div class="border border-default rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-file-text" class="text-primary" />
                <span class="font-medium">Documents</span>
              </div>
            </div>
            <UButton
              label="Gérer"
              color="neutral"
              variant="outline"
              block
              @click="showDocumentsModal = true"
            />
          </div>
        </div>
      </div>

      <!-- Boutons -->
      <div class="flex justify-end gap-3 pt-6 border-t border-default">
        <UButton
          label="Enregistrer et continuer"
          type="submit"
          color="primary"
          icon="i-lucide-arrow-right"
          trailing
          :loading="submitting"
        />
      </div>
    </UForm>

    <!-- Modals -->
    <ModulesCategoriesModal
      v-if="showCategoriesModal"
      v-model:open="showCategoriesModal"
      :module="module"
    />

    <ModulesDepartementsModal
      v-if="showServicesModal"
      v-model:open="showServicesModal"
      :module="module"
    />

    <ModulesDocumentsModal
      v-if="showDocumentsModal"
      v-model:open="showDocumentsModal"
      :module="module"
    />
  </div>
</template>
