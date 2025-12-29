<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { upperFirst } from "scule";
import type { Tables } from "~/types/database.types";

type Agent = Tables<"agent">;

const toast = useToast();
const table = useTemplateRef<any>("table");

const UCheckbox = resolveComponent("UCheckbox");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

/* ---------------------------------------------------
   1. Récupération des agents
----------------------------------------------------*/
const {
  data: agents,
  pending,
  error,
  refresh,
} = await useFetch<Agent[]>("/api/agent", {
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
   3. Module sélectionné pour, départements et services
----------------------------------------------------*/
const moduleForAgent = ref<Agent | null>(null);
const showAgentsModal = ref(false);

// Actions api
// Activer un agent
const activate = async (id: string) => {
  await $fetch(`/api/agent/${id}/activate`, { method: "PATCH" });
};

// Désactiver un agent
const deactivate = async (id: string) => {
  await $fetch(`/api/agent/${id}/deactivate`, { method: "PATCH" });
};

// Supprimer un agent
const softDelete = async (id: string) => {
  await $fetch(`/api/agent/soft-delete`, {
    method: "PATCH",
    body: {
      id: id,
    },
  });
};

/* ---------------------------------------------------
   4. Items du menu sur chaque ligne
----------------------------------------------------*/
function getRowItems(row: { original: Agent }) {
  const a = row.original;
  return [
    { type: "label", label: "Actions sur l'agent" },
    {
      label: "Copier l'ID",
      icon: "i-lucide-copy",
      onSelect: () => {
        navigator.clipboard.writeText(String(a.id_agent));
        toast.add({ title: "ID copié dans le presse-papier" });
      },
    },
    { type: "separator" },
    {
      label: a.actif ? "Désactiver" : "Activer",
      icon: a.actif ? "i-lucide-toggle-right" : "i-lucide-toggle-left",
      color: a.actif ? "warning" : "success",
      onSelect: async () => {
        a.actif ? await deactivate(a.id_service) : await activate(a.id_service);
        toast.add({
          title: a.actif ? "Agent désactivé" : "Agent activé",
        });
        refresh();
      },
    },
    {
      label: "Départements",
      icon: "i-lucide-tags",
      onSelect: () => {
        //moduleForCategories.value = m;
        //showCategoriesModal.value = true;
      },
    },
    {
      label: "Services",
      icon: "i-lucide-briefcase",
      onSelect: () => {
        moduleForAgent.value = a;
        showAgentsModal.value = true;
      },
    },
    { type: "separator" },
    {
      label: "Supprimer",
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: async () => {
        await softDelete(a.id_agent);
        toast.add({
          title: "Agent supprimé",
        });
        refresh();
        clearTableSelection();
      },
    },
  ];
}

/* ---------------------------------------------------
   4. Colonnes du tableau
----------------------------------------------------*/
const columns: TableColumn<Agent>[] = [
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
    accessorKey: "code_agent",
    header: "Code Agent",
    cell: ({ row }: any) =>
      h("div", { class: "font-medium" }, row.original.code_agent),
  },
  {
    accessorKey: "nom",
    header: "Nom",
    cell: ({ row }: any) =>
      h("div", { class: "font-medium" }, row.original.nom),
  },
  {
    accessorKey: "prenom",
    header: "Prénom",
    cell: ({ row }: any) =>
      h("div", { class: "font-medium" }, row.original.prenom),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }: any) => row.original.email,
  },
  {
    id: "statut",
    accessorFn: (row: Agent) => row.actif, // valeur filtrable
    header: "Actif ?",
    cell: ({ row }: any) =>
      h(
        UBadge,
        {
          color: row.original.actif ? "success" : "error",
          variant: "subtle",
        },
        () => (row.original.actif ? "Actif" : "Inactif")
      ),
  },
  {
    accessorKey: "last_login",
    header: "Dernière connexion",
    cell: ({ row }: any) => {
      if (!row.original.last_login) return "---";
      const date = new Date(row.original.last_login);
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
  }
);

/* ---------------------------------------------------
   7. Données paginées
----------------------------------------------------*/
const paginatedData = computed(() => {
  if (!agents.value) return [];
  const start = pagination.value.pageIndex * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return agents.value.slice(start, end);
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
  <UDashboardPanel id="modules">
    <template #header>
      <UDashboardNavbar title="Modules">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <!-- TODO: Ajouter ModulesAddModal pour créer un module -->
          <UButton
            label="Nouveau Module"
            icon="i-lucide-plus"
            @click="toast.add({ title: 'Fonction à venir', description: 'Créer un module (Phase suivante)' })"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>

      <!-- Modal de gestion des services -->
      <AgentsServicesModal
        v-if="moduleForAgent"
        v-model:open="showAgentsModal"
        :agent="moduleForAgent"
      />

      <!-- Composants de recherche et filtres -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <!-- Barre de recherche -->
        <UInput
          placeholder="Rechercher un agent..."
          :model-value="
            (table?.tableApi?.getColumn('nom')?.getFilterValue() as string) ??
            ''
          "
          icon="i-lucide-search"
          class="max-w-sm"
          @update:model-value="
            table?.tableApi?.getColumn('nom')?.setFilterValue($event)
          "
        />

        <div class="flex items-center gap-3">
          <!-- Modal de suppression
          <ModulesDeleteModal
            :count="
              table?.tableApi?.getFilteredSelectedRowModel().rows.length
            "
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
          </ModulesDeleteModal>
          -->
          <!-- Bouton de filtre -->
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'Tous', value: 'all' },
              { label: 'Actif', value: 'actif' },
              { label: 'Inactif', value: 'inactif' },
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
          :total="agents?.length || 0"
          @update:page="(p) => (pagination.pageIndex = p - 1)"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
