<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const props = defineProps<{
  moduleId: string;
}>();

const open = defineModel<boolean>("open", { default: false });
useModalEscapeOnly(open);

const emit = defineEmits<{
  (e: "created"): void;
}>();

const toast = useToast();

const schema = z.object({
  titre: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(255),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({ titre: "" });
const description = ref("");
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
    await $fetch("/api/cours/create", {
      method: "POST",
      body: {
        titre: event.data.titre,
        description: description.value,
        documents: [],
        id_module: props.moduleId,
      },
    });

    toast.add({
      title: "Succès",
      description: "Cours créé avec succès",
      color: "success",
    });

    state.titre = "";
    description.value = "";
    open.value = false;
    emit("created");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.statusMessage || "Impossible de créer le cours",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}

function onClose() {
  // Les vidéos orphelines éventuelles seront nettoyées par Edge Function nocturne 
  state.titre = "";
  description.value = "";
  open.value = false;
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="'Ajouter un cours'"
    :ui="{ content: 'max-w-5xl' }"
    :dismissible="false"
    @close="onClose"
    :description="'Créez un nouveau cours pour ce module. '"
  >
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Titre du cours" name="titre" required>
          <UInput
            v-model="state.titre"
            placeholder="Ex: Introduction aux bases"
            autofocus
          />
        </UFormField>

        <UFormField label="Contenu du cours" required>
          <ModulesCreateEditor
            v-model="description"
            :module-id="moduleId"
          />
        </UFormField>

        <p class="text-xs text-muted">
          <UIcon name="i-lucide-info" class="inline mr-1" />
          La durée de lecture sera estimée automatiquement en fonction du contenu.
        </p>

        <div class="flex justify-end gap-3 pt-4">
          <UButton
            label="Annuler"
            color="neutral"
            variant="outline"
            :disabled="submitting"
            @click="onClose"
          />
          <UButton
            label="Créer le cours"
            type="submit"
            color="primary"
            :loading="submitting"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
