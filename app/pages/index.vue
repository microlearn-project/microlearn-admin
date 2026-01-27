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
        <HomeStatsUtb />

        <HomeActivityChart />

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HomeTopModules />
          <HomeRecentModules />
        </div>

        <HomeServicesProgress />
      </div>
    </template>
  </UDashboardPanel>
</template>
