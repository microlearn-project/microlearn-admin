<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()

// Auth
const { user: authUser, logout } = useAuth();

// Données utilisateur - utilise l'auth si connecté, sinon fallback
const user = computed(() => {
  if (authUser.value) {
    const initials = `${authUser.value.prenom[0]}${authUser.value.nom[0]}`.toUpperCase();
    return {
      name: `${authUser.value.prenom} ${authUser.value.nom}`,
      email: authUser.value.email,
      role: authUser.value.role?.designation || 'Agent',
      avatar: {
        // Utiliser les initiales comme fallback
        alt: initials
      }
    }
  }
  return {
    name: 'Utilisateur',
    email: 'non.connecte@exemple.com',
    role: 'Agent',
    avatar: {
      src: 'https://github.com/Franck-adjinon.png',
      alt: 'User'
    }
  }
});

// Initiales pour l'avatar
const initials = computed(() => {
  if (authUser.value) {
    return `${authUser.value.prenom[0]}${authUser.value.nom[0]}`.toUpperCase();
  }
  return '?';
});

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: user.value.email,
  slot: 'user-info'
}], [{
  label: 'Profil',
  icon: 'i-lucide-user',
  to: '/settings'
} ], [{
  label: 'Apparence',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: 'Clair',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'light'
    }
  }, {
    label: 'Sombre',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onUpdateChecked(checked: boolean) {
      if (checked) {
        colorMode.preference = 'dark'
      }
    },
    onSelect(e: Event) {
      e.preventDefault()
    }
  }]
}],  [{
  label: 'Déconnexion',
  icon: 'i-lucide-log-out',
  color: 'error',
  onSelect: () => logout()
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    >
      <!-- Avatar avec initiales -->
      <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm shrink-0">
        {{ initials }}
      </div>

      <!-- Nom et rôle (masqués si collapsed) -->
      <template v-if="!collapsed">
        <div class="flex flex-col items-start flex-1 min-w-0 ml-2">
          <span class="text-sm font-medium truncate w-full text-left">{{ user.name }}</span>
          <span class="text-xs text-muted truncate w-full text-left">{{ user.role }}</span>
        </div>
        <UIcon name="i-lucide-chevrons-up-down" class="text-dimmed shrink-0" />
      </template>
    </UButton>

    <template #user-info-leading>
      <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
        {{ initials }}
      </div>
    </template>
  </UDropdownMenu>
</template>
