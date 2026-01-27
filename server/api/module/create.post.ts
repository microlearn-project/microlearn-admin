// server/api/module/create.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

type ModuleInsert = TablesInsert<"module">;

/**
 * Extrait et uploade les images base64 de la description vers Supabase Storage
 * Remplace les data URLs par les URLs publiques Supabase
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
    } catch {
      // Garder le base64 si erreur
    }
  }

  return processedDescription;
}

export default defineEventHandler(async (event) => {
  const { titre, description, duree_lecture, id_agent } = await readBody(event);

  if (!titre || !description || !duree_lecture || !id_agent) {
    throw createError({
      statusCode: 400,
      statusMessage: "Tous les champs sont requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Étape 1: Créer le module avec une description temporaire (sans images traitées)
  // pour obtenir l'ID du module
  const payload: ModuleInsert = {
    titre,
    description: "", // Temporairement vide
    duree_lecture,
    id_agent,
    publish: false,
  };

  const { data: newModule, error: createErr } = await supabase
    .from("module")
    .insert(payload)
    .select()
    .single();

  if (createErr) {
    throw createError({
      statusCode: 500,
      statusMessage: createErr.message,
    });
  }

  // logging de la création du module
  const session = getUserSession(event);
  await logActivity({
    user_id: session?.user?.id_agent ?? null,
    action: "module_cree",
    objet_type: "module",
    objet_id: newModule.id_module,
    meta: {
      titre: newModule.titre,
    },
  });

  // Étape 2: Traiter les images dans la description avec le vrai ID du module
  const processedDescription = await processImagesInDescription(
    description,
    newModule.id_module,
    supabase
  );

  // Étape 3: Mettre à jour le module avec la description traitée
  const { data, error: updateErr } = await supabase
    .from("module")
    .update({ description: processedDescription })
    .eq("id_module", newModule.id_module)
    .select()
    .single();

  if (updateErr) { 
    // Le module est créé, on retourne quand même avec la description originale
    return { ...newModule, description };
  }

  return data;
});
