<script setup lang="ts">
import { format } from "date-fns";
import {
  VisXYContainer,
  VisLine,
  VisAxis,
  VisArea,
  VisCrosshair,
  VisTooltip,
} from "@unovis/vue";

interface ActivityData {
  date: string;
  started: number;
  completed: number;
}

const cardRef = useTemplateRef<HTMLElement | null>("cardRef");

const { width } = useElementSize(cardRef);

const { data, pending } = await useFetch<ActivityData[]>(
  "/api/dashboard/activity",
  {
    lazy: true,
    default: () => [],
  },
);

const parsedData = computed(() => {
  return data.value.map((item) => ({
    ...item,
    dateObj: new Date(item.date),
  }));
});

const x = (_: any, i: number) => i;
const yStarted = (d: any) => d.started;
const yCompleted = (d: any) => d.completed;

const total = computed(() => {
  const totalStarted = data.value.reduce((acc, item) => acc + item.started, 0);
  const totalCompleted = data.value.reduce(
    (acc, item) => acc + item.completed,
    0,
  );
  return { started: totalStarted, completed: totalCompleted };
});

const formatDate = (date: Date): string => {
  return format(date, "d MMM");
};

const xTicks = (i: number) => {
  if (i === 0 || i === parsedData.value.length - 1 || !parsedData.value[i]) {
    return "";
  }
  return formatDate(parsedData.value[i].dateObj);
};

const template = (d: any) => {
  return `
    <div style="padding: 8px;">
      <div style="font-weight: 600; margin-bottom: 4px;">${formatDate(d.dateObj)}</div>
      <div style="color: var(--ui-primary);">Commencés: ${d.started}</div>
      <div style="color: var(--ui-success);">Terminés: ${d.completed}</div>
    </div>
  `;
};
</script>

<template>
  <UCard
    ref="cardRef"
    :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }"
  >
    <template #header>
      <div>
        <p class="text-xs text-muted uppercase mb-1.5">Activité (30 jours)</p>
        <div class="flex items-center gap-4">
          <div>
            <p class="text-sm text-muted">Commencés</p>
            <p v-if="pending" class="text-2xl text-highlighted font-semibold">
              ---
            </p>
            <p v-else class="text-2xl text-highlighted font-semibold">
              {{ total.started }}
            </p>
          </div>
          <div>
            <p class="text-sm text-muted">Terminés</p>
            <p v-if="pending" class="text-2xl text-highlighted font-semibold">
              ---
            </p>
            <p v-else class="text-2xl text-highlighted font-semibold">
              {{ total.completed }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <div v-if="pending" class="h-96 flex items-center justify-center">
      <UIcon
        name="i-lucide-loader-2"
        class="animate-spin text-4xl text-muted"
      />
    </div>

    <VisXYContainer
      v-else
      :data="parsedData"
      :padding="{ top: 40 }"
      class="h-96"
      :width="width"
    >
      <VisLine :x="x" :y="yStarted" color="var(--ui-primary)" />
      <VisArea :x="x" :y="yStarted" color="var(--ui-primary)" :opacity="0.1" />

      <VisLine :x="x" :y="yCompleted" color="var(--ui-success)" />
      <VisArea
        :x="x"
        :y="yCompleted"
        color="var(--ui-success)"
        :opacity="0.1"
      />

      <VisAxis type="x" :x="x" :tick-format="xTicks" />

      <VisCrosshair color="var(--ui-primary)" :template="template" />

      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
