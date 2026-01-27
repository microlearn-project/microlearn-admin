// server/api/cours/reorder.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

interface ReorderItem {
  id_cours: string;
  ordre: number;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { items } = body as { items: ReorderItem[] };

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Liste des cours à réordonner requise",
    });
  }

  const supabase = createSupabaseServerClient();

  // Stratégie pour éviter les conflits de contrainte unique (id_module, ordre):
  // 1. D'abord, mettre tous les ordres à des valeurs négatives temporaires
  // 2. Ensuite, mettre les vrais ordres

  // Étape 1: Ordres négatifs temporaires
  for (let i = 0; i < items.length; i++) {
    const tempOrder = -(i + 1000); // -1000, -1001, -1002, etc.
    const { error } = await supabase
      .from("cours")
      .update({ ordre: tempOrder })
      .eq("id_cours", items[i].id_cours);

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Erreur lors du réordonnancement: ${error.message}`,
      });
    }
  }

  // Étape 2: Vrais ordres
  for (const item of items) {
    const { error } = await supabase
      .from("cours")
      .update({ ordre: item.ordre })
      .eq("id_cours", item.id_cours);

    if (error) { 
      throw createError({
        statusCode: 500,
        statusMessage: `Erreur lors du réordonnancement: ${error.message}`,
      });
    }
  }

  return { success: true, message: "Cours réordonnés avec succès" };
});
