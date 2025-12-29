<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;

defineProps<{
  module: Module;
}>();

const emit = defineEmits<{
  (e: "next"): void;
  (e: "previous"): void;
}>();
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold mb-2">Cours du module</h2>
      <p class="text-muted">
        Ajoutez et organisez les cours de ce module. Vous pourrez les réordonner par glisser-déposer.
      </p>
    </div>

    <!-- TODO: Contenu de l'étape 2 -->
    <div class="text-center py-16 border-2 border-dashed border-default rounded-lg">
      <UIcon name="i-lucide-book-open" class="mx-auto mb-4 text-6xl text-muted" />
      <p class="text-lg font-medium mb-2">Gestion des cours</p>
      <p class="text-muted">Cette section sera développée dans la prochaine itération</p>
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
        label="Continuer"
        icon="i-lucide-arrow-right"
        trailing
        color="primary"
        @click="emit('next')"
      />
    </div>
  </div>
</template>
