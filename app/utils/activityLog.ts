// Journal d'activité : action/objet_type sont dérivés génériquement côté API
// (intercepteur global, voir activity-log.interceptor.ts) — une liste figée
// de libellés côté client se désynchronise vite. Ces helpers humanisent les
// valeurs réelles plutôt que de maintenir une liste séparée.

const KNOWN_OBJET_TYPE_LABELS: Record<string, string> = {
  agents: "Agent",
  directions: "Direction",
  departements: "Département",
  roles: "Rôle",
  "user-roles": "Attribution de rôle",
  tags: "Catégorie",
  cours: "Cours",
  documents: "Document",
  modules: "Module",
  quiz: "Quiz",
  questions: "Question",
  reponses: "Réponse",
  "autorite-superieures": "Autorité supérieure",
  session: "Session",
};

export function formatObjetTypeLabel(type: string | null | undefined): string {
  if (!type) return "-";
  return KNOWN_OBJET_TYPE_LABELS[type] || capitalizeWords(type.replace(/-/g, " "));
}

export function formatActionLabel(action: string): string {
  return capitalizeWords(action);
}

function capitalizeWords(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function actionVerbStyle(action: string): {
  color: "success" | "warning" | "error" | "info" | "neutral";
  icon: string;
} {
  if (action.startsWith("création")) {
    return { color: "info", icon: "i-lucide-circle-plus" };
  }
  if (action.startsWith("modification")) {
    return { color: "warning", icon: "i-lucide-pencil" };
  }
  if (action.startsWith("suppression")) {
    return { color: "error", icon: "i-lucide-trash-2" };
  }
  return { color: "neutral", icon: "i-lucide-activity" };
}

export function objetTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    agents: "i-lucide-user",
    directions: "i-heroicons-building-office",
    departements: "i-lucide-building-2",
    roles: "i-lucide-shield",
    "user-roles": "i-lucide-shield-check",
    tags: "i-lucide-tag",
    cours: "i-lucide-book-open",
    documents: "i-lucide-file-text",
    modules: "i-lucide-layers",
    quiz: "i-lucide-circle-question-mark",
    session: "i-lucide-key-round",
  };
  return icons[type] || "i-lucide-box";
}
