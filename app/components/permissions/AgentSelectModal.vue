<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";
import { getPaginationRowModel } from "@tanstack/vue-table";

type Agent = Tables<"agent_new">;

const open = defineModel<boolean>("open", { default: false });
const selectedAgent = defineModel<Agent | null>("selectedAgent", {
  default: null,
});

const emit = defineEmits<{
  (e: "select", agent: Agent): void;
}>();

const table = useTemplateRef<any>("table");
const UButton = resolveComponent("UButton");

const {
  data: agents,
  pending,
  refresh,
} = useFetch<Agent[]>("/api/agent", {
  server: false,
  lazy: true,
  immediate: false,
  watch: false,
  transform: (data) => data.filter((a) => !a.deleted_at && a.actif),
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

function selectAgent(agent: Agent) {
  selectedAgent.value = agent;
  emit("select", agent);
  open.value = false;
}

const columns: TableColumn<Agent>[] = [
  {
    accessorKey: "code_agent",
    header: "Code",
    cell: ({ row }: any) =>
      h("code", { class: "text-xs font-mono" }, row.original.code_agent),
  },
  {
    id: "nom_complet",
    accessorKey: "email",
    header: "Nom complet",
    cell: ({ row }: any) => {
      const agent = row.original;
      return h("div", {}, [
        h("p", { class: "font-medium" }, `${agent.prenom} ${agent.nom}`),
        h("p", { class: "text-xs text-muted" }, agent.email || "N/A"),
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
          onClick: () => selectAgent(row.original),
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
        title="Sélectionner un agent"
        description="Choisissez l'agent à qui attribuer un rôle"
        :overlay="false"
        :ui="{
          width: 'sm:max-w-4xl',
          wrapper: 'z-[100]',
        }"
      >
        <template #body>
          <div class="space-y-4">
            <UInput
              placeholder="Rechercher par code ou email..."
              v-model="globalFilter"
              icon="i-lucide-search"
              class="w-full"
            />

            <UTable
              ref="table"
              v-model:pagination="pagination"
              v-model:global-filter="globalFilter"
              :data="agents"
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
              v-if="agents && agents.length > 0"
              class="flex items-center justify-between gap-4 border-t border-default pt-4"
            >
              <div class="text-sm text-muted">
                {{ agents.length }} agent(s) disponible(s)
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
              v-if="!pending && (!agents || agents.length === 0)"
              class="text-center py-8 text-muted"
            >
              <UIcon name="i-lucide-inbox" class="mx-auto mb-2 text-4xl" />
              <p>Aucun agent disponible</p>
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
