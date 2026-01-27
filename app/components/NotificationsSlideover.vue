<script setup lang="ts">
const { isNotificationsSlideoverOpen } = useDashboard();
const { hasAnyRole } = useAuth();

interface Activity {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  objectType: string | null;
  objectId: string | null;
  meta: any;
}

const isAdmin = computed(() => hasAnyRole(["ADMIN", "SUPERADMIN"]));

const {
  data: activities,
  pending,
  refresh,
} = await useFetch<Activity[]>("/api/activity/recent", {
  query: { limit: 20 },
  lazy: true,
  immediate: false,
  server: false,
});

// Charger les activités quand le slideover s'ouvre
watch(
  isNotificationsSlideoverOpen,
  async (isOpen) => {
    if (isOpen && isAdmin.value) {
      await refresh();
    }
  },
  { immediate: true }
);

// Fonction pour formater l'action en français
function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    agent_cree: "Agent créé",
    agent_modifie: "Agent modifié",
    agent_supprime: "Agent supprimé",
    agent_password_reset: "Mot de passe réinitialisé",
    module_cree: "Module créé",
    module_modifie: "Module modifié",
    module_supprime: "Module supprimé",
    module_publie: "Module publié",
    module_depublie: "Module dépublié",
    module_republie: "Module republié",
    permission_attribuee: "Permission attribuée",
    permission_retiree: "Permission retirée",
    role_attribue: "Rôle attribué",
    connexion_agent: "Connexion",
  };

  return actionMap[action] || action;
}

// Fonction pour obtenir l'icône selon le type d'action
function getActionIcon(action: string): string {
  if (action.includes("cree") || action.includes("attribue")) return "i-lucide-plus-circle";
  if (action.includes("modifie")) return "i-lucide-edit";
  if (action.includes("supprime") || action.includes("retire")) return "i-lucide-trash-2";
  if (action.includes("publie")) return "i-lucide-upload";
  if (action.includes("depublie")) return "i-lucide-arrow-down";
  if (action.includes("connexion")) return "i-lucide-log-in";
  if (action.includes("password")) return "i-lucide-key-round";
  return "i-lucide-activity";
}

// Fonction pour obtenir la couleur selon le type d'action
function getActionColor(action: string): string {
  if (action.includes("cree") || action.includes("attribue") || action.includes("publie")) return "success";
  if (action.includes("modifie")) return "warning";
  if (action.includes("supprime") || action.includes("retire") || action.includes("depublie")) return "error";
  if (action.includes("connexion")) return "info";
  return "neutral";
}

// Fonction pour formater le temps relatif
function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return then.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Activités récentes"
    description="Dernières actions effectuées sur la plateforme"
    :ui="{ width: 'max-w-md' }"
  >
    <template #body>
      <div v-if="!isAdmin" class="flex flex-col items-center justify-center h-full text-center p-8">
        <UIcon name="i-lucide-shield-alert" class="text-5xl text-muted mb-4" />
        <p class="text-muted">
          Les notifications sont réservées aux administrateurs
        </p>
      </div>

      <div v-else-if="pending" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex gap-3">
          <USkeleton class="w-10 h-10 rounded-full" />
          <div class="flex-1 space-y-2">
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="h-3 w-1/2" />
          </div>
        </div>
      </div>

      <div
        v-else-if="!activities || activities.length === 0"
        class="flex flex-col items-center justify-center h-full text-center p-8"
      >
        <UIcon name="i-lucide-inbox" class="text-5xl text-muted mb-4" />
        <p class="text-muted">Aucune activité récente</p>
      </div>

      <div v-else class="space-y-1">
        <div
          v-for="activity in activities"
          :key="activity.id"
          class="flex gap-3 p-3 rounded-lg hover:bg-elevated/50 transition-colors"
        >
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            :class="`bg-${getActionColor(activity.action)}/10`"
          >
            <UIcon
              :name="getActionIcon(activity.action)"
              :class="`text-${getActionColor(activity.action)}`"
            />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-medium">
                {{ formatAction(activity.action) }}
              </p>
              <span class="text-xs text-muted shrink-0">
                {{ timeAgo(activity.timestamp) }}
              </span>
            </div>

            <p class="text-xs text-muted mt-1">
              par {{ activity.user }}
            </p>

            <div
              v-if="activity.meta && Object.keys(activity.meta).length > 0"
              class="mt-2"
            >
              <p
                v-if="activity.meta.titre"
                class="text-xs text-muted truncate"
              >
                {{ activity.meta.titre }}
              </p>
              <p
                v-else-if="activity.meta.agent_cree"
                class="text-xs text-muted truncate"
              >
                {{ activity.meta.agent_cree.prenom }}
                {{ activity.meta.agent_cree.nom }}
              </p>
              <p
                v-else-if="activity.meta.nom_complet"
                class="text-xs text-muted truncate"
              >
                {{ activity.meta.nom_complet }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between items-center">
        <UButton
          label="Actualiser"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          size="sm"
          :loading="pending"
          @click="refresh"
        />
        <UButton
          label="Fermer"
          color="neutral"
          variant="outline"
          size="sm"
          @click="isNotificationsSlideoverOpen = false"
        />
      </div>
    </template>
  </USlideover>
</template>
