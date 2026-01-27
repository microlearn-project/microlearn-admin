// server/api/module/[id]/toggle-download.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

export default defineEventHandler(async (event) => {
  // Récupérer l'utilisateur connecté
  const session = getUserSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Non authentifié",
    });
  }

  // VÉRIFICATION CRITIQUE : Seul un SUPERADMIN peut rendre un module téléchargeable
  const currentUserRole = session.user.role?.designation;
  if (currentUserRole !== "SUPERADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage:
        "Seul un SUPERADMIN peut gérer le téléchargement des modules",
    });
  }

  const moduleId = getRouterParam(event, "id");
  const body = await readBody(event);
  const { download_enabled } = body;

  if (!moduleId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module requis",
    });
  }

  if (typeof download_enabled !== "boolean") {
    throw createError({
      statusCode: 400,
      statusMessage: "download_enabled doit être un booléen",
    });
  }

  const supabase = createSupabaseServerClient();

  // Vérifier que le module existe
  const { data: module, error: moduleError } = await supabase
    .from("module")
    .select("id_module, titre, download_enabled")
    .eq("id_module", moduleId)
    .is("deleted_at", null)
    .single();

  if (moduleError || !module) {
    throw createError({
      statusCode: 404,
      statusMessage: "Module non trouvé",
    });
  }

  // Mettre à jour le statut de téléchargement
  const { data, error } = await supabase
    .from("module")
    .update({
      download_enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id_module", moduleId)
    .select()
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la mise à jour",
    });
  }

  // Log de l'activité de modification du statut de téléchargement du module
  await logActivity({
    user_id: session.user.id_agent || null,
    action: download_enabled
      ? "module_telechargeable_active"
      : "module_telechargeable_desactive",
    objet_type: "module",
    objet_id: moduleId,
    meta: {
      titre: module.titre,
      previous_status: module.download_enabled,
      new_status: download_enabled,
    },
  });

  return data;
});
