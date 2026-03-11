<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";

type Agent = Tables<"agent">;
type Departement = Tables<"departement">;

interface DepartementWithAttribution extends Departement {
  date_attribution?: string;
}

const props = defineProps<{ agent: Agent }>();
const open = defineModel<boolean>("open", { default: false });
const toast = useToast();

const UCheckbox = resolveComponent("UCheckbox");
const UButton = resolveComponent("UButton");
const table = useTemplateRef<any>("table");

const {
  data: departements,
  pending,
  refresh,
} = useFetch<DepartementWithAttribution[]>(
  () => `/api/module/services/${props.agent.id_departement}`,
  { server: false, lazy: true, immediate: false, watch: false },
);

watch(open, async (isOpen) => { if (isOpen) await refresh(); }, { immediate: true });

const rowSelection = ref<Record<string, boolean>>({});
const selectedRows = computed(
  () => table.value?.tableApi?.getSelectedRowModel().rows.map((r: any) => r.original) ?? [],
);

const removing = ref(false);

async function removeDepartements() {
  if (selectedRows.value.length === 0) return;
  removing.value = true;
  try {
    await Promise.all(
      selectedRows.value.map((dept: Departement) =>
        $fetch(`/api/module/services/remove`, {
          method: "DELETE",
          body: { id_departement: dept.id_departement },
        }),
      ),
    );
    toast.add({ title: "Succès", description: `${selectedRows.value.length} département(s) retiré(s)`, color: "success" });
    await refresh();
    clearTableSelection();
  } catch (err) {
    toast.add({ title: "Erreur", description: (err as Error).message, color: "error" });
  } finally {
    removing.value = false;
  }
}

const columns: TableColumn<DepartementWithAttribution>[] = [
  {
    id: "select",
    header: ({ table }: any) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected() ? "indeterminate" : table.getIsAllPageRowsSelected(),
        "onUpdate:modelValue": (v: any) => table.toggleAllPageRowsSelected(!!v),
        ariaLabel: "Sélectionner tout",
      }),
    cell: ({ row }: any) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        "onUpdate:modelValue": (v: any) => row.toggleSelected(!!v),
        ariaLabel: "Sélectionner la ligne",
      }),
  },
  {
    accessorKey: "designation",
    header: "Désignation",
    cell: ({ row }: any) => h("div", { class: "font-medium" }, row.original.designation),
  },
  {
    accessorKey: "date_attribution",
    header: "Date d'attribution",
    cell: ({ row }: any) => {
      if (!row.original.date_attribution) return "---";
      return new Date(row.original.date_attribution).toLocaleString("fr-FR", {
        dateStyle: "medium", timeStyle: "short",
      });
    },
  },
];

const pagination = ref({ pageIndex: 0, pageSize: 5 });

function clearTableSelection() {
  table.value?.tableApi?.resetRowSelection();
  rowSelection.value = {};
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Département de l'agent « ${agent.prenom} ${agent.nom} »`"
    description="Informations sur le département de l'agent"
    :ui="{ content: 'sm:max-w-4xl' }"
  >
    <slot />
    <template #body>
      <div class="space-y-4">
        <UTable
          ref="table"
          v-model:row-selection="rowSelection"
          v-model:pagination="pagination"
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
        />
        <div
          v-if="!pending && (!departements || departements.length === 0)"
          class="text-center py-8 text-muted"
        >
          <UIcon name="i-lucide-briefcase" class="mx-auto mb-2 text-4xl" />
          <p>Aucun département associé</p>
        </div>
        <div class="flex justify-end pt-4">
          <UButton label="Fermer" color="neutral" variant="subtle" @click="open = false" />
        </div>
      </div>
    </template>
  </UModal>
</template>
