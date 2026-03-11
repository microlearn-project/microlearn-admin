<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";

type AutoriteSuperieure = Tables<"autorite_superieure">;

const emit = defineEmits(["adddepartement"]);

const schema = z.object({
  designation: z
    .string()
    .max(255, "Le nombre maximum de caractères est de 255"),
  id_autorite: z.string().uuid("Veuillez sélectionner une autorité supérieure"),
  actif: z.boolean().default(true),
});

const open = ref(false);

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  designation: undefined,
  id_autorite: undefined,
  actif: true,
});

// Récupérer les autorités supérieures disponibles
const { data: autorites } = await useFetch<AutoriteSuperieure[]>(
  "/api/autorite-superieure",
  {
    transform: (data) => data.filter((a) => a.actif),
  },
);

// Transformer la désignation en majuscules automatiquement
const designationUppercase = computed({
  get: () => state.designation,
  set: (value: string) => {
    state.designation = value.toUpperCase();
  },
});

const toast = useToast();

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await $fetch("/api/departement/adddepartement", {
      method: "POST",
      body: {
        designation: event.data.designation,
        id_autorite: event.data.id_autorite,
        actif: event.data.actif,
      },
    });

    toast.add({
      title: "Succès",
      description: `Nouvelle direction « ${event.data.designation} » ajoutée`,
      color: "success",
    });

    emit("adddepartement");
    state.designation = "";
    state.id_autorite = undefined;
    state.actif = true;
    open.value = false;
  } catch (err: any) {
    const message =
      err?.data?.message || err?.statusMessage || err?.message || "";

    if (
      message.includes("duplicate key") ||
      message.includes("unique constraint")
    ) {
      toast.add({
        title: "Échec",
        description: "Cette direction existe déjà!",
        color: "error",
      });
      return;
    }

    if (err?.statusCode === 400) {
      toast.add({
        title: "Erreur",
        description: "Requête invalide.",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Erreur inattendue",
      description: "Veuillez réessayer plus tard.",
      color: "error",
    });
  }
}

function resetForm() {
  state.designation = "";
  state.id_autorite = undefined;
  state.actif = true;
  open.value = false;
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Nouvelle direction"
    description="Ajouter une nouvelle direction"
  >
    <UButton label="Nouvelle direction" icon="i-lucide-plus" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Désignation" name="designation" required>
          <UInput
            v-model="designationUppercase"
            class="w-full"
            placeholder="DIRECTION DES RESSOURCES HUMAINES"
          />
        </UFormField>

        <!--  Sélection autorité supérieure -->
        <UFormField
          label="Autorité Supérieure"
          name="id_autorite"
          required
          description="Rattacher cette direction à une autorité supérieure"
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

        <!--  Checkbox actif -->
        <UCheckbox
          v-model="state.actif"
          indicator="end"
          label="Actif ?"
          variant="card"
        />

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
