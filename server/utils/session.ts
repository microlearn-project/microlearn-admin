// server/utils/session.ts
import { H3Event } from "h3";

// Type pour les données de session
export interface SessionUser {
  id_agent: string;
  code_agent: string;
  nom: string;
  prenom: string;
  email: string;
  id_departement: string;
  id_service: string;
  role: {
    id_role: string;
    designation: string;
  };
  id_user_role: string;
}

export interface SessionData {
  user: SessionUser;
  loggedInAt: string;
  expiresAt: string;
}

// Nom du cookie de session
const SESSION_COOKIE_NAME = "lms_session";

// Durée de session en secondes (24h)
const SESSION_DURATION = 24 * 60 * 60;

/**
 * Crée une session pour un utilisateur
 */
export async function createSession(
  event: H3Event,
  user: SessionUser
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION * 1000);

  const sessionData: SessionData = {
    user,
    loggedInAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // Encoder les données en base64
  const encoded = Buffer.from(JSON.stringify(sessionData)).toString("base64");

  // Définir le cookie
  setCookie(event, SESSION_COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

/**
 * Récupère la session courante
 */
export function getUserSession(event: H3Event): SessionData | null {
  const cookie = getCookie(event, SESSION_COOKIE_NAME);

  if (!cookie) {
    return null;
  }

  try {
    const decoded = Buffer.from(cookie, "base64").toString("utf-8");
    const sessionData: SessionData = JSON.parse(decoded);

    // Vérifier si la session n'est pas expirée
    if (new Date(sessionData.expiresAt) < new Date()) {
      // Session expirée, la supprimer
      clearUserSession(event);
      return null;
    }

    return sessionData;
  } catch {
    // Cookie invalide
    clearUserSession(event);
    return null;
  }
}

/**
 * Supprime la session
 */
export function clearUserSession(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: "/",
  });
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export function isAuthenticated(event: H3Event): boolean {
  return getUserSession(event) !== null;
}

/**
 * Récupère l'utilisateur de la session ou lance une erreur
 */
export function requireAuth(event: H3Event): SessionData {
  const session = getUserSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Non authentifié",
    });
  }

  return session;
}
