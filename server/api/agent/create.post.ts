// server/api/agent/create.post.ts
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "~~/server/utils/supabase";
import { generateUniqueAgentCode } from "~~/server/utils/codeGenerator";
import { hashPassword } from "~~/server/utils/password";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";
import type { TablesInsert } from "~/types/database.types";

type AgentInsert = TablesInsert<"agent">;

export default defineEventHandler(async (event) => {
  const session = getUserSession(event);
  const currentUserId = session?.user?.id_agent || null;

  const body = await readBody(event);
  const { nom, prenom, email, id_departement, id_service } = body;

  // Validation des champs requis
  if (!nom || !prenom || !email || !id_departement || !id_service) {
    throw createError({
      statusCode: 400,
      statusMessage: "Nom, prénom, email, département et service sont requis",
    });
  }

  // Validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Format d'email invalide",
    });
  }

  const supabase = createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  // Vérifier si l'email existe déjà dans la table agent
  const { data: existingAgent } = await supabase
    .from("agent")
    .select("id_agent")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingAgent) {
    throw createError({
      statusCode: 409,
      statusMessage: "Un agent avec cet email existe déjà",
    });
  }

  // Générer un code agent unique (6 caractères base62)
  const code_agent = await generateUniqueAgentCode(supabase);

  // Hasher le mot de passe par défaut (= code_agent)
  const password_hash = hashPassword(code_agent);

  // ========== ÉTAPE 1 : Créer le user dans Supabase Auth ==========
  const { data: authUser, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: code_agent,
      email_confirm: true,
      user_metadata: {
        code_agent: code_agent,
        nom: nom,
        prenom: prenom,
      },
    });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      throw createError({
        statusCode: 409,
        statusMessage:
          "Un compte avec cet email existe déjà dans le système d'authentification",
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Erreur création auth: ${authError.message}`,
    });
  }

  // ========== ÉTAPE 2 : Créer l'agent dans la table agent ==========
  const payload: AgentInsert = {
    code_agent,
    password_hash,
    nom,
    prenom,
    email,
    actif: true,
    id_departement,
    id_service,
  };

  const { data, error } = await supabase
    .from("agent")
    .insert(payload)
    .select()
    .single();

  if (error) {
    // ========== ROLLBACK : Supprimer le user Auth si la création agent échoue ==========
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);

    if (error.code === "23505") {
      if (error.message.includes("email")) {
        throw createError({
          statusCode: 409,
          statusMessage: "Un agent avec cet email existe déjà",
        });
      }
      if (error.message.includes("code_agent")) {
        throw createError({
          statusCode: 500,
          statusMessage:
            "Erreur lors de la génération du code agent, veuillez réessayer",
        });
      }
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Retourner l'agent créé (sans le password_hash)
  const result = {
    ...data,
    password_hash: undefined,
    code_agent_display: code_agent,
  };

  // Logger l'activité
  await logActivity({
    user_id: currentUserId,
    action: "agent_cree",
    objet_type: "agent",
    objet_id: data.id_agent,
    meta: {
      agent_cree: {
        id: data.id_agent,
        code_agent: data.code_agent,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
      },
      id_departement,
      id_service,
    },
  });

  return result;
});
