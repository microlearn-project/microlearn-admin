// server/api/auth/login.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { verifyPassword } from "~~/server/utils/password";
import { createSession, type SessionUser } from "~~/server/utils/session";
import { logConnexion } from "~~/server/utils/activityLog";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { identifier, password, loginType, forceLogin } = body;

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

  // 1. Rechercher l'agent
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

  // 4. Vérifier si l'agent a un rôle valide
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
    `,
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

  // ========================================
  // 5. VÉRIFIER LES SESSIONS ACTIVES
  // ========================================
  const { data: activeSessions, error: sessionError } = await supabase
    .from("admin_sessions")
    .select("*")
    .eq("id_agent", agent.id_agent)
    .eq("is_active", true)
    .gte("expires_at", new Date().toISOString());

  if (sessionError) {
    console.error("Erreur récupération sessions:", sessionError);
  }

  // Si session active existe ET qu'on ne force pas la connexion
  if (activeSessions && activeSessions.length > 0 && !forceLogin) {
    const existingSession = activeSessions[0];

    return {
      success: false,
      requiresConfirmation: true, // signal au frontend
      message: `Une session est déjà active depuis ${new Date(existingSession.created_at).toLocaleString("fr-FR")}. Voulez-vous fermer cette session et continuer ?`,
      sessionInfo: {
        created_at: existingSession.created_at,
        last_activity: existingSession.last_activity,
        user_agent: existingSession.user_agent,
      },
    };
  }

  // Si forceLogin = true, désactiver toutes les sessions existantes
  if (forceLogin && activeSessions && activeSessions.length > 0) {
    await supabase
      .from("admin_sessions")
      .update({ is_active: false })
      .eq("id_agent", agent.id_agent)
      .eq("is_active", true);
  }

  // ========================================
  // 6. CRÉER UNE NOUVELLE SESSION
  // ========================================
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Récupérer User-Agent et IP
  const userAgent = getHeader(event, "user-agent") || "Unknown";
  const ipAddress =
    getHeader(event, "x-forwarded-for") ||
    getHeader(event, "x-real-ip") ||
    event.node.req.socket?.remoteAddress ||
    null;

  const { error: insertError } = await supabase.from("admin_sessions").insert({
    id_agent: agent.id_agent,
    session_token: sessionToken,
    user_agent: userAgent,
    ip_address: ipAddress,
    expires_at: expiresAt.toISOString(),
    is_active: true,
  });

  if (insertError) {
    console.error("Erreur création session:", insertError);
    throw createError({
      statusCode: 500,
      statusMessage: "Impossible de créer la session",
    });
  }

  // 7. Mettre à jour last_login
  await supabase
    .from("agent")
    .update({ last_login: new Date().toISOString() })
    .eq("id_agent", agent.id_agent);

  // 8. Créer la session utilisateur (cookie)
  const role = userRole.role as { id_role: string; designation: string };

  const sessionUser: SessionUser = {
    id_agent: agent.id_agent,
    code_agent: agent.code_agent,
    nom: agent.nom,
    prenom: agent.prenom,
    email: agent.email,
    id_direction: agent.id_direction,
    id_departement: agent.id_departement,
    role: {
      id_role: role.id_role,
      designation: role.designation,
    },
    id_user_role: userRole.id_user_role,
    session_token: sessionToken,
  };

  await createSession(event, sessionUser);

  // 9. Logger la connexion
  await logConnexion(agent.id_agent, {
    code_agent: agent.code_agent,
    nom: agent.nom,
    prenom: agent.prenom,
    email: agent.email,
  });

  return {
    success: true,
    user: sessionUser,
  };
});
