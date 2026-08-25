<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/vue-table";
import { upperFirst } from "scule";
import type { Tables } from "~/types/database.types";

type Direction = Tables<"direction">;
type AutoriteSuperieure = Tables<"autorite_superieure">;

const toast = useToast();

const table = useTemplateRef<any>("table");

const UCheckbox = resolveComponent("UCheckbox");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

/* ---------------------------------------------------
   1. Récupération des directions avec autorités
----------------------------------------------------*/
const {
  data: directions,
  pending,
  error,
  refresh,
} = await useFetch<Direction[]>("/api/direction", {
  server: true,
  lazy: false,
});

// Récupérer les autorités supérieures pour affichage
const { data: autorites } = await useFetch<AutoriteSuperieure[]>("/api/autorite-superieure");

// Map pour accès rapide aux autorités
const autoritesMap = computed(() => {
  if (!autorites.value) return new Map();
  return new Map(autorites.value.map(a => [a.id_autorite, a]));
});

/* ---------------------------------------------------
     3. Sélection des lignes
----------------------------------------------------*/
const rowSelection = ref<Record<string, boolean>>({});

const selectedRows = computed(
  () =>
    table.value?.tableApi?.getSelectedRowModel().rows.map((r) => r.original) ??
    [],
);

// Suppression d'une ligne : passe par la même confirmation que la
// suppression en masse, au lieu de supprimer immédiatement au clic.
const singleDeleteTarget = ref<Direction | null>(null);
const showSingleDeleteModal = ref(false);

function requestSingleDelete(direction: Direction) {
  singleDeleteTarget.value = direction;
  showSingleDeleteModal.value = true;
}

/* ---------------------------------------------------
     4. Items du menu sur chaque ligne
----------------------------------------------------*/
function getRowItems(row: { original: Direction }) {
  const s = row.original;
  return [
    { type: "label", label: "Actions sur la direction" },
    {
      label: "Copier l'ID",
      icon: "i-lucide-copy",
      onSelect: () => {
        navigator.clipboard.writeText(String(s.id_direction));
        toast.add({ title: "ID copié dans le presse-papier" });
      },
    },
    { type: "separator" },
    {
      label: "Supprimer",
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: () => requestSingleDelete(s),
    },
  ];
}

/* ---------------------------------------------------
     5. Colonnes du tableau
----------------------------------------------------*/
const columns: TableColumn<Direction>[] = [
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
    id: "autorite",
    accessorFn: (row: Direction) => row.id_autorite,
    header: "Autorité Supérieure",
    cell: ({ row }: any) => {
      const autorite = autoritesMap.value.get(row.original.id_autorite);
      if (!autorite) {
        return h("div", { class: "text-sm text-muted" }, "Non affecté");
      }
      return h("div", { class: "flex items-center gap-2" }, [
        h(
          "span",
          {
            class: `inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              autorite.code === "DG"
                ? "bg-primary/10 text-primary"
                : "bg-info/10 text-info"
            }`,
          },
          autorite.code
        ),
        h("span", { class: "text-sm" }, autorite.designation),
      ]);
    },
  },
  {
    id: "statut",
    accessorFn: (row: Direction) => row.actif,
    header: "Statut",
    cell: ({ row }: any) =>
      h(
        UBadge,
        {
          color: row.original.actif ? "success" : "error",
          variant: "subtle",
        },
        () => (row.original.actif ? "Actif" : "Inactif"),
      ),
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
     6. Pagination (10 directions par page)
----------------------------------------------------*/
const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

/*
  7. Filtre du tableau
*/
const statusFilter = ref("all");
watch(
  () => statusFilter.value,
  (newVal) => {
    if (!table?.value?.tableApi) return;

    const statusColumn = table.value.tableApi.getColumn("statut");
    if (!statusColumn) return;

    if (newVal === "all") {
      statusColumn.setFilterValue(undefined);
    } else {
      statusColumn.setFilterValue(newVal === "actif");
    }
  },
);

// Déselectionner toutes les lignes du tableau
function clearTableSelection() {
  table.value?.tableApi?.resetRowSelection();
  rowSelection.value = {};
}
</script>
<template>
  <UDashboardPanel id="directions">
    <template #header>
      <UDashboardNavbar title="Directions">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <DirectionsAddModal  @adddepartement="refresh()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Composants -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <!-- Barre de recherche -->
        <UInput
          :model-value="
            (table?.tableApi
              ?.getColumn('designation')
              ?.getFilterValue() as string) ?? ''
          "
          placeholder="Rechercher une direction..."
          icon="i-lucide-search"
          class="max-w-md"
          @update:model-value="
            table?.tableApi?.getColumn('designation')?.setFilterValue($event)
          "
        />

        <div class="flex items-center gap-3">
          <!-- Modal de mise à jour -->
          <DirectionsUpdateModal
  :rows="selectedRows"
  @updatedepartement="refresh()"
  @clear-selection="clearTableSelection"
>
            <UButton
              v-if="selectedRows.length === 1"
              label="Modifier"
              color="secondary"
              variant="subtle"
              icon="i-lucide-pen"
            />
          </DirectionsUpdateModal>

          <!-- Modal de suppression -->
          <DirectionsDeleteModal
            :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
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
                  {{
                    table?.tableApi?.getFilteredSelectedRowModel().rows.length
                  }}
                </UKbd>
              </template>
            </UButton>
          </DirectionsDeleteModal>

          <!-- Modal de suppression (action de ligne, une seule direction) -->
          <DirectionsDeleteModal
            v-model:open="showSingleDeleteModal"
            :count="1"
            :rows="singleDeleteTarget ? [singleDeleteTarget] : []"
            @deleted="refresh()"
            @clear-selection="singleDeleteTarget = null"
          />

          <!-- Bouton de filtre statut -->
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All', value: 'all' },
              { label: 'Actif', value: 'actif' },
              { label: 'Inactif', value: 'inactif' },
            ]"
            placeholder="Filtrer par statut"
            class="min-w-28"
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
        v-model:pagination="pagination"
        v-model:row-selection="rowSelection"
        :data="directions ?? []"
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
    </template>
  </UDashboardPanel>
</template>
