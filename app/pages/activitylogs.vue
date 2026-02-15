<script setup lang="ts">
import { h, resolveComponent } from "vue";

const toast = useToast();

// État
const loading = ref(true);
const logs = ref<any[]>([]);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});
const stats = ref({
  total: 0,
  today: 0,
  connexions_today: 0,
  top_actions: [] as { action: string; count: number }[],
});

// Filtres
const filters = ref({
  action: null as string | null,
  objet_type: null as string | null,
  search: "",
});

// Modals de sélection
const showActionSelectModal = ref(false);
const showTypeSelectModal = ref(false);

// Modal détail
const showDetailModal = ref(false);
const selectedLog = ref<any>(null);

// Options de filtre pour l'affichage
const actionOptions = [
  { label: "Connexion", value: "connexion" },
  { label: "Déconnexion", value: "deconnexion" },
  { label: "Agent créé", value: "agent_cree" },
  { label: "Rôle attribué", value: "role_attribue" },
  { label: "Rôle modifié", value: "role_modifie" },
  { label: "Rôle révoqué", value: "role_revoque" },
  { label: "Rôle supprimé", value: "role_supprime" },
  { label: "Catégorie créée", value: "categorie_creee" },
  { label: "Catégorie supprimée", value: "categorie_supprimee" },
  { label: "Service créé", value: "service_cree" },
  { label: "Service supprimé", value: "service_supprime" },
  { label: "Département créé", value: "departement_cree" },
  { label: "Département supprimé", value: "departement_supprime" },
];

const objetTypeOptions = [
  { label: "Agent", value: "agent" },
  { label: "User Role", value: "user_role" },
  { label: "Session", value: "session" },
  { label: "Catégorie", value: "tag" },
  { label: "Service", value: "service" },
  { label: "Département", value: "departement" },
];

// Handlers de sélection
function handleActionSelect(action: string) {
  filters.value.action = action;
}

function clearActionFilter() {
  filters.value.action = null;
}

function handleTypeSelect(type: string) {
  filters.value.objet_type = type;
}

function clearTypeFilter() {
  filters.value.objet_type = null;
}

// Récupérer le label d'une action
const selectedActionLabel = computed(() => {
  if (!filters.value.action) return null;
  return actionOptions.find(a => a.value === filters.value.action)?.label || filters.value.action;
});

// Récupérer le label d'un type
const selectedTypeLabel = computed(() => {
  if (!filters.value.objet_type) return null;
  return objetTypeOptions.find(t => t.value === filters.value.objet_type)?.label || filters.value.objet_type;
});

// Vérifier si des filtres sont actifs
const hasActiveFilters = computed(() => {
  return filters.value.action !== null || filters.value.objet_type !== null || filters.value.search !== "";
});

