<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Departement = Tables<"departement">;
type Service = Tables<"service">;

const emit = defineEmits<{
  (e: "addagent"): void;
}>();

const toast = useToast();
const open = ref(false);
const loading = ref(false);

// Formulaire
const form = ref({
  nom: "",
  prenom: "",
  email: "",
  id_departement: "",
  id_service: "",
});

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

// Modal de succès avec le code généré
const showSuccessModal = ref(false);
const generatedCode = ref("");
const generatedAgent = ref<{ nom: string; prenom: string; email: string } | null>(null);

async function submit() {
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
    const result = await $fetch("/api/agent/create", {
      method: "POST",
      body: form.value,
    });

    // Stocker les infos pour le modal de succès
    generatedCode.value = (result as any).code_agent_display || (result as any).code_agent;
    generatedAgent.value = {
      nom: form.value.nom,
      prenom: form.value.prenom,
      email: form.value.email,
    };

    // Fermer le formulaire et ouvrir le modal de succès
    open.value = false;
    showSuccessModal.value = true;

    // Reset du formulaire
    form.value = {
      nom: "",
      prenom: "",
      email: "",
      id_departement: "",
      id_service: "",
    };

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

function copyCode() {
  navigator.clipboard.writeText(generatedCode.value);
  toast.add({ title: "Code copié dans le presse-papier" });
}
</script>

<template>
  <!-- Bouton d'ouverture -->
  <UButton
    label="Nouvel Agent"
    icon="i-lucide-user-plus"
    @click="open = true"
  />

  <!-- Modal de création -->
  <UModal v-model:open="open" title="Ajouter un agent" :description="`Créer un nouvel agent`">
    <template #body>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Nom" required>
            <UInput
              v-model="form.nom"
              placeholder="Dupont"
            />
          </UFormField>

          <UFormField label="Prénom" required>
            <UInput
              v-model="form.prenom"
              placeholder="Jean"
            />
          </UFormField>
        </div>

        <UFormField label="Email" required>
          <UInput
            v-model="form.email"
            type="email"
            placeholder="jean.dupont@entreprise.com"
          />
        </UFormField>

        <UFormField label="Département" required>
          <USelect
            v-model="form.id_departement"
            :items="departementOptions"
            placeholder="Sélectionner un département"
          />
        </UFormField>

        <UFormField label="Service" required>
          <USelect
            v-model="form.id_service"
            :items="serviceOptions"
            placeholder="Sélectionner un service"
          />
        </UFormField>

        <div class="bg-info/10 border border-info/20 rounded-lg p-4 text-sm">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-info" class="text-info mt-0.5" />
            <div>
              <p class="font-medium">Informations de connexion</p>
              <p class="text-muted mt-1">
                Un code agent unique sera généré automatiquement.
                Ce code servira de mot de passe initial pour la première connexion.
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
  <UModal v-model:open="showSuccessModal" title="Agent créé avec succès !" :description="`Détails de l'agent`">
    <template #body>
      <div class="space-y-4">
        <div class="text-center py-4">
          <div class="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
            <UIcon name="i-lucide-check-circle" class="text-success text-3xl" />
          </div>
          <p class="font-medium text-lg">
            {{ generatedAgent?.prenom }} {{ generatedAgent?.nom }}
          </p>
          <p class="text-muted">{{ generatedAgent?.email }}</p>
        </div>

        <div class="bg-elevated border border-default rounded-lg p-4">
          <p class="text-sm text-muted mb-2">Code agent (mot de passe initial)</p>
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

        <div class="bg-warning/10 border border-warning/20 rounded-lg p-4 text-sm">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-alert-triangle" class="text-warning mt-0.5" />
            <div>
              <p class="font-medium">Important</p>
              <p class="text-muted mt-1">
                Communiquez ce code à l'agent de manière sécurisée.
                Il l'utilisera comme mot de passe pour sa première connexion
                et pourra ensuite le modifier.
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
