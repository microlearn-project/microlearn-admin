// server/api/cours/video-signed-url.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

const BUCKET_NAME = "cours-videos";
const ALLOWED_TYPES = ["video/mp4", "video/webm"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { fileName, fileType, fileSize, storagePath } = body;

  if (!fileName || !fileType || !storagePath) {
    throw createError({ statusCode: 400, statusMessage: "Paramètres manquants" });
  }

  if (!ALLOWED_TYPES.includes(fileType)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Format non supporté. Utilisez MP4 ou WebM",
    });
  }

  if (fileSize > MAX_SIZE_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: "Fichier trop volumineux. La limite est de 50 MB",
    });
  }

  const extension = fileType === "video/mp4" ? "mp4" : "webm";
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
  const filePath = `${storagePath}/${uniqueFileName}`;

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: "Impossible de générer l'URL d'upload" });
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    filePath,
    publicUrl: publicUrlData.publicUrl,
  };
});
