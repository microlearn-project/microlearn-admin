<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";

type Direction = Tables<"direction">;

const emit = defineEmits(["addservice"]);

const schema = z.object({
  designation: z
    .string()
    .max(255, "Le nombre maximum de caractères est de 255"),
  id_direction: z.string().uuid("Veuillez sélectionner une direction"),
  actif: z.boolean().default(false),
});

const open = ref(false);

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  designation: undefined,
  id_direction: undefined,
  actif: undefined,
});

// Récupérer les directions disponibles
const { data: directions } = await useFetch<Direction[]>("/api/direction", {
  transform: (data) => data.filter((d) => d.actif && !d.deleted_at),
});

const toast = useToast();

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await $fetch("/api/departement/adddepartement", {
      method: "POST",
      body: {
        designation: event.data.designation,
        id_direction: event.data.id_direction,
        actif: event.data.actif,
      },
    });

    toast.add({
      title: "Succès",
      description: `Nouveau département « ${event.data.designation} » ajouté`,
      color: "success",
    });

    emit("addservice");
    state.designation = "";
    state.id_direction = undefined;
    state.actif = undefined;
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
        description:
          "Ce département est déjà en place! Veuillez en ajouter un autre.",
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
  state.id_direction = undefined;
  state.actif = undefined;
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Nouveau département"
    description="Ajouter un nouveau département"
  >
    <UButton label="Nouveau département" icon="i-lucide-plus" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Désignation" name="designation" required>
          <UInput
            v-model="state.designation"
            class="w-full"
            placeholder="COURRIER"
          />
        </UFormField>

        <!--  Sélection de direction -->
        <UFormField
          label="Direction"
          name="id_direction"
          required
          description="Rattacher ce département à une direction"
        >
          <USelect
            v-model="state.id_direction"
            :items="
              directions?.map((d) => ({
                label: d.designation,
                value: d.id_direction,
              })) ?? []
            "
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
          <UButton
            label="Annuler"
            color="neutral"
            variant="subtle"
            @click="((open = false), resetForm())"
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
