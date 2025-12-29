// server/api/module/soft-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type ModuleUpdate = TablesUpdate<"module">;

// Fonction de vérification de l'existence dans suivi_module
async function isModuleUsed_suivi(id_module: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  let { data: suivi_module, error } = await supabase
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

  let { data: cours, error } = await supabase
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

  let { data: module_tag, error } = await supabase
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

  let { data: module_service, error } = await supabase
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
    // Soft delete
    const { data, error } = await supabase
      .from("module")
      .update(payload)
      .eq("id_module", id)
      .select()
      .single();

    if (error)
      throw createError({ statusCode: 500, statusMessage: error.message });

    return data;
  } else {
    // Hard delete
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

    return (data ?? []) as ModuleUpdate[];
  }
});
