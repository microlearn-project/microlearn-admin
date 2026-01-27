// server/api/cours/soft-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

const BUCKET_NAME = "cours-images";

/**
 * Supprime toutes les images associées à un cours dans Supabase Storage
 */
async function deleteCoursImages(
  coursId: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<void> {
  try {
    // Lister tous les fichiers du cours
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(coursId);

    if (listError) {
      return;
    }

    if (files && files.length > 0) {
      // Construire les chemins complets
      const filePaths = files.map((f) => `${coursId}/${f.name}`);

      // Supprimer tous les fichiers
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths);

      if (deleteError) {
        // Échec suppression fichiers
        return;
      }
    }
  } catch {
    //
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du cours requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer le cours pour avoir id_module et ordre
  const { data: cours, error: fetchError } = await supabase
    .from("cours")
    .select("id_module, ordre")
    .eq("id_cours", id)
    .single();

  if (fetchError || !cours) {
    throw createError({
      statusCode: 404,
      statusMessage: "Cours non trouvé",
    });
  }

  // Supprimer les images associées au cours
  await deleteCoursImages(id, supabase);

  // Soft delete du cours
  const { error: deleteError } = await supabase
    .from("cours")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id_cours", id);

  if (deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: deleteError.message,
    });
  }

  // Réordonner les cours restants pour combler le trou
  const { data: remainingCours, error: listError } = await supabase
    .from("cours")
    .select("id_cours, ordre")
    .eq("id_module", cours.id_module)
    .is("deleted_at", null)
    .gt("ordre", cours.ordre)
    .order("ordre", { ascending: true });

  if (!listError && remainingCours && remainingCours.length > 0) {
    // Utiliser la stratégie en 2 étapes pour éviter les conflits de contrainte unique

    // Étape 1: Ordres négatifs temporaires
    for (let i = 0; i < remainingCours.length; i++) {
      const tempOrder = -(i + 1000);
      await supabase
        .from("cours")
        .update({ ordre: tempOrder })
        .eq("id_cours", remainingCours[i].id_cours);
    }

    // Étape 2: Vrais ordres (décrémentés de 1)
    for (const c of remainingCours) {
      await supabase
        .from("cours")
        .update({ ordre: c.ordre - 1 })
        .eq("id_cours", c.id_cours);
    }
  }

  return { success: true, message: "Cours et images supprimés avec succès" };
});
