<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { upperFirst } from "scule";
import type { Tables } from "~/types/database.types";

type Document = Tables<"document"> & {
  module: {
    id_module: string;
    titre: string;
  } | null;
};

type Module = Tables<"module">;

const toast = useToast();
const table = useTemplateRef<any>("table");

const UCheckbox = resolveComponent("UCheckbox");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

// StorageService renvoie toujours des URLs publiques complètes.
function getFullFileUrl(fichier: string): string {
  return fichier;
}

/* ---------------------------------------------------
   1. Récupération des documents
----------------------------------------------------*/
const {
  data: documents,
  pending,
  error,
  refresh,
} = await useFetch<Document[]>("/api/document", {
  server: true,
  lazy: false,
});

/* ---------------------------------------------------
   2. Récupération des modules pour le filtre
----------------------------------------------------*/
const { data: modules } = await useFetch<Module[]>("/api/module", {
  server: true,
  lazy: false,
});

/* ---------------------------------------------------
   3. Modal de sélection de module pour le filtre
----------------------------------------------------*/
const showModuleSelectModal = ref(false);
const selectedModuleForFilter = ref<Module | null>(null);
const moduleFilter = ref("all");

function handleModuleSelect(module: Module) {
  selectedModuleForFilter.value = module;
  moduleFilter.value = module.id_module;
}

function clearModuleFilter() {
  selectedModuleForFilter.value = null;
  moduleFilter.value = "all";
}

/* ---------------------------------------------------
   4. Sélection des lignes
----------------------------------------------------*/
const rowSelection = ref<Record<string, boolean>>({});

const selectedRows = computed(
  () =>
    table.value?.tableApi?.getSelectedRowModel().rows.map((r) => r.original) ??
    [],
);

/* ---------------------------------------------------
   5. Modal de suppression
----------------------------------------------------*/
const showDeleteModal = ref(false);
const documentToDelete = ref<Document | null>(null);

function openDeleteModal(doc: Document) {
  documentToDelete.value = doc;
  showDeleteModal.value = true;
}

function onDocumentDeleted() {
  if (documentToDelete.value && documents.value) {
    documents.value = documents.value.filter(
      (d) => d.id_document !== documentToDelete.value?.id_document,
    );
  }
  documentToDelete.value = null;
  clearTableSelection();
}

/* ---------------------------------------------------
   6. Items du menu sur chaque ligne
----------------------------------------------------*/
function getRowItems(row: { original: Document }) {
  const d = row.original;
  const fullUrl = getFullFileUrl(d.fichier);

  return [
    { type: "label", label: "Actions sur le document" },
    {
      label: "Copier l'ID",
      icon: "i-lucide-copy",
      onSelect: () => {
        navigator.clipboard.writeText(String(d.id_document));
        toast.add({ title: "ID copié dans le presse-papier" });
      },
    },
    { type: "separator" },
    {
      label: "Supprimer",
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: () => openDeleteModal(d),
    },
  ];
}

/* ---------------------------------------------------
   7. Colonnes du tableau
----------------------------------------------------*/
/**
Extrait le nom de fichier à afficher
Priorité : nom_original > extraction depuis fichier
*/
function getFileName(document: Document): string {
  // Si nom_original existe, l'utiliser
  if (document.nom_original) {
    return document.nom_original;
  }

  // Sinon, extraire depuis le chemin (anciens documents)
  try {
    const parts = document.fichier.split("/");
    const fileName = parts[parts.length - 1];
    return decodeURIComponent(fileName);
  } catch {
    return document.fichier;
  }
}

function getFileExtension(document: Document): string {
  const fileName = getFileName(document);
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "?";
}

