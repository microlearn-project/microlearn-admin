// server/api/dashboard/stats.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  return callApi(event, "/dashboard/stats");
});
