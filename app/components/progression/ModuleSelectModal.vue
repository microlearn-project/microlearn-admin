<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/vue-table";

interface Module {
  id_module: string;
  titre: string;
  publish_at: string | null;
}

const open = defineModel<boolean>("open", { default: false });
const selectedModule = defineModel<Module | null>("selectedModule", {
  default: null,
});

const emit = defineEmits<{
  (e: "select", module: Module): void;
}>();

const table = useTemplateRef<any>("table");
const UButton = resolveComponent("UButton");

const {
  data: modules,
  pending,
  refresh,
} = useFetch<Module[]>("/api/progression/modules-list", {
  server: false,
  lazy: true,
  immediate: false,
  watch: false,
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

const columns: TableColumn<Module>[] = [
  {
    accessorKey: "titre",
    header: "Titre du module",
    cell: ({ row }: any) =>
      h("div", { class: "font-medium" }, row.original.titre),
  },
  {
    accessorKey: "publish_at",
    header: "Publié le",
    cell: ({ row }: any) => {
      if (!row.original.publish_at) return "N/A";
      return new Date(row.original.publish_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
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
</script>

<template>
  <UModal
    v-model:open="open"
    title="Sélectionner un module"
    description="Choisissez le module pour afficher la progression des agents"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <UInput
          placeholder="Rechercher un module..."
          :model-value="
            (table?.tableApi?.getColumn('titre')?.getFilterValue() as string) ??
            ''
          "
          icon="i-lucide-search"
          class="w-full"
          @update:model-value="
            table?.tableApi?.getColumn('titre')?.setFilterValue($event)
          "
        />

        <UTable
          ref="table"
          v-model:pagination="pagination"
          :data="modules"
          :pagination-options="{
            getPaginationRowModel: getPaginationRowModel(),
          }"
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
        />

        <div
          v-if="modules && modules.length > 0"
          class="flex items-center justify-between gap-4 border-t border-default pt-4"
        >
          <div class="text-sm text-muted">
            {{ modules.length }} module(s) disponible(s)
          </div>

          <UPagination
            :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>

        <div
          v-if="!pending && (!modules || modules.length === 0)"
          class="text-center py-8 text-muted"
        >
          <UIcon name="i-lucide-inbox" class="mx-auto mb-2 text-4xl" />
          <p>Aucun module publié disponible</p>
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
</template>
