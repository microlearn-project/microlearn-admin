<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";
import { getPaginationRowModel } from "@tanstack/vue-table";

type Module = Tables<"module">;

const open = defineModel<boolean>("open", { default: false });
const selectedModule = defineModel<Module | null>("selectedModule", {
  default: null,
});

const emit = defineEmits<{
  (e: "select", module: Module): void;
  (e: "clear"): void;
}>();

const table = useTemplateRef<any>("table");
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");

const {
  data: modules,
  pending,
  refresh,
} = useFetch<Module[]>("/api/module", {
  server: false,
  lazy: true,
  immediate: false,
  watch: false,
  transform: (data) => data.filter((m) => !m.deleted_at),
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

function selectModule(module: Module) {
  selectedModule.value = module;
  emit("select", module);
  open.value = false;
}

function clearSelection() {
  selectedModule.value = null;
  emit("clear");
  open.value = false;
}

const columns: TableColumn<Module>[] = [
  {
    accessorKey: "titre",
    header: "Titre du module",
    cell: ({ row }: any) => {
      const mod = row.original;
      return h("div", {}, [h("p", { class: "font-medium" }, mod.titre)]);
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
          onClick: () => selectModule(row.original),
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
        title="Sélectionner un module"
        description="Choisissez un module pour filtrer les documents"
        :overlay="false"
        :ui="{
          content: 'sm:max-w-4xl',
          wrapper: 'z-[100]',
        }"
      >
        <template #body>
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <UInput
                v-model="globalFilter"
                placeholder="Rechercher un module..."
                icon="i-lucide-search"
                class="flex-1"
              />

              <UButton
                label="Tous les modules"
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
              :data="modules"
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
              v-if="modules && modules.length > 0"
              class="flex items-center justify-between gap-4 border-t border-default pt-4"
            >
              <div class="text-sm text-muted">
                {{ modules.length }} module(s) disponible(s)
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
              v-if="!pending && (!modules || modules.length === 0)"
              class="text-center py-8 text-muted"
            >
              <UIcon name="i-lucide-inbox" class="mx-auto mb-2 text-4xl" />
              <p>Aucun module disponible</p>
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
