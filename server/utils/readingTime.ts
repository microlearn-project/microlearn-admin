// server/utils/readingTime.ts
//
// Estimation de durée de lecture — un seul endroit (était dupliqué entre
// cours/create.post.ts et cours/update.patch.ts). Le format produit
// ("< 1 min", "5 min", "1h", "1h30", max 10 caractères) est celui stocké
// tel quel en base (cours.duree_lecture, module.duree_lecture), donc
// parseReadingTimeToMinutes doit rester l'inverse exact de formatMinutes.
import { callApi } from "~~/server/utils/apiBridge";
import type { H3Event } from "h3";

export function formatMinutes(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0
    ? `${hours}h`
    : `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
}

export function estimateReadingTime(text: string, wordsPerMin = 225): string {
  const plainText = text
    .replace(/<[^>]*>/g, "")
    .replace(/&[^;]+;/g, " ")
    .trim();
  const wordCount = plainText.split(/\s+/).filter((w) => w.length > 0).length;
  const minutes = Math.ceil(wordCount / wordsPerMin);
  return formatMinutes(minutes);
}

export function parseReadingTimeToMinutes(formatted: string): number {
  if (formatted.startsWith("< 1")) return 0;

  const hourMatch = formatted.match(/^(\d+)h(\d{2})?$/);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    const minutes = hourMatch[2] ? Number(hourMatch[2]) : 0;
    return hours * 60 + minutes;
  }

  const minMatch = formatted.match(/^(\d+)\s*min$/);
  if (minMatch) return Number(minMatch[1]);

  return 0;
}

export function sumReadingTimes(formatted: string[]): string {
  const totalMinutes = formatted.reduce(
    (sum, value) => sum + parseReadingTimeToMinutes(value),
    0
  );
  return formatMinutes(totalMinutes);
}

// Recalcule et persiste la durée totale d'un module = somme de ses cours
// actifs — appelé après toute création/modification/suppression de cours.
export async function recomputeModuleDuration(
  event: H3Event,
  id_module: string
): Promise<void> {
  const cours = await callApi<{ duree_lecture: string }[]>(event, "/cours", {
    query: { module_id: id_module },
  });
  const duree_lecture = sumReadingTimes(cours.map((c) => c.duree_lecture));
  await callApi(event, `/modules/${id_module}`, {
    method: "PATCH",
    body: { duree_lecture },
  });
}
