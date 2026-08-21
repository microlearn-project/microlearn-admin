// server/api/dashboard/weekly-overview.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  return callApi(event, "/dashboard/weekly-overview");
});
