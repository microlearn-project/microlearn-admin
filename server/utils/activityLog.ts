// server/utils/activityLog.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export type ActivityAction =
  | "connexion"
  | "deconnexion"
  | "agent_cree"
  | "role_attribue"
  | "role_modifie"
  | "role_revoque"
  | "role_supprime"
  | "categorie_creee"
  | "categorie_supprimee"
  | "service_cree"
  | "service_supprime"
  | "departement_cree"
  | "module_telechargeable_active"
  | "module_telechargeable_desactive"
  | "module_publie"
  | "module_depublie"
  | "module_cree"
  | "module_modifie"
  | "module_supprime"
  | "module_republie"
  | "agent_password_reset"
  | "departement_supprime";

export type ObjetType =
  | "agent"
  | "user_role"
  | "tag"
  | "service"
  | "departement"
  | "session"
  | "module"
  | null;

export interface ActivityLogEntry {
  user_id: string | null;
  action: ActivityAction;
  objet_type: ObjetType;
  objet_id: string | null;
  meta: Record<string, any> | null;
}

/**
 * Enregistre une activité dans le journal
 */
export async function logActivity(entry: ActivityLogEntry): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();

    await supabase.from("activity_log").insert({
      user_id: entry.user_id,
      action: entry.action,
      objet_type: entry.objet_type,
      objet_id: entry.objet_id,
      meta: entry.meta,
    });
  } catch  {
    // On ne veut pas que le logging fasse échouer l'action principale

  }
}

/**
 * Helper pour logger une connexion
 */
export async function logConnexion(
  userId: string,
  userInfo: { code_agent: string; nom: string; prenom: string; email: string }
): Promise<void> {
  await logActivity({
    user_id: userId,
    action: "connexion",
    objet_type: "session",
    objet_id: null,
    meta: {
      code_agent: userInfo.code_agent,
      nom: userInfo.nom,
      prenom: userInfo.prenom,
      email: userInfo.email,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Helper pour logger une déconnexion
 */
export async function logDeconnexion(
  userId: string,
  userInfo: { code_agent: string; nom: string; prenom: string }
): Promise<void> {
  await logActivity({
    user_id: userId,
    action: "deconnexion",
    objet_type: "session",
    objet_id: null,
    meta: {
      code_agent: userInfo.code_agent,
      nom: userInfo.nom,
      prenom: userInfo.prenom,
      timestamp: new Date().toISOString(),
    },
  });
}
