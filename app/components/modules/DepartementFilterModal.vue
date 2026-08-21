<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";
import { getPaginationRowModel } from "@tanstack/vue-table";

type Departement = Tables<"departement">;

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  (e: "select", departement: Departement | null): void;
}>();

const table = useTemplateRef<any>("table");
const UButton = resolveComponent("UButton");

const {
  data: departements,
  pending,
  refresh,
} = useFetch<Departement[]>("/api/departement", {
  server: false,
  lazy: true,
  immediate: false,
  watch: false,
  transform: (data) => data.filter((d) => !d.deleted_at && d.actif),
});

watch(
  open,
  async (isOpen) => {
    if (isOpen) await refresh();
  },
  { immediate: true }
);

function selectDepartement(departement: Departement | null) {
  emit("select", departement);
  open.value = false;
}

const columns: TableColumn<Departement>[] = [
  {
    accessorKey: "designation",
    header: "Désignation",
    cell: ({ row }: any) =>
      h("p", { class: "font-medium" }, row.original.designation),
  },
  {
    id: "actions",
    cell: ({ row }: any) =>
      h("div", { class: "text-right" }, [
        h(UButton, {
          label: "Filtrer",
          icon: "i-lucide-check",
          color: "primary",
          variant: "ghost",
          size: "xs",
          onClick: () => selectDepartement(row.original),
        }),
      ]),
  },
];

const pagination = ref({ pageIndex: 0, pageSize: 5 });
const globalFilter = ref("");
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <UModal
        v-model:open="open"
        title="Filtrer par département"
        description="Choisissez un département pour filtrer la liste des modules"
        :overlay="false"
        :ui="{ content: 'sm:max-w-3xl', wrapper: 'z-[100]' }"
      >
        <template #body>
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <UInput
                v-model="globalFilter"
                placeholder="Rechercher un département..."
                icon="i-lucide-search"
                class="w-full"
              />
              <UButton
                label="Tous"
                icon="i-lucide-list"
                color="neutral"
                variant="outline"
                class="shrink-0"
                @click="selectDepartement(null)"
              />
            </div>

            <UTable
              ref="table"
              v-model:pagination="pagination"
              v-model:global-filter="globalFilter"
              :data="departements"
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
              v-if="departements && departements.length > 0"
              class="flex items-center justify-between gap-4 border-t border-default pt-4"
            >
              <div class="text-sm text-muted">
                {{ departements.length }} département(s) disponible(s)
              </div>

              <UPagination
                :page="
                  (table?.tableApi?.getState().pagination.pageIndex || 0) + 1
                "
                :items-per-page="table?.tableApi?.getState().pagination.pageSize"
                :total="table?.tableApi?.getFilteredRowModel().rows.length"
                @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
              />
            </div>

            <div
              v-if="!pending && (!departements || departements.length === 0)"
              class="text-center py-8 text-muted"
            >
              <UIcon name="i-lucide-inbox" class="mx-auto mb-2 text-4xl" />
              <p>Aucun département disponible</p>
            </div>

            <div class="flex justify-end pt-4">
              <UButton
                label="Fermer"
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
