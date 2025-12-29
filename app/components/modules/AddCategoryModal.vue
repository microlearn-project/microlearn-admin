<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;
type Tag = Tables<"tag">;

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
   1. Récupération des catégories disponibles
----------------------------------------------------*/
const {
  data: availableCategories,
  pending,
  refresh,
  error,
} = useFetch<Tag[]>(
  () => `/api/module/categories-available/${props.module.id_module}`,
  {
    server: false,
    lazy: true,
    immediate: false,
    watch: false,
  }
);

// Charger les catégories quand le modal s'ouvre
watch(open, async (isOpen) => {
  console.log('Modal open changed:', isOpen);
  if (isOpen) {
    console.log('Fetching available categories for module:', props.module.id_module);
    await refresh();
    console.log('Available categories:', availableCategories.value);
    console.log('Error:', error.value);
    console.log('Pending:', pending.value);
  }
}, { immediate: true });

/* ---------------------------------------------------
   2. Ajouter une catégorie
----------------------------------------------------*/
const adding = ref<string | null>(null);

async function addCategory(tag: Tag) {
  adding.value = tag.id_tag;
  try {
    await $fetch(`/api/module/categories/add`, {
      method: "POST",
      body: {
        id_module: props.module.id_module,
        id_tag: tag.id_tag,
      },
    });

    toast.add({
      title: "Succès",
      description: `Catégorie « ${tag.designation} » ajoutée`,
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
        description: "Cette catégorie est déjà associée au module",
        color: "error",
      });
    } else {
      toast.add({
        title: "Erreur",
        description: "Impossible d'ajouter la catégorie",
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
const columns: TableColumn<Tag>[] = [
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
          loading: adding.value === row.original.id_tag,
          onClick: () => addCategory(row.original),
        }),
      ]),
  },
];

/* ---------------------------------------------------
   4. Pagination
----------------------------------------------------*/
const pagination = ref({
  pageIndex: 0,
  pageSize: 8,
});

const paginatedData = computed(() => {
  if (!availableCategories.value) return [];
  const start = pagination.value.pageIndex * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return availableCategories.value.slice(start, end);
});
</script>

<template>
  <UModal
    v-model:open="open"
    title="Ajouter des catégories"
    description="Sélectionnez les catégories à ajouter au module"
    :ui="{ width: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Recherche -->
        <UInput
          placeholder="Rechercher une catégorie..."
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
          :data="paginatedData"
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
          v-if="availableCategories && availableCategories.length > 0"
          class="flex items-center justify-between gap-4 border-t border-default pt-4"
        >
          <div class="text-sm text-muted">
            {{ availableCategories.length }} catégorie(s) disponible(s)
          </div>

          <UPagination
            :default-page="pagination.pageIndex + 1"
            :items-per-page="pagination.pageSize"
            :total="availableCategories?.length || 0"
            @update:page="(p) => (pagination.pageIndex = p - 1)"
          />
        </div>

        <!-- Message si aucune catégorie disponible -->
        <div
          v-if="
            !pending &&
            (!availableCategories || availableCategories.length === 0)
          "
          class="text-center py-8 text-muted"
        >
          <UIcon name="i-lucide-check-circle" class="mx-auto mb-2 text-4xl" />
          <p>Toutes les catégories sont déjà associées à ce module</p>
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
