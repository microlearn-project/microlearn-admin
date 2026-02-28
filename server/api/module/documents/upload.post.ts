// server/api/module/documents/upload.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type DocumentInsert = TablesInsert<"document">;

/**
 * Nettoie le nom de fichier pour Supabase Storage
 * - Supprime les accents
 * - Remplace espaces par underscores
 * - Supprime caractères spéciaux
 * - Tout en minuscules
 *
 * Exemples :
 * - "Méthode de compression.pdf" → "methode_de_compression.pdf"
 * - "État d'avancement 2024.docx" → "etat_d_avancement_2024.docx"
 */
function sanitizeFileName(fileName: string): string {
  // Séparer nom et extension
  const lastDotIndex = fileName.lastIndexOf(".");
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";

  // Normaliser NFD pour décomposer les caractères accentués
  // "é" devient "e" + accent combinant
  const normalized = name.normalize("NFD");

  // Supprimer les diacritiques (accents)
  const withoutAccents = normalized.replace(/[\u0300-\u036f]/g, "");

  // Remplacer espaces par underscores
  const withUnderscores = withoutAccents.replace(/\s+/g, "_");

  // Garder uniquement : lettres, chiffres, points, tirets, underscores
  const cleaned = withUnderscores
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/_{2,}/g, "_") // Remplacer multiples underscores par un seul
    .toLowerCase();

  // Reconstituer avec extension en minuscules
  return cleaned + extension.toLowerCase();
}

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);

  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "Aucun fichier fourni",
    });
  }

  // Extraire le fichier et l'id_module du FormData
  const fileData = formData.find((item) => item.name === "file");
  const moduleIdData = formData.find((item) => item.name === "id_module");

  if (!fileData || !moduleIdData) {
    throw createError({
      statusCode: 400,
      statusMessage: "Fichier ou ID du module manquant",
    });
  }

  const id_module = moduleIdData.data.toString();
  const supabase = createSupabaseServerClient();

  // Sauvegarder le nom original
  const originalFileName = fileData.filename || `document_${Date.now()}`;

  // Nettoyer le nom pour Supabase Storage
  const cleanFileName = sanitizeFileName(originalFileName);

  // Ajouter timestamp pour unicité
  const timestamp = Date.now();
  const fileExtension = cleanFileName.split(".").pop() || "";
  const fileNameWithoutExt = cleanFileName.replace(`.${fileExtension}`, "");
  const uniqueFileName = `${fileNameWithoutExt}_${timestamp}.${fileExtension}`;

  // 1. Upload du fichier dans Supabase Storage
  const filePath = `modules/${id_module}/${uniqueFileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("documents") // Nom du bucket Supabase Storage
    .upload(filePath, fileData.data, {
      contentType: fileData.type,
      upsert: false,
    });

  if (uploadError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Erreur d'upload: ${uploadError.message}`,
    });
  }

  // 2. Enregistrer la référence du document dans la BDD
  const payload: DocumentInsert = {
    fichier: uploadData.path,      // Nom nettoyé (chemin dans storage)
    nom_original: originalFileName, // Nom original pour affichage
    id_module,
  };

  const { data: dbData, error: dbError } = await supabase
    .from("document")
    .insert(payload)
    .select()
    .single();

  if (dbError) {
    // Si l'insertion échoue, supprimer le fichier uploadé
    await supabase.storage.from("documents").remove([filePath]);

    throw createError({
      statusCode: 500,
      statusMessage: dbError.message,
    });
  }

  return dbData;
});
