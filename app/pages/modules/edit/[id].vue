<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;

definePageMeta({
  layout: "default",
});

const route = useRoute();
const router = useRouter();
const toast = useToast();

const moduleId = route.params.id as string;

/* ---------------------------------------------------
   1. Récupération du module
----------------------------------------------------*/
const {
  data: module,
  pending,
  refresh,
} = await useFetch<Module>(`/api/module/${moduleId}`, {
  server: false,
});

// Rediriger si le module n'existe pas
watch(
  [module, pending],
  ([mod, pend]) => {
    if (!pend && !mod) {
      toast.add({
        title: "Erreur",
        description: "Module introuvable",
        color: "error",
      });
      router.push("/modules");
    }
  },
  { immediate: true }
);

/* ---------------------------------------------------
   2. Gestion des étapes
----------------------------------------------------*/
const currentStep = ref(1);
const steps = [
  {
    number: 1,
    title: "Détails",
    description: "Informations du module",
    icon: "i-lucide-file-text",
  },
  {
    number: 2,
    title: "Cours",
    description: "Contenu pédagogique",
    icon: "i-lucide-book-open",
  },
  {
    number: 3,
    title: "Quiz",
    description: "Évaluations",
    icon: "i-lucide-help-circle",
  },
  {
    number: 4,
    title: "Aperçu",
    description: "Vérification finale",
    icon: "i-lucide-eye",
  },
];

function goToStep(step: number) {
  currentStep.value = step;
}

function nextStep() {
  if (currentStep.value < 4) {
    currentStep.value++;
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

/* ---------------------------------------------------
   3. Retour à la liste
----------------------------------------------------*/
function backToList() {
  router.push("/modules");
}
</script>

<template>
  <UDashboardPanel v-if="module">
    <template #header>
      <UDashboardNavbar :title="`Éditer : ${module.titre}`">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            @click="backToList"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-7xl mx-auto py-8 space-y-8">
        <!-- Stepper -->
        <div class="bg-elevated border border-default rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div
              v-for="(step, index) in steps"
              :key="step.number"
              class="flex items-center"
              :class="{ 'flex-1': index < steps.length - 1 }"
            >
              <!-- Step circle -->
              <div class="flex flex-col items-center">
                <button
                  class="flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all"
                  :class="
                    currentStep === step.number
                      ? 'border-primary bg-primary text-white'
                      : currentStep > step.number
                      ? 'border-success bg-success text-white'
                      : 'border-default bg-elevated text-muted'
                  "
                  @click="goToStep(step.number)"
                >
                  <UIcon
                    v-if="currentStep > step.number"
                    name="i-lucide-check"
                    class="text-xl"
                  />
                  <UIcon v-else :name="step.icon" class="text-xl" />
                </button>
                <div class="mt-2 text-center">
                  <p
                    class="text-sm font-medium"
                    :class="
                      currentStep === step.number
                        ? 'text-primary'
                        : 'text-muted'
                    "
                  >
                    {{ step.title }}
                  </p>
                  <p class="text-xs text-muted hidden sm:block">
                    {{ step.description }}
                  </p>
                </div>
              </div>

              <!-- Line connector -->
              <div
                v-if="index < steps.length - 1"
                class="flex-1 h-0.5 mx-4"
                :class="
                  currentStep > step.number ? 'bg-success' : 'bg-default'
                "
              />
            </div>
          </div>
        </div>

        <!-- Step Content -->
        <div class="bg-elevated border border-default rounded-lg p-6">
          <!-- Étape 1: Détails -->
          <ModulesEditStep1Details
            v-if="currentStep === 1"
            :module="module"
            @next="nextStep"
            @refresh="refresh"
          />

          <!-- Étape 2: Cours -->
          <ModulesEditStep2Cours
            v-if="currentStep === 2"
            :module="module"
            @next="nextStep"
            @previous="previousStep"
            @refresh="refresh"
          />

          <!-- Étape 3: Quiz -->
          <ModulesEditStep3Quiz
            v-if="currentStep === 3"
            :module="module"
            @next="nextStep"
            @previous="previousStep"
          />

          <!-- Étape 4: Aperçu -->
          <ModulesEditStep4Preview
            v-if="currentStep === 4"
            :module="module"
            @previous="previousStep"
            @finish="backToList"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Loading state -->
  <UDashboardPanel v-else-if="pending">
    <template #body>
      <div class="flex items-center justify-center h-96">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
      </div>
    </template>
  </UDashboardPanel>
</template>
