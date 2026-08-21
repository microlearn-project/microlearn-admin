// server/api/module/categories/[id].get.ts
import { callApi } from "~~/server/utils/apiBridge";

interface ModuleTag {
  id_tag: string;
  designation: string;
}

export default defineEventHandler(async (event) => {
  const id_module = getRouterParam(event, "id");

  if (!id_module) {
    throw createError({
      statusCode: 400,
      message: "ID du module manquant",
    });
  }

  const rows = await callApi<{ tag: ModuleTag }[]>(
    event,
    `/modules/${id_module}/tags`
  );
  return rows.map((row) => row.tag);
});
