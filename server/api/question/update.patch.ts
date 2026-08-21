// server/api/question/update.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id, texte, actif } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de la question requis",
    });
  }

  return callApi(event, `/questions/${id}`, {
    method: "PATCH",
    body: { texte, actif },
  });
});
