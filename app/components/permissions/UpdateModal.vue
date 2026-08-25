<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type UserRole = Tables<"user_role"> & {
  agent: {
    id_agent: string;
    code_agent: string;
    nom: string;
    prenom: string;
    email: string;
  };
  role: {
    id_role: string;
    designation: string;
  };
};

const props = defineProps<{
  userRole: UserRole | null;
}>();

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  (e: "updated"): void;
}>();

const toast = useToast();
const loading = ref(false);

// Formulaire
const form = ref({
  date_from: "",
  date_to: "",
  isPermanent: true,
  valide: true,
});

// Initialiser le formulaire quand le modal s'ouvre
watch(
  () => [open.value, props.userRole],
  ([isOpen, ur]) => {
    if (isOpen && ur) {
      const userRole = ur as UserRole;
      form.value = {
        date_from: userRole.date_from ? new Date(userRole.date_from).toISOString().slice(0, 16) : "",
        date_to: userRole.date_to ? new Date(userRole.date_to).toISOString().slice(0, 16) : "",
        isPermanent: !userRole.date_to,
        valide: userRole.valide,
      };
    }
  },
  { immediate: true }
);

async function submit() {
  if (!props.userRole) return;

  loading.value = true;

  try {
    await $fetch("/api/user-role/update", {
      method: "PATCH",
      body: {
        id: props.userRole.id_user_role,
        date_from: form.value.date_from,
        date_to: form.value.isPermanent ? null : form.value.date_to || null,
        valide: form.value.valide,
      },
    });

    toast.add({
      title: "Succès",
      description: "Attribution mise à jour",
      color: "success",
    });

    open.value = false;
    emit("updated");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.statusMessage || "Impossible de mettre à jour",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Modifier l'attribution" :description="`Modifier les détails de l'attribution de rôle pour ${userRole ? `${userRole.agent.prenom} ${userRole.agent.nom}` : 'l\'agent'}`">
    <template #body>
      <div v-if="userRole" class="space-y-4">
        <!-- Info agent et rôle (non modifiable) -->
        <div class="bg-muted/30 rounded-lg p-4 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              {{ userRole.agent.prenom[0] }}{{ userRole.agent.nom[0] }}
            </div>
            <div>
              <p class="font-medium">{{ userRole.agent.prenom }} {{ userRole.agent.nom }}</p>
              <code class="text-xs text-muted">{{ userRole.agent.code_agent }}</code>
            </div>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <UIcon name="i-lucide-shield" class="text-muted" />
            <span>Rôle : <strong>{{ userRole.role.designation }}</strong></span>
          </div>
        </div>

        <!-- Statut valide -->
        <div class="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
          <div class="flex items-center gap-2">
            <UIcon :name="form.valide ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
                   :class="form.valide ? 'text-success' : 'text-error'" />
            <span class="text-sm font-medium">Attribution {{ form.valide ? 'active' : 'révoquée' }}</span>
          </div>
          <USwitch v-model="form.valide" />
        </div>

        <!-- Date de début -->
        <UFormField label="Date de début">
          <UInput
            v-model="form.date_from"
            type="datetime-local"
          />
        </UFormField>

        <!-- Permanent ou temporaire -->
        <div class="flex items-center gap-3">
          <USwitch v-model="form.isPermanent" />
          <span class="text-sm">Attribution permanente</span>
        </div>

        <!-- Date de fin (si temporaire) -->
        <UFormField v-if="!form.isPermanent" label="Date de fin">
          <UInput
            v-model="form.date_to"
            type="datetime-local"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          label="Annuler"
          color="neutral"
          variant="outline"
          @click="open = false"
        />
        <UButton
          label="Enregistrer"
          color="primary"
          :loading="loading"
          @click="submit"
        />
      </div>
    </template>
  </UModal>
</template>
