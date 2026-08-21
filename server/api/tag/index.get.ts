// server/api/tag/index.get.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Tag = Tables<"tag">;

export default defineEventHandler((event) => {
  return callApi<Tag[]>(event, "/tags");
});
