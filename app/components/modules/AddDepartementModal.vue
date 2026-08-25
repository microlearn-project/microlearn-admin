<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/vue-table";
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;
type Departement = Tables<"departement">;

const props = defineProps<{
  module: Module;
}>();

const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{
  (e: "added"): void;
}>();

const toast = useToast();
const table = useTemplateRef<any>("table");

const UButton = resolveComponent("UButton");

/* ---------------------------------------------------
   1. Récupération des services disponibles
----------------------------------------------------*/
const {
  data: availableServices,
  pending,
  refresh,
  error,
} = useFetch<Departement[]>(
  () => `/api/module/departements-available/${props.module.id_module}`,
  {
    server: false,
    lazy: true,
    immediate: false,
    watch: false,
  },
);

// Charger les services quand le modal s'ouvre
watch(
  open,
  async (isOpen) => {
    if (isOpen) {
      await refresh();
    }
  },
  { immediate: true },
);

/* ---------------------------------------------------
   2. Ajouter un service
----------------------------------------------------*/
const adding = ref<string | null>(null);

async function addService(departement: Departement) {
  adding.value = departement.id_departement;
  try {
    await $fetch(`/api/module/departements/add`, {
      method: "POST",
      body: {
        id_module: props.module.id_module,
        id_departement: departement.id_departement,
      },
    });

    toast.add({
      title: "Succès",
      description: `Département « ${departement.designation} » ajouté`,
      color: "success",
    });

    emit("added");
    await refresh();
  } catch (err: any) {
    const message =
      err?.data?.message || err?.statusMessage || err?.message || "";

    if (message.includes("duplicate") || message.includes("unique")) {
      toast.add({
        title: "Échec",
        description: "Ce département est déjà associé au module",
        color: "error",
      });
    } else {
      toast.add({
        title: "Erreur",
        description: "Impossible d'ajouter le département",
        color: "error",
      });
    }
  } finally {
    adding.value = null;
  }
}

/* ---------------------------------------------------
   3. Colonnes du tableau
----------------------------------------------------*/
const columns: TableColumn<Departement>[] = [
  {
    accessorKey: "designation",
    header: "Désignation",
    cell: ({ row }: any) =>
      h("div", { class: "font-medium" }, row.original.designation),
  },
  {
    id: "actions",
    cell: ({ row }: any) =>
      h("div", { class: "text-right" }, [
        h(UButton, {
          icon: "i-lucide-plus",
          color: "primary",
          variant: "ghost",
          size: "xs",
          loading: adding.value === row.original.id_departement,
          onClick: () => addService(row.original),
        }),
      ]),
  },
];

/* ---------------------------------------------------
   4. Pagination
----------------------------------------------------*/
const pagination = ref({
  pageIndex: 0,
  pageSize: 5,
});
</script>

<template>
  <UModal
    v-model:open="open"
    title="Ajouter des départements"
    description="Sélectionnez les départements à ajouter au module"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Recherche -->
        <UInput
          placeholder="Rechercher un département..."
          :model-value="
            (table?.tableApi
              ?.getColumn('designation')
              ?.getFilterValue() as string) ?? ''
          "
          icon="i-lucide-search"
          class="w-full"
          @update:model-value="
            table?.tableApi?.getColumn('designation')?.setFilterValue($event)
          "
        />

        <!-- Tableau -->
        <UTable
          ref="table"
          v-model:pagination="pagination"
          :data="availableServices"
          :pagination-options="{
            getPaginationRowModel: getPaginationRowModel(),
          }"
          :columns="columns"
          :loading="pending"
          class="max-h-100 overflow-y-auto"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50',
            th: `
              sticky top-0 z-10
              bg-elevated
              first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r
            `,
            td: 'border-b border-default py-3',
            tbody: '[&>tr:last-child>td]:border-b-0',
          }"
        />

        <!-- Pied de page -->
        <div
          v-if="availableServices && availableServices.length > 0"
          class="flex items-center justify-between gap-4 border-t border-default pt-4"
        >
          <div class="text-sm text-muted">
            {{ availableServices.length }} département(s) disponible(s)
          </div>

          <UPagination
            :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>

        <!-- Message si aucun département disponible -->
        <div
          v-if="
            !pending && (!availableServices || availableServices.length === 0)
          "
          class="text-center py-8 text-muted"
        >
          <UIcon name="i-lucide-circle-check" class="mx-auto mb-2 text-4xl" />
          <p>Tous les départements sont déjà associés à ce module</p>
        </div>

        <!-- Bouton fermer -->
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
</template>
