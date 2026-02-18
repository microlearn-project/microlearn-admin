// server/api/activity-log/index.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const action = query.action as string;
  const objet_type = query.objet_type as string;
  const user_id = query.user_id as string;
  const from_date = query.from_date as string;
  const to_date = query.to_date as string;

  const supabase = createSupabaseServerClient();

  // Construire la requête de base
  let queryBuilder = supabase
    .from("activity_log")
    .select(
      `
      *,
      agent:user_id (
        id_agent,
        code_agent,
        nom,
        prenom,
        email
      )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  // Filtres
  if (action) {
    queryBuilder = queryBuilder.eq("action", action);
  }

  if (objet_type) {
    queryBuilder = queryBuilder.eq("objet_type", objet_type);
  }

  if (user_id) {
    queryBuilder = queryBuilder.eq("user_id", user_id);
  }

  if (from_date) {
    queryBuilder = queryBuilder.gte("created_at", from_date);
  }

  if (to_date) {
    queryBuilder = queryBuilder.lte("created_at", to_date);
  }

  // Pagination
  const offset = (page - 1) * limit;
  queryBuilder = queryBuilder.range(offset, offset + limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return {
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
});
