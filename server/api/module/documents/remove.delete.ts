// server/api/module/documents/remove.delete.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const { id_document } = await readBody(event);

  if (!id_document) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du document manquant",
    });
  }

  const supabase = createSupabaseServerClient();

  // 1. Récupérer les infos du document pour obtenir le chemin du fichier
  const { data: document, error: fetchError } = await supabase
    .from("document")
    .select("fichier")
    .eq("id_document", id_document)
    .single();

  if (fetchError) {
    throw createError({
      statusCode: 404,
      statusMessage: "Document introuvable",
    });
  }

  // 2. Supprimer le fichier du storage
  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([document.fichier]);

  if (storageError) {
    console.error("Erreur suppression storage:", storageError);
    // On continue quand même pour supprimer l'enregistrement BDD
  }

  // 3. Supprimer l'enregistrement de la BDD
  const { data, error: dbError } = await supabase
    .from("document")
    .delete()
    .eq("id_document", id_document)
    .select();

  if (dbError) {
    throw createError({
      statusCode: 500,
      statusMessage: dbError.message,
    });
  }

  return data;
});
