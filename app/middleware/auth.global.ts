// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = ["/login"];

  // Si on est sur une route publique, pas de vérification
  if (publicRoutes.includes(to.path)) {
    return;
  }

  // Côté serveur, on ne fait pas la vérification (sera faite côté client)
  if (import.meta.server) {
    return;
  }

  const { authenticated, loading, fetchUser, user } = useAuth();

  // Si on n'a pas encore vérifié l'auth, le faire
  if (loading.value || !authenticated.value) {
    await fetchUser();
  }

  // Si pas authentifié, rediriger vers login
  if (!authenticated.value) {
    return navigateTo("/login", { replace: true });
  }

  // Vérification des permissions par rôle
  const role = user.value?.role?.designation;

  // Routes interdites pour FORMATEUR
  const formateurForbidden = [
    '/agents',
    '/roles',
    '/permissions',
    '/services',
    '/departements',
    '/activity-log'
  ];

  // Routes interdites pour ADMIN
  const adminForbidden = [
    '/roles'
  ];

  // Vérification pour FORMATEUR
  if (role === 'FORMATEUR') {
    if (formateurForbidden.some(path => to.path.startsWith(path))) {
      return navigateTo('/', { replace: true });
    }
  }

  // Vérification pour ADMIN
  if (role === 'ADMIN') {
    if (adminForbidden.some(path => to.path.startsWith(path))) {
      return navigateTo('/', { replace: true });
    }
  }

  // SUPERADMIN a accès à tout
});
