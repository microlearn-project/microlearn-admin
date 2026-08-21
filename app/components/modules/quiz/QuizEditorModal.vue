<script setup lang="ts">
import type { Tables } from "~/types/database.types";

// documents n'est plus une colonne de la table cours (dérivé côté API,
// cours_document) — omis ici pour rester compatible avec l'objet enrichi
// que Step2Cours.vue/Step3Quiz.vue transmettent.
type Cours = Omit<Tables<"cours">, "documents">;
type Quiz = Tables<"quiz"> & {
  // L'API (formatQuiz) renvoie "questions" (pluriel), pas la relation Prisma
  // brute "question" — à ne pas confondre avec POST /quiz/create qui renvoie
  // la ligne Prisma brute (sans ce champ, injecté manuellement ci-dessous).
  questions: (Tables<"question"> & {
    reponse: Tables<"reponse">[];
  })[];
};

const props = defineProps<{
  cours: Cours;
}>();

const open = defineModel<boolean>("open", { default: false });
useModalEscapeOnly(open);

const emit = defineEmits<{
  (e: "saved"): void;
}>();

const toast = useToast();

// Charger le quiz du cours
const quiz = ref<Quiz | null>(null);
const loading = ref(true);
const creating = ref(false);

// UInput (nuxt-ui) accepte string | undefined, pas string | null (colonne
// description nullable en base) — pont get/set entre les deux. Distinct de
// quizDescription (ref plus bas) qui sert au formulaire de création.
const quizDescriptionModel = computed<string | undefined>({
  get: () => quiz.value?.description ?? undefined,
  set: (value) => {
    if (quiz.value) quiz.value.description = value ?? null;
  },
});

