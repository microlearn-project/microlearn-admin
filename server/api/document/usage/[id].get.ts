// server/api/document/usage/[id].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

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
  const documentId = getRouterParam(event, "id");

  if (!documentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du document requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // 1. Récupérer le document pour avoir l'URL et l'id_module
  const { data: doc, error: fetchError } = await supabase
    .from("document")
    .select("fichier, id_module")
    .eq("id_document", documentId)
    .single();

  if (fetchError || !doc) {
    throw createError({
      statusCode: 404,
      statusMessage: "Document non trouvé",
    });
  }

  const fileUrl = doc.fichier;
  const moduleId = doc.id_module;

  // 2. Chercher les cours qui utilisent ce document
  const coursUsingDocument: {
    id_cours: string;
    titre: string;
    ordre: number;
  }[] = [];

  if (moduleId && fileUrl) {
    // Récupérer tous les cours du module
    const { data: coursList, error: coursError } = await supabase
      .from("cours")
      .select("id_cours, titre, ordre, documents")
      .eq("id_module", moduleId)
      .is("deleted_at", null)
      .order("ordre", { ascending: true });

    if (coursError) {
      // Échec récupération cours
    }

    if (coursList) {
      // Extraire le chemin de stockage du document à chercher
      const storagePath = extractStoragePath(fileUrl);

      for (const cours of coursList) {
        const documents = cours.documents as string[] | null;

        if (documents && Array.isArray(documents) && documents.length > 0) {
          // Utiliser la même logique que delete.delete.ts
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
            coursUsingDocument.push({
              id_cours: cours.id_cours,
              titre: cours.titre,
              ordre: cours.ordre,
            });
          }
        }
      }
    }
  }

  return {
    documentId,
    fileUrl,
    moduleId,
    coursUsingDocument,
    coursCount: coursUsingDocument.length,
  };
});
