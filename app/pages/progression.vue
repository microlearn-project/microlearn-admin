<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";

interface Module {
  id_module: string;
  titre: string;
  publish_at: string | null;
}

interface AgentProgression {
  id_agent: string;
  code_agent: string;
  nom: string;
  prenom: string;
  email: string;
  service: string;
  departement: string;
  date_debut: string | null;
  date_fin: string | null;
  progression: number;
  quiz_termine: boolean;
  quiz_score: number | null;
  cours_completes: number;
  cours_total: number;
}

interface ProgressionResponse {
  module: {
    id_module: string;
    titre: string;
  };
  stats: {
    participants: number;
    tauxParticipation: number;
    tauxCompletion: number;
    tauxReussite: number;
    totalAgents: number;
    completedAgents: number;
  };
  agents: AgentProgression[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const UBadge = resolveComponent("UBadge");

const showModuleModal = ref(false);
const selectedModule = ref<Module | null>(null);
const currentPage = ref(1);
const searchQuery = ref("");
const searchMode = ref<"local" | "global">("local");

const selectedModuleId = computed(() => selectedModule.value?.id_module || "");

const {
  data: progressionData,
  pending,
  refresh,
} = await useFetch<ProgressionResponse>(
  () => `/api/progression/module/${selectedModuleId.value}`,
  {
    query: computed(() => ({ page: currentPage.value })),
    watch: [selectedModuleId, currentPage],
    immediate: false,
  }
);

const {
  data: searchResults,
  pending: searchPending,
  execute: executeSearch,
} = await useFetch<AgentProgression[]>("/api/progression/search", {
  query: computed(() => ({
    module: selectedModuleId.value,
    q: searchQuery.value,
  })),
  immediate: false,
});

const displayedAgents = computed(() => {
  if (searchMode.value === "global") {
    return searchResults.value || [];
  }
  return progressionData.value?.agents || [];
});

const localFilteredAgents = computed(() => {
  if (!searchQuery.value || searchMode.value === "global") {
    return displayedAgents.value;
  }

  const query = searchQuery.value.toLowerCase();
  return displayedAgents.value.filter((agent) => {
    const codeAgent = agent.code_agent.toLowerCase();
    const nom = agent.nom.toLowerCase();
    const prenom = agent.prenom.toLowerCase();
    const email = agent.email.toLowerCase();
    const fullName = `${prenom} ${nom}`.toLowerCase();

    return (
      codeAgent.includes(query) ||
      nom.includes(query) ||
      prenom.includes(query) ||
      email.includes(query) ||
      fullName.includes(query)
    );
  });
});

const searchTimeout = ref<NodeJS.Timeout | null>(null);

watch(searchQuery, (newQuery) => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  if (!newQuery) {
    searchMode.value = "local";
    return;
  }

  searchTimeout.value = setTimeout(() => {
    const query = newQuery.toLowerCase();
    const foundLocally = displayedAgents.value.some((agent) => {
      const codeAgent = agent.code_agent.toLowerCase();
      const nom = agent.nom.toLowerCase();
      const prenom = agent.prenom.toLowerCase();
      const email = agent.email.toLowerCase();
      const fullName = `${prenom} ${nom}`.toLowerCase();

      return (
        codeAgent.includes(query) ||
        nom.includes(query) ||
        prenom.includes(query) ||
        email.includes(query) ||
        fullName.includes(query)
      );
    });

    if (!foundLocally && selectedModuleId.value) {
      searchMode.value = "global";
      executeSearch();
    } else {
      searchMode.value = "local";
    }
  }, 300);
});

function changePage(page: number) {
  currentPage.value = page;
  searchQuery.value = "";
  searchMode.value = "local";
}

function handleModuleSelect(module: Module) {
  selectedModule.value = module;
  currentPage.value = 1;
  searchQuery.value = "";
  searchMode.value = "local";
  refresh();
}

const columns: TableColumn<AgentProgression>[] = [
  {
    accessorKey: "code_agent",
    header: "Code Agent",
    cell: ({ row }: any) =>
      h("code", { class: "text-xs font-mono" }, row.original.code_agent),
  },
  {
    id: "agent",
    header: "Agent",
    cell: ({ row }: any) => {
      const agent = row.original;
      return h("div", {}, [
        h("p", { class: "font-medium" }, `${agent.prenom} ${agent.nom}`),
        h("p", { class: "text-xs text-muted" }, agent.email),
      ]);
    },
  },
  {
    accessorKey: "service",
    header: "Service",
    cell: ({ row }: any) => row.original.service,
  },
  {
    accessorKey: "progression",
    header: "Progression",
    cell: ({ row }: any) => {
      const progression = row.original.progression;
      const color =
        progression === 100
          ? "success"
          : progression >= 50
            ? "warning"
            : "neutral";
      return h("div", { class: "flex items-center gap-2" }, [
        h(UBadge, { color, variant: "subtle" }, () => `${progression}%`),
        h("div", { class: "w-24 bg-neutral/20 rounded-full h-1.5" }, [
          h("div", {
            class: `h-1.5 rounded-full bg-${color}`,
            style: { width: `${progression}%` },
          }),
        ]),
      ]);
    },
  },
  {
    id: "cours",
    header: "Cours",
    cell: ({ row }: any) => {
      const agent = row.original;
      return `${agent.cours_completes}/${agent.cours_total}`;
    },
  },
  {
    id: "quiz",
    header: "Quiz",
    cell: ({ row }: any) => {
      const agent = row.original;
      if (!agent.quiz_termine) {
        return h(UBadge, { color: "neutral", variant: "subtle" }, () => "Non fait");
      }
      const score = agent.quiz_score || 0;
      const color = score >= 50 ? "success" : "error";
      return h(UBadge, { color, variant: "subtle" }, () => `${score}/100`);
    },
  },
  {
    accessorKey: "date_debut",
    header: "Début",
    cell: ({ row }: any) => {
      if (!row.original.date_debut) return "N/A";
      return new Date(row.original.date_debut).toLocaleDateString("fr-FR");
    },
  },
  {
    accessorKey: "date_fin",
    header: "Fin",
    cell: ({ row }: any) => {
      if (!row.original.date_fin) return "En cours";
      return new Date(row.original.date_fin).toLocaleDateString("fr-FR");
    },
  },
];
</script>

<template>
  <UDashboardPanel id="progression">
    <template #header>
      <UDashboardNavbar title="Progression des Agents">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <ProgressionModuleSelectModal
        v-model:open="showModuleModal"
        v-model:selected-module="selectedModule"
        @select="handleModuleSelect"
      />

      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <UButton
            label="Sélectionner un module"
            icon="i-lucide-search"
            color="primary"
            size="lg"
            @click="showModuleModal = true"
          />

