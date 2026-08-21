// server/api/user-role/create.post.ts
import { callApi } from "~~/server/utils/apiBridge";
import { requireSession } from "~~/server/utils/keycloakAuth";

export default defineEventHandler(async (event) => {
  const { id_agent, id_role, date_from, date_to } = await readBody(event);

  if (!id_agent || !id_role) {
    throw createError({
      statusCode: 400,
      message: "Agent et rôle sont requis",
    });
  }

  const session = requireSession(event);

  return callApi(event, "/user-roles", {
    method: "POST",
    body: {
      id_agent,
      id_role,
      granted_by: session.id_agent,
      date_from,
      date_to,
    },
  });
});
