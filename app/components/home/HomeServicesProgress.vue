<script setup lang="ts">
interface ServiceProgress {
  departement: string;
  totalAgents: number;
  activeAgents: number;
  participationRate: number;
}

const { data: services, pending } = await useFetch<ServiceProgress[]>(
  "/api/dashboard/services-progress",
  {
    lazy: true,
    default: () => [],
  }
);

const sortedServices = computed(() =>
  [...services.value].sort((a, b) => b.participationRate - a.participationRate)
);

// Aperçu limité en carte — la liste complète (avec recherche) est dans
// HomeServicesProgressModal, plus adapté à mesure que le nombre de
// départements augmente.
const PREVIEW_COUNT = 5;
const previewServices = computed(() => sortedServices.value.slice(0, PREVIEW_COUNT));
const showAllModal = ref(false);

function rateColor(rate: number) {
  if (rate >= 75) return "success";
  if (rate >= 40) return "warning";
  return "error";
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-muted uppercase mb-1.5">
            Participation par département
          </p>
          <p class="text-sm text-muted">
            Part des agents ayant démarré au moins un module
          </p>
        </div>
        <UIcon name="i-lucide-building-2" class="text-2xl text-primary" />
      </div>
    </template>

    <div v-if="pending" class="space-y-4">
      <div v-for="i in 5" :key="i" class="space-y-1.5">
        <div class="flex items-center justify-between">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-4 w-10" />
        </div>
        <USkeleton class="h-2 w-full rounded-full" />
      </div>
    </div>

    <div v-else-if="sortedServices.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
      <p class="text-sm text-muted">Aucun département actif</p>
    </div>

    <div v-else class="space-y-4">
      <div v-for="service in previewServices" :key="service.departement">
        <div class="flex items-center justify-between mb-1.5">
          <p class="text-sm font-medium truncate">{{ service.departement }}</p>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs text-muted">
              {{ service.activeAgents }}/{{ service.totalAgents }}
            </span>
            <UBadge :color="rateColor(service.participationRate)" variant="subtle" size="xs">
              {{ service.participationRate }}%
            </UBadge>
          </div>
        </div>
        <div class="h-2 w-full bg-elevated rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="{
              'bg-success': rateColor(service.participationRate) === 'success',
              'bg-warning': rateColor(service.participationRate) === 'warning',
              'bg-error': rateColor(service.participationRate) === 'error',
            }"
            :style="{ width: `${service.participationRate}%` }"
          />
        </div>
      </div>

      <UButton
        v-if="sortedServices.length > PREVIEW_COUNT"
        :label="`Voir tout (${sortedServices.length} départements)`"
        icon="i-lucide-list"
        variant="link"
        size="sm"
        class="px-0"
        @click="showAllModal = true"
      />
    </div>

    <HomeServicesProgressModal
      v-model:open="showAllModal"
      :services="sortedServices"
    />
  </UCard>
</template>
