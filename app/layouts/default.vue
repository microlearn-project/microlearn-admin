<script setup lang="ts">
import type { NavigationMenuItem, CommandPaletteItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

// Auth
const { user, authenticated, fetchUser } = useAuth();

// Charger l'utilisateur au montage
onMounted(async () => {
  if (!authenticated.value) {
    await fetchUser();
  }
});

const open = ref(false)

// Vérification des rôles
const isSuperAdmin = computed(() => user.value?.role?.designation === 'SUPERADMIN');
const isAdmin = computed(() => user.value?.role?.designation === 'ADMIN');
const isFormateur = computed(() => user.value?.role?.designation === 'FORMATEUR');

// Navigation basée sur les rôles
const links = computed<NavigationMenuItem[][]>(() => {
  const baseLinks: NavigationMenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'i-lucide-house',
      to: '/',
      onSelect: () => { open.value = false }
    }
  ];

  // Agents & Rôles - Pas accessible pour FORMATEUR
  if (!isFormateur.value) {
    const agentsRolesChildren: NavigationMenuItem[] = [
      {
        label: 'Agents',
        icon: 'i-heroicons-users',
        to: '/agents',
        exact: true,
        onSelect: () => { open.value = false }
      }
    ];

    // Sous-menu Rôles & Permissions
    const rolesPermissionsChildren: NavigationMenuItem[] = [
      {
        label: 'Permissions',
        icon: 'i-heroicons-lock-closed',
        to: '/permissions',
        onSelect: () => { open.value = false }
      }
    ];

    // Bouton Rôles uniquement pour SUPERADMIN
    // Finalement NON
    /*
    if (isSuperAdmin.value) {
      rolesPermissionsChildren.unshift({
        label: 'Rôles',
        icon: 'i-heroicons-shield-check',
        to: '/roles',
        exact: true,
        onSelect: () => { open.value = false }
      });
    }
    */

    agentsRolesChildren.push({
      label: 'Rôles & Permissions',
      icon: 'i-heroicons-key',
      to: '/permissions',
      defaultOpen: false,
      type: 'trigger',
      children: rolesPermissionsChildren
    } as NavigationMenuItem);

    baseLinks.push({
      label: 'Agents & Rôles',
      icon: 'i-heroicons-identification',
      defaultOpen: false,
      type: 'trigger',
      children: agentsRolesChildren
    } as NavigationMenuItem);
  }

  // Organisation - Pas accessible pour FORMATEUR
  if (!isFormateur.value) {
    baseLinks.push({
      label: 'Organisation',
      icon: 'i-lucide-users',
      defaultOpen: false,
      type: 'trigger',
      children: [
        {
          label: 'Départements',
          icon: 'i-heroicons-squares-2x2',
          to: '/departements',
          onSelect: () => { open.value = false }
        },
        {
          label: 'Directions',
          icon: 'i-heroicons-building-office',
          to: '/directions',
          onSelect: () => { open.value = false }
        }
      ]
    } as NavigationMenuItem);
  }

  // Apprentissage - Accessible à tous
  baseLinks.push({
    label: 'Apprentissage',
    icon: 'i-heroicons-building-library',
    defaultOpen: false,
    type: 'trigger',
    children: [
      {
        label: 'Catégories',
        icon: 'i-heroicons-tag',
        to: '/categories',
        onSelect: () => { open.value = false }
      },
      {
        label: 'Modules',
        icon: 'i-heroicons-rectangle-stack',
        to: '/modules',
        exact: true,
        onSelect: () => { open.value = false }
      }
    ]
  } as NavigationMenuItem);

  // Suivi & Analyse - Accessible à tous
  const suiviChildren: NavigationMenuItem[] = [
    {
      label: 'Progression Agents',
      icon: 'i-heroicons-chart-bar',
      to: '/progression',
      exact: true,
      onSelect: () => { open.value = false }
    },
    {
      label: 'Résultats Quiz',
      icon: 'i-heroicons-sparkles',
      to: '/quiz-results',
      onSelect: () => { open.value = false }
    }
  ];

  // Journal d'activité - Pas accessible pour FORMATEUR
  if (!isFormateur.value) {
    suiviChildren.push({
      label: "Journal d'activité",
      icon: 'i-heroicons-clipboard-document-list',
      to: '/activitylogs',
      onSelect: () => { open.value = false }
    });
  }

  const secondaryLinks: NavigationMenuItem[] = [
    {
      label: 'Suivi & Analyse',
      icon: 'i-lucide-search',
      defaultOpen: false,
      type: 'trigger',
      children: suiviChildren
    } as NavigationMenuItem,
    {
      label: 'Documents',
      icon: 'i-heroicons-folder',
      to: '/documents',
      onSelect: () => { open.value = false }
    }
  ];

  return [baseLinks, secondaryLinks];
});


// NavigationMenuItem.chip accepte boolean | ChipProps, CommandPaletteItem.chip
// n'accepte que ChipProps — aucun item ci-dessus ne fixe jamais "chip",
// cast sûr pour la seule incompatibilité structurelle entre les deux types.
const groups = computed(() => [{
  id: 'links',
  label: 'Aller au',
  items: links.value.flat() as CommandPaletteItem[]
}])
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
