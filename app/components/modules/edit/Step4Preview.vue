<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;

const props = defineProps<{
  module: Module;
}>();

const emit = defineEmits<{
  (e: "previous"): void;
  (e: "finish"): void;
}>();

const toast = useToast();
const publishing = ref(false);

async function publishModule() {
  if (props.module.publish) {
    emit("finish");
    return;
  }

  publishing.value = true;

  try {
    await $fetch(`/api/module/publish`, {
      method: "PATCH",
      body: {
        id: props.module.id_module,
      },
    });

    toast.add({
      title: "Succès",
      description: "Module publié avec succès",
      color: "success",
    });

    emit("finish");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description: err?.data?.message || "Impossible de publier le module",
      color: "error",
    });
  } finally {
    publishing.value = false;
  }
}

// Formater la date
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold mb-2">Aperçu et publication</h2>
      <p class="text-muted">
        Vérifiez les informations du module avant de le publier.
      </p>
    </div>

    <!-- Résumé du module -->
    <div class="space-y-4">
      <div class="bg-elevated border border-default rounded-lg p-6">
        <h3 class="font-semibold text-lg mb-4">{{ module.titre }}</h3>
        <div class="space-y-4 text-sm">
          <!-- Durée -->
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-clock" class="text-muted" />
            <span class="font-medium">Durée :</span>
            <span class="text-muted">{{ module.duree_lecture }}</span>
          </div>

          <!-- Aperçu de la description -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <UIcon name="i-lucide-file-text" class="text-muted" />
              <span class="font-medium">Aperçu de la description :</span>
            </div>
            <div
              class="prose prose-sm prose-neutral dark:prose-invert max-w-none max-h-64 overflow-y-auto rounded-lg bg-muted/20 p-4 border border-default"
              v-html="sanitizeHtml(module.description)"
            />
          </div>
        </div>
      </div>

      <!-- Statut de publication -->
      <div
        v-if="module.publish"
        class="bg-success/10 border border-success/20 rounded-lg p-4"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-circle-check" class="text-success text-xl" />
          <div>
            <p class="font-medium">Module déjà publié</p>
            <p class="text-sm text-muted">
              Publié le {{ formatDate(module.publish_at!) }}
            </p>
          </div>
        </div>
      </div>

      <div v-else class="bg-warning/10 border border-warning/20 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-triangle-alert" class="text-warning text-xl" />
          <div>
            <p class="font-medium">Module non publié</p>
            <p class="text-sm text-muted">
              Ce module n'est pas encore visible par les utilisateurs.
            </p>
          </div>
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
        :disabled="publishing"
        @click="emit('previous')"
      />
      <div class="flex gap-3">
        <UButton
          v-if="!module.publish"
          label="Publier le module"
          icon="i-lucide-upload"
          color="primary"
          :loading="publishing"
          @click="publishModule"
        />
        <UButton
          label="Terminer"
          icon="i-lucide-check"
          :color="module.publish ? 'primary' : 'neutral'"
          :variant="module.publish ? 'solid' : 'outline'"
          :disabled="publishing"
          @click="emit('finish')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.prose img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}

:deep(.prose h1) {
  font-size: 1.5rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

:deep(.prose h2) {
  font-size: 1.25rem;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
}

:deep(.prose p) {
  margin: 0.5rem 0;
}
</style>
