<script setup lang="ts">
import type { Tables } from "~/types/database.types";

// documents n'est plus une colonne de la table cours (dérivé côté API,
// cours_document) — omis ici pour rester compatible avec l'objet enrichi
// que Step2Cours.vue transmet ; ce modal charge de toute façon ses propres
// associations réelles via /api/cours/:id/documents.
type Cours = Omit<Tables<"cours">, "documents">;
type Document = Tables<"document">;

const props = defineProps<{
  cours: Cours;
  moduleId: string;
}>();

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  (e: "updated"): void;
}>();

const toast = useToast();

// Documents disponibles (associés au module)
const { data: availableDocuments, status: loadingDocs } = useFetch<Document[]>(
  `/api/module/documents/${props.moduleId}`,
  {
    default: () => [],
  },
);

// Documents réellement associés à CE cours (table de liaison cours_document —
// cours.documents n'existe plus, c'était l'ancien schéma Supabase).
interface CoursDocumentRow {
  id_document: string;
  document: { fichier: string };
}

const { data: currentDocuments, refresh: refreshCurrentDocuments } = useFetch<
  CoursDocumentRow[]
>(`/api/cours/${props.cours.id_cours}/documents`, { default: () => [] });

const selectedUrls = ref<string[]>([]);

watch(
  currentDocuments,
  (rows) => {
    selectedUrls.value = (rows ?? []).map((row) => row.document.fichier);
  },
  { immediate: true }
);

// Ré-ouvrir le modal (autre cours ou même cours après un changement externe)
// doit refléter l'état réel, pas ce qui traînait de la session précédente.
watch(open, (isOpen) => {
  if (isOpen) refreshCurrentDocuments();
});

// StorageService renvoie toujours des URLs publiques complètes — plus besoin
// de reconstruire quoi que ce soit ici (l'ancien getFullUrl() supposait un
// chemin relatif Supabase, ça n'existe plus).
function getFullUrl(fichier: string): string {
  return fichier;
}
/**
 * Extrait le nom de fichier à afficher
 * Priorité : nom_original > extraction depuis URL/chemin
 */
function getFileName(doc: Document): string {
  // Si nom_original existe, l'utiliser (c'est le vrai nom)
  if (doc.nom_original) {
    return doc.nom_original;
  }

  // Sinon, extraire depuis le chemin/URL (anciens documents)
  try {
    const parts = doc.fichier.split("/");
    const fileName = parts[parts.length - 1];
    return fileName ? decodeURIComponent(fileName) : doc.fichier;
  } catch {
    return doc.fichier;
  }
}

// Vérifier si un document est sélectionné
function isSelected(doc: Document): boolean {
  const fullUrl = getFullUrl(doc.fichier);
  return selectedUrls.value.includes(fullUrl);
}

// Toggle la sélection d'un document
function toggleDocument(doc: Document) {
  const fullUrl = getFullUrl(doc.fichier);
  const index = selectedUrls.value.indexOf(fullUrl);

  if (index === -1) {
    selectedUrls.value.push(fullUrl);
  } else {
    selectedUrls.value.splice(index, 1);
  }
}

const saving = ref(false);

async function saveDocuments() {
  saving.value = true;

  try {
    await $fetch("/api/cours/update", {
      method: "PATCH",
      body: {
        id: props.cours.id_cours,
        documents: selectedUrls.value, // Tableau d'URLs complètes
      },
    });

    await refreshCurrentDocuments();

    toast.add({
      title: "Succès",
      description: "Documents mis à jour",
      color: "success",
    });

    open.value = false;
    emit("updated");
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description:
        err?.data?.statusMessage || "Impossible de mettre à jour les documents",
      color: "error",
    });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Documents`"
    :description="`Cours : ${cours.titre}`"
  >
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-muted">
          Sélectionnez les documents à associer à ce cours. Les URLs complètes
          seront stockées pour un accès direct sur mobile.
        </p>

        <!-- État de chargement -->
        <div v-if="loadingDocs === 'pending'" class="text-center py-8">
          <UIcon
            name="i-lucide-loader-circle"
            class="animate-spin text-3xl text-muted"
          />
          <p class="text-muted mt-2">Chargement des documents...</p>
        </div>

        <!-- Aucun document disponible -->
        <div
          v-else-if="!availableDocuments || availableDocuments.length === 0"
          class="text-center py-8 border-2 border-dashed border-default rounded-lg"
        >
          <UIcon name="i-lucide-file-x" class="text-4xl text-muted mb-2" />
          <p class="font-medium">Aucun document disponible</p>
          <p class="text-sm text-muted mt-1">
            Ajoutez d'abord des documents au module dans l'étape "Détails".
          </p>
        </div>

        <!-- Liste des documents -->
        <div v-else class="space-y-2 max-h-80 overflow-y-auto">
          <div
            v-for="doc in availableDocuments"
            :key="doc.id_document"
            class="flex items-center gap-3 p-3 border border-default rounded-lg cursor-pointer transition-colors"
            :class="{
              'bg-primary/10 border-primary': isSelected(doc),
              'hover:bg-elevated': !isSelected(doc),
            }"
            @click="toggleDocument(doc)"
          >
            <div class="shrink-0">
              <UIcon name="i-lucide-file-text" class="text-xl text-primary" />
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">
                {{ getFileName(doc) }}
              </p>
              <p
                class="text-xs text-muted truncate"
                :title="getFullUrl(doc.fichier)"
              >
                {{ getFullUrl(doc.fichier) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Aperçu des URLs sélectionnées -->
        <div
          v-if="selectedUrls.length > 0"
          class="bg-success/10 border border-success/20 rounded-lg p-3"
        >
          <p class="text-xs font-medium text-success mb-2">
            {{ selectedUrls.length }} document(s) sélectionné(s)
          </p>
          <div class="space-y-1 max-h-24 overflow-y-auto">
            <div
              v-for="(url, index) in selectedUrls"
              :key="index"
              class="flex items-center gap-2 text-xs"
            >
              <UIcon
                name="i-lucide-circle-check"
                class="text-success shrink-0"
              />
              <span class="truncate" :title="url">
                {{
                  availableDocuments.find((d) => getFullUrl(d.fichier) === url)
                    ?.nom_original ||
                  getFileName({ fichier: url, nom_original: null } as Document)
                }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-default">
          <UButton
            label="Annuler"
            color="neutral"
            variant="outline"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            label="Enregistrer"
            color="primary"
            :loading="saving"
            :disabled="!availableDocuments || availableDocuments.length === 0"
            @click="saveDocuments"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
