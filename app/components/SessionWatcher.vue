<!-- app/components/SessionWatcher.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const { authenticated, user, logout } = useAuth();
let intervalId: NodeJS.Timeout | null = null;

// Vérifier la session toutes les 30 secondes
const CHECK_INTERVAL = 30 * 1000; // 30 secondes

async function checkSession() {
  // Ne vérifier que si authentifié et qu'on a un token
  if (!authenticated.value || !user.value?.session_token) {
    return;
  }

  try {
    const response = await $fetch<{ valid: boolean }>('/api/auth/validate-session', {
      method: 'POST',
      body: { session_token: user.value.session_token },
    });

    // Si session invalide, déconnecter
    if (!response.valid) {
      console.warn('Session invalidée - déconnexion automatique');
      await logout();
    }
  } catch (error) {
    console.error('Erreur vérification session:', error);
    // En cas d'erreur réseau, on ne déconnecte pas
  }
}

onMounted(() => {
  // Démarrer la vérification périodique
  intervalId = setInterval(checkSession, CHECK_INTERVAL);
});

onUnmounted(() => {
  // Nettoyer l'intervalle
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<template>
  <!-- Ce composant est invisible, il vérifie juste la session en arrière-plan -->
  <div />
</template>