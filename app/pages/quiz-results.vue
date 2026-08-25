<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";

type Departement = Tables<"departement">;

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UIcon = resolveComponent("UIcon");

interface QuizStats {
  totalQuiz: number;
  tauxReussite: number;
  scoreMoyen: number;
  quizReussis: number;
}

interface ModuleStats {
  id_module: string;
  titre: string;
  tentatives: number;
  tauxReussite: number;
  scoreMoyen: number;
}

interface TopScore {
  score: number;
  code_agent: string;
  nom: string;
  prenom: string;
  module_titre: string;
  date_soumission: string;
}

interface ModuleDetailResult {
  code_agent: string;
  nom: string;
  prenom: string;
  email: string;
  score: number;
  reussi: boolean;
  date_soumission: string;
  temps_ecoule: number;
}

/* ---------------------------------------------------
   1. Filtres et sélection
----------------------------------------------------*/
const showDepartementSelectModal = ref(false);
const selectedDepartementForFilter = ref<Departement | null>(null);
const selectedDepartementId = ref<string>("all");
const selectedPeriod = ref<string>("all");
const statusFilter = ref<string>("all");
const agentSearch = ref<string>("");

const { data: departements } = await useFetch<Departement[]>("/api/departement", {
  transform: (data) => data.filter((d) => d.actif && !d.deleted_at),
});

function handleDepartementSelect(departement: Departement) {
  selectedDepartementForFilter.value = departement;
  selectedDepartementId.value = departement.id_departement;
}

function clearDepartementFilter() {
  selectedDepartementForFilter.value = null;
  selectedDepartementId.value = "all";
}

const periodOptions = [
  { label: "Toute la période", value: "all" },
  { label: "7 derniers jours", value: "7d" },
  { label: "30 derniers jours", value: "30d" },
  { label: "3 derniers mois", value: "3m" },
  { label: "6 derniers mois", value: "6m" },
  { label: "Cette année", value: "year" },
];

const statusOptions = [
  { label: "Tous les statuts", value: "all" },
  { label: "Réussis uniquement (≥ 50%)", value: "passed" },
  { label: "Échoués uniquement (< 50%)", value: "failed" },
  { label: "Excellents (≥ 80%)", value: "excellent" },
  { label: "Faibles (< 50%)", value: "weak" },
];

const dateRange = computed(() => {
  const now = new Date();
  let start: string | undefined;

  switch (selectedPeriod.value) {
    case "7d":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case "30d":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case "3m":
      start = new Date(
        now.getTime() - 90 * 24 * 60 * 60 * 1000
      ).toISOString();
      break;
    case "6m":
      start = new Date(
        now.getTime() - 180 * 24 * 60 * 60 * 1000
      ).toISOString();
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1).toISOString();
      break;
  }

  return { start, end: now.toISOString() };
});

const queryParams = computed(() => ({
  service: selectedDepartementId.value === "all" ? undefined : selectedDepartementId.value,
  start: dateRange.value.start,
  end: dateRange.value.end,
  status: statusFilter.value === "all" ? undefined : statusFilter.value,
  agent: agentSearch.value || undefined,
}));

/* ---------------------------------------------------
   2. Récupération des données
----------------------------------------------------*/
const { data: stats, pending: statsPending } = await useFetch<QuizStats>(
  "/api/quiz/stats",
  {
    query: queryParams,
    lazy: true,
    default: () => ({
      totalQuiz: 0,
      tauxReussite: 0,
      scoreMoyen: 0,
      quizReussis: 0,
    }),
  }
);

const { data: moduleStats, pending: moduleStatsPending } = await useFetch<
  ModuleStats[]
>("/api/quiz/by-module", {
  query: queryParams,
  lazy: true,
  default: () => [],
});

const { data: topScores, pending: topScoresPending } = await useFetch<
  TopScore[]
>("/api/quiz/top-scores", {
  query: queryParams,
  lazy: true,
  default: () => [],
});

