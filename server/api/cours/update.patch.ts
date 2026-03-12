// server/api/cours/update.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type CoursUpdate = TablesUpdate<"cours">;

const BUCKET_NAME_IMAGES = "cours-images";
const BUCKET_NAME_VIDEOS = "cours-videos";

function estimateReadingTime(text: string, wordsPerMin: number = 225): string {
  const plainText = text.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
  const words = plainText.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const minutes = Math.ceil(wordCount / wordsPerMin);

  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0
    ? `${hours}h`
    : `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
}

function extractUrlsFromDescription(
  description: string,
  bucketName: string
): string[] {
  // Couvre à la fois <img src="..."> et <video src="...">
  const urlRegex = new RegExp(
    `src=["']([^"']*${bucketName}[^"']*)["']`,
    "gi"
  );
  const urls: string[] = [];
  let match;
  while ((match = urlRegex.exec(description)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

function extractFilePathFromUrl(
  url: string,
  bucketName: string
): string | null {
  const regex = new RegExp(`${bucketName}/(.+)$`);
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function deleteOrphanedFiles(
  oldDescription: string | null,
  newDescription: string,
  bucketName: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<void> {
  if (!oldDescription) return;

  const oldUrls = extractUrlsFromDescription(oldDescription, bucketName);
  const newUrls = extractUrlsFromDescription(newDescription, bucketName);
  const removedUrls = oldUrls.filter((url) => !newUrls.includes(url));

  if (removedUrls.length === 0) return;

  const filePaths: string[] = [];
  for (const url of removedUrls) {
    const filePath = extractFilePathFromUrl(url, bucketName);
    if (filePath) filePaths.push(filePath);
  }

  if (filePaths.length > 0) {
    await supabase.storage.from(bucketName).remove(filePaths);
  }
}

async function processImagesInDescription(
  description: string,
  coursId: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<string> {
  const base64Regex =
    /<img[^>]+src=["'](data:image\/([^;]+);base64,([^"']+))["'][^>]*>/gi;

  let processedDescription = description;
  const matches: Array<{
    fullMatch: string;
    dataUrl: string;
    extension: string;
    base64Data: string;
  }> = [];

  let match;
  while ((match = base64Regex.exec(description)) !== null) {
    matches.push({
      fullMatch: match[0],
      dataUrl: match[1],
      extension: match[2],
      base64Data: match[3],
    });
  }

  if (matches.length === 0) return description;

  for (const img of matches) {
    try {
      const imageBuffer = Buffer.from(img.base64Data, "base64");
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${img.extension}`;
      const filePath = `${coursId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME_IMAGES)
        .upload(filePath, imageBuffer, {
          contentType: `image/${img.extension}`,
          upsert: false,
        });

      if (uploadError) continue;

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME_IMAGES)
        .getPublicUrl(filePath);

      const newImgTag = img.fullMatch.replace(img.dataUrl, publicUrlData.publicUrl);
      processedDescription = processedDescription.replace(img.fullMatch, newImgTag);
    } catch {
      //
    }
  }

  return processedDescription;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, titre, description, documents } = body;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "ID du cours requis" });
  }

  const supabase = createSupabaseServerClient();

  const { data: currentCours } = await supabase
    .from("cours")
    .select("description")
    .eq("id_cours", id)
    .single();

  const payload: CoursUpdate = {};

  if (titre !== undefined) payload.titre = titre;
  if (documents !== undefined) payload.documents = documents;

  if (description !== undefined) {
    const processedDescription = await processImagesInDescription(
      description,
      id,
      supabase
    );

    // Supprimer images orphelines
    await deleteOrphanedFiles(
      currentCours?.description || null,
      processedDescription,
      BUCKET_NAME_IMAGES,
      supabase
    );

    // Supprimer vidéos orphelines
    await deleteOrphanedFiles(
      currentCours?.description || null,
      processedDescription,
      BUCKET_NAME_VIDEOS,
      supabase
    );

    payload.description = processedDescription;
    payload.duree_lecture = estimateReadingTime(processedDescription);
  }

  const { data, error } = await supabase
    .from("cours")
    .update(payload)
    .eq("id_cours", id)
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return data;
});
