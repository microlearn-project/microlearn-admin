// server/api/service/addservice.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";


type ServiceInsert = TablesInsert<"service">;

export default defineEventHandler(async (event) => {
  const { designation, actif } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: ServiceInsert = {
    designation: designation,
    actif: actif,
  };

  const { data, error } = await supabase
    .from("service")
    .insert(payload)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Log activity
  const session = getUserSession(event);
  await logActivity({
    user_id: session?.user?.id_agent || null,
    action: "service_cree",
    objet_type: "service",
    objet_id: data[0].id_service,
    meta: {
      designation: data[0].designation,
    },
  });

  return (data ?? []) as ServiceInsert[];
});
