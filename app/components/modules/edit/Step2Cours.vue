<script setup lang="ts">
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;
type Cours = Tables<"cours">;

const props = defineProps<{
  module: Module;
}>();

const emit = defineEmits<{
  (e: "next"): void;
  (e: "previous"): void;
  (e: "refresh"): void;
}>();

const toast = useToast();

// Récupérer les cours du module
const {
  data: coursData,
  status,
  refresh,
} = useFetch<Cours[]>(`/api/cours/${props.module.id_module}`, {
  default: () => [],
});

// Liste locale des cours (pour le drag & drop)
const localCours = ref<Cours[]>([]);

// Ordre initial (pour détecter les changements)
const initialOrder = ref<string[]>([]);

// Indicateur de changement d'ordre
const hasOrderChanged = computed(() => {
  if (localCours.value.length !== initialOrder.value.length) return false;
  return localCours.value.some(
    (cours, index) => cours.id_cours !== initialOrder.value[index]
  );
});

// Synchroniser les données quand elles arrivent
watch(
  coursData,
  (newData) => {
    if (newData) {
      localCours.value = [...newData];
      initialOrder.value = newData.map((c) => c.id_cours);
    }
  },
  { immediate: true }
);

// États des modales
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showDocumentsModal = ref(false);

// Cours sélectionné pour modification/suppression
const selectedCours = ref<Cours | null>(null);

// État du drag & drop
const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

// État de sauvegarde
const savingOrder = ref(false);

// Fonctions utilitaires
function getFileName(url: string): string {
  try {
    const parts = url.split("/");
    const fileName = parts[parts.length - 1];
    return decodeURIComponent(fileName);
  } catch {
    return url;
  }
}

// Actions sur les cours
function openEditModal(coursItem: Cours) {
  selectedCours.value = coursItem;
  showEditModal.value = true;
}

function openDeleteModal(coursItem: Cours) {
  selectedCours.value = coursItem;
  showDeleteModal.value = true;
}

function openDocumentsModal(coursItem: Cours) {
  selectedCours.value = coursItem;
  showDocumentsModal.value = true;
}

// Drag & Drop (modifie seulement l'ordre local)
function onDragStart(event: DragEvent, index: number) {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function onDragOver(event: DragEvent, index: number) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
  dragOverIndex.value = index;
}

function onDragLeave() {
  dragOverIndex.value = null;
}

function onDrop(targetIndex: number) {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    draggedIndex.value = null;
    dragOverIndex.value = null;
    return;
  }

  // Réordonner localement
  const items = [...localCours.value];
  const [draggedItem] = items.splice(draggedIndex.value, 1);
  items.splice(targetIndex, 0, draggedItem);

  // Mettre à jour les ordres visuels
  localCours.value = items.map((item, index) => ({
    ...item,
    ordre: index + 1,
  }));

  draggedIndex.value = null;
  dragOverIndex.value = null;
}

function onDragEnd() {
  draggedIndex.value = null;
  dragOverIndex.value = null;
}

// Annuler les changements d'ordre
function cancelOrderChanges() {
  if (coursData.value) {
    localCours.value = [...coursData.value];
  }
}

// Sauvegarder le nouvel ordre
async function saveOrder() {
  savingOrder.value = true;

  const reorderItems = localCours.value.map((item, index) => ({
    id_cours: item.id_cours,
    ordre: index + 1,
  }));

  try {
    await $fetch("/api/cours/reorder", {
      method: "PATCH",
      body: { items: reorderItems },
    });

    toast.add({
      title: "Succès",
      description: "Ordre des cours enregistré",
      color: "success",
    });

    // Rafraîchir les données pour synchroniser
    await refresh();
  } catch (err: any) { 
    toast.add({
      title: "Erreur",
      description: err?.data?.statusMessage || "Impossible de sauvegarder l'ordre",
      color: "error",
    });
  } finally {
    savingOrder.value = false;
  }
}

// Callbacks des modales
async function onCoursCreated() {
  await refresh();
}

async function onCoursUpdated() {
  await refresh();
}