function getFileIcon(document: Document): string {
  const ext = getFileExtension(document).toLowerCase();
  const icons: Record<string, string> = {
    pdf: "i-lucide-file-text",
    doc: "i-lucide-file-text",
    docx: "i-lucide-file-text",
    xls: "i-lucide-file-spreadsheet",
    xlsx: "i-lucide-file-spreadsheet",
    ppt: "i-lucide-presentation",
    pptx: "i-lucide-presentation",
    jpg: "i-lucide-image",
    jpeg: "i-lucide-image",
    png: "i-lucide-image",
    gif: "i-lucide-image",
    zip: "i-lucide-file-archive",
    rar: "i-lucide-file-archive",
    mp4: "i-lucide-file-play",
    mp3: "i-lucide-file-audio",
    txt: "i-lucide-file-text",
  };
  return icons[ext] || "i-lucide-file";
}

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
    cell: ({ row }: any) => {
      const fullUrl = getFullFileUrl(row.original.fichier);
      return h("div", { class: "flex items-center gap-3" }, [
        h(
          "div",
          {
            class:
              "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0",
          },
          [
            h(resolveComponent("UIcon"), {
              name: getFileIcon(row.original),
              class: "text-primary text-lg",
            }),
          ],
        ),
        h("div", { class: "min-w-0" }, [
          h(
            "a",
            {
              class:
                "font-medium truncate max-w-xs block hover:text-primary hover:underline cursor-pointer",
              title: getFileName(row.original) || "Fichier sans nom",
            },
            getFileName(row.original),
          ),
          h(
            "p",
            { class: "text-xs text-muted" },
            getFileExtension(row.original),
          ),
        ]),
      ]);
    },
  },
  {
    id: "module",
    accessorFn: (row: Document) => row.module?.titre || "",
    header: "Module",
    cell: ({ row }: any) =>
      row.original.module
        ? h(
            UBadge,
            { color: "primary", variant: "subtle" },
            () => row.original.module.titre,
          )
        : h("span", { class: "text-muted" }, "—"),
  },
  {
    accessorKey: "created_at",
    header: "Ajouté le",
    cell: ({ row }: any) => {
      const date = new Date(row.original.created_at);
      return date.toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    },
  },
  {
    id: "actions",
    cell: ({ row }: any) =>
      h("div", { class: "text-right" }, [
        h(
          UDropdownMenu,
          {
            items: getRowItems(row),
            content: { align: "end" },
          },
          () =>
            h(UButton, {
              icon: "i-lucide-ellipsis-vertical",
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
            }),
        ),
      ]),
  },
];

/* ---------------------------------------------------
   8. Pagination
----------------------------------------------------*/
const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

/* ---------------------------------------------------
   9. Filtres
----------------------------------------------------*/
const searchQuery = ref("");

// Données filtrées
const filteredData = computed(() => {
  if (!documents.value) return [];

  let result = [...documents.value];

  // Filtre par module
  if (moduleFilter.value !== "all") {
    result = result.filter((d) => d.module?.id_module === moduleFilter.value);
  }

  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((d) => {
      const fileName = getFileName(d).toLowerCase();  
      const moduleName = d.module?.titre?.toLowerCase() || "";
      return fileName.includes(query) || moduleName.includes(query);
    });
  }

  return result;
});

// Données paginées
const paginatedData = computed(() => {
  const start = pagination.value.pageIndex * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return filteredData.value.slice(start, end);
});

// Reset pagination quand les filtres changent
watch([moduleFilter, searchQuery], () => {
  pagination.value.pageIndex = 0;
});

/* ---------------------------------------------------
   10. Déselectionner toutes les lignes
----------------------------------------------------*/
function clearTableSelection() {
  table.value?.tableApi?.resetRowSelection();
  rowSelection.value = {};
}

/* ---------------------------------------------------
   11. Suppression multiple
----------------------------------------------------*/
const showBulkDeleteModal = ref(false);

function onBulkDeleted() {
  refresh();
  clearTableSelection();
}
</script>

