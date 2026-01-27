// server/api/cours/update.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type CoursUpdate = TablesUpdate<"cours">;

const BUCKET_NAME = "cours-images";

/**
 * Estime la durée de lecture en fonction du nombre de caractères
 */
function estimateReadingTime(text: string): string {
  const plainText = text.replace(/<[^>]*>/g, "").trim();
  const charCount = plainText.length;
  const minutes = Math.ceil(charCount / 1000);

  if (minutes < 1) {
    return "< 1 min";
  } else if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
  }
}

/**
 * Extrait toutes les URLs d'images Supabase d'une description HTML
 */
function extractSupabaseImageUrls(
  description: string,
  bucketName: string
): string[] {
  const urlRegex = new RegExp(
    `<img[^>]+src=["']([^"']*${bucketName}[^"']*)["'][^>]*>`,
    "gi"
  );

  const urls: string[] = [];
  let match;

  while ((match = urlRegex.exec(description)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

/**
 * Extrait le chemin du fichier depuis une URL publique Supabase
 */
function extractFilePathFromUrl(
  url: string,
  bucketName: string
): string | null {
  const regex = new RegExp(`${bucketName}/(.+)$`);
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Supprime les images qui ne sont plus présentes dans la nouvelle description
 */
async function deleteOrphanedImages(
  oldDescription: string | null,
  newDescription: string,
  coursId: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<void> {
  if (!oldDescription) return;

  const oldImageUrls = extractSupabaseImageUrls(oldDescription, BUCKET_NAME);
  const newImageUrls = extractSupabaseImageUrls(newDescription, BUCKET_NAME);

  const removedUrls = oldImageUrls.filter((url) => !newImageUrls.includes(url));

  if (removedUrls.length === 0) return;

  const filePaths: string[] = [];

  for (const url of removedUrls) {
    const filePath = extractFilePathFromUrl(url, BUCKET_NAME);
    if (filePath) {
      filePaths.push(filePath);
    }
  }

  if (filePaths.length > 0) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (error) {
      // Échec suppression fichiers
      return;
    }
  }
}

/**
 * Extrait et uploade les images base64 de la description vers Supabase Storage
 */
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

  if (matches.length === 0) {
    return description;
  }

  for (const img of matches) {
    try {
      const imageBuffer = Buffer.from(img.base64Data, "base64");
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}.${img.extension}`;
      const filePath = `${coursId}/${fileName}`;
      const contentType = `image/${img.extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, imageBuffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const newImgTag = img.fullMatch.replace(
        img.dataUrl,
        publicUrlData.publicUrl
      );
      processedDescription = processedDescription.replace(
        img.fullMatch,
        newImgTag
      );
    } catch  {
      // Échec traitement image
    }
  }

  return processedDescription;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, titre, description, documents } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du cours requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer l'ancienne description pour comparer les images
  const { data: currentCours, error: fetchError } = await supabase
    .from("cours")
    .select("description")
    .eq("id_cours", id)
    .single();

  if (fetchError) {
    // Cours non trouvé
  }

  // Construire le payload de mise à jour
  const payload: CoursUpdate = {};

  if (titre !== undefined) {
    payload.titre = titre;
  }

  if (documents !== undefined) {
    payload.documents = documents;
  }

  // Traiter les images si la description est fournie
  if (description !== undefined) {
    // Traiter les nouvelles images base64
    const processedDescription = await processImagesInDescription(
      description,
      id,
      supabase
    );

    // Supprimer les images orphelines
    await deleteOrphanedImages(
      currentCours?.description || null,
      processedDescription,
      id,
      supabase
    );

    payload.description = processedDescription;
    // Recalculer la durée de lecture
    payload.duree_lecture = estimateReadingTime(processedDescription);
  }

  const { data, error } = await supabase
    .from("cours")
    .update(payload)
    .eq("id_cours", id)
    .select()
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
