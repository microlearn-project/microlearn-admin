<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/vue-table";
import { upperFirst } from "scule";
import type { Tables } from "~/types/database.types";

// Auth
const { user, authenticated, fetchUser, hasRole } = useAuth();

// Charger l'utilisateur au montage
onMounted(async () => {
  if (!authenticated.value) {
    await fetchUser();
  }
});

// Vérification des rôles
const isSuperAdmin = computed(() => hasRole("SUPERADMIN"));
const isAdmin = computed(() => hasRole("ADMIN"));
const isFormateur = computed(() => hasRole("FORMATEUR"));

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
    [],
);

/* ---------------------------------------------------
   3. Actions API
----------------------------------------------------*/
// Activer un agent
async function activate(id: string) {
  try {
    await $fetch(`/api/agent/${id}/activate`, { method: "PATCH" });

    // Mise à jour locale
    if (agents.value) {
      agents.value = agents.value.map((a) =>
        a.id_agent === id
          ? { ...a, actif: true, updated_at: new Date().toISOString() }
          : a,
      );
    }

    toast.add({ title: "Agent activé" });
  } catch (err) {
    toast.add({
      title: "Erreur",
      description: "Impossible d'activer l'agent",
      color: "error",
    });
  }
}

// Désactiver un agent
async function deactivate(id: string) {
  try {
    await $fetch(`/api/agent/${id}/deactivate`, { method: "PATCH" });

    // Mise à jour locale
    if (agents.value) {
      agents.value = agents.value.map((a) =>
        a.id_agent === id
          ? { ...a, actif: false, updated_at: new Date().toISOString() }
          : a,
      );
    }

    toast.add({ title: "Agent désactivé" });
  } catch (err) {
    toast.add({
      title: "Erreur",
      description: "Impossible de désactiver l'agent",
      color: "error",
    });
  }
}

// Supprimer un agent (soft delete)
async function softDelete(id: string) {
  try {
    await $fetch("/api/agent/soft-delete", {
      method: "PATCH",
      body: { id },
    });

    // Mise à jour locale
    if (agents.value) {
      agents.value = agents.value.filter((a) => a.id_agent !== id);
    }

    toast.add({ title: "Agent supprimé" });
    clearTableSelection();
  } catch (err) {
    toast.add({
      title: "Erreur",
      description: "Impossible de supprimer l'agent",
      color: "error",
    });
  }
}

// Réinitialiser le mot de passe d'un agent
async function resetPassword(id: string, codeAgent: string) {
  try {
    const result = await $fetch(`/api/agent/${id}/reset-password`, {
      method: "PATCH",
    });

    toast.add({
      title: "Mot de passe réinitialisé",
      description: `Le nouveau mot de passe est: ${codeAgent}`,
      color: "success",
    });
  } catch (err: any) {
    toast.add({
      title: "Erreur",
      description:
        err?.data?.statusMessage ||
        "Impossible de réinitialiser le mot de passe",
      color: "error",
    });
  }
}

/* ---------------------------------------------------
   4. Modal des services
----------------------------------------------------*/
const agentForServices = ref<Agent | null>(null);
const showServicesModal = ref(false);

/* ---------------------------------------------------
   5. Items du menu sur chaque ligne
---------------------------------------------------- 
*/
function getRowItems(row: { original: Agent }) {
  const a = row.original;
  const items = [
    { type: "label", label: "Actions sur l'agent" },
    {
      label: "Copier le code agent",
      icon: "i-lucide-key",
      onSelect: () => {
        navigator.clipboard.writeText(a.code_agent);
        toast.add({ title: "Code agent copié dans le presse-papier" });
      },
    },
    { type: "separator" },
    {
      label: a.actif ? "Désactiver" : "Activer",
      icon: a.actif ? "i-lucide-user-x" : "i-lucide-user-check",
      color: a.actif ? "warning" : "success",
      onSelect: () => {
        if (a.actif) {
          deactivate(a.id_agent);
        } else {
          activate(a.id_agent);
        }
      },
    },
  ];

  // ACTION RÉINITIALISER MOT DE PASSE : Visible uniquement pour SUPERADMIN
  if (isSuperAdmin.value) {
    items.push(
      { type: "separator" },
      {
        label: "Réinitialiser le mot de passe",
        icon: "i-lucide-key-round",
        color: "warning",
        onSelect: () => resetPassword(a.id_agent, a.code_agent),
      },
    );
  }

  items.push(
    { type: "separator" },
    {
      label: "Supprimer",
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: () => softDelete(a.id_agent),
    },
  );

  return items;
}