async function onCoursDeleted() {
  await refresh();
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-bold mb-2">Cours du module</h2>
        <p class="text-muted">
          Ajoutez et organisez les cours. Glissez-déposez pour réordonner.
        </p>
      </div>
      <UButton
        label="Ajouter un cours"
        icon="i-lucide-plus"
        color="primary"
        @click="showAddModal = true"
      />
    </div>

    <!-- Barre de sauvegarde de l'ordre (visible si changement) -->
    <Transition name="slide">
      <div
        v-if="hasOrderChanged"
        class="sticky top-0 z-30 bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-alert-circle" class="text-warning text-xl" />
          <div>
            <p class="font-medium">Ordre modifié</p>
            <p class="text-sm text-muted">
              L'ordre des cours a été modifié. Enregistrez pour appliquer les changements.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            label="Annuler"
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="savingOrder"
            @click="cancelOrderChanges"
          />
          <UButton
            label="Enregistrer l'ordre"
            color="warning"
            size="sm"
            icon="i-lucide-save"
            :loading="savingOrder"
            @click="saveOrder"
          />
        </div>
      </div>
    </Transition>

    <!-- État de chargement -->
    <div v-if="status === 'pending'" class="text-center py-16">
      <UIcon name="i-lucide-loader-circle" class="animate-spin text-4xl text-muted mb-4" />
      <p class="text-muted">Chargement des cours...</p>
    </div>

    <!-- État vide -->
    <div
      v-else-if="!localCours || localCours.length === 0"
      class="text-center py-16 border-2 border-dashed border-default rounded-lg"
    >
      <UIcon name="i-lucide-book-open" class="mx-auto mb-4 text-6xl text-muted" />
      <p class="text-lg font-medium mb-2">Aucun cours</p>
      <p class="text-muted mb-4">
        Ce module n'a pas encore de cours. Commencez par en ajouter un.
      </p>
      <UButton
        label="Ajouter le premier cours"
        icon="i-lucide-plus"
        color="primary"
        @click="showAddModal = true"
      />
    </div>

    <!-- Liste des cours -->
    <div v-else class="space-y-3">
      <TransitionGroup name="list">
        <div
          v-for="(coursItem, index) in localCours"
          :key="coursItem.id_cours"
          draggable="true"
          class="group relative bg-elevated border border-default rounded-lg transition-all duration-200 select-none"
          :class="{
            'opacity-50 scale-95': draggedIndex === index,
            'border-primary border-2 bg-primary/5': dragOverIndex === index && draggedIndex !== index,
          }"
          @dragstart="onDragStart($event, index)"
          @dragover="onDragOver($event, index)"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop(index)"
          @dragend="onDragEnd"
        >
          <div class="flex items-stretch">
            <!-- Handle de drag -->
            <div
              class="flex items-center justify-center w-12 border-r border-default cursor-grab active:cursor-grabbing bg-muted/30 rounded-l-lg hover:bg-muted/50 transition-colors"
            >
              <UIcon name="i-lucide-grip-vertical" class="text-muted" />
            </div>

            <!-- Contenu principal -->
            <div class="flex-1 p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      class="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center"
                    >
                      {{ index + 1 }}
                    </span>
                    <h3 class="font-semibold truncate">{{ coursItem.titre }}</h3>
                  </div>

                  <div class="flex flex-wrap items-center gap-4 text-sm text-muted mt-2">
                    <!-- Durée -->
                    <div class="flex items-center gap-1">
                      <UIcon name="i-lucide-clock" class="text-xs" />
                      <span>{{ coursItem.duree_lecture }}</span>
                    </div>

                    <!-- Documents -->
                    <div class="flex items-center gap-1">
                      <UIcon name="i-lucide-paperclip" class="text-xs" />
                      <span v-if="!coursItem.documents || coursItem.documents.length === 0">
                        Aucun document
                      </span>
                      <span v-else>
                        {{ coursItem.documents.length }} doc(s)
                      </span>
                    </div>
                  </div>

                  <!-- Liste des documents (si présents) -->
                  <div
                    v-if="coursItem.documents && coursItem.documents.length > 0"
                    class="mt-2 flex flex-wrap gap-1"
                  >
                    <UBadge
                      v-for="(docUrl, docIndex) in coursItem.documents.slice(0, 3)"
                      :key="docIndex"
                      color="neutral"
                      variant="subtle"
                      size="xs"
                      class="max-w-37.5"
                    >
                      <UIcon name="i-lucide-file" class="mr-1 shrink-0" />
                      <span class="truncate">{{ getFileName(docUrl) }}</span>
                    </UBadge>
                    <UBadge
                      v-if="coursItem.documents.length > 3"
                      color="neutral"
                      variant="subtle"
                      size="xs"
                    >
                      +{{ coursItem.documents.length - 3 }}
                    </UBadge>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UTooltip text="Gérer les documents">
                    <UButton
                      icon="i-lucide-paperclip"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      @click.stop="openDocumentsModal(coursItem)"
                    />
                  </UTooltip>
                  <UTooltip text="Modifier">
                    <UButton
                      icon="i-lucide-pencil"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      @click.stop="openEditModal(coursItem)"
                    />
                  </UTooltip>
                  <UTooltip text="Supprimer">
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="ghost"
                      size="sm"
                      @click.stop="openDeleteModal(coursItem)"
                    />
                  </UTooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Info box -->
    <div
      v-if="localCours && localCours.length > 0"
      class="bg-info/10 border border-info/20 rounded-lg p-4"
    >
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-info" class="text-info mt-0.5 shrink-0" />
        <div class="text-sm">
          <p class="font-medium mb-1">Astuce</p>
          <p class="text-muted">
            Glissez-déposez les cours pour les réordonner, puis cliquez sur
            "Enregistrer l'ordre" pour sauvegarder.
          </p>
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
        label="Continuer vers les Quiz"
        icon="i-lucide-arrow-right"
        trailing
        color="primary"
        :disabled="!localCours || localCours.length === 0 || hasOrderChanged"
        @click="emit('next')"
      />
    </div>

    <!-- Modales -->
    <ModulesCoursAddModal
      v-if="showAddModal"
      v-model:open="showAddModal"
      :module-id="module.id_module"
      @created="onCoursCreated"
    />

    <ModulesCoursEditModal
      v-if="showEditModal && selectedCours"
      v-model:open="showEditModal"
      :cours="selectedCours"
      @updated="onCoursUpdated"
    />

    <ModulesCoursDeleteModal
      v-if="showDeleteModal && selectedCours"
      v-model:open="showDeleteModal"
      :cours="selectedCours"
      @deleted="onCoursDeleted"
    />

    <ModulesCoursDocumentsModal
      v-if="showDocumentsModal && selectedCours"
      v-model:open="showDocumentsModal"
      :cours="selectedCours"
      :module-id="module.id_module"
      @updated="onCoursUpdated"
    />
  </div>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-active {
  position: absolute;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