async function loadQuiz() {
  loading.value = true;
  try {
    const data = await $fetch<Quiz | null>(
      `/api/quiz/by-cours/${props.cours.id_cours}`
    );
    quiz.value = data;
  } catch {
    toast.add({
      title: "Erreur",
      description: "Impossible de charger le quiz",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Charger au montage et quand le cours change
watch(
  () => props.cours.id_cours,
  () => {
    if (open.value) {
      loadQuiz();
    }
  },
  { immediate: true }
);

watch(open, (isOpen) => {
  if (isOpen) {
    loadQuiz();
  }
});

// Créer un quiz
const quizTitre = ref("");
const quizDescription = ref("");

async function createQuiz() {
  if (!quizTitre.value.trim()) {
    toast.add({
      title: "Erreur",
      description: "Le titre du quiz est requis",
      color: "error",
    });
    return;
  }

  creating.value = true;
  try {
    const newQuiz = await $fetch<Quiz>("/api/quiz/create", {
      method: "POST",
      body: {
        titre: quizTitre.value,
        description: quizDescription.value || null,
        id_cours: props.cours.id_cours,
      },
    });

    quiz.value = { ...newQuiz, questions: [] };

    toast.add({
      title: "Succès",
      description: "Quiz créé",
      color: "success",
    });

    quizTitre.value = "";
    quizDescription.value = "";
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.statusMessage || "Impossible de créer le quiz",
      color: "error",
    });
  } finally {
    creating.value = false;
  }
}

// Mettre à jour le quiz
const savingQuiz = ref(false);
const quizSaveTimeout = ref<NodeJS.Timeout | null>(null);

function debouncedUpdateQuiz() {
  if (!quiz.value) return;

  if (quizSaveTimeout.value) {
    clearTimeout(quizSaveTimeout.value);
  }

  quizSaveTimeout.value = setTimeout(async () => {
    try {
      await $fetch("/api/quiz/update", {
        method: "PATCH",
        body: {
          id: quiz.value!.id_quiz,
          titre: quiz.value!.titre,
          description: quiz.value!.description,
        },
      });
    } catch {
      // Erreur silencieuse - la sauvegarde automatique ne doit pas déranger l'utilisateur
    }
  }, 500);
}

// Ajouter une question
const addingQuestion = ref(false);

async function addQuestion() {
  if (!quiz.value) return;

  addingQuestion.value = true;
  try {
    const newQuestion = await $fetch("/api/question/create", {
      method: "POST",
      body: {
        texte: "",
        id_quiz: quiz.value.id_quiz,
        actif: true,
      },
    });

    quiz.value.questions.push({
      ...(newQuestion as Tables<"question">),
      reponse: [],
    });

    toast.add({
      title: "Question ajoutée",
      description: "N'oubliez pas d'ajouter les réponses",
      color: "success",
    });
  } catch {
    toast.add({
      title: "Erreur",
      description: "Impossible d'ajouter la question",
      color: "error",
    });
  } finally {
    addingQuestion.value = false;
  }
}

// Supprimer une question
function onQuestionDeleted(questionId: string) {
  if (!quiz.value) return;
  quiz.value.questions = quiz.value.questions.filter(
    (q) => q.id_question !== questionId
  );
}

// Fermer le modal
function onClose() {
  emit("saved");
  open.value = false;
}

// Stats du quiz
const quizStats = computed(() => {
  if (!quiz.value) return null;

  const questions = quiz.value.questions;
  const activeQuestions = questions.filter((q) => q.actif);
  const validQuestions = questions.filter((q) => {
    const reponses = q.reponse;
    return reponses.length >= 2 && reponses.some((r) => r.est_correcte);
  });

  return {
    totalQuestions: questions.length,
    activeQuestions: activeQuestions.length,
    validQuestions: validQuestions.length,
    isValid: validQuestions.length > 0 && validQuestions.length === activeQuestions.length,
  };
});
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Quiz : ${cours.titre}`"
    :ui="{
      content: 'w-[calc(100vw-2rem)] max-w-4xl',
    }"
    :dismissible="false"
    @close="onClose"
    :description="quiz ? 'Éditez les questions et réponses du quiz.' : 'Créez un quiz pour ce cours.'"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Chargement -->
        <div v-if="loading" class="text-center py-12">
          <UIcon name="i-lucide-loader-circle" class="animate-spin text-4xl text-muted mb-4" />
          <p class="text-muted">Chargement du quiz...</p>
        </div>

        <!-- Pas de quiz : formulaire de création -->
        <div v-else-if="!quiz" class="space-y-4">
          <div class="text-center py-8">
            <UIcon name="i-lucide-help-circle" class="text-5xl text-muted mb-4" />
            <h3 class="text-lg font-semibold mb-2">Aucun quiz pour ce cours</h3>
            <p class="text-muted mb-6">
              Créez un quiz pour évaluer les connaissances des agents sur ce cours.
            </p>
          </div>

          <UFormField label="Titre du quiz" required>
            <UInput
              v-model="quizTitre"
              placeholder="Ex: Quiz - Introduction aux bases"
            />
          </UFormField>

          <UFormField label="Description (optionnelle)">
            <UTextarea
              v-model="quizDescription"
              placeholder="Description ou instructions pour le quiz..."
              :rows="2"
            />
          </UFormField>

          <div class="flex justify-end gap-3 pt-4">
            <UButton
              label="Annuler"
              color="neutral"
              variant="outline"
              @click="open = false"
            />
            <UButton
              label="Créer le quiz"
              color="primary"
              icon="i-lucide-plus"
              :loading="creating"
              @click="createQuiz"
            />
          </div>
        </div>

        <!-- Quiz existant : éditeur -->
        <template v-else>
          <!-- Infos du quiz -->
          <div class="bg-elevated rounded-xl p-4 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Titre du quiz">
                <UInput
                  v-model="quiz.titre"
                  @update:model-value="debouncedUpdateQuiz"
                />
              </UFormField>

              <UFormField label="Description">
                <UInput
                  v-model="quizDescriptionModel"
                  placeholder="Description optionnelle..."
                  @update:model-value="debouncedUpdateQuiz"
                />
              </UFormField>
            </div>

            <!-- Stats -->
            <div
              v-if="quizStats"
              class="flex items-center gap-4 pt-2 border-t border-default text-sm"
            >
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-help-circle" class="text-muted" />
                <span>{{ quizStats.totalQuestions }} question(s)</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-eye" class="text-muted" />
                <span>{{ quizStats.activeQuestions }} active(s)</span>
              </div>
              <div
                class="flex items-center gap-2"
                :class="{
                  'text-success': quizStats.isValid,
                  'text-warning': !quizStats.isValid,
                }"
              >
                <UIcon
                  :name="quizStats.isValid ? 'i-lucide-check-circle' : 'i-lucide-alert-circle'"
                />
                <span>{{ quizStats.validQuestions }} valide(s)</span>
              </div>
            </div>
          </div>

          <!-- Liste des questions -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">Questions</h3>
              <UButton
                label="Ajouter une question"
                icon="i-lucide-plus"
                color="primary"
                :loading="addingQuestion"
                @click="addQuestion"
              />
            </div>

            <div v-if="quiz.questions.length === 0" class="text-center py-12 border-2 border-dashed border-default rounded-xl">
              <UIcon name="i-lucide-list-plus" class="text-5xl text-muted mb-4" />
              <p class="font-medium mb-2">Aucune question</p>
              <p class="text-muted text-sm mb-4">
                Ajoutez des questions pour compléter votre quiz.
              </p>
              <UButton
                label="Ajouter la première question"
                icon="i-lucide-plus"
                color="primary"
                variant="soft"
                :loading="addingQuestion"
                @click="addQuestion"
              />
            </div>

            <div v-else class="space-y-4">
              <ModulesQuizQuestionEditor
                v-for="(question, index) in quiz.questions"
                :key="question.id_question"
                :question="question"
                :question-number="index + 1"
                @delete="onQuestionDeleted(question.id_question)"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-between items-center pt-4 border-t border-default">
            <div class="text-sm text-muted">
              <UIcon name="i-lucide-info" class="inline mr-1" />
              Les modifications sont sauvegardées automatiquement
            </div>
            <UButton
              label="Terminer"
              color="primary"
              @click="onClose"
            />
          </div>
        </template>
      </div>
    </template>
  </UModal>
</template>
