// server/api/reponse/update.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id, texte, est_correcte, explication } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de la réponse requis",
    });
  }

  return callApi(event, `/reponses/${id}`, {
    method: "PATCH",
    body: {
      texte,
      est_correcte,
      explication: explication === null ? undefined : explication,
    },
  });
});
