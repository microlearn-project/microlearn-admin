<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Question = Tables<"question"> & {
  reponse: Tables<"reponse">[];
};

const props = defineProps<{
  question: Question;
  questionNumber: number;
}>();

const emit = defineEmits<{
  (e: "update"): void;
  (e: "delete"): void;
}>();

const toast = useToast();

// États locaux
const texte = ref(props.question.texte);
const actif = ref(props.question.actif);
const reponses = ref([...props.question.reponse]);

const isCollapsed = ref(false);
const saving = ref(false);

// Debounce pour la mise à jour du texte
const saveTimeout = ref<NodeJS.Timeout | null>(null);

async function updateQuestionTexte() {
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }
  saveTimeout.value = setTimeout(async () => {
    try {
      await $fetch("/api/question/update", {
        method: "PATCH",
        body: {
          id: props.question.id_question,
          texte: texte.value,
        },
      });
    } catch {
      // Erreur silencieuse - la sauvegarde automatique ne doit pas déranger l'utilisateur
    }
  }, 500);
}

// Toggle actif
async function toggleActif() {
  actif.value = !actif.value;
  try {
    await $fetch("/api/question/update", {
      method: "PATCH",
      body: {
        id: props.question.id_question,
        actif: actif.value,
      },
    });
  } catch {
    actif.value = !actif.value; // Rollback
    toast.add({
      title: "Erreur",
      description: "Impossible de modifier le statut",
      color: "error",
    });
  }
}

// Ajouter une réponse
const addingReponse = ref(false);

async function addReponse() {
  addingReponse.value = true;
  try {
    const newReponse = await $fetch("/api/reponse/create", {
      method: "POST",
      body: {
        texte: "",
        est_correcte: false,
        id_question: props.question.id_question,
      },
    });

    reponses.value.push(newReponse as Tables<"reponse">);
  } catch {
    toast.add({
      title: "Erreur",
      description: "Impossible d'ajouter la réponse",
      color: "error",
    });
  } finally {
    addingReponse.value = false;
  }
}

// Mettre à jour une réponse
async function updateReponse(
  reponseId: string,
  data: Partial<Tables<"reponse">>
) {
  try {
    await $fetch("/api/reponse/update", {
      method: "PATCH",
      body: {
        id: reponseId,
        ...data,
      },
    });
  } catch {
    // Erreur silencieuse - la sauvegarde automatique ne doit pas déranger l'utilisateur
  }
}

// Supprimer une réponse
async function deleteReponse(reponseId: string) {
  try {
    await $fetch("/api/reponse/delete", {
      method: "DELETE",
      body: { id: reponseId },
    });

    reponses.value = reponses.value.filter((r) => r.id_reponse !== reponseId);
  } catch {
    toast.add({
      title: "Erreur",
      description: "Impossible de supprimer la réponse",
      color: "error",
    });
  }
}

// Supprimer la question
const deleting = ref(false);

