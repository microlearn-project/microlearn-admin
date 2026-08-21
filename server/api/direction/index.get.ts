// server/api/direction/index.get.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Direction = Tables<"direction">;

export default defineEventHandler((event) => {
  return callApi<Direction[]>(event, "/directions");
});
