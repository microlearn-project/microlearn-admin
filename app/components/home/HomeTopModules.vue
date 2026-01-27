<script setup lang="ts">
interface TopModule {
  id_module: string;
  titre: string;
  participants: number;
}

const { data: modules, pending } = await useFetch<TopModule[]>(
  "/api/dashboard/top-modules",
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
          <p class="text-xs text-muted uppercase mb-1.5">Top 5 Modules</p>
          <p class="text-sm text-muted">Les plus suivis</p>
        </div>
        <UIcon name="i-lucide-flame" class="text-2xl text-warning" />
      </div>
    </template>

    <div v-if="pending" class="space-y-4">
      <div v-for="i in 5" :key="i" class="flex items-center justify-between">
        <div class="flex items-center gap-3 flex-1">
          <USkeleton class="w-6 h-6 rounded-full" />
          <USkeleton class="h-4 w-3/4" />
        </div>
        <USkeleton class="w-12 h-6 rounded" />
      </div>
    </div>

    <div v-else-if="modules.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-2" />
      <p class="text-sm text-muted">Aucun module disponible</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="(module, index) in modules"
        :key="module.id_module"
        class="flex items-center justify-between group hover:bg-elevated/50 -mx-4 px-4 py-2 rounded-lg transition-colors"
      >
        <div class="flex items-center gap-3 flex-1">
          <div
            class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            :class="{
              'bg-warning/20 text-warning': index === 0,
              'bg-neutral/20 text-neutral': index === 1,
              'bg-primary/20 text-primary': index === 2,
              'bg-muted/20 text-muted': index > 2,
            }"
          >
            {{ index + 1 }}
          </div>
          <NuxtLink
            :to="`/modules/edit/${module.id_module}`"
            class="text-sm font-medium group-hover:text-primary transition-colors truncate"
          >
            {{ module.titre }}
          </NuxtLink>
        </div>
        <UBadge color="primary" variant="subtle" class="shrink-0">
          {{ module.participants }}
        </UBadge>
      </div>
    </div>
  </UCard>
</template>