// Charger les logs
async function loadLogs() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (filters.value.action) {
      params.append("action", filters.value.action);
    }
    if (filters.value.objet_type) {
      params.append("objet_type", filters.value.objet_type);
    }

    const response = await $fetch<any>(`/api/activity-log?${params}`);
    logs.value = response.data;
    pagination.value = response.pagination;
  } catch {
    toast.add({
      title: "Erreur",
      description: "Impossible de charger les logs",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Charger les stats
async function loadStats() {
  try {
    stats.value = await $fetch("/api/activity-log/stats");
  } catch {
    // Erreur silencieuse - les stats ne sont pas critiques
  }
}

// Ouvrir le modal de détail
function openDetail(log: any) {
  selectedLog.value = log;
  showDetailModal.value = true;
}

// Formater la date
function formatDate(date: string) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Formater l'action pour l'affichage
function formatAction(action: string) {
  const labels: Record<string, string> = {
    connexion: "Connexion",
    deconnexion: "Déconnexion",
    agent_cree: "Agent créé",
    role_attribue: "Rôle attribué",
    role_modifie: "Rôle modifié",
    role_revoque: "Rôle révoqué",
    role_supprime: "Rôle supprimé",
    categorie_creee: "Catégorie créée",
    categorie_supprimee: "Catégorie supprimée",
    service_cree: "Service créé",
    service_supprime: "Service supprimé",
    departement_cree: "Département créé",
    departement_supprime: "Département supprimé",
  };
  return labels[action] || action;
}

// Couleur du badge selon l'action
function getActionColor(
  action: string
): "success" | "neutral" | "info" | "error" | "warning" {
  if (action === "connexion") return "success";
  if (action === "deconnexion") return "neutral";
  if (action.includes("cree") || action.includes("attribue")) return "info";
  if (action.includes("supprime") || action.includes("revoque")) return "error";
  if (action.includes("modifie")) return "warning";
  return "neutral";
}

// Icône selon l'action
function getActionIcon(action: string) {
  if (action === "connexion") return "i-lucide-log-in";
  if (action === "deconnexion") return "i-lucide-log-out";
  if (action.includes("agent")) return "i-lucide-user-plus";
  if (action.includes("role")) return "i-lucide-shield";
  if (action.includes("categorie")) return "i-lucide-tag";
  if (action.includes("service")) return "i-lucide-briefcase";
  if (action.includes("departement")) return "i-lucide-building-2";
  return "i-lucide-activity";
}

// Colonnes du tableau
const UBadge = resolveComponent("UBadge");
const UIcon = resolveComponent("UIcon");
const UButton = resolveComponent("UButton");

const columns = [
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }: any) =>
      h("span", { class: "text-sm" }, formatDate(row.original.created_at)),
  },
  {
    accessorKey: "agent",
    header: "Utilisateur",
    cell: ({ row }: any) => {
      const agent = row.original.agent;
      if (agent) {
        return h("div", { class: "flex items-center gap-2" }, [
          h(
            "div",
            {
              class:
                "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs",
            },
            `${agent.prenom[0]}${agent.nom[0]}`
          ),
          h("div", {}, [
            h(
              "p",
              { class: "font-medium text-sm" },
              `${agent.prenom} ${agent.nom}`
            ),
            h("p", { class: "text-xs text-muted" }, agent.code_agent),
          ]),
        ]);
      }
      return h("span", { class: "text-muted text-sm" }, "Système");
    },
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }: any) => {
      const action = row.original.action;
      return h(
        UBadge,
        {
          color: getActionColor(action),
          variant: "subtle",
          class: "gap-1",
        },
        () => [
          h(UIcon, { name: getActionIcon(action), class: "text-xs" }),
          formatAction(action),
        ]
      );
    },
  },
  {
    accessorKey: "objet_type",
    header: "Type",
    cell: ({ row }: any) =>
      h(
        "span",
        { class: "text-sm text-muted capitalize" },
        row.original.objet_type || "-"
      ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }: any) =>
      h(UButton, {
        icon: "i-lucide-eye",
        color: "neutral",
        variant: "ghost",
        size: "sm",
        onClick: () => openDetail(row.original),
      }),
  },
];

// Logs filtrés
const filteredLogs = computed(() => {
  if (!filters.value.search) return logs.value;

  const search = filters.value.search.toLowerCase();
  return logs.value.filter((log) => {
    const agentName = log.agent
      ? `${log.agent.prenom} ${log.agent.nom}`.toLowerCase()
      : "";
    const agentCode = log.agent?.code_agent?.toLowerCase() || "";
    return (
      agentName.includes(search) ||
      agentCode.includes(search) ||
      log.action.includes(search)
    );
  });
});

// Changer de page
function changePage(newPage: number) {
  pagination.value.page = newPage;
  loadLogs();
}

// Réinitialiser tous les filtres
function resetAllFilters() {
  filters.value.action = null;
  filters.value.objet_type = null;
  filters.value.search = "";
}

// Watcher sur les filtres
watch(
  () => [filters.value.action, filters.value.objet_type],
  () => {
    pagination.value.page = 1;
    loadLogs();
  }
);

// Charger au montage
onMounted(() => {
  loadLogs();
  loadStats();
});
</script>

