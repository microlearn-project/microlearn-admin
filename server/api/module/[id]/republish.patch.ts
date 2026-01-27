// server/api/module/[id]/republish.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type ModuleUpdate = TablesUpdate<"module">;

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module manquant",
    });
  }

  const supabase = createSupabaseServerClient();

  // Vérifier que le module existe et a déjà été publié
  const { data: existingModule, error: fetchError } = await supabase
    .from("module")
    .select("id_module, publish, publish_at, titre")
    .eq("id_module", id)
    .is("deleted_at", null)
    .single();

  if (fetchError) {
    throw createError({
      statusCode: 404,
      statusMessage: "Module introuvable",
    });
  }

  // Vérifier qu'il a déjà été publié au moins une fois (sinon utiliser publish)
  if (!existingModule.publish_at) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ce module n'a jamais été publié. Utilisez l'action 'Publier' pour la première publication.",
    });
  }

  // Mettre à jour uniquement le statut publish (sans toucher à publish_at)
  const payload: ModuleUpdate = {
    publish: true,
  };

  const { data, error } = await supabase
    .from("module")
    .update(payload)
    .eq("id_module", id)
    .select()
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Logging de l'activité de republication
  const session = getUserSession(event);
  await logActivity({
    user_id: session?.user?.id_agent || null,
    action: "module_republie",
    objet_type: "module",
    objet_id: id,
    meta: {
      titre: existingModule.titre,
      date_publication_originale: existingModule.publish_at,
    },
  });

  return data;
});
