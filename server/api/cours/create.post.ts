// server/api/cours/create.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type CoursInsert = TablesInsert<"cours">;

const BUCKET_NAME = "cours-images";

/**
 * Estime la durée de lecture en fonction du nombre de caractères
 * Basé sur une moyenne de 200 mots/minute et ~5 caractères/mot
 * Soit environ 1000 caractères/minute
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
 * Extrait et uploade les images base64 de la description vers Supabase Storage
 * Remplace les data URLs par les URLs publiques Supabase
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
    } catch (error) {
      // Ignorer les erreurs d'upload et continuer
    }
  }

  return processedDescription;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { titre, description, documents, id_module } = body;

  if (!titre || !description || !id_module) {
    throw createError({
      statusCode: 400,
      statusMessage: "Titre, description et ID du module sont requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer le prochain ordre disponible
  const { data: existingCours, error: countError } = await supabase
    .from("cours")
    .select("ordre")
    .eq("id_module", id_module)
    .is("deleted_at", null)
    .order("ordre", { ascending: false })
    .limit(1);

  if (countError) {
    throw createError({
      statusCode: 500,
      statusMessage: countError.message,
    });
  }

  const nextOrder =
    existingCours && existingCours.length > 0 ? existingCours[0].ordre + 1 : 1;

  // Estimer la durée de lecture
  const duree_lecture = estimateReadingTime(description);

  // Étape 1: Créer le cours avec description temporaire pour obtenir l'ID
  const payload: CoursInsert = {
    titre,
    description: "", // Temporairement vide
    documents: documents || [],
    duree_lecture,
    ordre: nextOrder,
    id_module,
  };

  const { data: newCours, error: createErr } = await supabase
    .from("cours")
    .insert(payload)
    .select()
    .single();

  if (createErr) {
    throw createError({
      statusCode: 500,
      statusMessage: createErr.message,
    });
  }

  // Étape 2: Traiter les images avec le vrai ID du cours
  const processedDescription = await processImagesInDescription(
    description,
    newCours.id_cours,
    supabase
  );

  // Étape 3: Mettre à jour le cours avec la description traitée
  const { data, error: updateErr } = await supabase
    .from("cours")
    .update({ description: processedDescription })
    .eq("id_cours", newCours.id_cours)
    .select()
    .single();

  if (updateErr) { 
    return { ...newCours, description };
  }

  return data;
});
