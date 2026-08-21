<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";

// documents n'est plus une colonne de la table cours (dérivé côté API,
// cours_document) — omis ici pour rester compatible avec l'objet enrichi
// que Step2Cours.vue transmet.
type Cours = Omit<Tables<"cours">, "documents">;

const props = defineProps<{
  cours: Cours;
  moduleId: string;
}>();

const open = defineModel<boolean>("open", { default: false });
useModalEscapeOnly(open);

const emit = defineEmits<{
  (e: "updated"): void;
}>();

const toast = useToast();

const schema = z.object({
  titre: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(255),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({ titre: props.cours.titre });
const description = ref(props.cours.description);
const submitting = ref(false);

watch(
  () => props.cours,
  (newCours) => {
    state.titre = newCours.titre;
    description.value = newCours.description;
  }
);

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
    await $fetch("/api/cours/update", {
      method: "PATCH",
      body: {
        id: props.cours.id_cours,
        titre: event.data.titre,
        description: description.value,
      },
    });

    toast.add({
      title: "Succès",
      description: "Cours mis à jour",
      color: "success",
    });

    open.value = false;
    emit("updated");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.statusMessage || "Impossible de mettre à jour le cours",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}

function onClose() {
  // Les vidéos orphelines éventuelles seront nettoyées par Edge Function nocturne
  open.value = false;
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Modification`"
    :description="`Cours : ${cours.titre}`"
    :ui="{ content: 'max-w-5xl' }"
    :dismissible="false"
    @close="onClose"
  >
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Titre du cours" name="titre" required>
          <UInput v-model="state.titre" autofocus />
        </UFormField>

        <UFormField label="Contenu du cours" required>
          <ModulesCreateEditor
            v-model="description"
            :module-id="moduleId"
            :cours-id="cours.id_cours"
          />
        </UFormField>

        <p class="text-xs text-muted">
          <UIcon name="i-lucide-info" class="inline mr-1" />
          La durée de lecture sera recalculée automatiquement.
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
            label="Enregistrer"
            type="submit"
            color="primary"
            :loading="submitting"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
