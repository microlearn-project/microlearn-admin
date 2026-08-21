// server/utils/inlineImages.ts
//
// Images/vidéos embarquées dans les descriptions HTML (éditeur WYSIWYG des
// modules et cours) — dédupliqué entre les 4 endpoints qui en avaient chacun
// leur propre copie. Tout passe par l'API (POST /storage/images,
// DELETE /storage/files), jamais Supabase directement : c'était le seul
// endroit du Nuxt qui contournait encore "un seul point d'entrée métier".
import type { H3Event } from "h3";
import { callApi } from "~~/server/utils/apiBridge";

export type InlineImageBucket = "module-images" | "cours-images";
export type InlineFileBucket = InlineImageBucket | "cours-videos";

const BASE64_IMG_REGEX =
  /<img[^>]+src=["'](data:image\/([^;]+);base64,([^"']+))["'][^>]*>/gi;

// Remplace les images base64 embarquées dans une description par des URLs
// publiques (upload via l'API). Une image qui échoue à l'upload reste en
// base64 dans le HTML — pas bloquant pour le reste de l'enregistrement.
export async function processImagesInDescription(
  event: H3Event,
  description: string,
  bucket: InlineImageBucket
): Promise<string> {
  let processed = description;
  const matches = [...description.matchAll(BASE64_IMG_REGEX)];

  for (const match of matches) {
    const fullMatch = match[0];
    const dataUrl = match[1];
    if (!fullMatch || !dataUrl) continue;
    try {
      const { url } = await callApi<{ url: string }>(
        event,
        "/storage/images",
        { method: "POST", body: { bucket, imageBase64: dataUrl } }
      );
      processed = processed.replace(fullMatch, fullMatch.replace(dataUrl, url));
    } catch {
      // Garder le base64 si erreur — pas bloquant
    }
  }

  return processed;
}

export function extractBucketUrls(description: string, bucket: string): string[] {
  const urlRegex = new RegExp(`src=["']([^"']*${bucket}[^"']*)["']`, "gi");
  return [...description.matchAll(urlRegex)]
    .map((m) => m[1])
    .filter((url): url is string => Boolean(url));
}

export async function removeStorageUrls(
  event: H3Event,
  bucket: InlineFileBucket,
  urls: string[]
): Promise<void> {
  if (urls.length === 0) return;
  try {
    await callApi(event, "/storage/files", {
      method: "DELETE",
      body: { bucket, urls },
    });
  } catch {
    // best-effort — ne bloque jamais l'opération principale
  }
}

// Diff entre l'ancienne et la nouvelle description : ne supprime que les
// fichiers qui ont disparu (édition), pas ceux encore référencés.
export async function deleteOrphanedFiles(
  event: H3Event,
  oldDescription: string | null,
  newDescription: string,
  bucket: InlineFileBucket
): Promise<void> {
  if (!oldDescription) return;
  const oldUrls = extractBucketUrls(oldDescription, bucket);
  const newUrls = extractBucketUrls(newDescription, bucket);
  const removedUrls = oldUrls.filter((url) => !newUrls.includes(url));
  await removeStorageUrls(event, bucket, removedUrls);
}
