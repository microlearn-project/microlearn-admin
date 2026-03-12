// server/api/cours/video-delete.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

const BUCKET_NAME = "cours-videos";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { urls } = body as { urls: string[] };

  if (!urls || urls.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "URLs requises",
    });
  }

  const supabase = createSupabaseServerClient();

  // Extraire les chemins depuis les URLs publiques
  const filePaths: string[] = [];

  for (const url of urls) {
    const regex = new RegExp(`${BUCKET_NAME}/(.+)$`);
    const match = url.match(regex);
    if (match) {
      filePaths.push(match[1]);
    }
  }

  if (filePaths.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Aucun chemin valide extrait des URLs",
    });
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filePaths);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return { success: true, deleted: filePaths.length };
});
