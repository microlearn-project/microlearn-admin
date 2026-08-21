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

// Actions réellement présentes en base (dérivées génériquement par
// l'intercepteur d'audit côté API) — pas de liste figée ici.
const { data: facets, pending } = useFetch<{
  actions: string[];
  objetTypes: string[];
}>("/api/activity-log/facets", {
  default: () => ({ actions: [], objetTypes: [] }),
});

const actions = computed<ActionOption[]>(() =>
  facets.value.actions.map((action) => {
    const style = actionVerbStyle(action);
    return {
      label: formatActionLabel(action),
      value: action,
      icon: style.icon,
      color: style.color,
    };
  })
);

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
      if (action.value.startsWith("création")) type = "Création";
      else if (action.value.startsWith("modification")) type = "Modification";
      else if (action.value.startsWith("suppression")) type = "Suppression";

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

            <div v-if="pending" class="text-center py-8">
              <UIcon
                name="i-lucide-loader-circle"
                class="animate-spin text-3xl text-muted"
              />
            </div>

            <div
              v-else-if="actions.length === 0"
              class="text-center py-8 text-muted"
            >
              <UIcon name="i-lucide-inbox" class="mx-auto mb-2 text-4xl" />
              <p>Aucune activité enregistrée pour le moment</p>
            </div>

            <UTable
              v-else
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
              v-if="actions.length > 0"
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
