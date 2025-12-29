<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const emit = defineEmits(["adddepartement"]);

const schema = z.object({
  designation: z.string().max(50, "Le nombre maximum de caractères est de 50"), 
});
const open = ref(false);

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  designation: undefined,
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await $fetch("/api/departement/adddepartement", {
      method: "POST",
      body: {
        designation: event.data.designation,
      },
    });

    // SUCCESS → toast + reset
    toast.add({
      title: "Succès",
      description: `Nouveau département « ${event.data.designation} » ajouté`,
      color: "success",
    });

    emit("adddepartement");
    state.designation = "";
    open.value = false;

  } catch (err: any) {
    console.error("Erreur API :", err);

    const message = err?.data?.message || err?.statusMessage || err?.message || "";

    // Cas 1 → Duplicate key PostgreSQL
    if (message.includes("duplicate key") || message.includes("unique constraint")) {
      toast.add({
        title: "Échec",
        description: "Ce département est déjà en place! Veuillez en ajouter un autre.",
        color: "error",
      });
      return;
    }

    // Cas 2 → Autres erreurs connues
    if (err?.statusCode === 400) {
      toast.add({ title: "Erreur", description: "Requête invalide.", color: "error" });
      return;
    }

    // Cas 3 → erreur inconnue
    toast.add({
      title: "Erreur inattendue",
      description: "Veuillez réessayer plus tard.",
      color: "error",
    });
  }
}

function resetForm() {
  // Vider les champs du formulaire
  state.designation = "";
  // Fermer la modale
  open.value = false;
}

</script>

<template>
  <UModal
    v-model:open="open"
    title="Nouveau Département"
    description="Ajouter un nouveau département"
  >
    <UButton label="Nouveau Département" icon="i-lucide-plus" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Designation"
          name="designation"
        >
          <UInput v-model="state.designation" class="w-full" placeholder="Désignation du département" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            label="Annuler"
            color="neutral"
            variant="subtle"
            @click="resetForm()"
          />
          <UButton
            label="Ajouter"
            color="primary"
            variant="solid"
            type="submit"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
