// server/api/document/delete.delete.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

const BUCKET_NAME = "documents";

/**
 * Extrait le chemin relatif du fichier depuis une URL complète ou un chemin
 *
 * Si l'entrée est une URL complète:
 *   "https://xxx.supabase.co/storage/v1/object/public/documents/modules/abc/file.pdf"
 *   Retourne: "modules/abc/file.pdf"
 *
 * Si l'entrée est déjà un chemin relatif:
 *   "modules/abc/file.pdf"
 *   Retourne: "modules/abc/file.pdf"
 */
function extractStoragePath(fileUrlOrPath: string): string {
  // Si c'est une URL complète, extraire le chemin après "/documents/"
  if (fileUrlOrPath.startsWith("http")) {
    const regex = /\/documents\/(.+)$/;
    const match = fileUrlOrPath.match(regex);
    if (match) {
      return match[1];
    }
  }

  // Sinon, c'est déjà un chemin relatif
  return fileUrlOrPath;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du document requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // 1. Récupérer le document pour avoir le chemin du fichier et l'id_module
  const { data: doc, error: fetchError } = await supabase
    .from("document")
    .select("id_document, fichier, id_module")
    .eq("id_document", id)
    .single();

  if (fetchError || !doc) {
    throw createError({
      statusCode: 404,
      statusMessage: "Document non trouvé",
    });
  }

  const fileUrl = doc.fichier;
  const moduleId = doc.id_module;

  // 2. Supprimer le fichier du Storage Supabase
  if (fileUrl) {
    try {
      // Extraire le chemin de stockage (fonctionne avec URL complète ou chemin relatif)
      const storagePath = extractStoragePath(fileUrl);

      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (storageError) {
        // On continue quand même pour supprimer l'entrée en BDD
      }
    } catch {
      // Erreur suppression fichier
    }
  }

  // 3. Nettoyer les références dans les cours du module
  let coursImpacted = 0;

  if (moduleId && fileUrl) {
    try {
      // Récupérer tous les cours du module
      const { data: coursList, error: coursError } = await supabase
        .from("cours")
        .select("id_cours, documents")
        .eq("id_module", moduleId)
        .is("deleted_at", null);

      if (!coursError && coursList) {
        for (const cours of coursList) {
          const documents = cours.documents as string[] | null;

          if (documents && Array.isArray(documents) && documents.length > 0) {
            // Chercher l'URL dans le tableau
            // On compare l'URL complète ET le chemin extrait pour couvrir tous les cas
            const storagePath = extractStoragePath(fileUrl);

            const hasUrl = documents.some((url) => {
              if (!url) return false;
              const urlPath = extractStoragePath(url);
              return url === fileUrl ||
                     urlPath === storagePath ||
                     url.includes(storagePath) ||
                     fileUrl.includes(urlPath);
            });

            if (hasUrl) {
              // Filtrer pour retirer l'URL
              const updatedDocuments = documents.filter((url) => {
                if (!url) return true;
                const urlPath = extractStoragePath(url);
                return !(url === fileUrl ||
                        urlPath === storagePath ||
                        url.includes(storagePath) ||
                        fileUrl.includes(urlPath));
              });

              // Mettre à jour le cours
              const { error: updateError } = await supabase
                .from("cours")
                .update({
                  documents: updatedDocuments,
                  updated_at: new Date().toISOString()
                })
                .eq("id_cours", cours.id_cours);

              if (!updateError) {
                coursImpacted++;
              } else {
                // Échec mise à jour cours
              }
            }
          }
        }
      }
    } catch {
      // Échec nettoyage références cours
    }
  }

  // 4. Supprimer l'entrée de la base de données
  const { error: deleteError } = await supabase
    .from("document")
    .delete()
    .eq("id_document", id);

  if (deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: deleteError.message,
    });
  }

  return {
    success: true,
    message: "Document supprimé",
    coursImpacted,
  };
});