<template>
  <UDashboardPanel id="documents">
    <template #header>
      <UDashboardNavbar title="Documents">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Modal de suppression -->
      <DocumentsDeleteModal
        v-model:open="showDeleteModal"
        :document="documentToDelete"
        @deleted="onDocumentDeleted"
      />

      <!-- Modal de suppression multiple -->
      <DocumentsBulkDeleteModal
        v-model:open="showBulkDeleteModal"
        :documents="selectedRows"
        @deleted="onBulkDeleted"
      />

      <!-- Modal de sélection de module -->
      <ModuleSelectModal
        v-model:open="showModuleSelectModal"
        v-model:selected-module="selectedModuleForFilter"
        @select="handleModuleSelect"
        @clear="clearModuleFilter"
      />

      <!-- Stats rapides -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-elevated border border-default rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
            >
              <UIcon name="i-lucide-files" class="text-primary text-xl" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ documents?.length || 0 }}</p>
              <p class="text-sm text-muted">Total documents</p>
            </div>
          </div>
        </div>

        <div class="bg-elevated border border-default rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center"
            >
              <UIcon name="i-lucide-book-open" class="text-info text-xl" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ modules?.length || 0 }}</p>
              <p class="text-sm text-muted">Modules</p>
            </div>
          </div>
        </div>

        <div class="bg-elevated border border-default rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"
            >
              <UIcon name="i-lucide-filter" class="text-success text-xl" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ filteredData.length }}</p>
              <p class="text-sm text-muted">Résultats filtrés</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres et recherche -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <!-- Barre de recherche -->
        <UInput
          v-model="searchQuery"
          placeholder="Rechercher un document..."
          icon="i-lucide-search"
          class="max-w-md"
        />

        <div class="flex items-center gap-3">
          <!-- Bouton supprimer sélection -->
          <UButton
            v-if="selectedRows.length"
            label="Supprimer"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
            @click="showBulkDeleteModal = true"
          >
            <template #trailing>
              <UKbd>{{ selectedRows.length }}</UKbd>
            </template>
          </UButton>

          <!-- Filtre par module avec modal -->
          <div class="flex items-center gap-2">
            <UButton
              :label="
                selectedModuleForFilter
                  ? selectedModuleForFilter.titre
                  : 'Filtrer par module'
              "
              :icon="
                selectedModuleForFilter
                  ? 'i-lucide-book-open'
                  : 'i-lucide-filter'
              "
              :color="selectedModuleForFilter ? 'primary' : 'neutral'"
              variant="outline"
              class="min-w-48 justify-start"
              truncate
              @click="showModuleSelectModal = true"
            />

            <UButton
              v-if="selectedModuleForFilter"
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              square
              @click="clearModuleFilter"
            />
          </div>

          <!-- Bouton colonnes visibles -->
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((c: any) => c.getCanHide())
                .map((c: any) => ({
                  label: upperFirst(c.id),
                  type: 'checkbox' as const,
                  checked: c.getIsVisible(),
                  onUpdateChecked: (v: boolean) => c.toggleVisibility(!!v),
                  onSelect: (e?: Event) => e?.preventDefault(),
                })) ?? []
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Colonnes"
              trailing-icon="i-lucide-settings-2"
              color="neutral"
              variant="outline"
            />
          </UDropdownMenu>
        </div>
      </div>

      <!-- État vide -->
      <div
        v-if="!pending && filteredData.length === 0"
        class="text-center py-16 border-2 border-dashed border-default rounded-lg"
      >
        <UIcon name="i-lucide-file-x" class="text-5xl text-muted mb-4" />
        <p class="font-medium mb-2">Aucun document trouvé</p>
        <p class="text-muted text-sm">
          {{
            searchQuery || moduleFilter !== "all"
              ? "Essayez de modifier vos filtres"
              : "Les documents uploadés dans les modules apparaîtront ici"
          }}
        </p>
      </div>

      <!-- Tableau -->
      <UTable
        v-else
        ref="table"
        v-model:row-selection="rowSelection"
        :data="paginatedData"
        :columns="columns"
        :loading="pending"
        class="max-h-125 overflow-y-auto"
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
        v-if="filteredData.length > 0"
        class="flex items-center justify-between gap-4 border-t border-default pt-4 mt-6"
      >
        <div class="text-sm text-muted">
          {{ selectedRows.length || 0 }} ligne(s) sélectionnée(s)
        </div>

        <UPagination
          :default-page="pagination.pageIndex + 1"
          :items-per-page="pagination.pageSize"
          :total="filteredData.length"
          @update:page="(p) => (pagination.pageIndex = p - 1)"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
