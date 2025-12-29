<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { upperFirst } from "scule";
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;

const toast = useToast();
const table = useTemplateRef<any>("table");

const UCheckbox = resolveComponent("UCheckbox");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

/* ---------------------------------------------------
   1. Récupération des modules
----------------------------------------------------*/
const {
  data: modules,
  pending,
  error,
  refresh,
} = await useFetch<Module[]>("/api/module", {
  server: true,
  lazy: false,
});

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
   3. Modules sélectionnés pour les différents modals
----------------------------------------------------*/
const moduleToPublish = ref<Module | null>(null);
const showPublishModal = ref(false);

const moduleForCategories = ref<Module | null>(null);
const showCategoriesModal = ref(false);

const moduleForServices = ref<Module | null>(null);
const showServicesModal = ref(false);

const moduleForDocuments = ref<Module | null>(null);
const showDocumentsModal = ref(false);

/* ---------------------------------------------------
   4. Items du menu sur chaque ligne
----------------------------------------------------*/
function getRowItems(row: { original: Module }) {
  const m = row.original;
  return [
    { type: "label", label: "Actions sur le module" },
    {
      label: "Copier l'ID",
      icon: "i-lucide-copy",
      onSelect: () => {
        navigator.clipboard.writeText(String(m.id_module));
        toast.add({ title: "ID copié dans le presse-papier" });
      },
    },
    { type: "separator" },
    {
      label: "Modifier",
      icon: "i-lucide-edit",
      onSelect: () => {
        navigateTo(`/modules/edit/${m.id_module}`);
      },
    },
    ...(!m.publish
      ? [
          {
            label: "Publier",
            icon: "i-lucide-upload",
            color: "success",
            onSelect: () => {
              moduleToPublish.value = m;
              showPublishModal.value = true;
            },
          },
          { type: "separator" },
        ]
      : []),
    {
      label: "Catégories",
      icon: "i-lucide-tags",
      onSelect: () => {
        moduleForCategories.value = m;
        showCategoriesModal.value = true;
      },
    },
    {
      label: "Services",
      icon: "i-lucide-briefcase",
      onSelect: () => {
        moduleForServices.value = m;
        showServicesModal.value = true;
      },
    },
    {
      label: "Documents",
      icon: "i-lucide-file-text",
      onSelect: () => {
        moduleForDocuments.value = m;
        showDocumentsModal.value = true;
      },
    },
  ];
}

