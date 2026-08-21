<script setup lang="ts">
interface DashboardStats {
  totalAgents: number;
  publishedModules: number;
  completedQuiz: number;
  averageSuccessRate: number;
  activeSessionsNow: number;
}

const { data: stats, pending } = await useFetch<DashboardStats>(
  "/api/dashboard/stats",
  {
    lazy: true,
    default: () => ({
      totalAgents: 0,
      publishedModules: 0,
      completedQuiz: 0,
      averageSuccessRate: 0,
      activeSessionsNow: 0,
    }),
  }
);
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      icon="i-lucide-radio"
      title="Connectés maintenant"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading:
          'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span v-if="pending" class="text-2xl font-semibold text-highlighted">
          ---
        </span>
        <span v-else class="text-2xl font-semibold text-highlighted">
          {{ stats.activeSessionsNow }}
        </span>
      </div>
    </UPageCard>

    <UPageCard
      icon="i-lucide-book-open"
      title="Modules Publiés"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading:
          'p-2.5 rounded-full bg-success/10 ring ring-inset ring-success/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span v-if="pending" class="text-2xl font-semibold text-highlighted">
          ---
        </span>
        <span v-else class="text-2xl font-semibold text-highlighted">
          {{ stats.publishedModules }}
        </span>
      </div>
    </UPageCard>

    <UPageCard
      icon="i-lucide-check-circle"
      title="Quiz Complétés"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading:
          'p-2.5 rounded-full bg-info/10 ring ring-inset ring-info/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span v-if="pending" class="text-2xl font-semibold text-highlighted">
          ---
        </span>
        <span v-else class="text-2xl font-semibold text-highlighted">
          {{ stats.completedQuiz }}
        </span>
      </div>
    </UPageCard>

    <UPageCard
      icon="i-lucide-trending-up"
      title="Taux de Réussite"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading:
          'p-2.5 rounded-full bg-warning/10 ring ring-inset ring-warning/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span v-if="pending" class="text-2xl font-semibold text-highlighted">
          ---
        </span>
        <span v-else class="text-2xl font-semibold text-highlighted">
          {{ stats.averageSuccessRate }}%
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