<template>
  <UDashboardPanel id="activitylogs">
    <template #header>
      <UDashboardNavbar title="Journal d'activité">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="loading"
            @click="
              loadLogs();
              loadStats();
            "
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Modals de sélection -->
      <DocumentsActivityLogActionSelectModal
        v-model:open="showActionSelectModal"
        v-model:selected-action="filters.action"
        @select="handleActionSelect"
        @clear="clearActionFilter"
      />

      <DocumentsActivityLogTypeSelectModal
        v-model:open="showTypeSelectModal"
        v-model:selected-type="filters.objet_type"
        @select="handleTypeSelect"
        @clear="clearTypeFilter"
      />

      <div class="p-4 sm:p-6 space-y-6">
        <!-- Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-elevated border border-default rounded-lg p-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary/10 rounded-lg">
                <UIcon name="i-lucide-activity" class="text-primary text-xl" />
              </div>
              <div>
                <p class="text-2xl font-bold">{{ stats.total }}</p>
                <p class="text-sm text-muted">Total activités</p>
              </div>
            </div>
          </div>

          <div class="bg-elevated border border-default rounded-lg p-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-info/10 rounded-lg">
                <UIcon name="i-lucide-calendar" class="text-info text-xl" />
              </div>
              <div>
                <p class="text-2xl font-bold">{{ stats.today }}</p>
                <p class="text-sm text-muted">Aujourd'hui</p>
              </div>
            </div>
          </div>

          <div class="bg-elevated border border-default rounded-lg p-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-success/10 rounded-lg">
                <UIcon name="i-lucide-log-in" class="text-success text-xl" />
              </div>
              <div>
                <p class="text-2xl font-bold">{{ stats.connexions_today }}</p>
                <p class="text-sm text-muted">Connexions aujourd'hui</p>
              </div>
            </div>
          </div>

          <div class="bg-elevated border border-default rounded-lg p-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-warning/10 rounded-lg">
                <UIcon
                  name="i-lucide-trending-up"
                  class="text-warning text-xl"
                />
              </div>
              <div>
                <p class="text-2xl font-bold">
                  {{
                    stats.top_actions[0]?.action
                      ? formatAction(stats.top_actions[0].action)
                      : "-"
                  }}
                </p>
                <p class="text-sm text-muted">Action la plus fréquente</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtres -->
        <div class="bg-elevated border border-default rounded-lg p-4">
          <div class="space-y-4">
            <!-- Ligne 1 : Recherche et filtres -->
            <div class="flex flex-wrap items-center gap-4">
              <UInput
                v-model="filters.search"
                placeholder="Rechercher un utilisateur..."
                icon="i-lucide-search"
                class="flex-1 min-w-64"
                :ui="{ icon: { trailing: { pointer: '' } } }"
              >
                <template v-if="filters.search" #trailing>
                  <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="2xs"
                    @click="filters.search = ''"
                  />
                </template>
              </UInput>

              <!-- Filtre par action avec modal -->
              <div class="flex items-center gap-2">
                <UButton
                  :label="selectedActionLabel || 'Filtrer par action'"
                  :icon="filters.action ? 'i-lucide-filter-check' : 'i-lucide-filter'"
                  :color="filters.action ? 'primary' : 'neutral'"
                  variant="outline"
                  class="min-w-48 justify-start"
                  truncate
                  @click="showActionSelectModal = true"
                />

                <UButton
                  v-if="filters.action"
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  square
                  @click="clearActionFilter"
                />
              </div>

              <!-- Filtre par type avec modal -->
              <div class="flex items-center gap-2">
                <UButton
                  :label="selectedTypeLabel || 'Filtrer par type'"
                  :icon="filters.objet_type ? 'i-lucide-layers' : 'i-lucide-layers-2'"
                  :color="filters.objet_type ? 'primary' : 'neutral'"
                  variant="outline"
                  class="min-w-48 justify-start"
                  truncate
                  @click="showTypeSelectModal = true"
                />

                <UButton
                  v-if="filters.objet_type"
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  square
                  @click="clearTypeFilter"
                />
              </div>
            </div>

            <!-- Ligne 2 : Bouton de réinitialisation et badges -->
            <div v-if="hasActiveFilters" class="flex flex-wrap items-center gap-3 pt-2 border-t border-default">
              <p class="text-xs text-muted">Filtres actifs :</p>

              <UBadge
                v-if="filters.action"
                color="primary"
                variant="subtle"
                size="xs"
              >
                Action: {{ selectedActionLabel }}
              </UBadge>

              <UBadge
                v-if="filters.objet_type"
                color="info"
                variant="subtle"
                size="xs"
              >
                Type: {{ selectedTypeLabel }}
              </UBadge>

              <UBadge
                v-if="filters.search"
                color="success"
                variant="subtle"
                size="xs"
              >
                Recherche: "{{ filters.search }}"
              </UBadge>

              <UButton
                label="Réinitialiser"
                icon="i-lucide-rotate-ccw"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="resetAllFilters"
              />
            </div>
          </div>
        </div>

        <!-- Tableau -->
        <div
          class="bg-elevated border border-default rounded-lg overflow-hidden"
        >
          <UTable :columns="columns" :data="filteredLogs" :loading="loading">
            <template #empty>
              <div class="flex flex-col items-center justify-center py-12">
                <UIcon name="i-lucide-inbox" class="text-4xl text-muted mb-4" />
                <p class="text-muted">Aucune activité trouvée</p>
              </div>
            </template>
          </UTable>

          <!-- Pagination -->
          <div
            v-if="pagination.totalPages > 1"
            class="flex items-center justify-between px-4 py-3 border-t border-default"
          >
            <p class="text-sm text-muted">
              Page {{ pagination.page }} sur {{ pagination.totalPages }} ({{
                pagination.total
              }}
              activités)
            </p>
            <div class="flex gap-2">
              <UButton
                icon="i-lucide-chevron-left"
                color="neutral"
                variant="outline"
                size="sm"
                :disabled="pagination.page === 1"
                @click="changePage(pagination.page - 1)"
              />
              <UButton
                icon="i-lucide-chevron-right"
                color="neutral"
                variant="outline"
                size="sm"
                :disabled="pagination.page === pagination.totalPages"
                @click="changePage(pagination.page + 1)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Modal Détail -->
  <UModal v-model:open="showDetailModal" :description="`Détails de l'activité`">
    <template #content>
      <UCard v-if="selectedLog">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Détail de l'activité</h3>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="showDetailModal = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Infos générales -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-muted">Date</p>
              <p class="font-medium">
                {{ formatDate(selectedLog.created_at) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-muted">Action</p>
              <UBadge
                :color="getActionColor(selectedLog.action)"
                variant="subtle"
              >
                {{ formatAction(selectedLog.action) }}
              </UBadge>
            </div>
          </div>

          <!-- Utilisateur -->
          <div>
            <p class="text-sm text-muted mb-2">Utilisateur</p>
            <div
              v-if="selectedLog.agent"
              class="flex items-center gap-3 p-3 bg-muted/20 rounded-lg"
            >
              <div
                class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium"
              >
                {{ selectedLog.agent.prenom[0] }}{{ selectedLog.agent.nom[0] }}
              </div>
              <div>
                <p class="font-medium">
                  {{ selectedLog.agent.prenom }} {{ selectedLog.agent.nom }}
                </p>
                <p class="text-sm text-muted">{{ selectedLog.agent.email }}</p>
                <p class="text-xs text-muted">
                  Code: {{ selectedLog.agent.code_agent }}
                </p>
              </div>
            </div>
            <p v-else class="text-muted">Action système</p>
          </div>

          <!-- Type d'objet -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-muted">Type d'objet</p>
              <p class="font-medium capitalize">
                {{ selectedLog.objet_type || "-" }}
              </p>
            </div>
            <div>
              <p class="text-sm text-muted">ID de l'objet</p>
              <code
                v-if="selectedLog.objet_id"
                class="text-xs bg-muted/30 px-2 py-1 rounded"
              >
                {{ selectedLog.objet_id }}
              </code>
              <span v-else class="text-muted">-</span>
            </div>
          </div>

          <!-- Métadonnées -->
          <div
            v-if="selectedLog.meta && Object.keys(selectedLog.meta).length > 0"
          >
            <p class="text-sm text-muted mb-2">Détails supplémentaires</p>

            <!-- Box scrollable -->
            <div
              class="bg-muted/20 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto"
            >
              <template v-for="(value, key) in selectedLog.meta" :key="key">
                <div v-if="typeof value === 'object' && value !== null">
                  <p class="text-sm font-medium capitalize mb-2">
                    {{ String(key).replace(/_/g, " ") }}
                  </p>

                  <div class="pl-4 border-l-2 border-default space-y-1">
                    <div
                      v-for="(subValue, subKey) in value"
                      :key="subKey"
                      class="flex justify-between"
                    >
                      <span class="text-sm text-muted capitalize">
                        {{ String(subKey).replace(/_/g, " ") }}
                      </span>
                      <span class="text-sm font-medium">
                        {{ subValue }}
                      </span>
                    </div>
                  </div>
                </div>

                <div v-else class="flex justify-between">
                  <span class="text-sm text-muted capitalize">
                    {{ String(key).replace(/_/g, " ") }}
                  </span>
                  <span class="text-sm font-medium">
                    {{ value }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
