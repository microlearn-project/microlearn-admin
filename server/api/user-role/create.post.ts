// server/api/user-role/create.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";
import type { TablesInsert } from "~/types/database.types";

type UserRoleInsert = TablesInsert<"user_role">;

export default defineEventHandler(async (event) => {
  // Récupérer l'utilisateur connecté
  const session = getUserSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Non authentifié",
    });
  }

  const currentUserId = session.user.id_agent;
  const currentUserRole = session.user.role?.designation; // On récupère le rôle depuis la session

  const body = await readBody(event);
  const { id_agent, id_role, date_from, date_to } = body;

  // Validation
  if (!id_agent || !id_role) {
    throw createError({
      statusCode: 400,
      statusMessage: "Agent et rôle sont requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Vérifier que l'agent existe et est actif
  const { data: agent, error: agentError } = await supabase
    .from("agent")
    .select("id_agent, actif")
    .eq("id_agent", id_agent)
    .is("deleted_at", null)
    .single();

  if (agentError || !agent) {
    throw createError({
      statusCode: 404,
      statusMessage: "Agent non trouvé",
    });
  }

  if (!agent.actif) {
    throw createError({
      statusCode: 400,
      statusMessage: "Impossible d'attribuer un rôle à un agent inactif",
    });
  }

  // Vérifier que le rôle existe (on récupère aussi la designation)
  const { data: role, error: roleError } = await supabase
    .from("role")
    .select("id_role, designation")
    .eq("id_role", id_role)
    .single();

  if (roleError || !role) {
    throw createError({
      statusCode: 404,
      statusMessage: "Rôle non trouvé",
    });
  }

  // VÉRIFICATION CRITIQUE : Seul un SUPERADMIN peut attribuer le rôle SUPERADMIN
  if (role.designation === "SUPERADMIN") {
    if (currentUserRole !== "SUPERADMIN") {
      throw createError({
        statusCode: 403,
        statusMessage: "Seul un SUPERADMIN peut attribuer le rôle SUPERADMIN",
      });
    }
  }

  // Vérifier s'il n'y a pas déjà une attribution active pour ce rôle
  const { data: existing } = await supabase
    .from("user_role")
    .select("id_user_role")
    .eq("id_agent", id_agent)
    .eq("id_role", id_role)
    .eq("valide", true)
    .or("date_to.is.null,date_to.gte.now()")
    .maybeSingle();

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Cet agent possède déjà ce rôle actif",
    });
  }

  // Créer l'attribution avec l'ID de l'utilisateur connecté
  const payload: UserRoleInsert = {
    id_agent,
    id_role,
    granted_by: currentUserId,
    date_from: date_from || new Date().toISOString(),
    date_to: date_to || null,
    valide: true,
  };

  const { data, error } = await supabase
    .from("user_role")
    .insert(payload)
    .select(
      `
      *,
      agent:id_agent (
        id_agent,
        code_agent,
        nom,
        prenom,
        email
      ),
      role:id_role (
        id_role,
        designation
      ),
      granter:granted_by (
        id_agent,
        nom,
        prenom
      )
    `
    )
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Logger l'activité
  const agentData = data.agent as any;
  const roleData = data.role as any;

  await logActivity({
    user_id: currentUserId,
    action: "role_attribue",
    objet_type: "user_role",
    objet_id: data.id_user_role,
    meta: {
      agent_cible: {
        id: agentData.id_agent,
        code_agent: agentData.code_agent,
        nom: agentData.nom,
        prenom: agentData.prenom,
      },
      role: {
        id: roleData.id_role,
        designation: roleData.designation,
      },
      date_from: data.date_from,
      date_to: data.date_to,
      permanent: !data.date_to,
    },
  });

  return data;
});
