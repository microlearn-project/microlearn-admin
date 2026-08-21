// composables/useAuth.ts
export interface SessionUser {
  id_agent: string;
  code_agent: string;
  nom: string;
  prenom: string;
  email: string;
  role: { designation: string };
}

interface AuthState {
  authenticated: boolean;
  user: SessionUser | null;
}

export const useAuth = () => {
  const user = useState<SessionUser | null>("auth_user", () => null);
  const authenticated = useState<boolean>("auth_authenticated", () => false);
  const loading = useState<boolean>("auth_loading", () => true);

  async function fetchUser(): Promise<void> {
    loading.value = true;

    try {
      const data = await $fetch<AuthState>("/api/auth/me");
      authenticated.value = data.authenticated;
      user.value = data.user;
    } catch {
      authenticated.value = false;
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  // Démarre le flux Keycloak — navigation plein-écran, pas un appel $fetch,
  // puisque la suite se passe sur le domaine de Keycloak.
  function login(redirectTo?: string): void {
    const target = redirectTo
      ? `/api/auth/login?redirect=${encodeURIComponent(redirectTo)}`
      : "/api/auth/login";
    window.location.href = target;
  }

  async function logout(): Promise<void> {
    authenticated.value = false;
    user.value = null;
    window.location.href = "/api/auth/logout";
  }

  function hasRole(roleDesignation: string): boolean {
    return user.value?.role?.designation === roleDesignation;
  }

  function hasAnyRole(roles: string[]): boolean {
    if (!user.value?.role) return false;
    return roles.includes(user.value.role.designation);
  }

  return {
    user: readonly(user),
    authenticated: readonly(authenticated),
    loading: readonly(loading),
    fetchUser,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };
};
