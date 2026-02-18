<script setup lang="ts">
const { isNotificationsSlideoverOpen } = useDashboard();
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Tableau de Bord" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Stats principales (rapide - 1-2 requêtes) -->
        <HomeStatsUtb />

        <!-- Top modules (rapide - ~5 requêtes) -->
        <HomeTopModules />

        <!-- Actions rapides (aucune requête) -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Actions rapides</h3>
              <UIcon name="i-lucide-zap" class="text-warning" />
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <UButton
              label="Gérer les modules"
              icon="i-lucide-book-open"
              size="lg"
              color="primary"
              variant="outline"
              to="/modules"
              block
            />

            <UButton
              label="Voir les agents"
              icon="i-lucide-users"
              size="lg"
              color="neutral"
              variant="outline"
              to="/agents"
              block
            />

            <UButton
              label="Résultats des quiz"
              icon="i-lucide-bar-chart-3"
              size="lg"
              color="neutral"
              variant="outline"
              to="/quiz-results"
              block
            />

            <UButton
              label="Les départements"
              icon="i-heroicons-squares-2x2"
              size="lg"
              color="neutral"
              variant="outline"
              to="/services"
              block
            />
          </div>
        </UCard>

        <!-- Statistiques de la semaine (aucune requête supplémentaire si déjà dans HomeStatsUtb) -->
        <UCard>
          <HomeWeeklyOverview />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
