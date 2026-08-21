// server/middleware/auth.ts
import { requireSession } from "~~/server/utils/keycloakAuth";

// Routes accessibles sans session (whitelist)
const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/callback", "/api/auth/logout"];

// L'admin est réservé au staff — un compte "Agent" simple (mobile/apprenant)
// ne doit jamais pouvoir appeler la moindre route /api/ de cette app, même
// si callback.get.ts n'aurait normalement jamais dû lui ouvrir de session
// (filet de sécurité pour une session ouverte avant ce correctif, ou un rôle
// révoqué entre-temps).
const STAFF_ROLES = ["SUPERADMIN", "ADMIN", "FORMATEUR"];

export default defineEventHandler((event) => {
  const path = event.path;

  // Ne protéger que les routes /api/
  if (!path.startsWith("/api/")) return;

  // Exclure les paramètres de query pour le matching
  const pathname = path.split("?")[0];
  if (PUBLIC_PATHS.includes(pathname)) return;

  // Lance 401 si non authentifié
  const session = requireSession(event);

  if (!STAFF_ROLES.includes(session.role)) {
    throw createError({ statusCode: 403, message: "Accès non autorisé" });
  }
});
