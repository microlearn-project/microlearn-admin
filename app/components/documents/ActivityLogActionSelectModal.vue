<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/vue-table";

interface ActionOption {
  label: string;
  value: string;
  icon: string;
  color: "success" | "neutral" | "info" | "error" | "warning";
}

const open = defineModel<boolean>("open", { default: false });
const selectedAction = defineModel<string | null>("selectedAction", {
  default: null,
});

const emit = defineEmits<{
  (e: "select", action: string): void;
  (e: "clear"): void;
}>();

const table = useTemplateRef<any>("table");
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UIcon = resolveComponent("UIcon");

// Liste des actions avec icônes et couleurs
const actions: ActionOption[] = [
  { label: "Connexion", value: "connexion", icon: "i-lucide-log-in", color: "success" },
  { label: "Déconnexion", value: "deconnexion", icon: "i-lucide-log-out", color: "neutral" },
  { label: "Agent créé", value: "agent_cree", icon: "i-lucide-user-plus", color: "info" },
  { label: "Rôle attribué", value: "role_attribue", icon: "i-lucide-shield-plus", color: "info" },
  { label: "Rôle modifié", value: "role_modifie", icon: "i-lucide-shield", color: "warning" },
  { label: "Rôle révoqué", value: "role_revoque", icon: "i-lucide-shield-off", color: "error" },
  { label: "Rôle supprimé", value: "role_supprime", icon: "i-lucide-shield-x", color: "error" },
  { label: "Catégorie créée", value: "categorie_creee", icon: "i-lucide-tag", color: "info" },
  { label: "Catégorie supprimée", value: "categorie_supprimee", icon: "i-lucide-x", color: "error" },
  { label: "Direction créé", value: "direction_cree", icon: "i-heroicons-building-office", color: "info" },
  { label: "Direction supprimé", value: "direction_supprime", icon: "i-heroicons-building-office", color: "error" },
  { label: "Département créé", value: "departement_cree", icon: "i-lucide-building-2", color: "info" },
  { label: "Département supprimé", value: "departement_supprime", icon: "i-lucide-building-2", color: "error" },
];

function selectAction(action: ActionOption) {
  selectedAction.value = action.value;
  emit("select", action.value);
  open.value = false;
}

function clearSelection() {
  selectedAction.value = null;
  emit("clear");
  open.value = false;
}

const columns: TableColumn<ActionOption>[] = [
  {
    id: "action",
    header: "Action",
    cell: ({ row }: any) => {
      const action = row.original;
      return h("div", { class: "flex items-center gap-3" }, [
        h("div", {
          class: `w-10 h-10 rounded-lg bg-${action.color}/10 flex items-center justify-center flex-shrink-0`
        }, [
          h(UIcon, { name: action.icon, class: `text-${action.color} text-xl` }),
        ]),
        h("div", {}, [
          h("p", { class: "font-medium" }, action.label),
        ]),
      ]);
    },
  },
  {
    id: "badge",
    header: "Type",
    cell: ({ row }: any) => {
      const action = row.original;
      let type = "Autre";
      if (action.value.includes("connexion") || action.value.includes("deconnexion")) {
        type = "Authentification";
      } else if (action.value.includes("cree")) {
        type = "Création";
      } else if (action.value.includes("supprime")) {
        type = "Suppression";
      } else if (action.value.includes("modifie") || action.value.includes("attribue") || action.value.includes("revoque")) {
        type = "Modification";
      }

      return h(
        UBadge,
        {
          color: action.color,
          variant: "subtle",
          size: "xs",
        },
        () => type
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }: any) =>
      h("div", { class: "text-right" }, [
        h(UButton, {
          label: "Sélectionner",
          icon: "i-lucide-check",
          color: "primary",
          variant: "ghost",
          size: "xs",
          onClick: () => selectAction(row.original),
        }),
      ]),
  },
];

const pagination = ref({
  pageIndex: 0,
  pageSize: 8,
});

const globalFilter = ref("");
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <UModal
        v-model:open="open"
        title="Filtrer par action"
        description="Sélectionnez une action pour filtrer les logs"
        :overlay="false"
        :ui="{
          content: 'sm:max-w-3xl',
          wrapper: 'z-[100]',
        }"
      >
        <template #body>
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <UInput
                v-model="globalFilter"
                placeholder="Rechercher une action..."
                icon="i-lucide-search"
                class="flex-1"
              />

              <UButton
                label="Toutes les actions"
                icon="i-lucide-x"
                color="neutral"
                variant="outline"
                @click="clearSelection"
              />
            </div>

            <UTable
              ref="table"
              v-model:pagination="pagination"
              v-model:global-filter="globalFilter"
              :data="actions"
              :columns="columns"
              class="max-h-96 overflow-y-auto"
              :ui="{
                base: 'table-fixed border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50',
                th: 'sticky top-0 z-10 bg-elevated first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default py-3 cursor-pointer hover:bg-elevated/50 transition-colors',
                tbody: '[&>tr:last-child>td]:border-b-0',
              }"
              :pagination-options="{
                getPaginationRowModel: getPaginationRowModel(),
              }"
              @row-click="(row: any) => selectAction(row.original)"
            />

            <div
              v-if="actions && actions.length > 0"
              class="flex items-center justify-between gap-4 border-t border-default pt-4"
            >
              <div class="text-sm text-muted">
                {{ actions.length }} action(s) disponible(s)
              </div>

              <UPagination
                :page="
                  (table?.tableApi?.getState().pagination.pageIndex || 0) + 1
                "
                :items-per-page="
                  table?.tableApi?.getState().pagination.pageSize
                "
                :total="table?.tableApi?.getFilteredRowModel().rows.length"
                @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
              />
            </div>

            <div class="flex justify-end pt-4">
              <UButton
                label="Annuler"
                color="neutral"
                variant="subtle"
                @click="open = false"
              />
            </div>
          </div>
        </template>
      </UModal>
    </Teleport>
  </ClientOnly>
</template>
