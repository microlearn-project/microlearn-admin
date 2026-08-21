// server/api/module/categories/remove.delete.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id_module, id_tag } = await readBody(event);

  if (!id_module || !id_tag) {
    throw createError({
      statusCode: 400,
      message: "ID du module et ID du tag requis",
    });
  }

  await callApi(event, `/modules/${id_module}/tags/${id_tag}`, {
    method: "DELETE",
  });
  return { success: true };
});
