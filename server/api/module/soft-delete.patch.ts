// server/api/module/soft-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type ModuleUpdate = TablesUpdate<"module">;

/**
 * Supprime toutes les images associées à un module dans Supabase Storage
 */
async function deleteModuleImages(
  moduleId: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<void> {
  try {
    // Lister tous les fichiers du module
    const { data: files, error: listError } = await supabase.storage
      .from("module-images")
      .list(moduleId);

    if (listError) {
      return;
    }

    if (files && files.length > 0) {
      // Construire les chemins complets
      const filePaths = files.map((f) => `${moduleId}/${f.name}`);

      // Supprimer tous les fichiers
      const { error: deleteError } = await supabase.storage
        .from("module-images")
        .remove(filePaths);

      if (deleteError) {
        // Échec suppression fichiers
      }
    }
  } catch {
    // Échec suppression images
  }
}

// Fonction de vérification de l'existence dans suivi_module
async function isModuleUsed_suivi(id_module: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  const { data: suivi_module, error } = await supabase
    .from("suivi_module")
    .select("id_module")
    .eq("id_module", id_module)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  return !!(suivi_module && suivi_module.length > 0);
}

// Fonction de vérification de l'existence de cours liés
async function isModuleUsed_cours(id_module: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  const { data: cours, error } = await supabase
    .from("cours")
    .select("id_cours")
    .eq("id_module", id_module)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  return !!(cours && cours.length > 0);
}

// Fonction de vérification de l'existence dans module_tag
async function isModuleUsed_tag(id_module: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  const { data: module_tag, error } = await supabase
    .from("module_tag")
    .select("id_module")
    .eq("id_module", id_module)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  return !!(module_tag && module_tag.length > 0);
}

// Fonction de vérification de l'existence dans module_service
async function isModuleUsed_service(id_module: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  const { data: module_service, error } = await supabase
    .from("module_service")
    .select("id_module")
    .eq("id_module", id_module)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  return !!(module_service && module_service.length > 0);
}

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const payload: ModuleUpdate = {
    deleted_at: new Date().toISOString(),
  };

  // Vérification de l'utilisation du module
  const isUsed_inSuivi = await isModuleUsed_suivi(id);
  const isUsed_inCours = await isModuleUsed_cours(id);
  const isUsed_inTag = await isModuleUsed_tag(id);
  const isUsed_inService = await isModuleUsed_service(id);

  if (isUsed_inSuivi || isUsed_inCours || isUsed_inTag || isUsed_inService) {
    // Soft delete (le module est utilisé quelque part)
    // On garde les images car le module existe toujours (soft deleted)
    const { data, error } = await supabase
      .from("module")
      .update(payload)
      .eq("id_module", id)
      .select()
      .single();

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message });
    }

    // logger la suppression du module
    const session = getUserSession(event);
    await logActivity({
      user_id: session?.user?.id_agent ?? null,
      action: "module_supprime",
      objet_type: "module",
      objet_id: id,
      meta: {
        titre: data?.titre,
      },
    });

    return data;
  } else {
    // Hard delete (le module n'est utilisé nulle part)
    // Supprimer les images associées au module AVANT de supprimer le module
    await deleteModuleImages(id, supabase);

    const { data, error } = await supabase
      .from("module")
      .delete()
      .eq("id_module", id)
      .select();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }

    // logger la suppression définitive du module
    const session = getUserSession(event);
    await logActivity({
      user_id: session?.user?.id_agent ?? null,
      action: "module_supprime",
      objet_type: "module",
      objet_id: id,
      meta: {
        titre: data?.[0]?.titre,
      },
    });

    return {
      success: true,
      message: "Module et images supprimés définitivement",
      data: (data ?? []) as ModuleUpdate[],
    };
  }
});
