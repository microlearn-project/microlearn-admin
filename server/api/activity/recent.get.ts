// server/api/activity/recent.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const limit = Number(query.limit) || 20;

  return callApi(event, "/activity-log/recent", { query: { limit } });
});
