// server/utils/apiBridge.ts
//
// Passerelle vers l'API NestJS (JWT Keycloak obligatoire sur toutes les
// routes). Chaque requête porte le vrai token de l'agent connecté — voir
// server/utils/keycloakAuth.ts pour la gestion de session et le
// rafraîchissement silencieux du token.
import type { H3Event } from "h3";
import { getValidAccessToken } from "./keycloakAuth";

interface CallApiOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, unknown>;
}

interface NestErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

// Point d'entrée unique pour toutes les routes Nuxt migrées : récupère un
// token valide pour l'agent connecté, appelle l'API NestJS, et retraduit une
// erreur NestJS ({statusCode, message}) en erreur Nuxt ({statusCode,
// statusMessage}) — un seul endroit qui absorbe la différence de forme pour
// toutes les routes.
export async function callApi<T = unknown>(
  event: H3Event,
  path: string,
  options: CallApiOptions = {}
): Promise<T> {
  const token = await getValidAccessToken(event);
  const config = useRuntimeConfig();

  try {
    const response = await $fetch(path, {
      baseURL: config.apiBaseUrl,
      method: options.method ?? "GET",
      body: options.body as Record<string, unknown> | undefined,
      query: options.query,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response as T;
  } catch (err) {
    const fetchError = err as {
      response?: { status: number; _data?: NestErrorBody };
    };
    const status = fetchError.response?.status ?? 500;
    const data = fetchError.response?._data;
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : (data?.message ?? "Erreur de l'API");
    // statusMessage ET message : selon le composant, l'erreur est lue via
    // err.data.statusMessage OU err.data.message (les deux conventions
    // coexistent dans l'app) — sans les deux, la moitié des toasts d'erreur
    // retombaient sur leur message générique de fallback au lieu du détail
    // renvoyé par l'API (ex: distinction code_agent vs email sur un 409).
    throw createError({ statusCode: status, statusMessage: message, message });
  }
}
