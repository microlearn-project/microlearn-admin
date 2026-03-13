// server/api/cours/video-upload.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

const BUCKET_NAME = "cours-videos";
const ALLOWED_TYPES = ["video/mp4", "video/webm"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event);
  const file = formData.get("file") as File | null;
  const storagePath = formData.get("storagePath") as string | null;

  if (!file) {
    throw createError({ statusCode: 400, statusMessage: "Fichier vidéo requis" });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Format non supporté. Utilisez MP4 ou WebM",
    });
  }



  if (file.size > MAX_SIZE_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: "Fichier trop volumineux. La limite est de 50 MB",
    });
  }

  if (!storagePath) {
    throw createError({ statusCode: 400, statusMessage: "Chemin de stockage requis" });
  }

  const supabase = createSupabaseServerClient();

  const extension = file.type === "video/mp4" ? "mp4" : "webm";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
  const filePath = `${storagePath}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw createError({ statusCode: 500, statusMessage: uploadError.message });
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    url: publicUrlData.publicUrl,
    filePath,
    fileName,
  };
});
