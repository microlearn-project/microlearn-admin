<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Agent = Tables<"agent">;
type Direction = Tables<"direction">;
type Departement = Tables<"departement">;

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

// Modals de sélection
const showDepartementModal = ref(false);
const showServiceModal = ref(false);

// Éléments sélectionnés
const selectedDepartement = ref<Direction | null>(null);
const selectedService = ref<Departement | null>(null);

// Récupérer les directions et départements pour l'affichage initial
const { data: directions } = await useFetch<Direction[]>("/api/direction", {
  server: true,
  lazy: true,
});

const { data: departements } = await useFetch<Departement[]>("/api/departement", {
  server: true,
  lazy: true,
});

// Formulaire pré-rempli avec l'agent sélectionné
const form = ref({
  nom: "",
  prenom: "",
  email: "",
  id_direction: "",
  id_departement: "",
});

// Handlers de sélection — changer de direction invalide le département déjà
// choisi (il pourrait appartenir à l'ancienne direction).
function handleDepartementSelect(direction: Direction) {
  selectedDepartement.value = direction;
  form.value.id_direction = direction.id_direction;
  clearService();
}

function clearDepartement() {
  selectedDepartement.value = null;
  form.value.id_direction = "";
  clearService();
}

function handleServiceSelect(departement: Departement) {
  selectedService.value = departement;
  form.value.id_departement = departement.id_departement;
}

function clearService() {
  selectedService.value = null;
  form.value.id_departement = "";
}

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
        id_direction: agent.id_direction,
        id_departement: agent.id_departement,
      };

      // Trouver et définir la direction sélectionné
      if (directions.value) {
        selectedDepartement.value =
          directions.value.find((d) => d.id_direction === agent.id_direction) ||
          null;
      }

      // Trouver et définir le département sélectionné
      if (departements.value) {
        selectedService.value =
          departements.value.find(
            (s) => s.id_departement === agent.id_departement,
          ) || null;
      }
    }
  },
  { immediate: true },
);

// Ouvrir le modal quand on clique sur le slot
function openModal() {
  if (props.rows.length === 1) {
    const agent = props.rows[0];
    form.value = {
      nom: agent.nom,
      prenom: agent.prenom,
      email: agent.email,
      id_direction: agent.id_direction,
      id_departement: agent.id_departement,
    };

    // Trouver et définir la direction sélectionné
    if (directions.value) {
      selectedDepartement.value =
        directions.value.find((d) => d.id_direction === agent.id_direction) ||
        null;
    }

    // Trouver et définir le département sélectionné
    if (departements.value) {
      selectedService.value =
        departements.value.find(
          (s) => s.id_departement === agent.id_departement,
        ) || null;
    }

    open.value = true;
  }
}

