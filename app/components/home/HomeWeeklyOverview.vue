<script setup lang="ts">
const UIcon = resolveComponent("UIcon");

interface WeeklyStats {
  agents_actifs_semaine: number;
  agents_actifs_semaine_precedente: number;
  modules_commences: number;
  quiz_completes: number;
  quiz_reussis: number;
}

const { data: weeklyStats, pending } = await useFetch<WeeklyStats>(
  "/api/dashboard/weekly-overview"
);

const agentsTrend = computed(() => {
  if (!weeklyStats.value) return "neutral";
  const diff =
    weeklyStats.value.agents_actifs_semaine -
    weeklyStats.value.agents_actifs_semaine_precedente;
  if (diff > 0) return "success";
  if (diff < 0) return "error";
  return "neutral";
});

const agentsTrendIcon = computed(() => {
  if (!weeklyStats.value) return "i-lucide-minus";
  const diff =
    weeklyStats.value.agents_actifs_semaine -
    weeklyStats.value.agents_actifs_semaine_precedente;
  if (diff > 0) return "i-lucide-trending-up";
  if (diff < 0) return "i-lucide-trending-down";
  return "i-lucide-minus";
});

const quizReussisColor = computed(() => {
  if (!weeklyStats.value || weeklyStats.value.quiz_completes === 0)
    return "neutral";
  const taux =
    weeklyStats.value.quiz_reussis / weeklyStats.value.quiz_completes;
  if (taux >= 0.75) return "success";
  if (taux >= 0.5) return "warning";
  return "error";
});
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">Aperçu rapide</h3>
          <p class="text-sm text-muted mt-1">Dernières 7 jours</p>
        </div>
      </div>
    </template>

    <!-- Loading skeleton -->
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <USkeleton v-for="i in 3" :key="i" class="h-32" />
    </div>

    <!-- Données réelles -->
    <div v-else-if="weeklyStats" class="grid grid-cols-1 md:grid-cols-3 gap-6">

      <!-- Agents actifs -->
      <div class="text-center p-4 bg-elevated border border-default rounded-lg">
        <div class="flex items-center justify-center gap-2 mb-2">
          <UIcon
            :name="agentsTrendIcon"
            :class="`text-${agentsTrend} text-xl`"
          />
          <p :class="`text-3xl font-bold text-${agentsTrend}`">
            {{ weeklyStats.agents_actifs_semaine }}
          </p>
        </div>
        <p class="text-sm text-muted">Agents actifs</p>
        <p class="text-xs text-muted mt-1">
          {{ weeklyStats.agents_actifs_semaine_precedente }} la semaine dernière
        </p>
      </div>

      <!-- Modules commencés -->
      <div class="text-center p-4 bg-elevated border border-default rounded-lg">
        <div class="flex items-center justify-center gap-2 mb-2">
          <UIcon name="i-lucide-book-open" class="text-info text-xl" />
          <p class="text-3xl font-bold text-info">
            {{ weeklyStats.modules_commences }}
          </p>
        </div>
        <p class="text-sm text-muted">Modules commencés</p>
        <p class="text-xs text-muted mt-1">cette semaine</p>
      </div>

      <!-- Quiz réussis / complétés -->
      <div class="text-center p-4 bg-elevated border border-default rounded-lg">
        <div class="flex items-center justify-center gap-2 mb-2">
          <UIcon
            name="i-lucide-check-circle"
            :class="`text-${quizReussisColor} text-xl`"
          />
          <p :class="`text-3xl font-bold text-${quizReussisColor}`">
            {{ weeklyStats.quiz_reussis }}
            <span class="text-lg font-normal text-muted">
              / {{ weeklyStats.quiz_completes }}
            </span>
          </p>
        </div>
        <p class="text-sm text-muted">Quiz réussis</p>
        <p class="text-xs text-muted mt-1">cette semaine</p>
      </div>

    </div>

    <!-- État vide -->
    <div v-else class="text-center py-12">
      <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
      <p class="text-sm text-muted">Aucune donnée disponible</p>
    </div>
  </UCard>
</template>