/* ---------------------------------------------------
   3. Modal de détails par module
----------------------------------------------------*/
const showModuleDetailModal = ref(false);
const selectedModuleForDetail = ref<ModuleStats | null>(null);
const moduleDetailResults = ref<ModuleDetailResult[]>([]);
const loadingModuleDetails = ref(false);

async function openModuleDetail(module: ModuleStats) {
  selectedModuleForDetail.value = module;
  showModuleDetailModal.value = true;
  loadingModuleDetails.value = true;

  try {
    const response = await $fetch(`/api/quiz/module-details`, {
      query: {
        id_module: module.id_module,
        service: selectedDepartementId.value === "all" ? undefined : selectedDepartementId.value,
        start: dateRange.value.start,
        end: dateRange.value.end,
      },
    });
    moduleDetailResults.value = response as ModuleDetailResult[];
  } catch (error) {
    console.error("Erreur lors du chargement des détails:", error);
    moduleDetailResults.value = [];
  } finally {
    loadingModuleDetails.value = false;
  }
}

const detailColumns: TableColumn<ModuleDetailResult>[] = [
  {
    id: "agent",
    header: "Agent",
    cell: ({ row }: any) => {
      const result = row.original;
      return h("div", {}, [
        h("p", { class: "font-medium" }, `${result.prenom} ${result.nom}`),
        h("code", { class: "text-xs text-muted" }, result.code_agent),
      ]);
    },
  },
  {
    accessorKey: "score",
    header: "Score",
    cell: ({ row }: any) => {
      const score = row.original.score;
      const color = score >= 80 ? "success" : score >= 50 ? "warning" : "error";
      return h(UBadge, { color, variant: "subtle" }, () => `${score}/100`);
    },
  },
  {
    id: "resultat",
    header: "Résultat",
    cell: ({ row }: any) => {
      const reussi = row.original.reussi;
      return h(
        UBadge,
        { color: reussi ? "success" : "error", variant: "subtle", size: "xs" },
        () => (reussi ? "✓ Réussi" : "✗ Échoué")
      );
    },
  },
  {
    accessorKey: "date_soumission",
    header: "Date de soumission",
    cell: ({ row }: any) => {
      const date = new Date(row.original.date_soumission);
      return date.toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      });
    },
  },
];

/* ---------------------------------------------------
   4. Colonnes du tableau principal
----------------------------------------------------*/
const moduleColumns: TableColumn<ModuleStats>[] = [
  {
    accessorKey: "titre",
    header: "Module",
    cell: ({ row }: any) =>
      h("div", { class: "font-medium hover:text-primary cursor-pointer" }, row.original.titre),
  },
  {
    accessorKey: "tentatives",
    header: "Tentatives",
    cell: ({ row }: any) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(UIcon, { name: "i-lucide-users", class: "text-muted text-sm" }),
        h("span", {}, row.original.tentatives),
      ]),
  },
  {
    accessorKey: "tauxReussite",
    header: "Taux de réussite",
    cell: ({ row }: any) => {
      const taux = row.original.tauxReussite;
      const color = taux >= 80 ? "success" : taux >= 50 ? "warning" : "error";
      return h(UBadge, { color, variant: "subtle" }, () => `${taux}%`);
    },
  },
  {
    accessorKey: "scoreMoyen",
    header: "Score moyen",
    cell: ({ row }: any) => {
      const score = row.original.scoreMoyen;
      const color = score >= 80 ? "success" : score >= 50 ? "warning" : "error";
      return h(UBadge, { color, variant: "subtle" }, () => `${score}/100`);
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }: any) =>
      h("div", { class: "text-right" }, [
        h(UButton, {
          label: "Détails",
          icon: "i-lucide-eye",
          color: "primary",
          variant: "ghost",
          size: "xs",
          onClick: () => openModuleDetail(row.original),
        }),
      ]),
  },
];