/* ---------------------------------------------------
   4. Colonnes du tableau
----------------------------------------------------*/
const columns: TableColumn<Module>[] = [
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
    accessorKey: "titre",
    header: "Titre",
    cell: ({ row }: any) =>
      h("div", { class: "font-medium" }, row.original.titre),
  },
  {
    accessorKey: "duree_lecture",
    header: "Durée lecture",
    cell: ({ row }: any) => row.original.duree_lecture,
  },
  {
    id: "publish",
    accessorFn: (row: Module) => row.publish,
    header: "Publié ?",
    cell: ({ row }: any) =>
      h(
        UBadge,
        {
          color: row.original.publish ? "success" : "neutral",
          variant: "subtle",
        },
        () => (row.original.publish ? "OUI" : "NON")
      ),
  },
  {
    accessorKey: "publish_at",
    header: "Date publication",
    cell: ({ row }: any) => {
      if (!row.original.publish_at) return "---";
      const date = new Date(row.original.publish_at);
      return date.toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    },
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
   5. Pagination
----------------------------------------------------*/
const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

/* ---------------------------------------------------
   6. Filtre du tableau
----------------------------------------------------*/
const publishFilter = ref("all");
watch(
  () => publishFilter.value,
  (newVal) => {
    if (!table?.value?.tableApi) return;

    const publishColumn = table.value.tableApi.getColumn("publish");
    if (!publishColumn) return;

    if (newVal === "all") {
      publishColumn.setFilterValue(undefined);
    } else {
      publishColumn.setFilterValue(newVal === "published");
    }
  }
);

/* ---------------------------------------------------
   7. Données paginées
----------------------------------------------------*/
const paginatedData = computed(() => {
  if (!modules.value) return [];
  const start = pagination.value.pageIndex * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return modules.value.slice(start, end);
});


/* ---------------------------------------------------
   8. Déselectionner toutes les lignes
----------------------------------------------------*/
function clearTableSelection() {
  table.value?.tableApi?.resetRowSelection();
  rowSelection.value = {};
}

/* ---------------------------------------------------
   Mise à jour locale (UX optimisée)
----------------------------------------------------*/

// Gérer la publication d'un module
function handlePublishSuccess(updatedModule?: Module) {
  if (!modules.value || !moduleToPublish.value) return;

  const targetId = moduleToPublish.value.id_module;

  modules.value = modules.value.map((m) =>
    m.id_module === targetId
      ? {
          ...m,
          publish: true,
          publish_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(updatedModule || {}),
        }
      : m
  );

  moduleToPublish.value = null;
  showPublishModal.value = false;
}

// Gérer la suppression de modules
function handleDeletionSuccess() {
  if (!modules.value) return;

  // On récupère les IDs des lignes actuellement sélectionnées
  const idsToRemove = selectedRows.value.map((r) => r.id_module);

  // Filtrage local
  modules.value = modules.value.filter(
    (m) => !idsToRemove.includes(m.id_module)
  );

  toast.add({
    title: "Suppression réussie",
    description: `${idsToRemove.length} module(s) supprimé(s)`
  });

  clearTableSelection();
}
</script>

<template>
  <UDashboardPanel id="modules">
    <template #header>
      <UDashboardNavbar title="Modules">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            label="Nouveau Module"
            icon="i-lucide-plus"
            @click="navigateTo('/modules/create')"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <ModulesPublishModal
        v-if="moduleToPublish"
        v-model:open="showPublishModal"
        :module="moduleToPublish"
        @published="handlePublishSuccess"
      />

      <!-- Modal de gestion des catégories -->
      <ModulesCategoriesModal
        v-if="moduleForCategories"
        v-model:open="showCategoriesModal"
        :module="moduleForCategories"
      />

      <!-- Modal de gestion des services -->
      <ModulesServicesModal
        v-if="moduleForServices"
        v-model:open="showServicesModal"
        :module="moduleForServices"
      />

      <!-- Modal de gestion des documents -->
      <ModulesDocumentsModal
        v-if="moduleForDocuments"
        v-model:open="showDocumentsModal"
        :module="moduleForDocuments"
      />

      <!-- Composants de recherche et filtres -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <!-- Barre de recherche -->
        <UInput
          placeholder="Rechercher un module..."
          :model-value="
            (table?.tableApi?.getColumn('titre')?.getFilterValue() as string) ??
            ''
          "
          icon="i-lucide-search"
          class="max-w-sm"
          @update:model-value="
            table?.tableApi?.getColumn('titre')?.setFilterValue($event)
          "
        />

        <div class="flex items-center gap-3">
          <!-- Bouton supprimer -->
          <ModulesDeleteModal
            :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
            :rows="selectedRows"
            @deleted="handleDeletionSuccess"
            @clear-selection="clearTableSelection"
          >
            <UButton
              v-if="selectedRows.length"
              label="Supprimer"
              color="error"
              variant="subtle"
              icon="i-lucide-trash"
            >
              <template #trailing>
                <UKbd>
                  {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                </UKbd>
              </template>
            </UButton>
          </ModulesDeleteModal>

          <!-- Bouton de filtre -->
          <USelect
            v-model="publishFilter"
            :items="[
              { label: 'Tous', value: 'all' },
              { label: 'Publié', value: 'published' },
              { label: 'Non publié', value: 'unpublished' },
            ]"
            :ui="{
              trailingIcon:
                'group-data-[state=open]:rotate-180 transition-transform duration-200',
            }"
            placeholder="Filtrer statut"
            class="min-w-32"
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

      <!-- Tableau -->
      <UTable
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
        class="flex items-center justify-between gap-4 border-t border-default pt-4 mt-6"
      >
        <div class="text-sm text-muted">
          {{ selectedRows.length || 0 }} ligne(s) sélectionnée(s)
        </div>

        <UPagination
          :default-page="pagination.pageIndex + 1"
          :items-per-page="pagination.pageSize"
          :total="modules?.length || 0"
          @update:page="(p) => (pagination.pageIndex = p - 1)"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
