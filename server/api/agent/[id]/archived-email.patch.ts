// server/api/agent/[id]/archived-email.patch.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Agent = Tables<"agent">;

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  const { email } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de l'agent manquant",
    });
  }
  if (!email) {
    throw createError({
      statusCode: 400,
      message: "Email requis",
    });
  }

  return callApi<Agent>(event, `/agents/${id}/archived-email`, {
    method: "PATCH",
    body: { email },
  });
});
