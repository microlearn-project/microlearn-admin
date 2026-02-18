<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";
import { getPaginationRowModel } from "@tanstack/vue-table";

type Direction = Tables<"direction">;

const open = defineModel<boolean>("open", { default: false });
const selectedDepartement = defineModel<Direction | null>(
  "selectedDepartement",
  {
    default: null,
  },
);

const emit = defineEmits<{
  (e: "select", direction: Direction): void;
}>();

const table = useTemplateRef<any>("table");
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");

const {
  data: directions,
  pending,
  refresh,
} = useFetch<Direction[]>("/api/departement", {
  server: false,
  lazy: true,
  immediate: false,
  watch: false,
  transform: (data) => data.filter((d) => !d.deleted_at),
});

watch(
  open,
  async (isOpen) => {
    if (isOpen) {
      await refresh();
    }
  },
  { immediate: true },
);

function selectDepartement(direction: Direction) {
  selectedDepartement.value = direction;
  emit("select", direction);
  open.value = false;
}

const columns: TableColumn<Direction>[] = [
  {
    accessorKey: "designation",
    header: "Désignation",
    cell: ({ row }: any) => {
      const dept = row.original;
      return h("div", {}, [h("p", { class: "font-medium" }, dept.designation)]);
    },
  },
  {
    accessorKey: "created_at",
    header: "Créé le",
    cell: ({ row }: any) => {
      const date = new Date(row.original.created_at);
      return date.toLocaleDateString("fr-FR", { dateStyle: "medium" });
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
          onClick: () => selectDepartement(row.original),
        }),
      ]),
  },
];

const pagination = ref({
  pageIndex: 0,
  pageSize: 5,
});

const globalFilter = ref("");
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <UModal
        v-model:open="open"
        title="Sélectionner une direction"
        description="Choisissez une direction d'affectation de l'agent"
        :overlay="false"
        :ui="{
          width: 'sm:max-w-3xl',
          wrapper: 'z-[100]',
        }"
      >
        <template #body>
          <div class="space-y-4">
            <UInput
              v-model="globalFilter"
              placeholder="Rechercher une direction..."
              icon="i-lucide-search"
              class="w-full"
            />

            <UTable
              ref="table"
              v-model:pagination="pagination"
              v-model:global-filter="globalFilter"
              :data="directions"
              :columns="columns"
              :loading="pending"
              class="max-h-100 overflow-y-auto"
              :ui="{
                base: 'table-fixed border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50',
                th: 'sticky top-0 z-10 bg-elevated first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default py-3',
                tbody: '[&>tr:last-child>td]:border-b-0',
              }"
              :pagination-options="{
                getPaginationRowModel: getPaginationRowModel(),
              }"
            />

            <div
              v-if="directions && directions.length > 0"
              class="flex items-center justify-between gap-4 border-t border-default pt-4"
            >
              <div class="text-sm text-muted">
                {{ directions.length }} Direction(s) disponible(s)
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

            <div
              v-if="!pending && (!directions || directions.length === 0)"
              class="text-center py-8 text-muted"
            >
              <UIcon name="i-lucide-inbox" class="mx-auto mb-2 text-4xl" />
              <p>Aucune Direction disponible</p>
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
