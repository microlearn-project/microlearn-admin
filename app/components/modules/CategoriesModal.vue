<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/vue-table";
import { upperFirst } from "scule";
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;
type Tag = Tables<"tag">;

const props = defineProps<{
  module: Module;
}>();

const open = defineModel<boolean>("open", { default: false });
const toast = useToast();

const UCheckbox = resolveComponent("UCheckbox");
const UButton = resolveComponent("UButton");

const table = useTemplateRef<any>("table");

/* ---------------------------------------------------
   1. Récupération des catégories du module
----------------------------------------------------*/
const {
  data: categories,
  pending,
  refresh,
  error,
} = useFetch<Tag[]>(() => `/api/module/categories/${props.module.id_module}`, {
  server: false,
  lazy: true,
  immediate: false,
  watch: false,
});

// Charger les catégories quand le modal s'ouvre
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
   3. Modal d'ajout de catégories
----------------------------------------------------*/
const showAddModal = ref(false);

/* ---------------------------------------------------
   4. Retirer des catégories
----------------------------------------------------*/
const removing = ref(false);

async function removeCategories() {
  if (selectedRows.value.length === 0) return;

  const idsToRemove = selectedRows.value.map((cat) => cat.id_tag);
  removing.value = true;

  try {
    await Promise.all(
      selectedRows.value.map((cat) =>
        $fetch(`/api/module/categories/remove`, {
          method: "DELETE",
          body: {
            id_module: props.module.id_module,
            id_tag: cat.id_tag,
          },
        }),
      ),
    );

    // --- MISE À JOUR LOCALE ---
    if (categories.value) {
      categories.value = categories.value.filter(
        (cat) => !idsToRemove.includes(cat.id_tag),
      );
    }

    toast.add({
      title: "Succès",
      description: `${idsToRemove.length} catégorie(s) retirée(s)`,
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
const columns: TableColumn<Tag>[] = [
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
    accessorKey: "updated_at",
    header: "Dernière modification",
    cell: ({ row }: any) => {
      const date = new Date(row.original.updated_at);
      return date.toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    },
  },
  {
    accessorKey: "created_at",
    header: "Date création",
    cell: ({ row }: any) => {
      const date = new Date(row.original.created_at);
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
    :title="`Catégories du module « ${module.titre} »`"
    description="Gérer les catégories associées à ce module"
    :ui="{ content: 'sm:max-w-4xl' }"
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <!-- Barre d'actions -->
        <div class="flex items-center justify-between gap-3">
          <!-- Recherche -->
          <UInput
            placeholder="Rechercher une catégorie..."
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
              @click="removeCategories"
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
          :data="categories"
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
          v-if="categories && categories.length > 0"
          class="flex items-center justify-between gap-4 border-t border-default pt-4"
        >
          <div class="text-sm text-muted">
            {{ selectedRows.length || 0 }} catégorie(s) sélectionnée(s)
          </div>

          <UPagination
            :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>

        <!-- Message si aucune catégorie -->
        <div
          v-if="!pending && (!categories || categories.length === 0)"
          class="text-center py-8 text-muted"
        >
          <UIcon name="i-lucide-tags" class="mx-auto mb-2 text-4xl" />
          <p>Aucune catégorie associée à ce module</p>
          <UButton
            label="Ajouter une catégorie"
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

  <!-- Modal d'ajout de catégories -->
  <ModulesAddCategoryModal
    v-if="showAddModal"
    v-model:open="showAddModal"
    :module="module"
    @added="refresh()"
  />
</template>
