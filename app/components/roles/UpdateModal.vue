<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";

type Role = Tables<"role">;

/* -------------------------
   Props
--------------------------*/
const props = defineProps<{
  rows: Role[];
}>();

/* -------------------------
   Emits
--------------------------*/
const emit = defineEmits<{
  (e: "updaterole"): void;
  (e: "clear-selection"): void;
}>();

/* -------------------------
   Validation
--------------------------*/
const schema = z.object({
  designation: z.string().max(50),
});

type Schema = z.output<typeof schema>;

/* -------------------------
   State du formulaire
--------------------------*/
const state = reactive<Partial<Schema>>({
  designation: "",
});

/* -------------------------
   Rôle courant (1 seul)
--------------------------*/
const currentRole = computed(() => props.rows[0]);


/* -------------------------
   Sync props → form
--------------------------*/
watch(
  currentRole,
  (role) => {
    if (!role) return;

    state.designation = role.designation;
  },
  { immediate: true }
);

const toast = useToast();
const open = ref(false);

/* -------------------------
   Submit
--------------------------*/
async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!currentRole.value) return;

  const oldDesignation = currentRole.value.designation;

  try {
    await $fetch("/api/role/updaterole", {
      method: "PATCH",
      body: {
        id: currentRole.value.id_role,
        designation: event.data.designation,
      },
    });

    toast.add({
      title: "Succès",
      description: `Rôle « ${oldDesignation} » mis à jour vers « ${event.data.designation} » avec succès.`,
      color: "success",
    });

    emit("updaterole");
    emit("clear-selection");
  } catch (err: any) {
    const message =
      err?.data?.message || err?.statusMessage || err?.message || "";

    if (message.includes("duplicate") || message.includes("unique")) {
      toast.add({
        title: "Échec",
        description: "Ce rôle existe déjà.",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Erreur",
      description: "Un problème est survenu.",
      color: "error",
    });
  }

  open.value = false;
}

// Fonction pour nettoyer la sélection
function clear_selection() {
  // Fermer la modale
  open.value = false
  // Désélectionner toutes les lignes
  emit("clear-selection")
}

// Watcher pour détecter la fermeture de la modale
watch(open, (newValue) => {
  if (!newValue) {
    // La modale vient d'être fermée (par la croix, Esc, overlay, etc.)
    emit("clear-selection")
  }
})
</script>
<template>
  <UModal v-model:open="open" title="Modifier le rôle" :description="`Modifier les informations du rôle sélectionnée.`">
    <slot />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        @submit="onSubmit"
        class="space-y-4"
      >
        <UFormField label="Désignation" name="designation">
          <UInput v-model="state.designation" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="subtle" @click="clear_selection()">
            Annuler
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :disabled="props.rows.length !== 1"
          >
            Mettre à jour
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
