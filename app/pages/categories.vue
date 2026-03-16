<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/vue-table";
import { upperFirst } from "scule";
import type { Tables } from "~/types/database.types";

type Tag = Tables<"tag">;

const toast = useToast();
const table = useTemplateRef<any>("table");

const UCheckbox = resolveComponent("UCheckbox");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

/* ---------------------------------------------------
   1. Récupération des catégories
----------------------------------------------------*/
const {
  data: categories,
  pending,
  refresh,
} = await useFetch<Tag[]>("/api/tag", {
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
    [],
);

/* ---------------------------------------------------
   3. Suppression via modale (menu ligne)
----------------------------------------------------*/
const tagToDelete = ref<Tag | null>(null);
const showDeleteModal = ref(false);

function openDeleteModal(tag: Tag) {
  tagToDelete.value = tag;
  showDeleteModal.value = true;
}

/* ---------------------------------------------------
   4. Items du menu sur chaque ligne
----------------------------------------------------*/
function getRowItems(row: { original: Tag }) {
  const s = row.original;
  return [
    { type: "label", label: "Actions sur la catégorie" },
    {
      label: "Copier la désignation",
      icon: "i-lucide-copy",
      onSelect: () => {
        navigator.clipboard.writeText(String(s.designation));
        toast.add({ title: "Désignation copié dans le presse-papier" });
      },
    },
    { type: "separator" },
    {
      label: "Supprimer",
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: () => openDeleteModal(s),
    },
  ];
}

/* ---------------------------------------------------
   5. Colonnes du tableau
----------------------------------------------------*/
const columns: TableColumn<Tag>[] = [
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
    accessorKey: "designation",
    header: "Désignation",
    cell: ({ row }: any) =>
      h("div", { class: "font-medium" }, row.original.designation),
  },
  {
    accessorKey: "Dernière modification",
    header: "Dernière modification",
    cell: ({ row }: any) => {
      const date = new Date(row.original.updated_at);
      return date.toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "medium",
      });
    },
  },
  {
    accessorKey: "Date création",
    header: "Créé le",
    cell: ({ row }: any) => {
      const date = new Date(row.original.created_at);
      return date.toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "medium",
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
   6. Pagination
----------------------------------------------------*/
const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

/* ---------------------------------------------------
   7. Déselectionner toutes les lignes
----------------------------------------------------*/
function clearTableSelection() {
  table.value?.tableApi?.resetRowSelection();
  rowSelection.value = {};
}
</script>

<template>
  <UDashboardPanel id="categories">
    <template #header>
      <UDashboardNavbar title="Catégories">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <CategoriesAddModal @addcategory="refresh()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Filtres et actions -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <!-- Barre de recherche -->
        <UInput
          :model-value="
            (table?.tableApi
              ?.getColumn('designation')
              ?.getFilterValue() as string) ?? ''
          "
          placeholder="Rechercher une catégorie"
          icon="i-lucide-search"
          class="max-w-md"
          @update:model-value="
            table?.tableApi?.getColumn('designation')?.setFilterValue($event)
          "
        />

        <div class="flex items-center gap-3">
          <!-- Modal de mise à jour (sélection multiple) -->
          <CategoriesUpdateModal
            :rows="selectedRows"
            @updatetag="refresh()"
            @clear-selection="clearTableSelection"
          >
            <UButton
              v-if="selectedRows.length === 1"
              label="Modifier"
              color="secondary"
              variant="subtle"
              icon="i-lucide-edit-2"
            />
          </CategoriesUpdateModal>

          <!-- Modal de suppression (sélection multiple) -->
          <CategoriesDeleteModal
            :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0"
            :rows="selectedRows"
            @deleted="refresh()"
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
          </CategoriesDeleteModal>

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
        v-model:pagination="pagination"
        v-model:row-selection="rowSelection"
        :data="categories"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel(),
        }"
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
          :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
        />
      </div>

      <!-- Modal de suppression unitaire (depuis le menu ⋮) -->
      <CategoriesDeleteModal
        v-if="tagToDelete"
        :count="1"
        :rows="tagToDelete ? [tagToDelete] : []"
        v-model:open="showDeleteModal"
        @deleted="refresh(); tagToDelete = null"
        @clear-selection="tagToDelete = null"
      />
    </template>
  </UDashboardPanel>
</template>
