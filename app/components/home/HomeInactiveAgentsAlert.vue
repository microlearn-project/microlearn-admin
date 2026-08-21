<script setup lang="ts">
interface InactiveAgent {
  id_agent: string;
  code_agent: string;
  nom: string;
  prenom: string;
  last_login: string | null;
  created_at: string;
  departement: { designation: string } | null;
}

interface InactiveAgentsResponse {
  total: number;
  agents: InactiveAgent[];
}

const { data, pending } = await useFetch<InactiveAgentsResponse>(
  "/api/dashboard/inactive-agents",
  {
    lazy: true,
    default: () => ({ total: 0, agents: [] }),
  }
);

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <UCard v-if="pending || data.total > 0">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-muted uppercase mb-1.5">
            Agents jamais actifs
          </p>
          <p class="text-sm text-muted">
            N'ont commencé aucun module depuis leur création
          </p>
        </div>
        <UIcon name="i-lucide-user-x" class="text-2xl text-warning" />
      </div>
    </template>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="flex items-center gap-3">
        <USkeleton class="w-8 h-8 rounded-full" />
        <USkeleton class="h-4 flex-1" />
      </div>
    </div>

    <div v-else class="space-y-3">
      <p class="text-sm text-muted">
        <span class="font-semibold text-highlighted">{{ data.total }}</span>
        agent(s) actif(s) concerné(s)
        <span v-if="data.total > data.agents.length">
          — {{ data.agents.length }} plus anciens affichés
        </span>
      </p>

      <div
        v-for="agent in data.agents"
        :key="agent.id_agent"
        class="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-elevated/50 transition-colors"
      >
        <div
          class="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-warning font-medium text-xs shrink-0"
        >
          {{ agent.prenom[0] }}{{ agent.nom[0] }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">
            {{ agent.prenom }} {{ agent.nom }}
            <span class="text-xs text-muted">({{ agent.code_agent }})</span>
          </p>
          <p class="text-xs text-muted truncate">
            {{ agent.departement?.designation || "N/A" }} · créé le
            {{ formatDate(agent.created_at) }}
          </p>
        </div>
        <UBadge
          :color="agent.last_login ? 'neutral' : 'error'"
          variant="subtle"
          size="xs"
          class="shrink-0"
        >
          {{ agent.last_login ? "Déjà connecté" : "Jamais connecté" }}
        </UBadge>
      </div>

      <UButton
        v-if="data.total > 0"
        label="Voir tous les agents"
        icon="i-lucide-users"
        variant="link"
        size="sm"
        to="/agents"
        class="px-0"
      />
    </div>
  </UCard>
</template>
