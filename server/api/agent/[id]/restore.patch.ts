// server/api/agent/[id]/restore.patch.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Agent = Tables<"agent">;

export default defineEventHandler((event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de l'agent manquant",
    });
  }

  return callApi<Agent>(event, `/agents/${id}/restore`, { method: "PATCH" });
});
