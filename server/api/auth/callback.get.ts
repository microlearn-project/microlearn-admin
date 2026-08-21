// server/api/auth/callback.get.ts
// Keycloak redirige ici après connexion avec ?code=...&state=... : on
// échange le code contre de vrais tokens, on résout l'agent correspondant
// via notre propre API (/auth/me, qui applique aussi la politique de
// session unique), puis on ouvre la session locale.
import {
  getAuthStateCookie,
  clearAuthStateCookie,
  setAuthCookie,
  type AuthCookiePayload,
} from "~~/server/utils/keycloakAuth";

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
}

interface JwtClaims {
  sub: string;
  sid?: string;
  realm_access?: { roles?: string[] };
}

const APPLICATIVE_ROLES = ["SUPERADMIN", "ADMIN", "FORMATEUR"] as const;

function decodeJwtClaims(token: string): JwtClaims {
  const payload = token.split(".").at(1);
  if (!payload) {
    throw createError({ statusCode: 502, message: "Token Keycloak invalide" });
  }
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
}

interface AuthMeResponse {
  id_agent: string;
  code_agent: string;
  nom: string;
  prenom: string;
  email: string;
  roles: string[];
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = query.code as string | undefined;
  const state = query.state as string | undefined;
  const errorParam = query.error as string | undefined;

  if (errorParam) {
    return sendRedirect(event, `/login?error=${encodeURIComponent(errorParam)}`);
  }

  const stateCookie = getAuthStateCookie(event);
  clearAuthStateCookie(event);

  if (!code || !state || !stateCookie || state !== stateCookie.state) {
    return sendRedirect(event, "/login?error=invalid_state");
  }

  const config = useRuntimeConfig();
  const redirectUri = `${getRequestURL(event).origin}/api/auth/callback`;

  const tokenRes = await fetch(
    `${config.keycloakIssuer}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: config.keycloakAdminClientId as string,
        client_secret: config.keycloakAdminClientSecret as string,
        code_verifier: stateCookie.code_verifier,
      }),
    }
  );

  if (!tokenRes.ok) {
    return sendRedirect(event, "/login?error=token_exchange_failed");
  }

  const tokens = (await tokenRes.json()) as KeycloakTokenResponse;
  const claims = decodeJwtClaims(tokens.access_token);

  let profile: AuthMeResponse;
  try {
    profile = await $fetch<AuthMeResponse>(
      `${config.apiBaseUrl}/auth/me`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
  } catch {
    // Le token est valide mais aucun agent ne correspond (ni id_keycloak, ni
    // code_agent, ni email) — compte Keycloak orphelin côté Postgres.
    return sendRedirect(event, "/login?error=no_agent_match");
  }

  const role = profile.roles.find((r) => APPLICATIVE_ROLES.includes(r as any));

  // Authentifié dans Keycloak, mais aucun rôle staff (SUPERADMIN/ADMIN/
  // FORMATEUR) — un compte "Agent" simple (mobile/apprenant) ne doit jamais
  // obtenir de session admin, quelle que soit la validité de son login.
  if (!role) {
    return sendRedirect(event, "/login?error=no_admin_access");
  }

  const session: AuthCookiePayload = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    id_token: tokens.id_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    sid: claims.sid,
    id_agent: profile.id_agent,
    code_agent: profile.code_agent,
    nom: profile.nom,
    prenom: profile.prenom,
    email: profile.email,
    role,
  };

  setAuthCookie(event, session);

  return sendRedirect(event, stateCookie.redirect_to || "/");
});
