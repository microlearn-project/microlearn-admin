<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/vue-table";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UIcon = resolveComponent("UIcon");

interface ServiceProgress {
  id_service: string;
  designation: string;
  total_agents: number;
  participants: number;
  non_participants: number;
  taux_participation: number;
  modules_disponibles: number;
}

interface Agent {
  id_agent: string;
  code_agent: string;
  nom: string;
  prenom: string;
  email: string;
  progression_moyenne?: number;
  modules_completes?: number;
}

// Récupération des données
const { data: servicesProgress, pending } = await useFetch<ServiceProgress[]>(
  "/api/dashboard/services-progress-detailed"
);

// Table
const table = useTemplateRef<any>("table");
const pagination = ref({
  pageIndex: 0,
  pageSize: 5,
});
const globalFilter = ref("");

// Modal de détails
const showDetailModal = ref(false);
const selectedService = ref<ServiceProgress | null>(null);
const loadingParticipants = ref(false);
const participants = ref<Agent[]>([]);
const nonParticipants = ref<Agent[]>([]);

// Recherche dans le modal
const participantsSearch = ref("");
const activeTab = ref("participants");

// Ouvrir le modal de détails
async function openServiceDetail(service: ServiceProgress) {
  selectedService.value = service;
  showDetailModal.value = true;
  loadingParticipants.value = true;

  try {
    const response = await $fetch(`/api/dashboard/service-participants/${service.id_service}`);
    participants.value = (response as any).participants || [];
    nonParticipants.value = (response as any).non_participants || [];
  } catch (error) {
    console.error("Erreur lors du chargement des participants:", error);
  } finally {
    loadingParticipants.value = false;
  }
}

// Filtrer les participants selon la recherche
const filteredParticipants = computed(() => {
  if (!participantsSearch.value) return participants.value;

  const query = participantsSearch.value.toLowerCase();
  return participants.value.filter(agent =>
    agent.nom.toLowerCase().includes(query) ||
    agent.prenom.toLowerCase().includes(query) ||
    agent.code_agent.toLowerCase().includes(query) ||
    agent.email.toLowerCase().includes(query)
  );
});

const filteredNonParticipants = computed(() => {
  if (!participantsSearch.value) return nonParticipants.value;

  const query = participantsSearch.value.toLowerCase();
  return nonParticipants.value.filter(agent =>
    agent.nom.toLowerCase().includes(query) ||
    agent.prenom.toLowerCase().includes(query) ||
    agent.code_agent.toLowerCase().includes(query) ||
    agent.email.toLowerCase().includes(query)
  );
});

// Colonnes du tableau principal
const columns: TableColumn<ServiceProgress>[] = [
  {
    accessorKey: "designation",
    header: "Service",
    cell: ({ row }: any) => {
      const service = row.original;
      return h("div", { class: "flex items-center gap-2" }, [
        h("div", {
          class: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"
        }, [
          h(UIcon, { name: "i-lucide-briefcase", class: "text-primary" }),
        ]),
        h("p", { class: "font-medium" }, service.designation),
      ]);
    },
  },
  {
    accessorKey: "participants",
    header: "Participants",
    cell: ({ row }: any) => {
      const service = row.original;
      return h("div", { class: "flex items-center gap-2" }, [
        h("span", { class: "font-semibold" }, service.participants),
        h("span", { class: "text-muted text-sm" }, `/ ${service.total_agents}`),
      ]);
    },
  },
  {
    accessorKey: "taux_participation",
    header: "Taux de participation",
    cell: ({ row }: any) => {
      const taux = row.original.taux_participation;
      const color = taux >= 75 ? "success" : taux >= 50 ? "warning" : taux >= 25 ? "info" : "error";

      return h("div", { class: "flex items-center gap-2" }, [
        h(UBadge, { color, variant: "subtle" }, () => `${taux}%`),
        h("div", { class: "flex-1 bg-muted/30 rounded-full h-2 max-w-24" }, [
          h("div", {
            class: `bg-${color} h-full rounded-full transition-all`,
            style: { width: `${taux}%` }
          }),
        ]),
      ]);
    },
  },
  {
    accessorKey: "modules_disponibles",
    header: "Modules",
    cell: ({ row }: any) => {
      return h("div", { class: "flex items-center gap-1" }, [
        h(UIcon, { name: "i-lucide-book-open", class: "text-muted text-sm" }),
        h("span", { class: "text-sm" }, row.original.modules_disponibles),
      ]);
    },
  },
  {
    id: "actions",
    cell: ({ row }: any) =>
      h(UButton, {
        label: "Détails",
        icon: "i-lucide-eye",
        color: "primary",
        variant: "ghost",
        size: "xs",
        onClick: () => openServiceDetail(row.original),
      }),
  },
];

