// server/api/activity-log/facets.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  return callApi(event, "/activity-log/facets");
});
