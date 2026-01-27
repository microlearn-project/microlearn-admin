// server/api/module/documents/remove.delete.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

const BUCKET_NAME = "documents";

/**
 * Extrait le chemin relatif du fichier depuis une URL complète ou un chemin
 */
function extractStoragePath(fileUrlOrPath: string): string {
  if (fileUrlOrPath.startsWith("http")) {
    const regex = /\/documents\/(.+)$/;
    const match = fileUrlOrPath.match(regex);
    if (match) {
      return match[1];
    }
  }
  return fileUrlOrPath;
}

export default defineEventHandler(async (event) => {
  const { id_document } = await readBody(event);

  if (!id_document) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du document manquant",
    });
  }

  const supabase = createSupabaseServerClient();

  // 1. Récupérer les infos du document pour obtenir le chemin du fichier et le module
  const { data: document, error: fetchError } = await supabase
    .from("document")
    .select("fichier, id_module")
    .eq("id_document", id_document)
    .single();

  if (fetchError) {
    throw createError({
      statusCode: 404,
      statusMessage: "Document introuvable",
    });
  }

  const fileUrl = document.fichier;
  const moduleId = document.id_module;

  // 2. Supprimer le fichier du storage
  if (fileUrl) {
    const storagePath = extractStoragePath(fileUrl);

    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (storageError) {
      // On continue quand même pour supprimer l'enregistrement BDD
    } else {
      // Fichier supprimé avec succès
    }
  }

  // 3. Nettoyer les références dans les cours du module
  let coursImpacted = 0;

  if (moduleId && fileUrl) {
    try {
      const { data: coursList, error: coursError } = await supabase
        .from("cours")
        .select("id_cours, documents")
        .eq("id_module", moduleId)
        .is("deleted_at", null);

      if (!coursError && coursList) {
        const storagePath = extractStoragePath(fileUrl);

        for (const cours of coursList) {
          const documents = cours.documents as string[] | null;

          if (documents && Array.isArray(documents) && documents.length > 0) {
            const hasUrl = documents.some((url) => {
              if (!url) return false;
              const urlPath = extractStoragePath(url);
              return (
                url === fileUrl ||
                urlPath === storagePath ||
                url.includes(storagePath) ||
                fileUrl.includes(urlPath)
              );
            });

            if (hasUrl) {
              const updatedDocuments = documents.filter((url) => {
                if (!url) return true;
                const urlPath = extractStoragePath(url);
                return !(
                  url === fileUrl ||
                  urlPath === storagePath ||
                  url.includes(storagePath) ||
                  fileUrl.includes(urlPath)
                );
              });

              const { error: updateError } = await supabase
                .from("cours")
                .update({
                  documents: updatedDocuments,
                  updated_at: new Date().toISOString(),
                })
                .eq("id_cours", cours.id_cours);

              if (!updateError) {
                coursImpacted++;
              }
            }
          }
        }
      }
    } catch   {
      // Échec nettoyage références dans cours
    }
  }

  // 4. Supprimer l'enregistrement de la BDD
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

  return {
    success: true,
    data,
    coursImpacted,
  };
});
