<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Agent = Tables<"agent">;
type Departement = Tables<"departement">;
type Service = Tables<"service">;

const props = defineProps<{
  rows: Agent[];
}>();

const emit = defineEmits<{
  (e: "updateagent"): void;
  (e: "clear-selection"): void;
}>();

const toast = useToast();
const open = ref(false);
const loading = ref(false);

// Récupérer les départements
const { data: departements } = await useFetch<Departement[]>("/api/departement", {
  server: true,
  lazy: true,
});

// Récupérer les services
const { data: services } = await useFetch<Service[]>("/api/service", {
  server: true,
  lazy: true,
});

// Options pour les selects
const departementOptions = computed(() => {
  if (!departements.value) return [];
  return departements.value
    .filter((d) => !d.deleted_at)
    .map((d) => ({
      label: d.designation,
      value: d.id_departement,
    }));
});

const serviceOptions = computed(() => {
  if (!services.value) return [];
  return services.value
    .filter((s) => !s.deleted_at && s.actif)
    .map((s) => ({
      label: s.designation,
      value: s.id_service,
    }));
});

// Formulaire pré-rempli avec l'agent sélectionné
const form = ref({
  nom: "",
  prenom: "",
  email: "",
  id_departement: "",
  id_service: "",
});

// Remplir le formulaire quand l'agent change
watch(
  () => props.rows,
  (newRows) => {
    if (newRows.length === 1) {
      const agent = newRows[0];
      form.value = {
        nom: agent.nom,
        prenom: agent.prenom,
        email: agent.email,
        id_departement: agent.id_departement,
        id_service: agent.id_service,
      };
    }
  },
  { immediate: true }
);

// Ouvrir le modal quand on clique sur le slot
function openModal() {
  if (props.rows.length === 1) {
    const agent = props.rows[0];
    form.value = {
      nom: agent.nom,
      prenom: agent.prenom,
      email: agent.email,
      id_departement: agent.id_departement,
      id_service: agent.id_service,
    };
    open.value = true;
  }
}

async function submit() {
  if (props.rows.length !== 1) return;

  const agent = props.rows[0];

  // Validation
  if (!form.value.nom.trim()) {
    toast.add({ title: "Erreur", description: "Le nom est requis", color: "error" });
    return;
  }
  if (!form.value.prenom.trim()) {
    toast.add({ title: "Erreur", description: "Le prénom est requis", color: "error" });
    return;
  }
  if (!form.value.email.trim()) {
    toast.add({ title: "Erreur", description: "L'email est requis", color: "error" });
    return;
  }
  if (!form.value.id_departement) {
    toast.add({ title: "Erreur", description: "Le département est requis", color: "error" });
    return;
  }
  if (!form.value.id_service) {
    toast.add({ title: "Erreur", description: "Le service est requis", color: "error" });
    return;
  }

  loading.value = true;

  try {
    await $fetch("/api/agent/update", {
      method: "PATCH",
      body: {
        id: agent.id_agent,
        ...form.value,
      },
    });

    toast.add({
      title: "Succès",
      description: "Agent mis à jour",
      color: "success",
    });

    open.value = false;
    emit("updateagent");
    emit("clear-selection");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.statusMessage || "Impossible de mettre à jour l'agent",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Obtenir le nom du département actuel
const currentDepartement = computed(() => {
  if (!departements.value || props.rows.length !== 1) return null;
  return departements.value.find((d) => d.id_departement === props.rows[0].id_departement);
});

// Obtenir le nom du service actuel
const currentService = computed(() => {
  if (!services.value || props.rows.length !== 1) return null;
  return services.value.find((s) => s.id_service === props.rows[0].id_service);
});
</script>

<template>
  <div @click="openModal">
    <slot />
  </div>

  <UModal v-model:open="open" title="Modifier l'agent" :description="rows.length === 1 ? `Modification de l'agent ${rows[0].prenom} ${rows[0].nom}` : ''">
    <template #body>
      <div class="space-y-4">
        <!-- Info agent -->
        <div v-if="rows.length === 1" class="bg-muted/30 rounded-lg p-4 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg">
              {{ rows[0].prenom[0] }}{{ rows[0].nom[0] }}
            </div>
            <div>
              <p class="font-medium">{{ rows[0].prenom }} {{ rows[0].nom }}</p>
              <div class="flex items-center gap-2 mt-1">
                <code class="text-xs bg-muted/50 px-2 py-0.5 rounded">{{ rows[0].code_agent }}</code>
                <span class="text-xs text-muted">•</span>
                <span class="text-xs text-muted">{{ rows[0].email }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Informations personnelles -->
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted flex items-center gap-2">
            <UIcon name="i-lucide-user" />
            Informations personnelles
          </p>
          <div class="grid grid-cols-2 gap-4 p-3 bg-muted/10 rounded-lg">
            <UFormField label="Nom" required>
              <UInput v-model="form.nom" placeholder="Nom de famille" />
            </UFormField>

            <UFormField label="Prénom" required>
              <UInput v-model="form.prenom" placeholder="Prénom" />
            </UFormField>
          </div>
        </div>

        <!-- Email -->
        <UFormField label="Email" required>
          <UInput v-model="form.email" type="email" placeholder="email@exemple.com" />
        </UFormField>

        <!-- Affectation -->
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted flex items-center gap-2">
            <UIcon name="i-lucide-building-2" />
            Affectation
          </p>
          <div class="grid grid-cols-2 gap-4 p-3 bg-muted/10 rounded-lg">
            <UFormField label="Département" required>
              <USelect
                v-model="form.id_departement"
                :items="departementOptions"
                placeholder="Sélectionner"
              />
            </UFormField>

            <UFormField label="Service" required>
              <USelect
                v-model="form.id_service"
                :items="serviceOptions"
                placeholder="Sélectionner"
              />
            </UFormField>
          </div>
        </div>

        <!-- Info sur les changements -->
        <div v-if="rows.length === 1" class="text-xs text-muted space-y-1">
          <p v-if="currentDepartement">
            Département actuel : <span class="font-medium">{{ currentDepartement.designation }}</span>
          </p>
          <p v-if="currentService">
            Service actuel : <span class="font-medium">{{ currentService.designation }}</span>
          </p>
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
          label="Enregistrer"
          color="primary"
          :loading="loading"
          @click="submit"
        />
      </div>
    </template>
  </UModal>
</template>
