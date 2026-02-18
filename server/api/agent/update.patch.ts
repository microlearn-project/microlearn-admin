// server/api/agent/update.patch.ts
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type AgentUpdate = TablesUpdate<"agent">;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, nom, prenom, email, id_direction, id_departement } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de l'agent requis",
    });
  }

  const supabase = createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  // Récupérer l'agent actuel pour avoir son email
  const { data: currentAgent } = await supabase
    .from("agent")
    .select("email")
    .eq("id_agent", id)
    .single();

  if (!currentAgent) {
    throw createError({
      statusCode: 404,
      statusMessage: "Agent non trouvé",
    });
  }

  // Construire le payload de mise à jour
  const payload: AgentUpdate = {};
  const authPayload: { email?: string; user_metadata?: Record<string, any> } =
    {};

  if (nom !== undefined) {
    payload.nom = nom;
    authPayload.user_metadata = { ...authPayload.user_metadata, nom };
  }

  if (prenom !== undefined) {
    payload.prenom = prenom;
    authPayload.user_metadata = { ...authPayload.user_metadata, prenom };
  }

  if (email !== undefined) {
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Format d'email invalide",
      });
    }

    // Vérifier si l'email existe déjà pour un autre agent
    const { data: existingAgent } = await supabase
      .from("agent")
      .select("id_agent")
      .eq("email", email)
      .neq("id_agent", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingAgent) {
      throw createError({
        statusCode: 409,
        statusMessage: "Un autre agent utilise déjà cet email",
      });
    }

    payload.email = email;
    authPayload.email = email;
  }

  if (id_direction !== undefined) {
    const { data: dept } = await supabase
      .from("direction")
      .select("id_direction")
      .eq("id_direction", id_direction)
      .is("deleted_at", null)
      .maybeSingle();

    if (!dept) {
      throw createError({
        statusCode: 400,
        statusMessage: "Département invalide",
      });
    }

    payload.id_direction = id_direction;
  }

  if (id_departement !== undefined) {
    const { data: svc } = await supabase
      .from("departement")
      .select("id_departement")
      .eq("id_departement", id_departement)
      .eq("actif", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (!svc) {
      throw createError({
        statusCode: 400,
        statusMessage: "Département invalide ou inactif",
      });
    }

    payload.id_departement = id_departement;
  }

  payload.updated_at = new Date().toISOString();

  // ========== Mettre à jour Supabase Auth si nécessaire ==========
  if (Object.keys(authPayload).length > 0) {
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUsers.users.find(
      (u) => u.email === currentAgent.email
    );

    if (authUser) {
      const { error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, authPayload);

      if (authError) {
        // Error handling commented out to avoid exposing sensitive info
      }
    }
  }

  // ========== Mettre à jour la table agent ==========
  const { data, error } = await supabase
    .from("agent")
    .update(payload)
    .eq("id_agent", id)
    .select()
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
