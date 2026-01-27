// server/api/auth/login.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { verifyPassword } from "~~/server/utils/password";
import { createSession, type SessionUser } from "~~/server/utils/session";
import { logConnexion } from "~~/server/utils/activityLog";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { identifier, password, loginType } = body;

  // Validation
  if (!identifier || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Identifiant et mot de passe requis",
    });
  }

  if (!loginType || !["email", "code"].includes(loginType)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Type de connexion invalide",
    });
  }

  const supabase = createSupabaseServerClient();

  // 1. Rechercher l'agent selon le type de connexion
  let query = supabase.from("agent").select("*").is("deleted_at", null);

  if (loginType === "email") {
    query = query.eq("email", identifier.toLowerCase().trim());
  } else {
    query = query.eq("code_agent", identifier.trim());
  }

  const { data: agent, error: agentError } = await query.single();

  if (agentError || !agent) {
    throw createError({
      statusCode: 401,
      statusMessage:
        loginType === "email" ? "Email invalide" : "Code agent invalide",
    });
  }

  // 2. Vérifier le mot de passe
  const isPasswordValid = verifyPassword(password, agent.password_hash);

  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Mot de passe incorrect",
    });
  }

  // 3. Vérifier si le compte est actif
  if (!agent.actif) {
    throw createError({
      statusCode: 403,
      statusMessage: "Votre compte est désactivé. Contactez un administrateur.",
    });
  }

  // 4. Vérifier si l'agent a un rôle valide dans user_role
  const { data: userRole, error: roleError } = await supabase
    .from("user_role")
    .select(
      `
      id_user_role,
      id_role,
      role:id_role (
        id_role,
        designation
      )
    `
    )
    .eq("id_agent", agent.id_agent)
    .eq("valide", true)
    .or("date_to.is.null,date_to.gte.now()")
    .lte("date_from", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!userRole || !userRole.role) {
    throw createError({
      statusCode: 403,
      statusMessage:
        "Vous n'avez pas les droits d'accès à l'interface d'administration.",
    });
  }

  // 5. Mettre à jour last_login
  await supabase
    .from("agent")
    .update({ last_login: new Date().toISOString() })
    .eq("id_agent", agent.id_agent);

  // 6. Créer la session
  const role = userRole.role as { id_role: string; designation: string };

  const sessionUser: SessionUser = {
    id_agent: agent.id_agent,
    code_agent: agent.code_agent,
    nom: agent.nom,
    prenom: agent.prenom,
    email: agent.email,
    id_departement: agent.id_departement,
    id_service: agent.id_service,
    role: {
      id_role: role.id_role,
      designation: role.designation,
    },
    id_user_role: userRole.id_user_role,
  };

  await createSession(event, sessionUser);

  // 7. Logger la connexion
  await logConnexion(agent.id_agent, {
    code_agent: agent.code_agent,
    nom: agent.nom,
    prenom: agent.prenom,
    email: agent.email,
  });

  // 8. Retourner les infos utilisateur (sans données sensibles)
  return {
    success: true,
    user: sessionUser,
  };
});
