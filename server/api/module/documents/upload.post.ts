// server/api/module/documents/upload.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type DocumentInsert = TablesInsert<"document">;

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

  // 1. Upload du fichier dans Supabase Storage
  const fileName = fileData.filename || `document_${Date.now()}`;
  const filePath = `modules/${id_module}/${fileName}`;

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
    fichier: uploadData.path, // Chemin du fichier dans le storage
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
