<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/vue-table";

interface TypeOption {
  label: string;
  value: string;
  icon: string;
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

// Types d'objets réellement présents en base (dérivés génériquement par
// l'intercepteur d'audit côté API) — pas de liste figée ici.
const { data: facets, pending } = useFetch<{
  actions: string[];
  objetTypes: string[];
}>("/api/activity-log/facets", {
  default: () => ({ actions: [], objetTypes: [] }),
});

const types = computed<TypeOption[]>(() =>
  facets.value.objetTypes.map((type) => ({
    label: formatObjetTypeLabel(type),
    value: type,
    icon: objetTypeIcon(type),
  }))
);

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

            <div v-if="pending" class="text-center py-8">
              <UIcon
                name="i-lucide-loader-circle"
                class="animate-spin text-3xl text-muted"
              />
            </div>

            <div
              v-else-if="types.length === 0"
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
              v-if="types.length > 0"
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
