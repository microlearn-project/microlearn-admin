// server/api/dashboard/services-progress.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  return callApi(event, "/dashboard/services-progress");
});
