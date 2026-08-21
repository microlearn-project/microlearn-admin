// server/api/cours/reorder.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

interface ReorderItem {
  id_cours: string;
  ordre: number;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { items } = body as { items: ReorderItem[] };

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Liste des cours à réordonner requise",
    });
  }

  // Stratégie pour éviter les conflits de contrainte unique (id_module, ordre) :
  // 1. D'abord, des ordres temporaires très au-dessus de toute valeur réelle
  //    (ordre est validé @Min(1) côté API — des négatifs seraient rejetés)
  // 2. Ensuite, les vrais ordres
  for (const [i, item] of items.entries()) {
    await callApi(event, `/cours/${item.id_cours}`, {
      method: "PATCH",
      body: { ordre: 100000 + i },
    });
  }

  for (const item of items) {
    await callApi(event, `/cours/${item.id_cours}`, {
      method: "PATCH",
      body: { ordre: item.ordre },
    });
  }

  return { success: true, message: "Cours réordonnés avec succès" };
});
