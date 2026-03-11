<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/vue-table";

interface TypeOption {
  label: string;
  value: string;
  icon: string;
  description: string;
}

const open = defineModel<boolean>("open", { default: false });
const selectedType = defineModel<string | null>("selectedType", {
  default: null,
});

const emit = defineEmits<{
  (e: "select", type: string): void;
  (e: "clear"): void;
}>();

const table = useTemplateRef<any>("table");
const UButton = resolveComponent("UButton");
const UIcon = resolveComponent("UIcon");

// Liste des types d'objets
const types: TypeOption[] = [
  {
    label: "Agent",
    value: "agent",
    icon: "i-lucide-user",
    description: "Actions liées aux agents/utilisateurs"
  },
  {
    label: "User Role",
    value: "user_role",
    icon: "i-lucide-shield",
    description: "Attribution et gestion des rôles"
  },
  {
    label: "Session",
    value: "session",
    icon: "i-lucide-key-round",
    description: "Connexions et déconnexions"
  },
  {
    label: "Catégorie",
    value: "tag",
    icon: "i-lucide-tag",
    description: "Gestion des catégories/tags"
  },
  {
    label: "Direction",
    value: "direction",
    icon: "i-heroicons-building-office",
    description: "Gestion des directions"
  },
  {
    label: "Département",
    value: "departement",
    icon: "i-lucide-building-2",
    description: "Gestion des départements"
  },
];

function selectType(type: TypeOption) {
  selectedType.value = type.value;
  emit("select", type.value);
  open.value = false;
}

function clearSelection() {
  selectedType.value = null;
  emit("clear");
  open.value = false;
}

const columns: TableColumn<TypeOption>[] = [
  {
    id: "type",
    header: "Type d'objet",
    cell: ({ row }: any) => {
      const type = row.original;
      return h("div", { class: "flex items-center gap-3" }, [
        h("div", {
          class: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"
        }, [
          h(UIcon, { name: type.icon, class: "text-primary text-xl" }),
        ]),
        h("div", { class: "flex-1 min-w-0" }, [
          h("p", { class: "font-medium" }, type.label),
          h("p", { class: "text-xs text-muted truncate" }, type.description),
        ]),
      ]);
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
          onClick: () => selectType(row.original),
        }),
      ]),
  },
];

const pagination = ref({
  pageIndex: 0,
  pageSize: 6,
});

const globalFilter = ref("");
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <UModal
        v-model:open="open"
        title="Filtrer par type d'objet"
        description="Sélectionnez un type pour filtrer les logs"
        :overlay="false"
        :ui="{
          content: 'sm:max-w-2xl',
          wrapper: 'z-[100]',
        }"
      >
        <template #body>
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <UInput
                v-model="globalFilter"
                placeholder="Rechercher un type..."
                icon="i-lucide-search"
                class="flex-1"
              />

              <UButton
                label="Tous les types"
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
              :data="types"
              :columns="columns"
              class="max-h-80 overflow-y-auto"
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
              @row-click="(row: any) => selectType(row.original)"
            />

            <div
              v-if="types && types.length > 0"
              class="flex items-center justify-between gap-4 border-t border-default pt-4"
            >
              <div class="text-sm text-muted">
                {{ types.length }} type(s) disponible(s)
              </div>

              <UPagination
                v-if="table?.tableApi?.getPageCount() > 1"
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
