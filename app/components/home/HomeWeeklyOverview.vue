<script setup lang="ts">
const UIcon = resolveComponent("UIcon");

interface WeeklyStats {
  agents_actifs_evolution: number;
  modules_commences: number;
  quiz_completes: number;
}

// Récupération des stats de la semaine
const { data: weeklyStats, pending } = await useFetch<WeeklyStats>(
  "/api/dashboard/weekly-overview"
);

// Calcul du pourcentage d'évolution
const agentsEvolutionPercent = computed(() => {
  if (!weeklyStats.value) return 0;
  return weeklyStats.value.agents_actifs_evolution;
});

const agentsEvolutionColor = computed(() => {
  const val = agentsEvolutionPercent.value;
  if (val > 0) return "success";
  if (val < 0) return "error";
  return "neutral";
});

const agentsEvolutionIcon = computed(() => {
  const val = agentsEvolutionPercent.value;
  if (val > 0) return "i-lucide-trending-up";
  if (val < 0) return "i-lucide-trending-down";
  return "i-lucide-minus";
});

const agentsEvolutionText = computed(() => {
  const val = agentsEvolutionPercent.value;
  if (val === 0) return "0%";
  return val > 0 ? `+${val}%` : `${val}%`;
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
        <UBadge color="success" variant="subtle">
          En temps réel
        </UBadge>
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
            :name="agentsEvolutionIcon"
            :class="`text-${agentsEvolutionColor} text-xl`"
          />
          <p :class="`text-3xl font-bold text-${agentsEvolutionColor}`">
            {{ agentsEvolutionText }}
          </p>
        </div>
        <p class="text-sm text-muted">Agents actifs</p>
        <p class="text-xs text-muted mt-1">vs semaine dernière</p>
      </div>

      <!-- Modules commencés -->
      <div class="text-center p-4 bg-elevated border border-default rounded-lg">
        <div class="flex items-center justify-center gap-2 mb-2">
          <UIcon name="i-lucide-book-open" class="text-info text-xl" />
          <p class="text-3xl font-bold text-info">
            {{ weeklyStats.modules_commences > 0 ? '+' : '' }}{{ weeklyStats.modules_commences }}
          </p>
        </div>
        <p class="text-sm text-muted">Modules commencés</p>
        <p class="text-xs text-muted mt-1">cette semaine</p>
      </div>

      <!-- Quiz complétés -->
      <div class="text-center p-4 bg-elevated border border-default rounded-lg">
        <div class="flex items-center justify-center gap-2 mb-2">
          <UIcon name="i-lucide-check-circle" class="text-warning text-xl" />
          <p class="text-3xl font-bold text-warning">
            {{ weeklyStats.quiz_completes > 0 ? '+' : '' }}{{ weeklyStats.quiz_completes }}
          </p>
        </div>
        <p class="text-sm text-muted">Quiz complétés</p>
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