/* ---------------------------------------------------
   6. Colonnes du tableau
----------------------------------------------------*/
const columns: TableColumn<Agent>[] = [
  {
    id: "select",
    header: ({ table }: any) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? "indeterminate"
          : table.getIsAllPageRowsSelected(),
        "onUpdate:modelValue": (v: unknown) =>
          table.toggleAllPageRowsSelected(!!v),
        ariaLabel: "Sélectionner tout",
      }),
    cell: ({ row }: any) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        "onUpdate:modelValue": (v: unknown) => row.toggleSelected(!!v),
        ariaLabel: "Sélectionner la ligne",
      }),
  },
  {
    accessorKey: "code_agent",
    header: "Code",
    cell: ({ row }: any) =>
      h(
        "code",
        { class: "font-mono text-sm bg-muted/50 px-2 py-1 rounded" },
        row.original.code_agent,
      ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        label: "Agent",
        icon: isSorted
          ? isSorted === "asc"
            ? "i-lucide-arrow-up-narrow-wide"
            : "i-lucide-arrow-down-wide-narrow"
          : "i-lucide-arrow-up-down",
        class: "-mx-2.5",
        onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
      });
    },
    cell: ({ row }: any) =>
      h("div", { class: "flex items-center gap-3" }, [
        h(
          "div",
          {
            class:
              "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm",
          },
          `${row.original.prenom[0]}${row.original.nom[0]}`,
        ),
        h("div", {}, [
          h(
            "p",
            { class: "font-medium" },
            `${row.original.prenom} ${row.original.nom}`,
          ),
          h("p", { class: "text-xs text-muted" }, row.original.email),
        ]),
      ]),
  },
  {
    id: "statut",
    accessorFn: (row: Agent) => row.actif,
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
    accessorKey: "last_login",
    header: "Dernière connexion",
    cell: ({ row }: any) => {
      if (!row.original.last_login) {
        return h("span", { class: "text-muted" }, "Jamais connecté");
      }
      const date = new Date(row.original.last_login);
      return date.toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    },
  },
  {
    accessorKey: "created_at",
    header: "Créé le",
    cell: ({ row }: any) => {
      const date = new Date(row.original.created_at);
      return date.toLocaleString("fr-FR", {
        dateStyle: "medium",
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
   7. Pagination
----------------------------------------------------*/
const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

/* ---------------------------------------------------
   8. Filtres
----------------------------------------------------*/
const statusFilter = ref("all");

watch(statusFilter, (newVal) => {
  if (!table?.value?.tableApi) return;

  const statusColumn = table.value.tableApi.getColumn("statut");
  if (!statusColumn) return;

  if (newVal === "all") {
    statusColumn.setFilterValue(undefined);
  } else {
    statusColumn.setFilterValue(newVal === "actif");
  }
});

/* ---------------------------------------------------
   9. Déselectionner toutes les lignes
----------------------------------------------------*/
function clearTableSelection() {
  table.value?.tableApi?.resetRowSelection();
  rowSelection.value = {};
}

const globalFilter = ref("");
const sorting = ref([
  {
    id: "email",
    desc: false,
  },
]);
</script>

<template>
  <UDashboardPanel id="agents">
    <template #header>
      <UDashboardNavbar title="Agents">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <AgentsAddModal @addagent="refresh()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Filtres et recherche -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <!-- Barre de recherche -->
        <UInput
          v-model="globalFilter"
          placeholder="Rechercher un agent..."
          icon="i-lucide-search"
          class="max-w-md"
        />

        <div class="flex items-center gap-3">
          <!-- Modal de mise à jour -->
          <AgentsUpdateModal
            :rows="selectedRows"
            @updateagent="refresh()"
            @clear-selection="clearTableSelection"
          >
            <UButton
              v-if="selectedRows.length === 1"
              label="Modifier"
              color="secondary"
              variant="subtle"
              icon="i-lucide-edit-2"
            />
          </AgentsUpdateModal>

          <!-- Modal de suppression -->
          <AgentsDeleteModal
            :count="
              table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
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
                <UKbd>{{ selectedRows.length }}</UKbd>
              </template>
            </UButton>
          </AgentsDeleteModal>

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
      v-model:pagination="pagination"
        v-model:row-selection="rowSelection"
        v-model:global-filter="globalFilter"
        v-model:sorting="sorting"
        :data="agents"
        :columns="columns"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel(),
        }"
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