/* ---------------------------------------------------
   5. Statistiques enrichies
----------------------------------------------------*/
const enrichedStats = computed(() => {
  if (!stats.value) return null;

  return {
    ...stats.value,
    tauxEchec: 100 - stats.value.tauxReussite,
    quizEchoues: stats.value.totalQuiz - stats.value.quizReussis,
    progression: stats.value.totalQuiz > 0 ?
      Math.round((stats.value.quizReussis / stats.value.totalQuiz) * 100) : 0,
  };
});

/* ---------------------------------------------------
   6. Tri et recherche dans le top scores
----------------------------------------------------*/
const topScoresSearch = ref("");
const filteredTopScores = computed(() => {
  if (!topScores.value) return [];

  if (!topScoresSearch.value) return topScores.value;

  const query = topScoresSearch.value.toLowerCase();
  return topScores.value.filter(item =>
    item.nom.toLowerCase().includes(query) ||
    item.prenom.toLowerCase().includes(query) ||
    item.code_agent.toLowerCase().includes(query) ||
    item.module_titre.toLowerCase().includes(query)
  );
});

/* ---------------------------------------------------
   7. Réinitialisation des filtres
----------------------------------------------------*/
function resetAllFilters() {
  clearDepartementFilter();
  selectedPeriod.value = "all";
  statusFilter.value = "all";
  agentSearch.value = "";
}

const hasActiveFilters = computed(() => {
  return (
    selectedDepartementForFilter.value !== null ||
    selectedPeriod.value !== "all" ||
    statusFilter.value !== "all" ||
    agentSearch.value !== ""
  );
});

/* ---------------------------------------------------
   8. Export Excel/CSV
----------------------------------------------------*/
const toast = useToast();
const exportLoading = ref(false);

async function exportToExcel() {
  exportLoading.value = true;

  try {
    const response = await $fetch("/api/quiz/export", {
      query: queryParams.value,
    });

    const data = response as any[];

    if (data.length === 0) {
      toast.add({
        title: "Aucune donnée à exporter",
        description: "Aucun résultat ne correspond aux filtres sélectionnés",
        color: "warning",
      });
      return;
    }

    const headers = [
      "Module",
      "Agent Code",
      "Nom",
      "Prénom",
      "Email",
      "Score",
      "Statut",
      "Date de soumission",
      "Temps écoulé (min)",
    ];

    const csvRows = [
      headers.join(","),
      ...data.map((row) => [
        `"${row.module_titre}"`,
        row.code_agent,
        `"${row.nom}"`,
        `"${row.prenom}"`,
        `"${row.email}"`,
        row.score,
        row.reussi ? "Réussi" : "Échoué",
        new Date(row.date_soumission).toLocaleString("fr-FR"),
        Math.round(row.temps_ecoule / 60),
      ].join(",")),
    ];

    const csvContent = csvRows.join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `resultats-quiz-${dateStr}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.add({
      title: "Export réussi",
      description: `${data.length} résultat(s) exporté(s)`,
      color: "success",
    });
  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    toast.add({
      title: "Erreur",
      description: "Impossible d'exporter les données",
      color: "error",
    });
  } finally {
    exportLoading.value = false;
  }
}

async function exportToJSON() {
  exportLoading.value = true;

  try {
    const response = await $fetch("/api/quiz/export", {
      query: queryParams.value,
    });

    const data = response as any[];

    if (data.length === 0) {
      toast.add({
        title: "Aucune donnée à exporter",
        color: "warning",
      });
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `resultats-quiz-${dateStr}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.add({
      title: "Export JSON réussi",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Erreur",
      description: "Impossible d'exporter les données",
      color: "error",
    });
  } finally {
    exportLoading.value = false;
  }
}

const exportItems = [
  [
    {
      label: "Exporter en CSV",
      icon: "i-lucide-file-spreadsheet",
      onSelect: exportToExcel,
    },
    {
      label: "Exporter en JSON",
      icon: "i-lucide-file-json",
      onSelect: exportToJSON,
    },
  ],
];
</script>

