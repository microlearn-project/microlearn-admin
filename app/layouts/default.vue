<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)

const links = [[{
  label: 'Dashboard',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Agents & Rôles',
  icon: 'i-heroicons-identification',
  to: '/inbox',
  //badge: '4',
  defaultOpen: false,
  type: 'trigger',
  children: [{
    label: 'Agents',
    icon: 'i-heroicons-users',
    to: '/agents',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Rôles & Permissions',
    icon: 'i-heroicons-key',
    to: '/settings/members',
    defaultOpen: false,
    type: 'trigger',
    children: [{
      label: 'Rôles',
      icon: 'i-heroicons-shield-check',
      to: '/roles',
      exact: true,
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Permissions',
      icon: 'i-heroicons-lock-closed',
      to: '/settings/members',
      onSelect: () => {
        open.value = false
      }
    }]
  }]
}, {
  label: 'Organisation',
  icon: 'i-lucide-users',
  to: '/customers',
  defaultOpen: false,
  type: 'trigger',
  children: [{
    label: 'Services',
    icon: 'i-heroicons-building-office',
    to: '/services',
  }, {
    label: 'Départements',
    icon: 'i-heroicons-squares-2x2',
    to: '/departements',
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: 'Apprentissage',
  icon: 'i-heroicons-building-library',
  defaultOpen: false,
  type: 'trigger',
  children: [{
    label: 'Catégories',
    icon: 'i-heroicons-tag',
    to: '/categories',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Modules',
    icon: 'i-heroicons-rectangle-stack',
    to: '/modules',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Éditeur du Module',
    icon: 'i-heroicons-document-text',
    to: '/settings/members',
    defaultOpen: false,
    type: 'trigger',
    children: [{
      label: 'Détails du module',
      icon: 'i-heroicons-document-text',
      to: '/settings',
      exact: true,
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Cours',
      icon: 'i-heroicons-book-open',
      to: '/settings/members',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Quiz',
      icon: 'i-heroicons-question-mark-circle',
      to: '/settings/members',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Questions & Réponses',
      icon: 'i-heroicons-list-bullet',
      to: '/settings/members',
      onSelect: () => {
        open.value = false
      }
    }]
  }]
}], [{
  label: 'Suivi & Analyse',
  icon: 'i-lucide-search',
  to: '/settings/members',
  defaultOpen: false,
  type: 'trigger',
  children: [{
    label: 'Progression Agents',
    icon: 'i-heroicons-chart-bar',
    to: '/settings',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Résultats Quiz',
    icon: 'i-heroicons-sparkles',
    to: '/settings/members',
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: 'Documents',
  icon: 'i-heroicons-folder',
  to: '/settings/members'
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
