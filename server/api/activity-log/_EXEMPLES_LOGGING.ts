// ============================================
// EXEMPLES DE LOGGING POUR LES AUTRES ENDPOINTS
// ============================================
// Ce fichier montre comment ajouter le logging aux endpoints existants
// Copie ces modifications dans tes fichiers correspondants

// ============================================
// 1. CATÉGORIES (tag)
// ============================================

// Dans addtag.post.ts - Ajoute ces imports en haut :
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

// Après la création réussie, ajoute :
/*
const session = getUserSession(event);
await logActivity({
  user_id: session?.user?.id_agent || null,
  action: "categorie_creee",
  objet_type: "tag",
  objet_id: data.id_tag,
  meta: {
    designation: data.designation,
  },
});
*/

// Dans soft-delete.patch.ts (tag) :
/*
const session = getUserSession(event);
// Récupérer les infos avant suppression
const { data: existing } = await supabase
  .from("tag")
  .select("*")
  .eq("id_tag", id)
  .single();

// Après la suppression réussie :
await logActivity({
  user_id: session?.user?.id_agent || null,
  action: "categorie_supprimee",
  objet_type: "tag",
  objet_id: id,
  meta: {
    designation: existing?.designation,
  },
});
*/

// ============================================
// 2. SERVICES
// ============================================

// Dans addservice.post.ts :
/*
const session = getUserSession(event);
await logActivity({
  user_id: session?.user?.id_agent || null,
  action: "service_cree",
  objet_type: "service",
  objet_id: data.id_service,
  meta: {
    designation: data.designation,
  },
});
*/

// Dans soft-delete.patch.ts (service) :
/*
const session = getUserSession(event);
await logActivity({
  user_id: session?.user?.id_agent || null,
  action: "service_supprime",
  objet_type: "service",
  objet_id: id,
  meta: {
    designation: existing?.designation,
  },
});
*/

// ============================================
// 3. DÉPARTEMENTS
// ============================================

// Dans adddepartement.post.ts :
/*
const session = getUserSession(event);
await logActivity({
  user_id: session?.user?.id_agent || null,
  action: "departement_cree",
  objet_type: "departement",
  objet_id: data.id_departement,
  meta: {
    designation: data.designation,
  },
});
*/

// Dans soft-delete.patch.ts (departement) :
/*
const session = getUserSession(event);
await logActivity({
  user_id: session?.user?.id_agent || null,
  action: "departement_supprime",
  objet_type: "departement",
  objet_id: id,
  meta: {
    designation: existing?.designation,
  },
});
*/

// ============================================
// 4. UPDATE user_role
// ============================================

// Dans user-role/update.patch.ts, ajoute après la mise à jour :
/*
const session = getUserSession(event);

// Récupérer les infos complètes
const { data: updated } = await supabase
  .from("user_role")
  .select(`
    *,
    agent:id_agent (id_agent, code_agent, nom, prenom),
    role:id_role (id_role, designation)
  `)
  .eq("id_user_role", id)
  .single();

await logActivity({
  user_id: session?.user?.id_agent || null,
  action: "role_modifie",
  objet_type: "user_role",
  objet_id: id,
  meta: {
    agent_cible: {
      id: updated.agent?.id_agent,
      code_agent: updated.agent?.code_agent,
      nom: updated.agent?.nom,
      prenom: updated.agent?.prenom,
    },
    role: {
      id: updated.role?.id_role,
      designation: updated.role?.designation,
    },
    modifications: {
      date_from,
      date_to,
      valide,
    },
  },
});
*/

export default {};