<template>
  <UDashboardPanel id="quiz-results">
    <template #header>
      <UDashboardNavbar title="Résultats des Quiz">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UDropdownMenu :items="exportItems" :content="{ align: 'end' }">
            <UButton
              label="Exporter"
              trailing-icon="i-lucide-download"
              color="neutral"
              variant="outline"
              :loading="exportLoading"
            />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Modal de sélection de département -->
      <DepartementSelectModal
        v-model:open="showDepartementSelectModal"
        v-model:selected-departement="selectedDepartementForFilter"
        @select="handleDepartementSelect"
        @clear="clearDepartementFilter"
      />

      <!-- Modal de détails par module -->
      <UModal
        v-model:open="showModuleDetailModal"
        :title="`Détails - ${selectedModuleForDetail?.titre}`"
        :description="`Liste des agents ayant tenté ce module`"
        :ui="{ content: 'sm:max-w-5xl' }"
      >
        <template #body>
          <div class="space-y-4">
            <div v-if="selectedModuleForDetail" class="grid grid-cols-3 gap-4 mb-4">
              <div class="bg-elevated border border-default rounded-lg p-3">
                <p class="text-xs text-muted mb-1">Tentatives</p>
                <p class="text-xl font-bold">{{ selectedModuleForDetail.tentatives }}</p>
              </div>
              <div class="bg-elevated border border-default rounded-lg p-3">
                <p class="text-xs text-muted mb-1">Taux de réussite</p>
                <p class="text-xl font-bold">{{ selectedModuleForDetail.tauxReussite }}%</p>
              </div>
              <div class="bg-elevated border border-default rounded-lg p-3">
                <p class="text-xs text-muted mb-1">Score moyen</p>
                <p class="text-xl font-bold">{{ selectedModuleForDetail.scoreMoyen }}/100</p>
              </div>
            </div>

            <UTable
              :data="moduleDetailResults"
              :columns="detailColumns"
              :loading="loadingModuleDetails"
              class="max-h-96 overflow-y-auto"
              :ui="{
                base: 'table-fixed border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50',
                th: 'sticky top-0 z-10 bg-elevated first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default py-3',
                tbody: '[&>tr:last-child>td]:border-b-0',
              }"
            />

            <div
              v-if="!loadingModuleDetails && moduleDetailResults.length === 0"
              class="text-center py-8"
            >
              <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
              <p class="text-sm text-muted">Aucun résultat pour ce module</p>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-between items-center">
            <p class="text-sm text-muted">
              {{ moduleDetailResults.length }} résultat(s)
            </p>
            <UButton
              label="Fermer"
              color="neutral"
              variant="outline"
              @click="showModuleDetailModal = false"
            />
          </div>
        </template>
      </UModal>

      <div class="space-y-6">
        <!-- Filtres -->
        <div class="bg-elevated border border-default rounded-lg p-4">
          <div class="space-y-4">
            <!-- Ligne 1 : Département et Période -->
            <div class="flex flex-wrap items-end gap-4">
              <UFormField label="Département" class="min-w-64">
                <div class="flex items-center gap-2">
                  <UButton
                    :label="
                      selectedDepartementForFilter
                        ? selectedDepartementForFilter.designation
                        : 'Tous les départements'
                    "
                    :icon="selectedDepartementForFilter ? 'i-lucide-briefcase' : 'i-lucide-filter'"
                    :color="selectedDepartementForFilter ? 'primary' : 'neutral'"
                    variant="outline"
                    class="flex-1 justify-start min-w-64"
                    truncate
                    @click="showDepartementSelectModal = true"
                  />

                  <UButton
                    v-if="selectedDepartementForFilter"
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    square
                    @click="clearDepartementFilter"
                  />
                </div>
              </UFormField>

              <UFormField label="Période" class="min-w-64">
                <USelect
                  v-model="selectedPeriod"
                  :items="periodOptions"
                  placeholder="Toute la période"
                />
              </UFormField>

              <UFormField label="Statut" class="min-w-64">
                <USelect
                  v-model="statusFilter"
                  :items="statusOptions"
                  placeholder="Tous les statuts"
                />
              </UFormField>
            </div>

            <!-- Ligne 2 : Recherche d'agent -->
            <div class="flex items-end gap-4">
              <UFormField label="Rechercher un agent" class="flex-1 max-w-md">
                <UInput
                  v-model="agentSearch"
                  placeholder="Nom, prénom ou code agent..."
                  icon="i-lucide-user-search"
                >
                  <template v-if="agentSearch" #trailing>
                    <UButton
                      icon="i-lucide-x"
                      color="neutral"
                      variant="ghost"
                      size="2xs"
                      @click="agentSearch = ''"
                    />
                  </template>
                </UInput>
              </UFormField>

              <UButton
                v-if="hasActiveFilters"
                label="Réinitialiser les filtres"
                icon="i-lucide-rotate-ccw"
                color="neutral"
                variant="ghost"
                @click="resetAllFilters"
              />
            </div>

            <!-- Badge de résumé des filtres -->
            <div v-if="hasActiveFilters" class="flex flex-wrap gap-2 pt-2 border-t border-default">
              <p class="text-xs text-muted mr-2">Filtres actifs :</p>

              <UBadge
                v-if="selectedDepartementForFilter"
                color="primary"
                variant="subtle"
                size="xs"
              >
                Département: {{ selectedDepartementForFilter.designation }}
              </UBadge>

              <UBadge
                v-if="selectedPeriod !== 'all'"
                color="info"
                variant="subtle"
                size="xs"
              >
                Période: {{ periodOptions.find(p => p.value === selectedPeriod)?.label }}
              </UBadge>

              <UBadge
                v-if="statusFilter !== 'all'"
                color="warning"
                variant="subtle"
                size="xs"
              >
                Statut: {{ statusOptions.find(s => s.value === statusFilter)?.label }}
              </UBadge>

              <UBadge
                v-if="agentSearch"
                color="success"
                variant="subtle"
                size="xs"
              >
                Agent: "{{ agentSearch }}"
              </UBadge>
            </div>
          </div>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard :ui="{ body: 'p-4' }">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
              >
                <UIcon
                  name="i-lucide-file-check"
                  class="text-primary text-2xl"
                />
              </div>
              <div>
                <p class="text-xs text-muted uppercase mb-1">Total Quiz</p>
                <p
                  v-if="statsPending"
                  class="text-2xl font-bold text-highlighted"
                >
                  <USkeleton class="h-8 w-16" />
                </p>
                <p v-else class="text-2xl font-bold text-highlighted">
                  {{ stats.totalQuiz }}
                </p>
              </div>
            </div>
          </UCard>

          <UCard :ui="{ body: 'p-4' }">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0"
              >
                <UIcon
                  name="i-lucide-circle-check"
                  class="text-success text-2xl"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-muted uppercase mb-1">Taux Réussite</p>
                <p
                  v-if="statsPending"
                  class="text-2xl font-bold text-highlighted"
                >
                  <USkeleton class="h-8 w-16" />
                </p>
                <div v-else class="flex items-center gap-2">
                  <p class="text-2xl font-bold text-highlighted">
                    {{ stats.tauxReussite }}%
                  </p>
                  <UBadge
                    v-if="enrichedStats"
                    :color="enrichedStats.tauxReussite >= 80 ? 'success' : enrichedStats.tauxReussite >= 50 ? 'warning' : 'error'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ enrichedStats.quizReussis }}/{{ enrichedStats.totalQuiz }}
                  </UBadge>
                </div>
              </div>
            </div>
          </UCard>

          <UCard :ui="{ body: 'p-4' }">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center shrink-0"
              >
                <UIcon
                  name="i-lucide-trending-up"
                  class="text-info text-2xl"
                />
              </div>
              <div>
                <p class="text-xs text-muted uppercase mb-1">Score Moyen</p>
                <p
                  v-if="statsPending"
                  class="text-2xl font-bold text-highlighted"
                >
                  <USkeleton class="h-8 w-16" />
                </p>
                <p v-else class="text-2xl font-bold text-highlighted">
                  {{ stats.scoreMoyen }}/100
                </p>
              </div>
            </div>
          </UCard>

          <UCard :ui="{ body: 'p-4' }">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center shrink-0"
              >
                <UIcon name="i-lucide-award" class="text-warning text-2xl" />
              </div>
              <div>
                <p class="text-xs text-muted uppercase mb-1">Quiz Réussis</p>
                <p
                  v-if="statsPending"
                  class="text-2xl font-bold text-highlighted"
                >
                  <USkeleton class="h-8 w-16" />
                </p>
                <p v-else class="text-2xl font-bold text-highlighted">
                  {{ stats.quizReussis }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Résultats par module -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium">Résultats par module</p>
                <p class="text-xs text-muted mt-1">
                  Cliquez sur le bouton "Détails" pour voir les résultats individuels par module
                </p>
              </div>
              <UIcon name="i-lucide-info" class="text-muted" />
            </div>
          </template>

          <UTable
            :data="moduleStats"
            :columns="moduleColumns"
            :loading="moduleStatsPending"
            :ui="{
              base: 'table-fixed border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50',
              th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'border-b border-default py-3 cursor-pointer hover:bg-elevated/50 transition-colors',
              tbody: '[&>tr:last-child>td]:border-b-0',
            }"
            @row-click="(row: any) => openModuleDetail(row.original)"
          />

          <div
            v-if="!moduleStatsPending && moduleStats.length === 0"
            class="text-center py-8"
          >
            <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
            <p class="text-sm text-muted">Aucun résultat disponible</p>
          </div>
        </UCard>

        <!-- Top Scores -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium">Top 10 Meilleurs Scores</p>
                <UIcon name="i-lucide-trophy" class="text-warning text-xl" />
              </div>
              <UInput
                v-model="topScoresSearch"
                placeholder="Rechercher..."
                icon="i-lucide-search"
                size="xs"
                class="w-64"
              />
            </div>
          </template>

          <div v-if="topScoresPending" class="space-y-3">
            <div v-for="i in 5" :key="i" class="flex items-center gap-3">
              <USkeleton class="w-8 h-8 rounded-full" />
              <USkeleton class="h-4 w-full" />
            </div>
          </div>

          <div
            v-else-if="filteredTopScores.length === 0"
            class="text-center py-8"
          >
            <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
            <p class="text-sm text-muted">
              {{ topScoresSearch ? 'Aucun résultat trouvé' : 'Aucun score disponible' }}
            </p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(item, index) in filteredTopScores"
              :key="index"
              class="flex items-center gap-3 group hover:bg-elevated/50 -mx-4 px-4 py-3 rounded-lg transition-all"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                :class="{
                  'bg-warning/20 text-warning': index === 0,
                  'bg-neutral/20 text-neutral': index === 1,
                  'bg-primary/20 text-primary': index === 2,
                  'bg-muted/20 text-muted': index > 2,
                }"
              >
                <UIcon
                  v-if="index === 0"
                  name="i-lucide-crown"
                  class="text-lg"
                />
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">
                  {{ item.prenom }} {{ item.nom }}
                  <span class="text-xs text-muted">({{ item.code_agent }})</span>
                </p>
                <p class="text-xs text-muted truncate">
                  {{ item.module_titre }}
                </p>
                <p class="text-xs text-muted">
                  {{ new Date(item.date_soumission).toLocaleDateString('fr-FR', { dateStyle: 'medium' }) }}
                </p>
              </div>
              <UBadge
                :color="item.score >= 90 ? 'success' : item.score >= 80 ? 'primary' : 'warning'"
                variant="subtle"
                class="shrink-0"
              >
                {{ item.score }}/100
              </UBadge>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
