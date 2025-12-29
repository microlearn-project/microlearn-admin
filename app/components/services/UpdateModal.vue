<script setup lang="ts">
import * as z from "zod"
import type { FormSubmitEvent } from "@nuxt/ui"
import type { Tables } from "~/types/database.types"

type Service = Tables<"service">

/* -------------------------
   Props
--------------------------*/
const props = defineProps<{
  rows: Service[]
}>()

/* -------------------------
   Emits
--------------------------*/
const emit = defineEmits<{
  (e: "updateservice"): void
  (e: "clear-selection"): void
}>()

/* -------------------------
   Validation
--------------------------*/
const schema = z.object({
  designation: z.string().max(50),
  actif: z.boolean().default(false),
})

type Schema = z.output<typeof schema>

/* -------------------------
   State du formulaire
--------------------------*/
const state = reactive<Partial<Schema>>({
  designation: "",
  actif: false,
})

/* -------------------------
   Service courant (1 seul)
--------------------------*/
const currentService = computed(() => props.rows[0])

/* -------------------------
   Sync props → form
--------------------------*/
watch(
  currentService,
  (service) => {
    if (!service) return

    state.designation = service.designation
    state.actif = service.actif
  },
  { immediate: true }
)

const toast = useToast()
const open = ref(false)

/* -------------------------
   Submit
--------------------------*/
async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!currentService.value) return

  try {
    await $fetch("/api/service/updateservice", {
      method: "PATCH",
      body: {
        id: currentService.value.id_service,
        designation: event.data.designation,
        actif: event.data.actif,
      },
    })

    toast.add({
      title: "Succès",
      description: `Service « ${event.data.designation} » mis à jour`,
      color: "success",
    })

    emit("updateservice")
    emit("clear-selection")
  } catch (err: any) {
    const message =
      err?.data?.message || err?.statusMessage || err?.message || ""

    if (message.includes("duplicate") || message.includes("unique")) {
      toast.add({
        title: "Échec",
        description: "Cette désignation existe déjà.",
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
    // La modale vient d'être fermée (par la croix, Esc, overlay, etc.)
    emit("clear-selection")
  }
})
</script>
<template>
  <UModal v-model:open="open" title="Modifier le service" :description="`Modifier le service sélectionné.`">
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

        <UCheckbox
          v-model="state.actif"
          indicator="end"
          label="Actif ?"
          variant="card"
        />

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
