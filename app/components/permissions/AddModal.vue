<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Agent = Tables<"agent">;
type Role = Tables<"role">;

const emit = defineEmits<{
  (e: "created"): void;
}>();

// Auth - On utilise hasRole pour plus de sécurité
const { hasRole } = useAuth();

const toast = useToast();
const open = ref(false);
const loading = ref(false);
const showAgentModal = ref(false);
const selectedAgent = ref<Agent | null>(null);

// Formulaire
const form = ref({
  id_agent: "",
  id_role: "",
  date_from: "",
  date_to: "",
  isPermanent: true,
});

// Récupérer les rôles
const { data: roles } = await useFetch<Role[]>("/api/role", {
  server: true,
  lazy: true,
});

// VÉRIFICATION STRICTE : Seul SUPERADMIN peut voir et attribuer SUPERADMIN
const isSuperAdmin = computed(() => {
  return hasRole("SUPERADMIN");
});

// FILTRAGE DES RÔLES : Masquer SUPERADMIN si l'utilisateur n'est pas SUPERADMIN
const roleOptions = computed(() => {
  if (!roles.value) return [];

  return roles.value
    .filter((r) => {
      if (r.designation === "SUPERADMIN") {
        return isSuperAdmin.value;
      }
      return true;
    })
    .map((r) => ({
      label: r.designation,
      value: r.id_role,
    }));
});

// Date par défaut = maintenant
const now = new Date();
const defaultDateFrom = now.toISOString().slice(0, 16);

function resetForm() {
  form.value = {
    id_agent: "",
    id_role: "",
    date_from: defaultDateFrom,
    date_to: "",
    isPermanent: true,
  };
  selectedAgent.value = null;
}

function handleAgentSelect(agent: Agent) {
  selectedAgent.value = agent;
  form.value.id_agent = agent.id_agent;
}

function clearAgent() {
  selectedAgent.value = null;
  form.value.id_agent = "";
}

async function submit() {
  // Validation
  if (!form.value.id_agent) {
    toast.add({
      title: "Erreur",
      description: "Veuillez sélectionner un agent",
      color: "error",
    });
    return;
  }
  if (!form.value.id_role) {
    toast.add({
      title: "Erreur",
      description: "Veuillez sélectionner un rôle",
      color: "error",
    });
    return;
  }

  loading.value = true;

  try {
    await $fetch("/api/user-role/create", {
      method: "POST",
      body: {
        id_agent: form.value.id_agent,
        id_role: form.value.id_role,
        date_from: form.value.date_from || new Date().toISOString(),
        date_to: form.value.isPermanent ? null : form.value.date_to || null,
      },
    });

    toast.add({
      title: "Succès",
      description: "Rôle attribué avec succès",
      color: "success",
    });

    open.value = false;
    resetForm();
    emit("created");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description:
        err?.data?.statusMessage || "Impossible d'attribuer le rôle",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Reset le formulaire quand on ferme
watch(open, (isOpen) => {
  if (!isOpen) {
    resetForm();
  }
});
</script>

<template>
  <UButton
    label="Attribuer un rôle"
    icon="i-lucide-shield-plus"
    @click="open = true"
  />

  <PermissionsAgentSelectModal
    v-model:open="showAgentModal"
    v-model:selected-agent="selectedAgent"
    @select="handleAgentSelect"
  />

  <UModal
    v-model:open="open"
    title="Attribuer un rôle"
    :description="`Afin de permettre à un agent d'accéder à l'interface d'administration`"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Sélection de l'agent -->
        <UFormField label="Agent" required>
          <div class="flex items-center gap-2">
            <UButton
              :label="
                selectedAgent
                  ? `${selectedAgent.prenom} ${selectedAgent.nom} (${selectedAgent.code_agent})`
                  : 'Sélectionner un agent'
              "
              :icon="selectedAgent ? 'i-lucide-user-check' : 'i-lucide-search'"
              :color="selectedAgent ? 'primary' : 'neutral'"
              variant="outline"
              class="flex-1 justify-start"
              truncate
              @click="showAgentModal = true"
            />

            <UButton
              v-if="selectedAgent"
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              square
              @click="clearAgent"
            />
          </div>

          <p v-if="selectedAgent" class="text-xs text-muted mt-1">
            {{ selectedAgent.email || "Aucun email" }}
          </p>
        </UFormField>

        <!-- Sélection du rôle -->
        <UFormField label="Rôle" required>
          <USelect
            v-model="form.id_role"
            :items="roleOptions"
            placeholder="Sélectionner un rôle"
          />
        </UFormField>

        <!-- Date de début -->
        <UFormField label="Date de début">
          <UInput v-model="form.date_from" type="datetime-local" />
        </UFormField>

        <!-- Permanent ou temporaire -->
        <div class="flex items-center gap-3">
          <USwitch v-model="form.isPermanent" />
          <span class="text-sm">Attribution permanente</span>
        </div>

        <!-- Date de fin (si temporaire) -->
        <UFormField v-if="!form.isPermanent" label="Date de fin">
          <UInput v-model="form.date_to" type="datetime-local" />
        </UFormField>

        <!-- Info -->
        <div class="bg-info/10 border border-info/20 rounded-lg p-4 text-sm">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-info" class="text-info mt-0.5" />
            <div>
              <p class="font-medium">À propos des rôles</p>
              <p class="text-muted mt-1">
                L'attribution d'un rôle donne à l'agent l'accès à l'interface
                d'administration selon les permissions associées au rôle.
              </p>
            </div>
          </div>
        </div>
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
          label="Attribuer"
          color="primary"
          :loading="loading"
          @click="submit"
        />
      </div>
    </template>
  </UModal>
</template>