// Colonnes pour les agents dans le modal
const agentColumns: TableColumn<Agent>[] = [
  {
    id: "agent",
    header: "Agent",
    cell: ({ row }: any) => {
      const agent = row.original;
      return h("div", { class: "flex items-center gap-2" }, [
        h("div", {
          class: "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs"
        }, `${agent.prenom[0]}${agent.nom[0]}`),
        h("div", {}, [
          h("p", { class: "font-medium text-sm" }, `${agent.prenom} ${agent.nom}`),
          h("code", { class: "text-xs text-muted" }, agent.code_agent),
        ]),
      ]);
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }: any) => h("span", { class: "text-sm text-muted" }, row.original.email),
  },
];

// Colonnes pour les participants (avec progression)
const participantColumns: TableColumn<Agent>[] = [
  ...agentColumns,
  {
    accessorKey: "progression_moyenne",
    header: "Progression",
    cell: ({ row }: any) => {
      const prog = row.original.progression_moyenne || 0;
      const color = prog >= 75 ? "success" : prog >= 50 ? "warning" : "info";
      return h(UBadge, { color, variant: "subtle", size: "xs" }, () => `${prog}%`);
    },
  },
  {
    accessorKey: "modules_completes",
    header: "Modules complétés",
    cell: ({ row }: any) => h("span", { class: "text-sm" }, row.original.modules_completes || 0),
  },
];
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">Progression par département</h3>
          <p class="text-sm text-muted mt-1">
            Vue d'ensemble de la participation aux formations
          </p>
        </div>
      </div>
    </template>

    <!-- Barre de recherche -->
    <div class="mb-4">
      <UInput
        v-model="globalFilter"
        placeholder="Rechercher un service..."
        icon="i-lucide-search"
        class="max-w-md"
      />
    </div>

    <!-- Tableau -->
    <UTable
      ref="table"
      v-model:pagination="pagination"
      v-model:global-filter="globalFilter"
      :data="servicesProgress"
      :columns="columns"
      :loading="pending"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50',
        th: 'sticky top-0 z-10 bg-elevated first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default py-3 cursor-pointer hover:bg-elevated/50 transition-colors',
        tbody: '[&>tr:last-child>td]:border-b-0',
      }"
      :pagination-options="{
        getPaginationRowModel: getPaginationRowModel(),
      }"
      @row-click="(row: any) => openServiceDetail(row.original)"
    />

    <!-- Pagination -->
    <div
      v-if="servicesProgress && servicesProgress.length > pagination.pageSize"
      class="flex items-center justify-between gap-4 border-t border-default pt-4 mt-4"
    >
      <div class="text-sm text-muted">
        {{ servicesProgress.length }} service(s)
      </div>

      <UPagination
        :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
        :items-per-page="table?.tableApi?.getState().pagination.pageSize"
        :total="table?.tableApi?.getFilteredRowModel().rows.length"
        @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
      />
    </div>

    <!-- État vide -->
    <div
      v-if="!pending && (!servicesProgress || servicesProgress.length === 0)"
      class="text-center py-12"
    >
      <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
      <p class="text-sm text-muted">Aucun département disponible</p>
    </div>
  </UCard>

  <!-- Modal de détails du département -->
  <UModal
    v-model:open="showDetailModal"
    :title="selectedService?.designation"
    :description="`Détails de participation au département ${selectedService?.designation}`"
    :ui="{ width: 'sm:max-w-5xl' }"
  >
    <template #body>
      <div v-if="selectedService" class="space-y-4">
        <!-- Stats du service -->
        <div class="grid grid-cols-4 gap-4">
          <div class="bg-elevated border border-default rounded-lg p-3">
            <p class="text-xs text-muted mb-1">Total agents</p>
            <p class="text-2xl font-bold">{{ selectedService.total_agents }}</p>
          </div>
          <div class="bg-elevated border border-default rounded-lg p-3">
            <p class="text-xs text-muted mb-1">Participants</p>
            <p class="text-2xl font-bold text-success">{{ selectedService.participants }}</p>
          </div>
          <div class="bg-elevated border border-default rounded-lg p-3">
            <p class="text-xs text-muted mb-1">Non-participants</p>
            <p class="text-2xl font-bold text-error">{{ selectedService.non_participants }}</p>
          </div>
          <div class="bg-elevated border border-default rounded-lg p-3">
            <p class="text-xs text-muted mb-1">Taux de participation</p>
            <p class="text-2xl font-bold">{{ selectedService.taux_participation }}%</p>
          </div>
        </div>

        <!-- Recherche unique -->
        <UInput
          v-model="participantsSearch"
          placeholder="Rechercher un agent..."
          icon="i-lucide-user-search"
          class="w-full"
          :ui="{ icon: { trailing: { pointer: '' } } }"
        >
          <template v-if="participantsSearch" #trailing>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="2xs"
              @click="participantsSearch = ''"
            />
          </template>
        </UInput>

        <!-- Tabs -->
        <UTabs
          v-model="activeTab"
          :items="[
            {
              key: 'participants',
              label: 'Participants',
              badge: filteredParticipants.length.toString(),
              icon: 'i-lucide-user-check'
            },
            {
              key: 'non-participants',
              label: 'Non-participants',
              badge: filteredNonParticipants.length.toString(),
              icon: 'i-lucide-user-x'
            },
          ]"
          class="w-full"
        >
          <!-- Tab Participants -->
          <template #item="{ item }">
            <div v-if="item.key === 'participants'" class="mt-4">
              <UTable
                :data="filteredParticipants"
                :columns="participantColumns"
                :loading="loadingParticipants"
                class="max-h-96 overflow-y-auto"
                :ui="{
                  base: 'table-fixed',
                  td: 'py-2',
                }"
              >
                <template #empty>
                  <div class="text-center py-8">
                    <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
                    <p class="text-sm text-muted">
                      {{ participantsSearch ? 'Aucun participant trouvé' : 'Aucun participant' }}
                    </p>
                  </div>
                </template>
              </UTable>
            </div>

            <div v-else-if="item.key === 'non-participants'" class="mt-4">
              <UTable
                :data="filteredNonParticipants"
                :columns="agentColumns"
                :loading="loadingParticipants"
                class="max-h-96 overflow-y-auto"
                :ui="{
                  base: 'table-fixed',
                  td: 'py-2',
                }"
              >
                <template #empty>
                  <div class="text-center py-8">
                    <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
                    <p class="text-sm text-muted">
                      {{ participantsSearch ? 'Aucun agent trouvé' : 'Tous les agents participent ✨' }}
                    </p>
                  </div>
                </template>
              </UTable>
            </div>
          </template>
        </UTabs>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between items-center">
        <p class="text-sm text-muted">
          {{ activeTab === 'participants' ? filteredParticipants.length : filteredNonParticipants.length }}
          agent(s)
        </p>
        <UButton
          label="Fermer"
          color="neutral"
          variant="outline"
          @click="showDetailModal = false"
        />
      </div>
    </template>
  </UModal>
</template>
