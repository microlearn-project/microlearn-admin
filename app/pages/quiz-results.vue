<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Tables } from "~/types/database.types";
import {
  VisXYContainer,
  VisAxis,
  VisStackedBar,
  VisTooltip,
} from "@unovis/vue";

type Service = Tables<"service">;

const UBadge = resolveComponent("UBadge");

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

interface DistributionData {
  range: string;
  count: number;
}

interface TopScore {
  score: number;
  code_agent: string;
  nom: string;
  prenom: string;
  module_titre: string;
}

const selectedServiceId = ref<string>("all");
const selectedPeriod = ref<string>("all");

const { data: services } = await useFetch<Service[]>("/api/service", {
  transform: (data) => data.filter((s) => s.actif && !s.deleted_at),
});

const serviceOptions = computed(() => {
  if (!services.value) return [{ label: "Tous les services", value: "all" }];
  return [
    { label: "Tous les services", value: "all" },
    ...services.value.map((s) => ({
      label: s.designation,
      value: s.id_service,
    })),
  ];
});

const periodOptions = [
  { label: "Toute la période", value: "all" },
  { label: "7 derniers jours", value: "7d" },
  { label: "30 derniers jours", value: "30d" },
  { label: "3 derniers mois", value: "3m" },
  { label: "6 derniers mois", value: "6m" },
  { label: "Cette année", value: "year" },
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
  service: selectedServiceId.value === "all" ? undefined : selectedServiceId.value,
  start: dateRange.value.start,
  end: dateRange.value.end,
}));

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

const { data: distribution, pending: distributionPending } = await useFetch<
  DistributionData[]
>("/api/quiz/distribution", {
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

const moduleColumns: TableColumn<ModuleStats>[] = [
  {
    accessorKey: "titre",
    header: "Module",
    cell: ({ row }: any) =>
      h("div", { class: "font-medium" }, row.original.titre),
  },
  {
    accessorKey: "tentatives",
    header: "Tentatives",
    cell: ({ row }: any) => row.original.tentatives,
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
      const color =
        score >= 80 ? "success" : score >= 50 ? "warning" : "error";
      return h(UBadge, { color, variant: "subtle" }, () => `${score}/100`);
    },
  },
];

const chartCardRef = useTemplateRef<HTMLElement | null>("chartCardRef");
const { width } = useElementSize(chartCardRef);

const x = (_: DistributionData, i: number) => i;
const y = (d: DistributionData) => d.count;

const xTicks = (i: number) => {
  if (!distribution.value || !distribution.value[i]) return "";
  return distribution.value[i].range;
};
</script>

<template>
  <UDashboardPanel id="quiz-results">
    <template #header>
      <UDashboardNavbar title="Résultats des Quiz">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="flex flex-wrap items-center gap-4">
          <UFormField label="Service" class="min-w-64">
            <USelect
              v-model="selectedServiceId"
              :items="serviceOptions"
              placeholder="Tous les services"
            />
          </UFormField>

          <UFormField label="Période" class="min-w-64">
            <USelect
              v-model="selectedPeriod"
              :items="periodOptions"
              placeholder="Toute la période"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard>
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
              >
                <UIcon
                  name="i-lucide-file-check"
                  class="text-primary text-xl"
                />
              </div>
              <div>
                <p class="text-xs text-muted uppercase mb-1">Total Quiz</p>
                <p
                  v-if="statsPending"
                  class="text-2xl font-bold text-highlighted"
                >
                  ---
                </p>
                <p v-else class="text-2xl font-bold text-highlighted">
                  {{ stats.totalQuiz }}
                </p>
              </div>
            </div>
          </UCard>

          <UCard>
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
                <p class="text-xs text-muted uppercase mb-1">Taux Réussite</p>
                <p
                  v-if="statsPending"
                  class="text-2xl font-bold text-highlighted"
                >
                  ---
                </p>
                <p v-else class="text-2xl font-bold text-highlighted">
                  {{ stats.tauxReussite }}%
                </p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center"
              >
                <UIcon
                  name="i-lucide-trending-up"
                  class="text-info text-xl"
                />
              </div>
              <div>
                <p class="text-xs text-muted uppercase mb-1">Score Moyen</p>
                <p
                  v-if="statsPending"
                  class="text-2xl font-bold text-highlighted"
                >
                  ---
                </p>
                <p v-else class="text-2xl font-bold text-highlighted">
                  {{ stats.scoreMoyen }}/100
                </p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"
              >
                <UIcon name="i-lucide-award" class="text-warning text-xl" />
              </div>
              <div>
                <p class="text-xs text-muted uppercase mb-1">Quiz Réussis</p>
                <p
                  v-if="statsPending"
                  class="text-2xl font-bold text-highlighted"
                >
                  ---
                </p>
                <p v-else class="text-2xl font-bold text-highlighted">
                  {{ stats.quizReussis }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <p class="text-sm font-medium">Résultats par module</p>
          </template>

          <UTable
            :data="moduleStats"
            :columns="moduleColumns"
            :loading="moduleStatsPending"
            :ui="{
              base: 'table-fixed border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50',
              th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'border-b border-default py-3',
              tbody: '[&>tr:last-child>td]:border-b-0',
            }"
          />

          <div
            v-if="!moduleStatsPending && moduleStats.length === 0"
            class="text-center py-8"
          >
            <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
            <p class="text-sm text-muted">Aucun résultat disponible</p>
          </div>
        </UCard>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UCard ref="chartCardRef">
            <template #header>
              <p class="text-sm font-medium">Distribution des scores</p>
            </template>

            <div v-if="distributionPending" class="h-64 flex items-center justify-center">
              <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl text-muted" />
            </div>

            <VisXYContainer
              v-else
              :data="distribution"
              :padding="{ top: 20, bottom: 40 }"
              class="h-64"
              :width="width"
            >
              <VisStackedBar :x="x" :y="y" color="var(--ui-primary)" />

              <VisAxis type="x" :x="x" :tick-format="xTicks" />
              <VisAxis type="y" :y="y" />

              <VisTooltip />
            </VisXYContainer>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium">Top 10 Meilleurs Scores</p>
                <UIcon name="i-lucide-trophy" class="text-warning text-xl" />
              </div>
            </template>

            <div v-if="topScoresPending" class="space-y-3">
              <div v-for="i in 5" :key="i" class="flex items-center gap-3">
                <USkeleton class="w-6 h-6 rounded-full" />
                <USkeleton class="h-4 w-full" />
              </div>
            </div>

            <div
              v-else-if="topScores.length === 0"
              class="text-center py-8"
            >
              <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
              <p class="text-sm text-muted">Aucun score disponible</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="(item, index) in topScores"
                :key="index"
                class="flex items-center gap-3 group hover:bg-elevated/50 -mx-4 px-4 py-2 rounded-lg transition-colors"
              >
                <div
                  class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  :class="{
                    'bg-warning/20 text-warning': index === 0,
                    'bg-neutral/20 text-neutral': index === 1,
                    'bg-primary/20 text-primary': index === 2,
                    'bg-muted/20 text-muted': index > 2,
                  }"
                >
                  {{ index + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">
                    {{ item.prenom }} {{ item.nom }}
                    <span class="text-xs text-muted">({{ item.code_agent }})</span>
                  </p>
                  <p class="text-xs text-muted truncate">
                    {{ item.module_titre }}
                  </p>
                </div>
                <UBadge color="success" variant="subtle" class="shrink-0">
                  {{ item.score }}/100
                </UBadge>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.unovis-xy-container {
  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);
}
</style>
