// server/api/activity-log/export.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const query = getQuery(event);

  return callApi(event, "/activity-log/export", {
    query: {
      action: query.action || undefined,
      objet_type: query.objet_type || undefined,
      user_id: query.user_id || undefined,
      from: query.from_date || undefined,
      to: query.to_date || undefined,
      search: query.search || undefined,
    },
  });
});
