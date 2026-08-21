<script setup lang="ts">
import type { Tables } from "~/types/database.types";

// Import asynchrone du composant pour éviter les problèmes de résolution
const QuizEditorModal = defineAsyncComponent(
  () => import("~/components/modules/quiz/QuizEditorModal.vue")
);

type Module = Tables<"module">;
// documents n'est plus une colonne de la table cours (dérivé côté API,
// cours_document) — omis ici pour rester compatible avec l'objet enrichi
// que Step2Cours.vue transmet.
type Cours = Omit<Tables<"cours">, "documents">;
type Quiz = Tables<"quiz"> & {
  // L'API (formatQuiz) renvoie "questions" (pluriel) — voir la même note
  // dans QuizEditorModal.vue.
  questions: (Tables<"question"> & {
    reponse: Tables<"reponse">[];
  })[];
};

const props = defineProps<{
  module: Module;
}>();

const emit = defineEmits<{
  (e: "next"): void;
  (e: "previous"): void;
}>();

// Récupérer les cours du module
const { data: cours, status: loadingCours } = useFetch<Cours[]>(
  `/api/cours/${props.module.id_module}`,
  {
    default: () => [],
  }
);

// État des quiz par cours (chargement à la demande)
const quizByCoursId = ref<Record<string, Quiz | null | "loading">>({});

// Charger le quiz d'un cours
async function loadQuizForCours(coursId: string) {
  if (quizByCoursId.value[coursId] !== undefined) return;

  quizByCoursId.value[coursId] = "loading";

  try {
    const data = await $fetch<Quiz | null>(`/api/quiz/by-cours/${coursId}`);
    quizByCoursId.value[coursId] = data;
  } catch (err) { 
    quizByCoursId.value[coursId] = null;
  }
}

// Charger tous les quiz au montage
watch(
  cours,
  async (newCours) => {
    if (newCours && newCours.length > 0) {
      for (const c of newCours) {
        await loadQuizForCours(c.id_cours);
      }
    }
  },
  { immediate: true }
);

// Modal d'édition
const showQuizEditor = ref(false);
const selectedCours = ref<Cours | null>(null);

function openQuizEditor(coursItem: Cours) {
  selectedCours.value = coursItem;
  showQuizEditor.value = true;
}

// Callback après fermeture du modal
async function onQuizSaved() {
  if (selectedCours.value) {
    // Forcer le rechargement du quiz
    delete quizByCoursId.value[selectedCours.value.id_cours];
    await loadQuizForCours(selectedCours.value.id_cours);
  }
}

// Helpers
function getQuizStatus(coursId: string) {
  const quiz = quizByCoursId.value[coursId];

  if (quiz === "loading") {
    return { status: "loading", label: "Chargement...", color: "neutral" };
  }

  if (!quiz) {
    return { status: "none", label: "Pas de quiz", color: "neutral" };
  }

  const questions = quiz.questions || [];
  const activeQuestions = questions.filter((q) => q.actif);
  const validQuestions = questions.filter((q) => {
    const reponses = q.reponse || [];
    return reponses.length >= 2 && reponses.some((r) => r.est_correcte);
  });

  if (activeQuestions.length === 0) {
    return { status: "empty", label: "Aucune question", color: "warning" };
  }

  if (validQuestions.length < activeQuestions.length) {
    return {
      status: "incomplete",
      label: `${validQuestions.length}/${activeQuestions.length} valide(s)`,
      color: "warning",
    };
  }

  return {
    status: "ready",
    label: `${activeQuestions.length} question(s)`,
    color: "success",
  };
}

function getQuizInfo(coursId: string) {
  const quiz = quizByCoursId.value[coursId];
  if (!quiz || quiz === "loading") return null;
  return quiz;
}

