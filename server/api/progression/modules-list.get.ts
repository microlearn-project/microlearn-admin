// server/api/progression/modules-list.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { getUserSession } from "~~/server/utils/session";

export default defineEventHandler(async (event) => {
  const session = getUserSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Non authentifié",
    });
  }

  const supabase = createSupabaseServerClient();

  try {
    const { data: modules, error } = await supabase
      .from("module")
      .select("id_module, titre, publish_at")
      .eq("publish", true)
      .is("deleted_at", null)
      .order("publish_at", { ascending: false });

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Erreur de base de données: ${error.message}`,
      });
    }

    return modules || [];
  } catch (err: any) { 
    throw createError({
      statusCode: 500,
      statusMessage: err.message || "Erreur lors de la récupération des modules",
    });
  }
});