          <div
            v-if="selectedModule"
            class="flex items-center gap-2 px-4 py-2 bg-elevated border border-default rounded-lg"
          >
            <UIcon name="i-lucide-book-open" class="text-primary" />
            <span class="font-medium">{{ selectedModule.titre }}</span>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              square
              @click="selectedModule = null"
            />
          </div>
        </div>

        <div v-if="selectedModuleId && progressionData">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div class="bg-elevated border border-default rounded-lg p-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
                >
                  <UIcon name="i-lucide-users" class="text-primary text-xl" />
                </div>
                <div>
                  <p class="text-2xl font-bold">
                    {{ progressionData.stats.participants }}
                  </p>
                  <p class="text-sm text-muted">Participants</p>
                </div>
              </div>
            </div>

            <div class="bg-elevated border border-default rounded-lg p-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-user-check"
                    class="text-info text-xl"
                  />
                </div>
                <div>
                  <p class="text-2xl font-bold">
                    {{ progressionData.stats.tauxParticipation }}%
                  </p>
                  <p class="text-sm text-muted">Participation</p>
                </div>
              </div>
            </div>

            <div class="bg-elevated border border-default rounded-lg p-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-check-circle"
                    class="text-success text-xl"
                  />
                </div>
                <div>
                  <p class="text-2xl font-bold">
                    {{ progressionData.stats.tauxCompletion }}%
                  </p>
                  <p class="text-sm text-muted">Complétion</p>
                </div>
              </div>
            </div>

            <div class="bg-elevated border border-default rounded-lg p-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-trending-up"
                    class="text-warning text-xl"
                  />
                </div>
                <div>
                  <p class="text-2xl font-bold">
                    {{ progressionData.stats.tauxReussite }}%
                  </p>
                  <p class="text-sm text-muted">Réussite</p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between mb-4">
            <UInput
              v-model="searchQuery"
              placeholder="Rechercher par code, nom, prénom ou email..."
              icon="i-lucide-search"
              class="max-w-md"
              :loading="searchPending"
            />

            <div class="flex items-center gap-2">
              <UBadge
                v-if="searchMode === 'global'"
                color="info"
                variant="subtle"
              >
                Recherche globale
              </UBadge>
              <p class="text-sm text-muted">
                {{ localFilteredAgents.length }} agent(s)
              </p>
            </div>
          </div>

          <UTable
            :data="localFilteredAgents"
            :columns="columns"
            :loading="pending || searchPending"
            :ui="{
              base: 'table-fixed border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50',
              th: 'sticky top-0 z-10 bg-elevated first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'border-b border-default py-3',
              tbody: '[&>tr:last-child>td]:border-b-0',
            }"
          />

          <div
            v-if="searchMode === 'local' && progressionData.pagination"
            class="flex items-center justify-between gap-4 border-t border-default pt-4 mt-6"
          >
            <div class="text-sm text-muted">
              Page {{ progressionData.pagination.page }} sur
              {{ progressionData.pagination.totalPages }}
            </div>

            <UPagination
              :model-value="currentPage"
              :total="progressionData.pagination.total"
              :items-per-page="progressionData.pagination.limit"
              @update:model-value="changePage"
            />
          </div>
        </div>

        <div
          v-else-if="!selectedModule"
          class="text-center py-16 border-2 border-dashed border-default rounded-lg"
        >
          <UIcon
            name="i-lucide-graduation-cap"
            class="text-5xl text-muted mb-4"
          />
          <p class="font-medium mb-2">Aucun module sélectionné</p>
          <p class="text-muted text-sm mb-4">
            Cliquez sur le bouton ci-dessus pour sélectionner un module
          </p>
          <UButton
            label="Sélectionner un module"
            icon="i-lucide-search"
            @click="showModuleModal = true"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