// Stats globales
const globalStats = computed(() => {
  const coursWithQuiz = Object.entries(quizByCoursId.value).filter(
    ([_, quiz]) => quiz && quiz !== "loading"
  ).length;

  const readyQuiz = Object.entries(quizByCoursId.value).filter(([_, quiz]) => {
    if (!quiz || quiz === "loading") return false;
    const questions = quiz.questions || [];
    const activeQuestions = questions.filter((q) => q.actif);
    const validQuestions = questions.filter((q) => {
      const reponses = q.reponse || [];
      return reponses.length >= 2 && reponses.some((r) => r.est_correcte);
    });
    return (
      activeQuestions.length > 0 &&
      validQuestions.length === activeQuestions.length
    );
  }).length;

  return {
    totalCours: cours.value?.length || 0,
    coursWithQuiz,
    readyQuiz,
  };
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-bold mb-2">Quiz du module</h2>
        <p class="text-muted">
          Créez des quiz pour évaluer les connaissances acquises dans chaque cours.
        </p>
      </div>
    </div>

    <!-- Stats globales -->
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-elevated rounded-xl p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UIcon name="i-lucide-book-open" class="text-primary text-xl" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ globalStats.totalCours }}</p>
            <p class="text-sm text-muted">Cours</p>
          </div>
        </div>
      </div>

      <div class="bg-elevated rounded-xl p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
            <UIcon name="i-lucide-help-circle" class="text-info text-xl" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ globalStats.coursWithQuiz }}</p>
            <p class="text-sm text-muted">Avec quiz</p>
          </div>
        </div>
      </div>

      <div class="bg-elevated rounded-xl p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <UIcon name="i-lucide-check-circle" class="text-success text-xl" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ globalStats.readyQuiz }}</p>
            <p class="text-sm text-muted">Prêts</p>
          </div>
        </div>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loadingCours === 'pending'" class="text-center py-16">
      <UIcon name="i-lucide-loader-circle" class="animate-spin text-4xl text-muted mb-4" />
      <p class="text-muted">Chargement des cours...</p>
    </div>

    <!-- Aucun cours -->
    <div
      v-else-if="!cours || cours.length === 0"
      class="text-center py-16 border-2 border-dashed border-default rounded-lg"
    >
      <UIcon name="i-lucide-book-x" class="mx-auto mb-4 text-6xl text-muted" />
      <p class="text-lg font-medium mb-2">Aucun cours</p>
      <p class="text-muted">
        Vous devez d'abord créer des cours avant de pouvoir ajouter des quiz.
      </p>
      <UButton
        label="Retour aux cours"
        icon="i-lucide-arrow-left"
        color="primary"
        variant="soft"
        class="mt-4"
        @click="emit('previous')"
      />
    </div>

    <!-- Liste des cours avec leurs quiz -->
    <div v-else class="space-y-3">
      <div
        v-for="coursItem in cours"
        :key="coursItem.id_cours"
        class="group bg-elevated border border-default rounded-xl p-4 hover:border-primary/50 transition-colors"
      >
        <div class="flex items-center justify-between gap-4">
          <!-- Info du cours -->
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <div
              class="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
            >
              <span class="font-bold text-primary">{{ coursItem.ordre }}</span>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="font-semibold truncate">{{ coursItem.titre }}</h3>
              <div class="flex items-center gap-3 mt-1">
                <!-- Durée -->
                <span class="text-xs text-muted flex items-center gap-1">
                  <UIcon name="i-lucide-clock" />
                  {{ coursItem.duree_lecture }}
                </span>

                <!-- Status du quiz -->
                <UBadge
                  :color="getQuizStatus(coursItem.id_cours).color as any"
                  variant="subtle"
                  size="xs"
                >
                  <UIcon
                    v-if="getQuizStatus(coursItem.id_cours).status === 'loading'"
                    name="i-lucide-loader-circle"
                    class="animate-spin mr-1"
                  />
                  <UIcon
                    v-else-if="getQuizStatus(coursItem.id_cours).status === 'ready'"
                    name="i-lucide-check"
                    class="mr-1"
                  />
                  <UIcon
                    v-else-if="getQuizStatus(coursItem.id_cours).status === 'none'"
                    name="i-lucide-x"
                    class="mr-1"
                  />
                  <UIcon
                    v-else
                    name="i-lucide-alert-circle"
                    class="mr-1"
                  />
                  {{ getQuizStatus(coursItem.id_cours).label }}
                </UBadge>
              </div>
            </div>
          </div>

          <!-- Info quiz et action -->
          <div class="flex items-center gap-4">
            <!-- Aperçu du quiz si existant -->
            <div
              v-if="getQuizInfo(coursItem.id_cours)"
              class="text-right hidden sm:block"
            >
              <p class="text-sm font-medium truncate max-w-50">
                {{ getQuizInfo(coursItem.id_cours)?.titre }}
              </p>
              <p class="text-xs text-muted">
                {{ getQuizInfo(coursItem.id_cours)?.questions?.length || 0 }} question(s)
              </p>
            </div>

            <!-- Bouton d'action -->
            <UButton
              :label="getQuizInfo(coursItem.id_cours) ? 'Éditer le quiz' : 'Créer un quiz'"
              :icon="getQuizInfo(coursItem.id_cours) ? 'i-lucide-pencil' : 'i-lucide-plus'"
              :color="getQuizInfo(coursItem.id_cours) ? 'neutral' : 'primary'"
              :variant="getQuizInfo(coursItem.id_cours) ? 'outline' : 'solid'"
              size="sm"
              @click="openQuizEditor(coursItem)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Info box -->
    <div class="bg-info/10 border border-info/20 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-info" class="text-info mt-0.5 shrink-0" />
        <div class="text-sm">
          <p class="font-medium mb-1">À propos des quiz</p>
          <ul class="text-muted space-y-1">
            <li>• Chaque cours peut avoir <strong>un seul quiz</strong></li>
            <li>• Une question valide a <strong>au moins 2 réponses</strong> dont <strong>1 correcte</strong></li>
            <li>• Les questions inactives ne seront pas affichées aux agents</li>
            <li>• Vous pouvez formater le texte des questions (gras, italique...)</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Boutons de navigation -->
    <div class="flex justify-between pt-6 border-t border-default">
      <UButton
        label="Précédent"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="outline"
        @click="emit('previous')"
      />
      <UButton
        label="Continuer vers l'aperçu"
        icon="i-lucide-arrow-right"
        trailing
        color="primary"
        @click="emit('next')"
      />
    </div>

    <!-- Modal d'édition de quiz (avec composant importé explicitement) -->
    <QuizEditorModal
      v-if="selectedCours"
      v-model:open="showQuizEditor"
      :cours="selectedCours"
      @saved="onQuizSaved"
    />
  </div>
</template>
