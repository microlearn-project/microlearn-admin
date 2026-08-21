<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Direction = Tables<"direction">;
type Departement = Tables<"departement">;

const emit = defineEmits<{
  (e: "addagent"): void;
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

// Formulaire
const form = ref({
  nom: "",
  prenom: "",
  email: "",
  id_direction: "",
  id_departement: "",
});


// Modal de succès avec le code généré
const showSuccessModal = ref(false);
const generatedCode = ref("");
const generatedPassword = ref("");
const generatedAgent = ref<{
  nom: string;
  prenom: string;
  email: string;
} | null>(null);

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

async function submit() {
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
    const result = await $fetch("/api/agent/create", {
      method: "POST",
      body: form.value,
    });

    // Stocker les infos pour le modal de succès
    generatedCode.value = (result as any).code_agent;
    generatedPassword.value = (result as any).temporary_password;
    generatedAgent.value = {
      nom: form.value.nom,
      prenom: form.value.prenom,
      email: form.value.email,
    };

    // Fermer le formulaire et ouvrir le modal de succès
    open.value = false;
    showSuccessModal.value = true;

    // Reset du formulaire
    resetForm();

    emit("addagent");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.statusMessage || "Impossible de créer l'agent",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.value = {
    nom: "",
    prenom: "",
    email: "",
    id_direction: "",
    id_departement: "",
  };
  selectedDepartement.value = null;
  selectedService.value = null;
}

function copyCode() {
  navigator.clipboard.writeText(generatedCode.value);
  toast.add({ title: "Code agent copié dans le presse-papier" });
}

function copyPassword() {
  navigator.clipboard.writeText(generatedPassword.value);
  toast.add({ title: "Mot de passe temporaire copié dans le presse-papier" });
}

// Reset le formulaire quand on ferme
watch(open, (isOpen) => {
  if (!isOpen) {
    resetForm();
  }
});
</script>

<template>
  <!-- Bouton d'ouverture -->
  <UButton
    label="Nouvel Agent"
    icon="i-lucide-user-plus"
    @click="open = true"
  />

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

  <!-- Modal de création -->
  <UModal
    v-model:open="open"
    title="Ajouter un agent"
    :description="`Créer un nouvel agent`"
  >
    <template #body>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Nom" required>
            <UInput v-model="form.nom" placeholder="Dupont" />
          </UFormField>

          <UFormField label="Prénom" required>
            <UInput v-model="form.prenom" placeholder="Jean" />
          </UFormField>
        </div>

        <UFormField label="Email" required>
          <UInput
            v-model="form.email"
            type="email"
            placeholder="jean.dupont@mail.com"
          />
        </UFormField>

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

        <div class="bg-info/10 border border-info/20 rounded-lg p-4 text-sm">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-info" class="text-info mt-0.5" />
            <div>
              <p class="font-medium">Informations de connexion</p>
              <p class="text-muted mt-1">
                Un code agent unique et un mot de passe temporaire seront
                générés automatiquement. Le mot de passe sera envoyé par
                email à l'agent, et affiché une seule fois ici.
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
          label="Créer l'agent"
          color="primary"
          :loading="loading"
          @click="submit"
        />
      </div>
    </template>
  </UModal>

  <!-- Modal de succès avec le code généré -->
  <UModal
    v-model:open="showSuccessModal"
    title="Agent créé avec succès !"
    :description="`Détails de l'agent`"
  >
    <template #body>
      <div class="space-y-4">
        <div class="text-center py-4">
          <div
            class="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4"
          >
            <UIcon name="i-lucide-check-circle" class="text-success text-3xl" />
          </div>
          <p class="font-medium text-lg">
            {{ generatedAgent?.prenom }} {{ generatedAgent?.nom }}
          </p>
          <p class="text-muted">{{ generatedAgent?.email }}</p>
        </div>

        <div class="bg-elevated border border-default rounded-lg p-4">
          <p class="text-sm text-muted mb-2">Code agent (identifiant)</p>
          <div class="flex items-center gap-3">
            <code class="text-2xl font-mono font-bold tracking-widest flex-1">
              {{ generatedCode }}
            </code>
            <UButton
              icon="i-lucide-copy"
              color="neutral"
              variant="outline"
              @click="copyCode"
            />
          </div>
        </div>

        <div class="bg-elevated border border-default rounded-lg p-4">
          <p class="text-sm text-muted mb-2">Mot de passe temporaire</p>
          <div class="flex items-center gap-3">
            <code class="text-lg font-mono font-bold tracking-wide flex-1 break-all">
              {{ generatedPassword }}
            </code>
            <UButton
              icon="i-lucide-copy"
              color="neutral"
              variant="outline"
              @click="copyPassword"
            />
          </div>
        </div>

        <div
          class="bg-warning/10 border border-warning/20 rounded-lg p-4 text-sm"
        >
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-alert-triangle" class="text-warning mt-0.5" />
            <div>
              <p class="font-medium">Important</p>
              <p class="text-muted mt-1">
                Ce mot de passe temporaire a déjà été envoyé par email à
                l'agent. Vous pouvez aussi le lui communiquer directement de
                manière sécurisée — il devra le changer à sa première
                connexion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          label="Fermer"
          color="primary"
          @click="showSuccessModal = false"
        />
      </div>
    </template>
  </UModal>
</template>
