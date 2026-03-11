<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { upperFirst } from "scule";
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;
type Document = Tables<"document">;

const props = defineProps<{
  module: Module;
}>();

const open = defineModel<boolean>("open", { default: false });
const toast = useToast();

const UCheckbox = resolveComponent("UCheckbox");
const UButton = resolveComponent("UButton");

const table = useTemplateRef<any>("table");

/* ---------------------------------------------------
   1. Récupération des documents du module
----------------------------------------------------*/
const {
  data: documents,
  pending,
  refresh,
  error,
} = useFetch<Document[]>(
  () => `/api/module/documents/${props.module.id_module}`,
  {
    server: false,
    lazy: true,
    immediate: false,
    watch: false,
  }
);

// Charger les documents quand le modal s'ouvre
watch(
  open,
  async (isOpen) => {
    if (isOpen) {
      await refresh();
    }
  },
  { immediate: true }
);

/* ---------------------------------------------------
   2. Sélection des lignes
----------------------------------------------------*/
const rowSelection = ref<Record<string, boolean>>({});

const selectedRows = computed(
  () =>
    table.value?.tableApi?.getSelectedRowModel().rows.map((r) => r.original) ??
    []
);

/* ---------------------------------------------------
   3. Modal d'ajout de documents
----------------------------------------------------*/
const showAddModal = ref(false);

/* ---------------------------------------------------
   4. Retirer des documents
----------------------------------------------------*/
const removing = ref(false);

async function removeDocuments() {
  if (selectedRows.value.length === 0) return;

  removing.value = true;
  try {
    await Promise.all(
      selectedRows.value.map((doc) =>
        $fetch(`/api/module/documents/remove`, {
          method: "DELETE",
          body: {
            id_document: doc.id_document,
          },
        })
      )
    );

    toast.add({
      title: "Succès",
      description: `${selectedRows.value.length} document(s) retiré(s)`,
      color: "success",
    });

    await refresh();
    clearTableSelection();
  } catch (err) {
    toast.add({
      title: "Erreur",
      description: (err as Error).message,
      color: "error",
    });
  } finally {
    removing.value = false;
  }
}

/* ---------------------------------------------------
   5. Afficher nom_original en priorité
----------------------------------------------------*/
function getFileName(document: Document): string {
  // Si nom_original existe
  if (document.nom_original) {
    return document.nom_original;
  }

  // Sinon, extraire le nom depuis le chemin (anciens documents)
  const parts = document.fichier.split("/");
  return parts[parts.length - 1];
}

/* ---------------------------------------------------
   6. Colonnes du tableau
----------------------------------------------------*/
const columns: TableColumn<Document>[] = [
  {
    id: "select",
    header: ({ table }: any) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? "indeterminate"
          : table.getIsAllPageRowsSelected(),
        "onUpdate:modelValue": (v) => table.toggleAllPageRowsSelected(!!v),
        ariaLabel: "Sélectionner tout",
      }),
    cell: ({ row }: any) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        "onUpdate:modelValue": (v) => row.toggleSelected(!!v),
        ariaLabel: "Sélectionner la ligne",
      }),
  },
  {
    accessorKey: "fichier",
    header: "Fichier",
    cell: ({ row }: any) =>
      h(
        "div",
        { class: "flex items-center gap-2" },
        [
          h("span", { class: "i-lucide-file text-muted" }),
          // Utiliser getFileName qui gère nom_original
          h("span", { class: "font-medium truncate max-w-xs" }, getFileName(row.original)),
        ]
      ),
  },
  {
    accessorKey: "updated_at",
    header: "Dernière modification",
    cell: ({ row }: any) => {
      const date = new Date(row.original.updated_at);
      return date.toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    },
  },
  {
    accessorKey: "created_at",
    header: "Date création",
    cell: ({ row }: any) => {
      const date = new Date(row.original.created_at);
      return date.toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    },
  },
];

/* ---------------------------------------------------
   7. Pagination
----------------------------------------------------*/
const pagination = ref({
  pageIndex: 0,
  pageSize: 5,
});

const paginatedData = computed(() => {
  if (!documents.value) return [];
  const start = pagination.value.pageIndex * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return documents.value.slice(start, end);
});

/* ---------------------------------------------------
   8. Déselectionner toutes les lignes
----------------------------------------------------*/
function clearTableSelection() {
  table.value?.tableApi?.resetRowSelection();
  rowSelection.value = {};
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Documents du module « ${module.titre} »`"
    description="Gérer les documents associés à ce module"
    :ui="{ content: 'sm:max-w-5xl' }"
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <!-- Barre d'actions -->
        <div class="flex items-center justify-between gap-3">
          <!-- Recherche -->
          <UInput
            placeholder="Rechercher un document..."
            :model-value="
              (table?.tableApi
                ?.getColumn('fichier')
                ?.getFilterValue() as string) ?? ''
            "
            icon="i-lucide-search"
            class="max-w-xs"
            @update:model-value="
              table?.tableApi?.getColumn('fichier')?.setFilterValue($event)
            "
          />

          <div class="flex items-center gap-2">
            <!-- Bouton retirer -->
            <UButton
              v-if="selectedRows.length > 0"
              label="Retirer"
              color="error"
              variant="subtle"
              icon="i-lucide-x"
              :loading="removing"
              @click="removeDocuments"
            >
              <template #trailing>
                <UKbd>{{ selectedRows.length }}</UKbd>
              </template>
            </UButton>

            <!-- Bouton ajouter -->
            <UButton
              label="Ajouter"
              icon="i-lucide-upload"
              color="primary"
              @click="showAddModal = true"
            />
          </div>
        </div>

        <!-- Tableau -->
        <UTable
          ref="table"
          v-model:row-selection="rowSelection"
          :data="paginatedData"
          :columns="columns"
          :loading="pending"
          class="max-h-100 overflow-y-auto"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50',
            th: `
              sticky top-0 z-10
              bg-elevated
              first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r
            `,
            td: 'border-b border-default py-3',
            tbody: '[&>tr:last-child>td]:border-b-0',
          }"
        />

        <!-- Pied de page -->
        <div
          v-if="documents && documents.length > 0"
          class="flex items-center justify-between gap-4 border-t border-default pt-4"
        >
          <div class="text-sm text-muted">
            {{ selectedRows.length || 0 }} document(s) sélectionné(s)
          </div>

          <UPagination
            :default-page="pagination.pageIndex + 1"
            :items-per-page="pagination.pageSize"
            :total="documents?.length || 0"
            @update:page="(p) => (pagination.pageIndex = p - 1)"
          />
        </div>

        <!-- Message si aucun document -->
        <div
          v-if="!pending && (!documents || documents.length === 0)"
          class="text-center py-8 text-muted"
        >
          <UIcon name="i-lucide-file-text" class="mx-auto mb-2 text-4xl" />
          <p>Aucun document associé à ce module</p>
          <UButton
            label="Ajouter un document"
            icon="i-lucide-upload"
            color="primary"
            variant="subtle"
            class="mt-4"
            @click="showAddModal = true"
          />
        </div>

        <!-- Bouton fermer -->
        <div class="flex justify-end pt-4">
          <UButton
            label="Fermer"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
        </div>
      </div>
    </template>
  </UModal>

  <!-- Modal d'ajout de documents -->
  <ModulesAddDocumentModal
    v-if="showAddModal"
    v-model:open="showAddModal"
    :module="module"
    @added="refresh()"
  />
</template>
