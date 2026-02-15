<script setup lang="ts">
import * as z from "zod"
import type { FormSubmitEvent } from "@nuxt/ui"
import type { Tables } from "~/types/database.types"

type Departement = Tables<"departement">

/* -------------------------
   Props
--------------------------*/
const props = defineProps<{
  rows: Departement[]
}>()

/* -------------------------
   Emits
--------------------------*/
const emit = defineEmits<{
  (e: "updatedepartement"): void
  (e: "clear-selection"): void
}>()

/* -------------------------
   Validation
--------------------------*/
const schema = z.object({
  designation: z.string().max(50),
})

type Schema = z.output<typeof schema>

/* -------------------------
   State du formulaire
--------------------------*/
const state = reactive<Partial<Schema>>({
  designation: "",
})

// Transformer la désignation en majuscules automatiquement
const designationUppercase = computed({
  get: () => state.designation,
  set: (value: string) => {
    state.designation = value.toUpperCase();
  },
});

/* -------------------------
   Département courant (1 seul)
--------------------------*/
const currentDepartement = computed(() => props.rows[0])

/* -------------------------
   Sync props → form
--------------------------*/
watch(
  currentDepartement,
  (departement) => {
    if (!departement) return

    state.designation = departement.designation
  },
  { immediate: true }
)

const toast = useToast()
const open = ref(false)

/* -------------------------
   Submit
--------------------------*/
async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!currentDepartement.value) return

  const oldDesignation = currentDepartement.value.designation;

  try {
    await $fetch("/api/departement/updatedepartement", {
      method: "PATCH",
      body: {
        id: currentDepartement.value.id_departement,
        designation: event.data.designation,
      },
    })

    toast.add({
      title: "Succès",
      description: `Département mis à jour de « ${oldDesignation} » vers « ${event.data.designation} » avec succès.`,
      color: "success",
    })

    emit("updatedepartement")
    emit("clear-selection")
  } catch (err: any) {
    const message =
      err?.data?.message || err?.statusMessage || err?.message || ""

    if (message.includes("duplicate") || message.includes("unique")) {
      toast.add({
        title: "Échec",
        description: "Ce département existe déjà.",
        color: "error",
      })
      return
    }

    toast.add({
      title: "Erreur",
      description: "Un problème est survenu.",
      color: "error",
    })
  }

  open.value = false
}


// Fonction pour nettoyer la sélection
function clear_selection() {
  // Fermer la modale
  open.value = false
  // Désélectionner toutes les lignes
  emit("clear-selection")
}

watch(open, (newValue) => {
  if (!newValue) {
    // La modale vient d'être fermée
    emit("clear-selection")
  }
})
</script>
<template>
  <UModal v-model:open="open" title="Modifier le département" :description="`Modifier les informations du département sélectionné.`">
    <slot />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        @submit="onSubmit"
        class="space-y-4"
      >
        <UFormField label="Désignation" name="designation">
          <UInput v-model="designationUppercase" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="subtle" @click="clear_selection()">
            Annuler
          </UButton>
          <UButton type="submit" color="primary" :disabled="props.rows.length !== 1">
            Mettre à jour
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
