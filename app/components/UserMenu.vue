<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const appConfig = useAppConfig()

// Auth
const { user: authUser, logout } = useAuth();

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

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
  label: 'Theme',
  icon: 'i-lucide-palette',
  children: [{
    label: 'Primary',
    slot: 'chip',
    chip: appConfig.ui.colors.primary,
    content: {
      align: 'center',
      collisionPadding: 16
    },
    children: colors.map(color => ({
      label: color,
      chip: color,
      slot: 'chip',
      checked: appConfig.ui.colors.primary === color,
      type: 'checkbox',
      onSelect: (e) => {
        e.preventDefault()

        appConfig.ui.colors.primary = color
      }
    }))
  }, {
    label: 'Neutral',
    slot: 'chip',
    chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
    content: {
      align: 'end',
      collisionPadding: 16
    },
    children: neutrals.map(color => ({
      label: color,
      chip: color === 'neutral' ? 'old-neutral' : color,
      slot: 'chip',
      type: 'checkbox',
      checked: appConfig.ui.colors.neutral === color,
      onSelect: (e) => {
        e.preventDefault()

        appConfig.ui.colors.neutral = color
      }
    }))
  }]
}, {
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

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
        />
      </div>
    </template>

    <template #user-info-leading>
      <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
        {{ initials }}
      </div>
    </template>
  </UDropdownMenu>
</template>
