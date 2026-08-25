<script setup lang="ts">
interface ModuleStats {
  id_module: string;
  titre: string;
  tentatives: number;
  tauxReussite: number;
  scoreMoyen: number;
}

const { data: moduleStats, pending } = await useFetch<ModuleStats[]>(
  "/api/quiz/by-module",
  {
    lazy: true,
    default: () => [],
  }
);

const strugglingModules = computed(() =>
  [...moduleStats.value]
    .filter((m) => m.tentatives > 0)
    .sort((a, b) => a.tauxReussite - b.tauxReussite)
    .slice(0, 5)
);

function rateColor(rate: number) {
  if (rate < 50) return "error";
  if (rate < 80) return "warning";
  return "success";
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-muted uppercase mb-1.5">Modules à la traîne</p>
          <p class="text-sm text-muted">Taux de réussite le plus faible</p>
        </div>
        <UIcon name="i-lucide-trending-down" class="text-2xl text-error" />
      </div>
    </template>

    <div v-if="pending" class="space-y-4">
      <div v-for="i in 5" :key="i" class="flex items-center justify-between">
        <USkeleton class="h-4 w-3/4" />
        <USkeleton class="w-12 h-6 rounded" />
      </div>
    </div>

    <div v-else-if="strugglingModules.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-circle-check" class="text-4xl text-success mb-2" />
      <p class="text-sm text-muted">
        Aucun résultat de quiz encore enregistré
      </p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="module in strugglingModules"
        :key="module.id_module"
        class="flex items-center justify-between group hover:bg-elevated/50 -mx-4 px-4 py-2 rounded-lg transition-colors"
      >
        <div class="flex-1 min-w-0">
          <NuxtLink
            :to="`/modules/edit/${module.id_module}`"
            class="text-sm font-medium group-hover:text-primary transition-colors truncate block"
          >
            {{ module.titre }}
          </NuxtLink>
          <p class="text-xs text-muted mt-0.5">
            {{ module.tentatives }} tentative(s) · score moyen
            {{ module.scoreMoyen }}/100
          </p>
        </div>
        <UBadge :color="rateColor(module.tauxReussite)" variant="subtle" class="shrink-0">
          {{ module.tauxReussite }}%
        </UBadge>
      </div>
    </div>
  </UCard>
</template>
