<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/vue-table";
import { upperFirst } from "scule";
import type { Tables } from "~/types/database.types";

type Departement = Tables<"departement">;
type Direction = Tables<"direction">;

const toast = useToast();

const table = useTemplateRef<any>("table");

const UCheckbox = resolveComponent("UCheckbox");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

/* ---------------------------------------------------
   1. Récupération des départements avec directions
----------------------------------------------------*/
const {
  data: departements,
  pending,
  error,
  refresh,
} = await useFetch<Departement[]>("/api/service", {
  server: true,
  lazy: false,
});

// Récupérer les directions pour affichage
const { data: directions } = await useFetch<Direction[]>("/api/direction");

// Créer un map pour accès rapide aux directions
const directionsMap = computed(() => {
  if (!directions.value) return new Map();
  return new Map(directions.value.map((d) => [d.id_direction, d]));
});

/* ---------------------------------------------------
   2. Actions API
----------------------------------------------------*/
// Activer un département
const activate = async (id: string) => {
  await $fetch(`/api/service/${id}/activate`, { method: "PATCH" });
};

// Désactiver un département
const deactivate = async (id: string) => {
  await $fetch(`/api/service/${id}/deactivate`, { method: "PATCH" });
};

// Supprimer un département
const softDelete = async (id: string) => {
  await $fetch(`/api/service/soft-delete`, {
    method: "PATCH",
    body: {
      id: id,
    },
  });
};

/* ---------------------------------------------------
     3. Sélection des lignes
----------------------------------------------------*/
const rowSelection = ref<Record<string, boolean>>({});

const selectedRows = computed(
  () =>
    table.value?.tableApi?.getSelectedRowModel().rows.map((r) => r.original) ??
    [],
);

/* ---------------------------------------------------
     4. Items du menu sur chaque ligne
----------------------------------------------------*/
function getRowItems(row: { original: Departement }) {
  const s = row.original;
  return [
    { type: "label", label: "Actions sur le département" },
    {
      label: "Copier l'ID",
      icon: "i-lucide-copy",
      onSelect: () => {
        navigator.clipboard.writeText(String(s.id_departement));
        toast.add({ title: "ID copié dans le presse-papier" });
      },
    },
    { type: "separator" },
    {
      label: s.actif ? "Désactiver" : "Activer",
      icon: s.actif ? "i-lucide-toggle-right" : "i-lucide-toggle-left",
      color: s.actif ? "warning" : "success",
      onSelect: async () => {
        const newStatus = !s.actif;

        try {
          if (newStatus) {
            await activate(s.id_departement);
          } else {
            await deactivate(s.id_departement);
          }

          // MISE À JOUR LOCALE
          if (!departements.value) return;

          departements.value = departements.value.map((srv) =>
            srv.id_departement === s.id_departement
              ? {
                  ...srv,
                  actif: newStatus,
                  updated_at: new Date().toISOString(),
                }
              : srv,
          );

          toast.add({
            title: newStatus ? "Département activé" : "Département désactivé",
          });
        } catch (e) {
          toast.add({
            title: "Erreur",
            description: "Impossible de modifier le département",
            color: "error",
          });
        }
      },
    },
    { type: "separator" },
    {
      label: "Supprimer",
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: async () => {
        try {
          await softDelete(s.id_departement);

          departements.value = departements.value?.filter(
            (srv) => srv.id_departement !== s.id_departement,
          );

          toast.add({ title: "Département supprimé" });
          clearTableSelection();
        } catch {
          toast.add({
            title: "Erreur",
            description: "Suppression impossible",
            color: "error",
          });
        }
      },
    },
  ];
}

/* ---------------------------------------------------
     5. Colonnes du tableau
----------------------------------------------------*/
const columns: TableColumn<Departement>[] = [
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
    id: "direction", //  Colonne Direction
    accessorFn: (row: Departement) => row.id_direction,
    header: "Direction",
    cell: ({ row }: any) => {
      const direction = directionsMap.value.get(row.original.id_direction);
      return h(
        "div",
        { class: "text-sm" },
        direction?.designation || "Non affecté",
      );
    },
  },
  {
    id: "statut",
    accessorFn: (row: Departement) => row.actif,
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
     6. Pagination (10 départements par page)
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
  <UDashboardPanel id="departements">
    <template #header>
      <UDashboardNavbar title="Départements">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <ServicesAddModal @addservice="refresh()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Composants -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <!-- Barre de recherche  -->
        <UInput
          placeholder="Rechercher ..."
          :model-value="
            (table?.tableApi
              ?.getColumn('designation')
              ?.getFilterValue() as string) ?? ''
          "
          icon="i-lucide-search"
          class="max-w-xs"
          @update:model-value="
            table?.tableApi?.getColumn('designation')?.setFilterValue($event)
          "
        />

        <div class="flex items-center gap-3">
          <!-- Modal de mise à jour -->
          <ServicesUpdateModal
            :rows="selectedRows"
            @updateservice="refresh()"
            @clear-selection="clearTableSelection"
          >
            <UButton
              v-if="selectedRows.length === 1"
              label="Modifier"
              color="secondary"
              variant="subtle"
              icon="i-lucide-edit-2"
            />
          </ServicesUpdateModal>

          <!-- Modal de suppression -->
          <ServicesDeleteModal
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
          </ServicesDeleteModal>

          <!-- Bouton de filtre -->
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All', value: 'all' },
              { label: 'Actif', value: 'actif' },
              { label: 'Inactif', value: 'inactif' },
            ]"
            :ui="{
              trailingIcon:
                'group-data-[state=open]:rotate-180 transition-transform duration-200',
            }"
            placeholder="Filter status"
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
        :data="departements"
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
