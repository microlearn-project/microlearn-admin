<script setup lang="ts">
interface RecentModule {
  id_module: string;
  titre: string;
  publish_at: string;
  timeAgo: string;
}

const { data: modules, pending } = await useFetch<RecentModule[]>(
  "/api/dashboard/recent-modules",
  {
    lazy: true,
    default: () => [],
  }
);
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-muted uppercase mb-1.5">Modules Récents</p>
          <p class="text-sm text-muted">Récemment publiés</p>
        </div>
        <UIcon name="i-lucide-clock" class="text-2xl text-info" />
      </div>
    </template>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 5" :key="i" class="flex items-start gap-3">
        <USkeleton class="w-2 h-2 rounded-full mt-1.5" />
        <div class="flex-1 space-y-2">
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-3 w-16" />
        </div>
      </div>
    </div>

    <div v-else-if="modules.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
      <p class="text-sm text-muted">Aucun module récent</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="module in modules"
        :key="module.id_module"
        class="flex items-start gap-3 group hover:bg-elevated/50 -mx-4 px-4 py-2 rounded-lg transition-colors"
      >
        <div class="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
        <div class="flex-1 min-w-0">
          <NuxtLink
            :to="`/modules/edit/${module.id_module}`"
            class="text-sm font-medium group-hover:text-primary transition-colors block truncate"
          >
            {{ module.titre }}
          </NuxtLink>
          <p class="text-xs text-muted mt-1">{{ module.timeAgo }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-center">
        <UButton
          label="Voir tous les modules"
          variant="ghost"
          color="neutral"
          size="sm"
          trailing-icon="i-lucide-arrow-right"
          to="/modules"
        />
      </div>
    </template>
  </UCard>
</template>
