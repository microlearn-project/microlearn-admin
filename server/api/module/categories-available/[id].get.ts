// server/api/module/categories-available/[id].get.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Tag = Tables<"tag">;

export default defineEventHandler(async (event) => {
  const id_module = getRouterParam(event, "id");

  if (!id_module) {
    throw createError({
      statusCode: 400,
      message: "ID du module manquant",
    });
  }

  const [allTags, associated] = await Promise.all([
    callApi<Tag[]>(event, "/tags"),
    callApi<{ id_tag: string }[]>(event, `/modules/${id_module}/tags`),
  ]);

  const associatedIds = new Set(associated.map((row) => row.id_tag));
  return allTags
    .filter((tag) => !associatedIds.has(tag.id_tag))
    .sort((a, b) => a.designation.localeCompare(b.designation));
});
