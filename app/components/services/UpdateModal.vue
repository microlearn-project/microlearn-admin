<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";

type Departement = Tables<"departement">;
type Direction = Tables<"direction">;

/* -------------------------
   Props
--------------------------*/
const props = defineProps<{
  rows: Departement[];
}>();

/* -------------------------
   Emits
--------------------------*/
const emit = defineEmits<{
  (e: "updateservice"): void;
  (e: "clear-selection"): void;
}>();

/* -------------------------
   Validation
--------------------------*/
const schema = z.object({
  designation: z.string().max(50),
  id_direction: z.string().uuid("Veuillez sélectionner une direction"),   
  actif: z.boolean().default(false),
});

type Schema = z.output<typeof schema>;

/* -------------------------
   Récupération directions
--------------------------*/
const { data: directions } = await useFetch<Direction[]>("/api/direction", {
  transform: (data) => data.filter((d) => d.actif && !d.deleted_at),
});

/* -------------------------
   State du formulaire
--------------------------*/
const state = reactive<Partial<Schema>>({
  designation: "",
  id_direction: undefined,   
  actif: false,
});

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
const currentService = computed(() => props.rows[0]);

/* -------------------------
   Sync props → form
--------------------------*/
watch(
  currentService,
  (service) => {
    if (!service) return;

    state.designation = service.designation;
    state.id_direction = service.id_direction;  
    state.actif = service.actif;
  },
  { immediate: true },
);

const toast = useToast();
const open = ref(false);

/* -------------------------
   Submit
--------------------------*/
async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!currentService.value) return;

  try {
    await $fetch("/api/service/updateservice", {   
      method: "PATCH",
      body: {
        id: currentService.value.id_departement,
        designation: event.data.designation,
        id_direction: event.data.id_direction, 
        actif: event.data.actif,
      },
    });

    toast.add({
      title: "Succès",
      description: `Département « ${event.data.designation} » mis à jour`,
      color: "success",
    });

    emit("updateservice");
    emit("clear-selection");
  } catch (err: any) {
    const message =
      err?.data?.message || err?.statusMessage || err?.message || "";

    if (message.includes("duplicate") || message.includes("unique")) {
      toast.add({
        title: "Échec",
        description: "Cette désignation existe déjà.",
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
  open.value = false;
  emit("clear-selection");
}

watch(open, (newValue) => {
  if (!newValue) {
    emit("clear-selection");
  }
});
</script>

<template>
  <UModal
    v-model:open="open"
    title="Modifier le département"
    :description="`Modifier le département sélectionné.`"
  >
    <slot />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        @submit="onSubmit"
        class="space-y-4"
      >
        <UFormField label="Désignation" name="designation" required>
          <UInput v-model="designationUppercase" class="w-full" />
        </UFormField>

        <!-- ← AJOUTÉ : Sélection de direction -->
        <UFormField
          label="Direction"
          name="id_direction"
          required
          description="Rattacher ce département à une direction"
        >
          <USelect
            v-model="state.id_direction"
            :items="directions?.map(d => ({ label: d.designation, value: d.id_direction })) ?? []"
            placeholder="Sélectionner une direction"
            class="w-full"
          />
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