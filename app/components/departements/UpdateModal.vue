<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";

type Direction = Tables<"direction">;
type AutoriteSuperieure = Tables<"autorite_superieure">;

/* -------------------------
   Props
--------------------------*/
const props = defineProps<{
  rows: Direction[];
}>();

/* -------------------------
   Emits
--------------------------*/
const emit = defineEmits<{
  (e: "updatedepartement"): void;
  (e: "clear-selection"): void;
}>();

/* -------------------------
   Validation
--------------------------*/
const schema = z.object({
  designation: z
    .string()
    .max(255, "Le nombre maximum de caractères est de 255"),
  id_autorite: z.string().uuid("Veuillez sélectionner une autorité supérieure"),
  actif: z.boolean().default(true),
});

type Schema = z.output<typeof schema>;

/* -------------------------
   Récupération autorités
--------------------------*/
const { data: autorites } = await useFetch<AutoriteSuperieure[]>(
  "/api/autorite-superieure",
  {
    transform: (data) => data.filter((a) => a.actif),
  },
);

/* -------------------------
   State du formulaire
--------------------------*/
const state = reactive<Partial<Schema>>({
  designation: "",
  id_autorite: undefined,
  actif: true,
});

// Transformer la désignation en majuscules automatiquement
const designationUppercase = computed({
  get: () => state.designation,
  set: (value: string) => {
    state.designation = value.toUpperCase();
  },
});

/* -------------------------
   Direction courante (1 seul)
--------------------------*/
const currentDepartement = computed(() => props.rows[0]);

/* -------------------------
   Sync props → form
--------------------------*/
watch(
  currentDepartement,
  (departement) => {
    if (!departement) return;

    state.designation = departement.designation;
    state.id_autorite = departement.id_autorite;
    state.actif = departement.actif;
  },
  { immediate: true },
);

const toast = useToast();
const open = ref(false);

/* -------------------------
   Submit
--------------------------*/
async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!currentDepartement.value) return;

  const oldDesignation = currentDepartement.value.designation;

  try {
    await $fetch("/api/departement/updatedepartement", {
      method: "PATCH",
      body: {
        id: currentDepartement.value.id_direction,
        designation: event.data.designation,
        id_autorite: event.data.id_autorite,
        actif: event.data.actif,
      },
    });

    toast.add({
      title: "Succès",
      description: `Direction mise à jour avec succès`,
      color: "success",
    });

    emit("updatedepartement");
    emit("clear-selection");
  } catch (err: any) {
    const message =
      err?.data?.message || err?.statusMessage || err?.message || "";

    if (message.includes("duplicate") || message.includes("unique")) {
      toast.add({
        title: "Échec",
        description: "Cette direction existe déjà.",
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
    title="Modifier la Direction"
    :description="`Modifier les informations de la direction sélectionnée.`"
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

        <!--  Sélection autorité supérieure -->
        <UFormField
          label="Autorité Supérieure"
          name="id_autorite"
          required
          description="Rattacher cette direction au SG ou à la DG"
        >
          <USelect
            v-model="state.id_autorite"
            :items="
              autorites?.map((a) => ({
                label: `${a.code} - ${a.designation}`,
                value: a.id_autorite,
              })) ?? []
            "
            placeholder="Sélectionner une autorité"
            class="w-full"
          />
        </UFormField>

        <!--   Checkbox actif -->
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
