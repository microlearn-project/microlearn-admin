<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Reponse = Tables<"reponse">;

const props = defineProps<{
  reponse: Reponse;
  index: number;
  canDelete: boolean;
}>();

const emit = defineEmits<{
  (e: "update", data: Partial<Reponse>): void;
  (e: "delete"): void;
}>();

// États locaux
const texte = ref(props.reponse.texte);
const estCorrecte = ref(props.reponse.est_correcte);
const explication = ref(props.reponse.explication || "");
const showExplication = ref(!!props.reponse.explication);

// Debounce pour l'auto-save
const saveTimeout = ref<NodeJS.Timeout | null>(null);

function debouncedUpdate() {
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }
  saveTimeout.value = setTimeout(() => {
    emit("update", {
      texte: texte.value,
      est_correcte: estCorrecte.value,
      explication: showExplication.value ? explication.value : null,
    });
  }, 500);
}

// Watchers pour auto-save
watch(texte, debouncedUpdate);
watch(explication, debouncedUpdate);

// Changement immédiat pour est_correcte
watch(estCorrecte, () => {
  emit("update", {
    texte: texte.value,
    est_correcte: estCorrecte.value,
    explication: showExplication.value ? explication.value : null,
  });
});

// Réinitialiser quand la réponse change
watch(
  () => props.reponse,
  (newReponse) => {
    texte.value = newReponse.texte;
    estCorrecte.value = newReponse.est_correcte;
    explication.value = newReponse.explication || "";
    showExplication.value = !!newReponse.explication;
  }
);

function toggleExplication() {
  showExplication.value = !showExplication.value;
  if (!showExplication.value) {
    explication.value = "";
    debouncedUpdate();
  }
}

// Lettres pour les réponses (A, B, C, D...)
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
</script>

<template>
  <div
    class="group relative p-3 rounded-lg border transition-colors"
    :class="{
      'border-success bg-success/5': estCorrecte,
      'border-default bg-elevated hover:border-muted': !estCorrecte,
    }"
  >
    <div class="flex items-start gap-3">
      <!-- Indicateur lettre -->
      <div
        class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
        :class="{
          'bg-success text-white': estCorrecte,
          'bg-muted/50 text-muted': !estCorrecte,
        }"
      >
        {{ letters[index] }}
      </div>

      <!-- Contenu -->
      <div class="flex-1 min-w-0 space-y-2">
        <!-- Texte de la réponse -->
        <UInput
          v-model="texte"
          :placeholder="`Réponse ${letters[index]}...`"
          size="sm"
        />

        <!-- Explication (optionnelle) -->
        <div v-if="showExplication" class="mt-2">
          <UTextarea
            v-model="explication"
            placeholder="Explication affichée après la réponse de l'agent..."
            :rows="2"
            size="sm"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1">
        <!-- Toggle bonne réponse -->
        <UTooltip :text="estCorrecte ? 'Réponse correcte' : 'Marquer comme correcte'">
          <UButton
            :icon="estCorrecte ? 'i-lucide-check-circle' : 'i-lucide-circle'"
            size="xs"
            :color="estCorrecte ? 'success' : 'neutral'"
            :variant="estCorrecte ? 'solid' : 'ghost'"
            @click="estCorrecte = !estCorrecte"
          />
        </UTooltip>

        <!-- Toggle explication -->
        <UTooltip :text="showExplication ? 'Masquer explication' : 'Ajouter explication'">
          <UButton
            icon="i-lucide-message-square"
            size="xs"
            :color="showExplication ? 'primary' : 'neutral'"
            :variant="showExplication ? 'soft' : 'ghost'"
            @click="toggleExplication"
          />
        </UTooltip>

        <!-- Supprimer -->
        <UTooltip v-if="canDelete" text="Supprimer cette réponse">
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            color="error"
            variant="ghost"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click="emit('delete')"
          />
        </UTooltip>
      </div>
    </div>
  </div>
</template>
