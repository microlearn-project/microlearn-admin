// server/utils/keycloakAuth.ts
//
// Authentification réelle des agents via Keycloak (Authorization Code,
// client confidentiel "utblearn-admin") — remplace le pont par rôle de
// server/utils/apiBridge.ts : chaque requête porte désormais le vrai token
// de l'agent connecté, plus besoin de choisir un compte de service.
import { createHmac, randomBytes, createHash, timingSafeEqual } from "crypto";
import type { H3Event } from "h3";

const SESSION_COOKIE_NAME = "kc_session";
const STATE_COOKIE_NAME = "kc_auth_state";
const STATE_COOKIE_MAX_AGE = 10 * 60; // 10 minutes — durée de l'aller-retour Keycloak

export interface AuthCookiePayload {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_at: number; // epoch ms
  sid?: string;
  id_agent: string;
  code_agent: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

interface AuthStateCookie {
  state: string;
  code_verifier: string;
  redirect_to?: string;
}

function getSecret(): string {
  const secret = useRuntimeConfig().sessionSecret;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET manquant — définissez-le dans .env avant de démarrer le serveur"
    );
  }
  return secret;
}

function sign(encoded: string): string {
  return createHmac("sha256", getSecret()).update(encoded).digest("hex");
}

function verify(encoded: string, signature: string): boolean {
  try {
    const expected = Buffer.from(sign(encoded), "hex");
    const received = Buffer.from(signature, "hex");
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

function pack(payload: unknown): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function unpack<T>(cookie: string | undefined): T | null {
  if (!cookie) return null;
  const dotIndex = cookie.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const encoded = cookie.slice(0, dotIndex);
  const signature = cookie.slice(dotIndex + 1);
  if (!verify(encoded, signature)) return null;
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}

// --- Session (tokens + profil résolu) ---
//
// Stockée côté serveur, pas dans le cookie : un access_token + refresh_token
// + id_token Keycloak réunis dépassent régulièrement la limite d'environ
// 4 Ko par cookie que les navigateurs imposent — le Set-Cookie est alors
// silencieusement ignoré (aucune erreur, la session "disparaît" juste au
// prochain aller-retour). Le cookie ne porte plus qu'un identifiant opaque.
// Limite connue : en mémoire, donc perdu au redémarrage du serveur et non
// partagé entre plusieurs instances — suffisant pour un déploiement à un
// seul process ; passer à un store partagé (Redis, ...) si ça change.
const sessionStore = new Map<string, AuthCookiePayload>();

function generateSessionId(): string {
  return randomBytes(32).toString("base64url");
}

export function setAuthCookie(event: H3Event, payload: AuthCookiePayload): void {
  let sessionId = getCookie(event, SESSION_COOKIE_NAME);
  if (!sessionId || !sessionStore.has(sessionId)) {
    sessionId = generateSessionId();
    setCookie(event, SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // borne haute ; expires_at (token) gouverne la validité réelle
      path: "/",
    });
  }
  sessionStore.set(sessionId, payload);
}

export function getAuthCookie(event: H3Event): AuthCookiePayload | null {
  const sessionId = getCookie(event, SESSION_COOKIE_NAME);
  if (!sessionId) return null;
  return sessionStore.get(sessionId) ?? null;
}

export function clearAuthCookie(event: H3Event): void {
  const sessionId = getCookie(event, SESSION_COOKIE_NAME);
  if (sessionId) sessionStore.delete(sessionId);
  deleteCookie(event, SESSION_COOKIE_NAME, { path: "/" });
}

// --- Cookie temporaire (state + PKCE) — durée de l'aller-retour Keycloak uniquement ---

export function setAuthStateCookie(event: H3Event, data: AuthStateCookie): void {
  setCookie(event, STATE_COOKIE_NAME, pack(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_COOKIE_MAX_AGE,
    path: "/",
  });
}

export function getAuthStateCookie(event: H3Event): AuthStateCookie | null {
  return unpack<AuthStateCookie>(getCookie(event, STATE_COOKIE_NAME));
}

export function clearAuthStateCookie(event: H3Event): void {
  deleteCookie(event, STATE_COOKIE_NAME, { path: "/" });
}

// --- PKCE ---

export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function generateState(): string {
  return randomBytes(16).toString("base64url");
}

// --- Rafraîchissement du token ---

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
}

async function refreshTokens(
  refreshToken: string
): Promise<KeycloakTokenResponse> {
  const config = useRuntimeConfig();
  const res = await fetch(
    `${config.keycloakIssuer}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: config.keycloakAdminClientId as string,
        client_secret: config.keycloakAdminClientSecret as string,
      }),
    }
  );
  if (!res.ok) {
    throw createError({
      statusCode: 401,
      message: "Session expirée — reconnexion requise",
    });
  }
  return res.json() as Promise<KeycloakTokenResponse>;
}

// Point d'entrée unique pour obtenir un token utilisable : rafraîchit
// silencieusement si l'access_token est sur le point d'expirer, jamais besoin
// de reconnexion tant que le refresh_token (et la session Keycloak) est valide.
export async function getValidAccessToken(event: H3Event): Promise<string> {
  const session = getAuthCookie(event);
  if (!session) {
    throw createError({ statusCode: 401, message: "Non authentifié" });
  }

  if (session.expires_at > Date.now() + 10_000) {
    return session.access_token;
  }

  const refreshed = await refreshTokens(session.refresh_token);
  const updated: AuthCookiePayload = {
    ...session,
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    id_token: refreshed.id_token,
    expires_at: Date.now() + refreshed.expires_in * 1000,
  };
  setAuthCookie(event, updated);
  return updated.access_token;
}

// Session complète (profil + rôle) pour les routes qui ont besoin de savoir
// QUI agit, pas seulement d'un token valide (ex. granted_by, id_agent auteur).
export function requireSession(event: H3Event): AuthCookiePayload {
  const session = getAuthCookie(event);
  if (!session) {
    throw createError({ statusCode: 401, message: "Non authentifié" });
  }
  return session;
}
