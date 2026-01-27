<script setup lang="ts">
interface ServiceProgress {
  service: string;
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

const getProgressColor = (rate: number) => {
  if (rate >= 80) return "success";
  if (rate >= 50) return "warning";
  return "error";
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-muted uppercase mb-1.5">
            Progression par Service
          </p>
          <p class="text-sm text-muted">Taux de participation</p>
        </div>
        <UIcon name="i-lucide-briefcase" class="text-2xl text-primary" />
      </div>
    </template>

    <div v-if="pending" class="space-y-4">
      <div v-for="i in 3" :key="i" class="space-y-2">
        <div class="flex items-center justify-between">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-4 w-12" />
        </div>
        <USkeleton class="h-2 w-full rounded-full" />
      </div>
    </div>

    <div v-else-if="services.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
      <p class="text-sm text-muted">Aucun service disponible</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="service in services"
        :key="service.service"
        class="space-y-2"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium">{{ service.service }}</p>
            <p class="text-xs text-muted">
              ({{ service.activeAgents }}/{{ service.totalAgents }})
            </p>
          </div>
          <UBadge
            :color="getProgressColor(service.participationRate)"
            variant="subtle"
          >
            {{ service.participationRate }}%
          </UBadge>
        </div>

        <UProgress
          :value="service.participationRate"
          :color="getProgressColor(service.participationRate)"
          size="sm"
          animation="none"
        />
      </div>
    </div>
  </UCard>
</template>
