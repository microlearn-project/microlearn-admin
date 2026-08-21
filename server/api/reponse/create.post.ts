// server/api/reponse/create.post.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { texte, est_correcte, explication, id_question } = await readBody(event);

  if (texte === undefined || texte === null || !id_question) {
    throw createError({
      statusCode: 400,
      message: "Texte et ID de la question sont requis",
    });
  }

  return callApi(event, "/reponses", {
    method: "POST",
    body: { texte, est_correcte, explication: explication || undefined, id_question },
  });
});
