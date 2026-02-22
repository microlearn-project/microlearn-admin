<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { upperFirst } from "scule";
import type { Tables } from "~/types/database.types";

type UserRole = Tables<"user_role"> & {
  agent: {
    id_agent: string;
    code_agent: string;
    nom: string;
    prenom: string;
    email: string;
    actif: boolean;
  };
  role: {
    id_role: string;
    designation: string;
  };
  granter: {
    id_agent: string;
    nom: string;
    prenom: string;
  } | null;
};

const toast = useToast();
const table = useTemplateRef<any>("table");

const UCheckbox = resolveComponent("UCheckbox");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

/* ---------------------------------------------------
   1. Récupération des attributions
----------------------------------------------------*/
const {
  data: userRoles,
  pending,
  error,
  refresh,
} = await useFetch<UserRole[]>("/api/user-role", {
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
   3. Modal de modification
----------------------------------------------------*/
const userRoleToEdit = ref<UserRole | null>(null);
const showEditModal = ref(false);

/* ---------------------------------------------------
   4. Helpers
----------------------------------------------------*/
function isActive(ur: UserRole): boolean {
  if (!ur.valide) return false;
  const now = new Date();
  const dateFrom = new Date(ur.date_from);
  if (now < dateFrom) return false;
  if (ur.date_to) {
    const dateTo = new Date(ur.date_to);
    if (now > dateTo) return false;
  }
  return true;
}

function getStatusLabel(ur: UserRole): string {
  if (!ur.valide) return "Révoqué";
  const now = new Date();
  const dateFrom = new Date(ur.date_from);
  if (now < dateFrom) return "Planifié";
  if (ur.date_to) {
    const dateTo = new Date(ur.date_to);
    if (now > dateTo) return "Expiré";
  }
  return "Actif";
}

function getStatusColor(
  ur: UserRole,
): "success" | "warning" | "error" | "info" {
  const status = getStatusLabel(ur);
  switch (status) {
    case "Actif":
      return "success";
    case "Planifié":
      return "info";
    case "Expiré":
      return "warning";
    case "Révoqué":
      return "error";
    default:
      return "info";
  }
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* ---------------------------------------------------
   5. Actions API
----------------------------------------------------*/
async function revokeRole(id: string) {
  try {
    await $fetch("/api/user-role/revoke", {
      method: "PATCH",
      body: { id },
    });

    // Mise à jour locale
    if (userRoles.value) {
      userRoles.value = userRoles.value.map((ur) =>
        ur.id_user_role === id
          ? { ...ur, valide: false, date_to: new Date().toISOString() }
          : ur,
      );
    }

    toast.add({ title: "Attribution révoquée" });
  } catch (err) {
    toast.add({
      title: "Erreur",
      description: "Impossible de révoquer l'attribution",
      color: "error",
    });
  }
}

async function reactivateRole(id: string) {
  try {
    await $fetch("/api/user-role/update", {
      method: "PATCH",
      body: { id, valide: true, date_to: null },
    });

    // Mise à jour locale
    if (userRoles.value) {
      userRoles.value = userRoles.value.map((ur) =>
        ur.id_user_role === id ? { ...ur, valide: true, date_to: null } : ur,
      );
    }

    toast.add({ title: "Attribution réactivée" });
  } catch (err) {
    toast.add({
      title: "Erreur",
      description: "Impossible de réactiver l'attribution",
      color: "error",
    });
  }
}

/* ---------------------------------------------------
   6. Items du menu sur chaque ligne
----------------------------------------------------*/
function getRowItems(row: { original: UserRole }) {
  const ur = row.original;
  const active = isActive(ur);

  return [
    { type: "label", label: "Actions" },
    { type: "separator" },
    {
      label: "Modifier",
      icon: "i-lucide-edit",
      onSelect: () => {
        userRoleToEdit.value = ur;
        showEditModal.value = true;
      },
    },
    ...(ur.valide
      ? [
          {
            label: "Révoquer",
            icon: "i-lucide-shield-off",
            color: "warning",
            onSelect: () => revokeRole(ur.id_user_role),
          },
        ]
      : [
          {
            label: "Réactiver",
            icon: "i-lucide-shield-check",
            color: "success",
            onSelect: () => reactivateRole(ur.id_user_role),
          },
        ]),
  ];
}

/* ---------------------------------------------------
   7. Colonnes du tableau
----------------------------------------------------*/
const columns: TableColumn<UserRole>[] = [
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
    id: "agent",
    accessorFn: (row: UserRole) =>
      `${row.agent?.nom ?? ""} ${row.agent?.prenom ?? ""}`,
    header: "Agent", 
    cell: ({ row }: any) => {
      const ur = row.original as UserRole;
      return h("div", { class: "flex items-center gap-3" }, [
        h(
          "div",
          {
            class:
              "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm",
          },
          `${ur.agent.prenom?.[0] ?? ""}${ur.agent.nom?.[0] ?? ""}`
        ),
        h("div", {}, [
          h("p", { class: "font-medium" }, `${ur.agent.prenom} ${ur.agent.nom}`),
          h("code", { class: "text-xs text-muted" }, ur.agent.code_agent),
        ]),
      ]);
    },
  },
  {
    id: "role",
    accessorFn: (row: UserRole) => row.role.designation,
    header: "Rôle",
    cell: ({ row }: any) => {
      const ur = row.original as UserRole;
      return h(
        UBadge,
        { color: "primary", variant: "subtle" },
        () => ur.role.designation,
      );
    },
  },
  {
    id: "status",
    accessorFn: (row: UserRole) => getStatusLabel(row),
    header: "Statut",
    cell: ({ row }: any) => {
      const ur = row.original as UserRole;
      return h(UBadge, { color: getStatusColor(ur), variant: "subtle" }, () =>
        getStatusLabel(ur),
      );
    },
  },
  {
    accessorKey: "date_from",
    header: "Début",
    cell: ({ row }: any) => formatDate(row.original.date_from),
  },
  {
    accessorKey: "date_to",
    header: "Fin",
    cell: ({ row }: any) => {
      const ur = row.original as UserRole;
      if (!ur.date_to) {
        return h("span", { class: "text-muted italic" }, "Permanent");
      }
      return formatDate(ur.date_to);
    },
  },
  {
    id: "granter",
    header: "Attribué par",
    cell: ({ row }: any) => {
      const ur = row.original as UserRole;
      if (!ur.granter) return h("span", { class: "text-muted" }, "—");
      return `${ur.granter.prenom} ${ur.granter.nom}`;
    },
  },
  {
    accessorKey: "created_at",
    header: "Créé le",
    cell: ({ row }: any) =>
      new Date(row.original.created_at).toLocaleDateString("fr-FR"),
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
const statusFilter = ref("all");
const searchQuery = ref("");

// Données filtrées
const filteredData = computed(() => {
  if (!userRoles.value) return [];

  let result = [...userRoles.value];

  // Filtre par statut
  if (statusFilter.value !== "all") {
    result = result.filter((ur) => {
      const status = getStatusLabel(ur);
      switch (statusFilter.value) {
        case "active":
          return status === "Actif";
        case "revoked":
          return status === "Révoqué";
        case "expired":
          return status === "Expiré";
        case "scheduled":
          return status === "Planifié";
        default:
          return true;
      }
    });
  }

  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((ur) => {
      const agentName = `${ur.agent.prenom} ${ur.agent.nom}`.toLowerCase();
      const agentCode = ur.agent.code_agent.toLowerCase();
      const roleName = ur.role.designation.toLowerCase();
      return (
        agentName.includes(query) ||
        agentCode.includes(query) ||
        roleName.includes(query)
      );
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
watch([statusFilter, searchQuery], () => {
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
   11. Stats
----------------------------------------------------*/
const stats = computed(() => {
  if (!userRoles.value) return { total: 0, active: 0, revoked: 0, expired: 0 };

  let active = 0;
  let revoked = 0;
  let expired = 0;

  for (const ur of userRoles.value) {
    const status = getStatusLabel(ur);
    if (status === "Actif") active++;
    else if (status === "Révoqué") revoked++;
    else if (status === "Expiré") expired++;
  }

  return {
    total: userRoles.value.length,
    active,
    revoked,
    expired,
  };
});
</script>

<template>
  <UDashboardPanel id="permissions">
    <template #header>
      <UDashboardNavbar title="Permissions">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <PermissionsAddModal @created="refresh()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Modal de modification -->
      <PermissionsUpdateModal
        v-model:open="showEditModal"
        :user-role="userRoleToEdit"
        @updated="refresh()"
      />

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-elevated border border-default rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
            >
              <UIcon name="i-lucide-shield" class="text-primary text-xl" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ stats.total }}</p>
              <p class="text-sm text-muted">Total</p>
            </div>
          </div>
        </div>

        <div class="bg-elevated border border-default rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"
            >
              <UIcon
                name="i-lucide-shield-check"
                class="text-success text-xl"
              />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ stats.active }}</p>
              <p class="text-sm text-muted">Actives</p>
            </div>
          </div>
        </div>

        <div class="bg-elevated border border-default rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"
            >
              <UIcon name="i-lucide-clock" class="text-warning text-xl" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ stats.expired }}</p>
              <p class="text-sm text-muted">Expirées</p>
            </div>
          </div>
        </div>

        <div class="bg-elevated border border-default rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center"
            >
              <UIcon name="i-lucide-shield-off" class="text-error text-xl" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ stats.revoked }}</p>
              <p class="text-sm text-muted">Révoquées</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres et recherche -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <!-- Barre de recherche -->
        <UInput
          v-model="searchQuery"
          placeholder="Rechercher un agent ..."
          icon="i-lucide-search"
          class="max-w-md"
        />

        <div class="flex items-center gap-3">
          <!-- Bouton révoquer -->
          <PermissionsDeleteModal
            :count="selectedRows.length"
            :rows="selectedRows"
            mode="revoke"
            @done="refresh()"
            @clear-selection="clearTableSelection"
          >
            <UButton
              v-if="selectedRows.length && selectedRows.some((r) => r.valide)"
              label="Révoquer"
              color="warning"
              variant="subtle"
              icon="i-lucide-shield-off"
            >
              <template #trailing>
                <UKbd>{{ selectedRows.filter((r) => r.valide).length }}</UKbd>
              </template>
            </UButton>
          </PermissionsDeleteModal>

          <!-- Bouton supprimer -->
          <PermissionsDeleteModal
            :count="selectedRows.length"
            :rows="selectedRows"
            mode="delete"
            @done="refresh()"
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
          </PermissionsDeleteModal>

          <!-- Filtre par statut -->
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'Tous les statuts', value: 'all' },
              { label: 'Actif', value: 'active' },
              { label: 'Révoqué', value: 'revoked' },
              { label: 'Expiré', value: 'expired' },
              { label: 'Planifié', value: 'scheduled' },
            ]"
            :ui="{
              trailingIcon:
                'group-data-[state=open]:rotate-180 transition-transform duration-200',
            }"
            placeholder="Filtrer statut"
            class="min-w-40"
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
        <UIcon
          name="i-lucide-shield-question"
          class="text-5xl text-muted mb-4"
        />
        <p class="font-medium mb-2">Aucune attribution trouvée</p>
        <p class="text-muted text-sm mb-4">
          {{
            searchQuery || statusFilter !== "all"
              ? "Essayez de modifier vos filtres"
              : "Commencez par attribuer un rôle à un agent"
          }}
        </p>
        <PermissionsAddModal
          v-if="!searchQuery && statusFilter === 'all'"
          @created="refresh()"
        />
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