async function deleteQuestion() {
  deleting.value = true;
  try {
    await $fetch("/api/question/delete", {
      method: "DELETE",
      body: { id: props.question.id_question },
    });

    emit("delete");
  } catch {
    toast.add({
      title: "Erreur",
      description: "Impossible de supprimer la question",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

// Réinitialiser quand la question change
watch(
  () => props.question,
  (newQuestion) => {
    texte.value = newQuestion.texte;
    actif.value = newQuestion.actif;
    reponses.value = [...newQuestion.reponse];
  }
);

// Stats de la question
const stats = computed(() => {
  const correctCount = reponses.value.filter((r) => r.est_correcte).length;
  return {
    totalReponses: reponses.value.length,
    correctReponses: correctCount,
    isValid: reponses.value.length >= 2 && correctCount >= 1,
  };
});
</script>

<template>
  <div
    class="border rounded-xl overflow-hidden transition-all"
    :class="{
      'border-default': actif,
      'border-warning/50 bg-warning/5': !actif,
    }"
  >
    <!-- Header -->
    <div
      class="flex items-center gap-3 p-4 bg-elevated cursor-pointer"
      @click="isCollapsed = !isCollapsed"
    >
      <!-- Numéro -->
      <div
        class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
        :class="{
          'bg-primary/10 text-primary': actif,
          'bg-warning/10 text-warning': !actif,
        }"
      >
        {{ questionNumber }}
      </div>

      <!-- Aperçu du texte -->
      <div class="flex-1 min-w-0">
        <div
          class="text-sm font-medium truncate"
          v-html="texte || '<span class=\'text-muted italic\'>Question sans texte...</span>'"
        />
        <div class="flex items-center gap-2 mt-1 text-xs text-muted">
          <span>{{ stats.totalReponses }} réponse(s)</span>
          <span>•</span>
          <span
            :class="{
              'text-success': stats.correctReponses > 0,
              'text-error': stats.correctReponses === 0,
            }"
          >
            {{ stats.correctReponses }} correcte(s)
          </span>
          <template v-if="!actif">
            <span>•</span>
            <UBadge color="warning" variant="subtle" size="xs">Inactive</UBadge>
          </template>
        </div>
      </div>

      <!-- Actions header -->
      <div class="flex items-center gap-1" @click.stop>
        <UTooltip :text="actif ? 'Désactiver' : 'Activer'">
          <UButton
            :icon="actif ? 'i-lucide-eye' : 'i-lucide-eye-off'"
            size="xs"
            :color="actif ? 'neutral' : 'warning'"
            variant="ghost"
            @click="toggleActif"
          />
        </UTooltip>

        <UTooltip text="Supprimer la question">
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            color="error"
            variant="ghost"
            :loading="deleting"
            @click="deleteQuestion"
          />
        </UTooltip>

        <UButton
          :icon="isCollapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
          size="xs"
          color="neutral"
          variant="ghost"
          @click.stop="isCollapsed = !isCollapsed"
        />
      </div>
    </div>

    <!-- Contenu (collapsible) -->
    <Transition name="collapse">
      <div v-show="!isCollapsed" class="p-4 space-y-4 border-t border-default">
        <!-- Éditeur de texte -->
        <div>
          <label class="block text-sm font-medium mb-2">
            Texte de la question
          </label>
          <ModulesQuizQuestionTextEditor
            v-model="texte"
            placeholder="Saisissez la question ici... (vous pouvez utiliser le formatage)"
            @update:model-value="updateQuestionTexte"
          />
        </div>

        <!-- Liste des réponses -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium">
              Réponses
            </label>
            <UButton
              label="Ajouter une réponse"
              icon="i-lucide-plus"
              size="xs"
              color="primary"
              variant="soft"
              :loading="addingReponse"
              @click="addReponse"
            />
          </div>

          <div v-if="reponses.length === 0" class="text-center py-6 text-muted">
            <UIcon name="i-lucide-list" class="text-3xl mb-2" />
            <p class="text-sm">Aucune réponse</p>
            <p class="text-xs">Ajoutez au moins 2 réponses dont 1 correcte</p>
          </div>

          <div v-else class="space-y-2">
            <ModulesQuizReponseEditor
              v-for="(reponse, index) in reponses"
              :key="reponse.id_reponse"
              :reponse="reponse"
              :index="index"
              :can-delete="reponses.length > 1"
              @update="(data) => updateReponse(reponse.id_reponse, data)"
              @delete="deleteReponse(reponse.id_reponse)"
            />
          </div>

          <!-- Warning si pas assez de réponses ou pas de bonne réponse -->
          <div
            v-if="reponses.length > 0 && !stats.isValid"
            class="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg"
          >
            <div class="flex items-start gap-2">
              <UIcon name="i-lucide-alert-triangle" class="text-warning mt-0.5" />
              <div class="text-sm">
                <p v-if="reponses.length < 2" class="text-warning">
                  Ajoutez au moins 2 réponses
                </p>
                <p v-if="stats.correctReponses === 0" class="text-warning">
                  Marquez au moins 1 réponse comme correcte
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 1000px;
}
</style>