async function submit() {
  if (props.rows.length !== 1) return;

  const agent = props.rows[0];

  // Validation
  if (!form.value.nom.trim()) {
    toast.add({
      title: "Erreur",
      description: "Le nom est requis",
      color: "error",
    });
    return;
  }
  if (!form.value.prenom.trim()) {
    toast.add({
      title: "Erreur",
      description: "Le prénom est requis",
      color: "error",
    });
    return;
  }
  if (!form.value.email.trim()) {
    toast.add({
      title: "Erreur",
      description: "L'email est requis",
      color: "error",
    });
    return;
  }
  if (!form.value.id_direction) {
    toast.add({
      title: "Erreur",
      description: "La direction est requise",
      color: "error",
    });
    return;
  }
  if (!form.value.id_departement) {
    toast.add({
      title: "Erreur",
      description: "Le département est requis",
      color: "error",
    });
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
      description:
        err?.data?.statusMessage || "Impossible de mettre à jour l'agent",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Obtenir le nom de la direction actuel (pour affichage de comparaison)
const currentDepartement = computed(() => {
  if (!directions.value || props.rows.length !== 1) return null;
  return directions.value.find(
    (d) => d.id_direction === props.rows[0].id_direction,
  );
});

// Obtenir le nom du département actuel (pour affichage de comparaison)
const currentService = computed(() => {
  if (!departements.value || props.rows.length !== 1) return null;
  return departements.value.find(
    (s) => s.id_departement === props.rows[0].id_departement,
  );
});

watch(open, (newValue) => {
  if (!newValue) {
    // La modale vient d'être fermée (par la croix, Esc, overlay, etc.)
    emit("clear-selection");
  }
});
</script>

<template>
  <div @click="openModal">
    <slot />
  </div>

  <!-- Modals de sélection -->
  <AgentsDirectionSelectModal
    v-model:open="showDepartementModal"
    v-model:selected-departement="selectedDepartement"
    @select="handleDepartementSelect"
  />

  <AgentsDepartementSelectModal
    v-model:open="showServiceModal"
    v-model:selected-service="selectedService"
    :id-direction="form.id_direction"
    @select="handleServiceSelect"
  />

  <UModal
    v-model:open="open"
    title="Modifier l'agent"
    :description="
      rows.length === 1
        ? `Modification de l'agent ${rows[0].prenom} ${rows[0].nom}`
        : ''
    "
  >
    <template #body>
      <div class="space-y-4">
        <!-- Info agent -->
        <div v-if="rows.length === 1" class="bg-muted/30 rounded-lg p-4 mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg"
            >
              {{ rows[0].prenom[0] }}{{ rows[0].nom[0] }}
            </div>
            <div>
              <p class="font-medium">{{ rows[0].prenom }} {{ rows[0].nom }}</p>
              <div class="flex items-center gap-2 mt-1">
                <code class="text-xs bg-muted/50 px-2 py-0.5 rounded">{{
                  rows[0].code_agent
                }}</code>
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
          <UInput
            v-model="form.email"
            type="email"
            placeholder="email@exemple.com"
          />
        </UFormField>

        <!-- Affectation -->
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted flex items-center gap-2">
            <UIcon name="i-lucide-briefcase" />
            Affectation
          </p>
          <div class="space-y-3 p-3 bg-muted/10 rounded-lg">
            <!-- Sélection de la direction -->
            <UFormField label="Direction" required>
              <div class="flex items-center gap-2">
                <UButton
                  :label="
                    selectedDepartement
                      ? selectedDepartement.designation
                      : 'Sélectionner une direction'
                  "
                  :icon="
                    selectedDepartement
                      ? 'i-heroicons-building-office'
                      : 'i-lucide-search'
                  "
                  :color="selectedDepartement ? 'primary' : 'neutral'"
                  variant="outline"
                  class="flex-1 justify-start"
                  truncate
                  @click="showDepartementModal = true"
                />

                <UButton
                  v-if="selectedDepartement"
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  square
                  @click="clearDepartement"
                />
              </div>
            </UFormField>

            <!-- Sélection du département -->
            <UFormField label="Département" required>
              <div class="flex items-center gap-2">
                <UButton
                  :label="
                    selectedService
                      ? selectedService.designation
                      : selectedDepartement
                        ? 'Sélectionner un département'
                        : 'Choisir une direction d\'abord'
                  "
                  :icon="
                    selectedService ? 'i-lucide-building-2' : 'i-lucide-search'
                  "
                  :color="selectedService ? 'primary' : 'neutral'"
                  variant="outline"
                  class="flex-1 justify-start"
                  truncate
                  :disabled="!selectedDepartement"
                  @click="showServiceModal = true"
                />

                <UButton
                  v-if="selectedService"
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  square
                  @click="clearService"
                />
              </div>
            </UFormField>
          </div>
        </div>

        <!-- Info sur les changements -->
        <div v-if="rows.length === 1" class="text-xs text-muted space-y-1">
          <p v-if="currentDepartement">
            Direction actuel :
            <span class="font-medium">{{
              currentDepartement.designation
            }}</span>
          </p>
          <p v-if="currentService">
            Département actuel :
            <span class="font-medium">{{ currentService.designation }}</span>
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
