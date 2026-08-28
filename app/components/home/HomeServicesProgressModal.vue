<script setup lang="ts">
interface ServiceProgress {
  departement: string;
  totalAgents: number;
  activeAgents: number;
  participationRate: number;
}

const props = defineProps<{
  services: ServiceProgress[];
}>();

const open = defineModel<boolean>("open", { default: false });

const search = ref("");

// Réinitialise la recherche à chaque réouverture — pas de raison de garder
// un filtre d'une session de consultation précédente.
watch(open, (isOpen) => {
  if (isOpen) search.value = "";
});

const filteredServices = computed(() => {
  const sorted = [...props.services].sort(
    (a, b) => b.participationRate - a.participationRate
  );
  if (!search.value.trim()) return sorted;

  const query = search.value.trim().toLowerCase();
  return sorted.filter((s) => s.departement.toLowerCase().includes(query));
});

function rateColor(rate: number) {
  if (rate >= 75) return "success";
  if (rate >= 40) return "warning";
  return "error";
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Participation par département"
    description="Part des agents ayant démarré au moins un module"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <UInput
          v-model="search"
          placeholder="Rechercher un département..."
          icon="i-lucide-search"
          class="w-full"
          autofocus
        />

        <div class="space-y-4 max-h-100 overflow-y-auto pr-1">
          <div
            v-for="service in filteredServices"
            :key="service.departement"
          >
            <div class="flex items-center justify-between mb-1.5">
              <p class="text-sm font-medium truncate">
                {{ service.departement }}
              </p>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs text-muted">
                  {{ service.activeAgents }}/{{ service.totalAgents }}
                </span>
                <UBadge
                  :color="rateColor(service.participationRate)"
                  variant="subtle"
                  size="xs"
                >
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

          <div
            v-if="filteredServices.length === 0"
            class="text-center py-8 text-muted"
          >
            <UIcon name="i-lucide-search-x" class="mx-auto mb-2 text-3xl" />
            <p class="text-sm">Aucun département ne correspond à « {{ search }} »</p>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-default pt-3">
          <p class="text-xs text-muted">
            {{ filteredServices.length }} / {{ services.length }} département(s)
          </p>
          <UButton
            label="Fermer"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
