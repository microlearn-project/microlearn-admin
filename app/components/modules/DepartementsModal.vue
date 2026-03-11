<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/vue-table";
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;
type Departement = Tables<"departement">;

// Type pour les départements avec date_attribution
interface DepartementWithAttribution extends Departement {
  date_attribution?: string;
}

const props = defineProps<{
  module: Module;
}>();

const open = defineModel<boolean>("open", { default: false });
const toast = useToast();

const UCheckbox = resolveComponent("UCheckbox");
const UButton = resolveComponent("UButton");

const table = useTemplateRef<any>("table");

/* ---------------------------------------------------
   1. Récupération des départements du module
----------------------------------------------------*/
const {
  data: departements,
  pending,
  refresh,
  error,
} = useFetch<DepartementWithAttribution[]>(
  () => `/api/module/services/${props.module.id_module}`,
  {
    server: false,
    lazy: true,
    immediate: false,
    watch: false,
  },
);

// Charger les départements quand le modal s'ouvre
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
   2. Sélection des lignes
----------------------------------------------------*/
const rowSelection = ref<Record<string, boolean>>({});

const selectedRows = computed(
  () =>
    table.value?.tableApi?.getSelectedRowModel().rows.map((r) => r.original) ??
    [],
);

/* ---------------------------------------------------
   3. Modal d'ajout de départements
----------------------------------------------------*/
const showAddModal = ref(false);

/* ---------------------------------------------------
   4. Retirer des départements
----------------------------------------------------*/
const removing = ref(false);

async function removeServices() {
  if (selectedRows.value.length === 0) return;

  const idsToRemove = selectedRows.value.map((s) => s.id_departement);
  removing.value = true;

  try {
    await Promise.all(
      selectedRows.value.map((departement) =>
        $fetch(`/api/module/services/remove`, {
          method: "DELETE",
          body: {
            id_module: props.module.id_module,
            id_departement: departement.id_departement,
          },
        }),
      ),
    );

    // --- MISE À JOUR LOCALE ---
    if (departements.value) {
      departements.value = departements.value.filter(
        (d) => !idsToRemove.includes(d.id_departement),
      );
    }

    toast.add({
      title: "Succès",
      description: `${idsToRemove.length} département(s) retiré(s)`,
      color: "success",
    });

    clearTableSelection();
  } catch (err) {
    toast.add({
      title: "Erreur",
      description: (err as Error).message,
      color: "error",
    });
  } finally {
    removing.value = false;
  }
}

/* ---------------------------------------------------
   5. Colonnes du tableau
----------------------------------------------------*/
const columns: TableColumn<DepartementWithAttribution>[] = [
  {
    id: "select",
    header: ({ table }: any) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? "indeterminate"
          : table.getIsAllPageRowsSelected(),
        "onUpdate:modelValue": (v) => table.toggleAllPageRowsSelected(!!v),
        ariaLabel: "Sélectionner tout",
      }),
    cell: ({ row }: any) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        "onUpdate:modelValue": (v) => row.toggleSelected(!!v),
        ariaLabel: "Sélectionner la ligne",
      }),
  },
  {
    accessorKey: "designation",
    header: "Désignation",
    cell: ({ row }: any) =>
      h("div", { class: "font-medium" }, row.original.designation),
  },
  {
    accessorKey: "date_attribution",
    header: "Date d'attribution",
    cell: ({ row }: any) => {
      if (!row.original.date_attribution) return "---";
      const date = new Date(row.original.date_attribution);
      return date.toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    },
  },
];

/* ---------------------------------------------------
   6. Pagination
----------------------------------------------------*/
const pagination = ref({
  pageIndex: 0,
  pageSize: 5,
});

/* ---------------------------------------------------
   7. Déselectionner toutes les lignes
----------------------------------------------------*/
function clearTableSelection() {
  table.value?.tableApi?.resetRowSelection();
  rowSelection.value = {};
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Départements du module « ${module.titre} »`"
    description="Gérer les départements associés à ce module"
    :ui="{ content: 'sm:max-w-4xl' }"
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <!-- Barre d'actions -->
        <div class="flex items-center justify-between gap-3">
          <!-- Recherche -->
          <UInput
            placeholder="Rechercher un département..."
            :model-value="
              (table?.tableApi
                ?.getColumn('designation')
                ?.getFilterValue() as string) ?? ''
            "
            icon="i-lucide-search"
            class="max-w-xs"
            @update:model-value="
              table?.tableApi?.getColumn('designation')?.setFilterValue($event)
            "
          />

          <div class="flex items-center gap-2">
            <!-- Bouton retirer -->
            <UButton
              v-if="selectedRows.length > 0"
              label="Retirer"
              color="error"
              variant="subtle"
              icon="i-lucide-x"
              :loading="removing"
              @click="removeServices"
            >
              <template #trailing>
                <UKbd>{{ selectedRows.length }}</UKbd>
              </template>
            </UButton>

            <!-- Bouton ajouter -->
            <UButton
              label="Ajouter"
              icon="i-lucide-plus"
              color="primary"
              @click="showAddModal = true"
            />
          </div>
        </div>

        <!-- Tableau -->
        <UTable
          ref="table"
          v-model:pagination="pagination"
          v-model:row-selection="rowSelection"
          :data="departements"
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
          v-if="departements && departements.length > 0"
          class="flex items-center justify-between gap-4 border-t border-default pt-4"
        >
          <div class="text-sm text-muted">
            {{ selectedRows.length || 0 }} département(s) sélectionné(s)
          </div>

          <UPagination
            :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>

        <!-- Message si aucun service -->
        <div
          v-if="!pending && (!departements || departements.length === 0)"
          class="text-center py-8 text-muted"
        >
          <UIcon name="i-lucide-briefcase" class="mx-auto mb-2 text-4xl" />
          <p>Aucun département associé à ce module</p>
          <UButton
            label="Ajouter un département"
            icon="i-lucide-plus"
            color="primary"
            variant="subtle"
            class="mt-4"
            @click="showAddModal = true"
          />
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

  <!-- Modal d'ajout de services -->
  <ModulesAddDepartementModal
    v-if="showAddModal"
    v-model:open="showAddModal"
    :module="module"
    @added="refresh()"
  />
</template>
