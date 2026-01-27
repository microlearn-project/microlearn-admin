// server/api/module/images/upload.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { image, id_module } = body;

  if (!image || !id_module) {
    throw createError({
      statusCode: 400,
      statusMessage: "Image et ID du module requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Extraire les données de l'image base64
  // Format attendu : "data:image/png;base64,iVBORw0KGgo..."
  const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    throw createError({
      statusCode: 400,
      statusMessage: "Format d'image invalide",
    });
  }

  const contentType = matches[1]; // Ex: "image/png"
  const base64Data = matches[2];

  // Convertir base64 en buffer
  const imageBuffer = Buffer.from(base64Data, 'base64');

  // Générer un nom de fichier unique
  const fileExtension = contentType.split('/')[1] || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
  const filePath = `${id_module}/${fileName}`;

  // Upload vers Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("module-images")
    .upload(filePath, imageBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) { 
    throw createError({
      statusCode: 500,
      statusMessage: `Erreur d'upload: ${uploadError.message}`,
    });
  }

  // Récupérer l'URL publique
  const { data: publicUrlData } = supabase.storage
    .from("module-images")
    .getPublicUrl(filePath);

  return {
    url: publicUrlData.publicUrl,
    path: filePath,
  };
});
