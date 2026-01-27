// server/api/module/update.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";


type ModuleUpdate = TablesUpdate<"module">;

/**
 * Extrait toutes les URLs d'images Supabase d'une description HTML
 */
function extractSupabaseImageUrls(
  description: string,
  bucketName: string
): string[] {
  // Regex pour trouver les URLs d'images Supabase dans les balises img
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
 * Ex: https://xxx.supabase.co/storage/v1/object/public/module-images/abc-123/image.png
 * Retourne: abc-123/image.png
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
  moduleId: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<void> {
  if (!oldDescription) return;

  const bucketName = "module-images";

  // Extraire les URLs d'images de l'ancienne et nouvelle description
  const oldImageUrls = extractSupabaseImageUrls(oldDescription, bucketName);
  const newImageUrls = extractSupabaseImageUrls(newDescription, bucketName);

  // Trouver les images qui ont été supprimées (présentes dans old mais pas dans new)
  const removedUrls = oldImageUrls.filter((url) => !newImageUrls.includes(url));

  if (removedUrls.length === 0) return;

  // Extraire les chemins de fichiers et les supprimer
  const filePaths: string[] = [];

  for (const url of removedUrls) {
    const filePath = extractFilePathFromUrl(url, bucketName);
    if (filePath) {
      filePaths.push(filePath);
    }
  }

  if (filePaths.length > 0) {
    const { error } = await supabase.storage.from(bucketName).remove(filePaths);

    if (error) {
      // Échec suppression fichiers
      return;
    }
  }
}

/**
 * Extrait et uploade les images base64 de la description vers Supabase Storage
 * Remplace les data URLs par les URLs publiques Supabase
 * Ne touche pas aux images déjà uploadées (URLs Supabase existantes)
 */
async function processImagesInDescription(
  description: string,
  moduleId: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<string> {
  // Regex pour trouver les images base64 dans les balises img
  const base64Regex =
    /<img[^>]+src=["'](data:image\/([^;]+);base64,([^"']+))["'][^>]*>/gi;

  let processedDescription = description;

  // Trouver toutes les images base64
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

  // Si aucune image base64, retourner la description telle quelle
  if (matches.length === 0) {
    return description;
  }

  // Uploader chaque image et remplacer par l'URL
  for (const img of matches) {
    try {
      // Convertir base64 en buffer
      const imageBuffer = Buffer.from(img.base64Data, "base64");

      // Générer un nom de fichier unique
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}.${img.extension}`;
      const filePath = `${moduleId}/${fileName}`;

      // Déterminer le content type
      const contentType = `image/${img.extension}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("module-images")
        .upload(filePath, imageBuffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        continue; // Garder le base64 si l'upload échoue
      }

      // Récupérer l'URL publique
      const { data: publicUrlData } = supabase.storage
        .from("module-images")
        .getPublicUrl(filePath);

      // Remplacer le base64 par l'URL dans la description
      const newImgTag = img.fullMatch.replace(
        img.dataUrl,
        publicUrlData.publicUrl
      );
      processedDescription = processedDescription.replace(
        img.fullMatch,
        newImgTag
      );
    } catch  {
      // Garder le base64 si erreur
    }
  }

  return processedDescription;
}

export default defineEventHandler(async (event) => {
  const { id, titre, description, duree_lecture } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer l'ancienne description pour comparer les images
  const { data: currentModule, error: fetchError } = await supabase
    .from("module")
    .select("description")
    .eq("id_module", id)
    .single();

  if (fetchError) {
    // Module non trouvé 
  }

  // Traiter les images dans la description (upload base64 → URLs Supabase)
  let processedDescription = description;
  if (description) {
    processedDescription = await processImagesInDescription(
      description,
      id,
      supabase
    );

    // Supprimer les images orphelines (retirées de l'éditeur)
    await deleteOrphanedImages(
      currentModule?.description || null,
      processedDescription,
      id,
      supabase
    );
  }

  // Construire le payload de mise à jour
  const payload: ModuleUpdate = {
    titre,
    description: processedDescription,
    duree_lecture,
  };

  const { data, error } = await supabase
    .from("module")
    .update(payload)
    .eq("id_module", id)
    .select()
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // logging de la modification du module
  const session = getUserSession(event);
  await logActivity({
    user_id: session?.user?.id_agent ?? null,
    action: "module_modifie",
    objet_type: "module",
    objet_id: id,
    meta: {
      titre: data?.titre,
    },
  });

  return data;
});
