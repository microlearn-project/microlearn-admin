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
const config = useRuntimeConfig();

const UCheckbox = resolveComponent("UCheckbox");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

/* ---------------------------------------------------
   0. Helper pour construire l'URL complète du fichier
----------------------------------------------------*/
function getFullFileUrl(fichier: string): string {
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (fichier.startsWith("http://") || fichier.startsWith("https://")) {
    return fichier;
  }

  // Sinon, construire l'URL complète avec Supabase
  // Le bucket s'appelle "module-documents" d'après ta structure
  const supabaseUrl = config.public.supabaseUrl || "https://x.supabase.co";

  // Nettoyer le chemin (enlever le / initial si présent)
  const cleanPath = fichier.startsWith("/") ? fichier.slice(1) : fichier;

  // Si le chemin contient déjà "module-documents", ne pas le rajouter
  if (cleanPath.includes("documents")) {
    return `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
  }

  // Sinon, ajouter le bucket
  return `${supabaseUrl}/storage/v1/object/public/documents/${cleanPath}`;
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
   3. Sélection des lignes
----------------------------------------------------*/
const rowSelection = ref<Record<string, boolean>>({});

const selectedRows = computed(
  () =>
    table.value?.tableApi?.getSelectedRowModel().rows.map((r) => r.original) ??
    []
);

/* ---------------------------------------------------
   4. Modal de suppression
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
      (d) => d.id_document !== documentToDelete.value?.id_document
    );
  }
  documentToDelete.value = null;
  clearTableSelection();
}

/* ---------------------------------------------------
   5. Items du menu sur chaque ligne
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
    {
      label: "Ouvrir le fichier",
      icon: "i-lucide-external-link",
      onSelect: () => {
        window.open(fullUrl, "_blank");
      },
    },
    {
      label: "Copier l'URL",
      icon: "i-lucide-link",
      onSelect: () => {
        navigator.clipboard.writeText(fullUrl);
        toast.add({ title: "URL copiée dans le presse-papier" });
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
   6. Colonnes du tableau
----------------------------------------------------*/
function getFileName(fichier: string): string {
  try {
    // Extraire le nom du fichier depuis le chemin ou l'URL
    const parts = fichier.split("/");
    const fileName = parts[parts.length - 1];
    return decodeURIComponent(fileName);
  } catch {
    return fichier;
  }
}

function getFileExtension(fichier: string): string {
  const fileName = getFileName(fichier);
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "?";
}

function getFileIcon(fichier: string): string {
  const ext = getFileExtension(fichier).toLowerCase();
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
    mp4: "i-lucide-file-video",
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
        h("div", {
          class: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"
        }, [
          h(resolveComponent("UIcon"), {
            name: getFileIcon(row.original.fichier),
            class: "text-primary text-lg"
          }),
        ]),
        h("div", { class: "min-w-0" }, [
          h("a", {
            class: "font-medium truncate max-w-xs block hover:text-primary hover:underline cursor-pointer",
            href: fullUrl,
            target: "_blank",
            title: getFileName(row.original.fichier)
          }, getFileName(row.original.fichier)),
          h("p", { class: "text-xs text-muted" }, getFileExtension(row.original.fichier)),
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
            () => row.original.module.titre
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
            })
        ),
      ]),
  },
];

/* ---------------------------------------------------
   7. Pagination
----------------------------------------------------*/
const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

/* ---------------------------------------------------
   8. Filtres
----------------------------------------------------*/
const moduleFilter = ref("all");
const searchQuery = ref("");

// Options du filtre module
const moduleFilterOptions = computed(() => {
  const options = [{ label: "Tous les modules", value: "all" }];
  if (modules.value) {
    for (const m of modules.value) {
      options.push({ label: m.titre, value: m.id_module });
    }
  }
  return options;
});

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
      const fileName = getFileName(d.fichier).toLowerCase();
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
   9. Déselectionner toutes les lignes
----------------------------------------------------*/
function clearTableSelection() {
  table.value?.tableApi?.resetRowSelection();
  rowSelection.value = {};
}

/* ---------------------------------------------------
   10. Suppression multiple
----------------------------------------------------*/
const deletingMultiple = ref(false);
const showBulkDeleteModal = ref(false);

async function deleteSelectedDocuments() {
  if (selectedRows.value.length === 0) return;

  deletingMultiple.value = true;

  try {
    let totalCoursImpacted = 0;

    for (const doc of selectedRows.value) {
      const result = await $fetch("/api/document/delete", {
        method: "DELETE",
        body: { id: doc.id_document },
      });
      totalCoursImpacted += (result as any).coursImpacted || 0;
    }

    await refresh();
    clearTableSelection();

    toast.add({
      title: "Documents supprimés",
      description: totalCoursImpacted > 0
        ? `${selectedRows.value.length} document(s) supprimé(s), ${totalCoursImpacted} cours mis à jour`
        : `${selectedRows.value.length} document(s) supprimé(s)`,
      color: "success",
    });
  } catch (err) {
    toast.add({
      title: "Erreur",
      description: "Erreur lors de la suppression",
      color: "error",
    });
  } finally {
    deletingMultiple.value = false;
  }
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
      <!-- Stats rapides -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-elevated border border-default rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
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
            <div class="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
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
            <div class="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
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
          class="max-w-sm"
        />

        <div class="flex items-center gap-3">
          <!-- Bouton supprimer sélection -->
          <UButton
            v-if="selectedRows.length"
            label="Supprimer"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
            :loading="deletingMultiple"
            @click="deleteSelectedDocuments"
          >
            <template #trailing>
              <UKbd>{{ selectedRows.length }}</UKbd>
            </template>
          </UButton>

          <!-- Filtre par module -->
          <USelect
            v-model="moduleFilter"
            :items="moduleFilterOptions"
            placeholder="Filtrer par module"
            class="min-w-48"
            :ui="{
              trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
            }"
          />

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
          {{ searchQuery || moduleFilter !== 'all' ? 'Essayez de modifier vos filtres' : 'Les documents uploadés dans les modules apparaîtront ici' }}
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
