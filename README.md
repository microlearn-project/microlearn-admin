## Description

UTBLearn Admin est une interface d'administration complète pour la plateforme de formation UTBLearn. Cette application permet de gérer efficacement tous les aspects de la plateforme, incluant les utilisateurs, les modules de formation, les cours, les quiz, et les statistiques de suivi.

L'application est développée avec Nuxt 3 et utilise Supabase comme base de données backend, offrant une expérience utilisateur moderne et réactive grâce à Nuxt UI.

## Fonctionnalités principales

- **Gestion des agents** : Création, modification, activation/désactivation et suppression douce des comptes utilisateurs
- **Gestion des modules** : Création et édition de modules de formation avec contenu riche (éditeur WYSIWYG)
- **Gestion des cours** : Organisation et réordonnancement des cours au sein des modules
- **Gestion des quiz** : Création et gestion des évaluations avec questions et réponses
- **Gestion des catégories** : Organisation des modules par catégories (tags)
- **Gestion des services et départements** : Attribution des agents à des services et départements
- **Gestion des rôles et permissions** : Système de rôles (SUPERADMIN, ADMIN, FORMATEUR, AGENT)
- **Publication de modules** : Workflow de publication avec validation
- **Suivi des activités** : Journal d'activité pour auditer les actions des utilisateurs
- **Statistiques et tableaux de bord** : Visualisation des métriques de la plateforme
- **Gestion des documents** : Upload et association de documents aux modules
- **Notifications et alertes** : Système de notifications en temps réel

## Technologies utilisées

- **Framework** : Nuxt 3 (Vue 3)
- **Langage** : TypeScript
- **UI/UX** : Nuxt UI (basé sur Tailwind CSS)
- **Base de données** : Supabase (PostgreSQL)
- **Éditeur de texte** : Tiptap (éditeur riche pour les descriptions)
- **Graphiques** : Unovis (pour les visualisations de données)
- **Authentification** : Supabase Auth
- **Stockage** : Supabase Storage (pour les images et documents)
- **Outil de build** : Vite
- **Linting** : ESLint
- **Gestionnaire de paquets** : pnpm

## Prérequis

- Node.js version 18 ou supérieure
- pnpm (recommandé) ou npm
- Un compte Supabase avec une base de données configurée

## Installation et configuration

1. **Cloner le repository** :
   ```bash
   git clone <url-du-repository>
   cd utblearn-admin
   ```

2. **Installer les dépendances** :
   ```bash
   pnpm install
   ```

3. **Préparer l'environnement Nuxt** :
   ```bash
   pnpm run postinstall
   ```

4. **Configurer les variables d'environnement** :
   Créer un fichier .env à la racine du projet avec les variables suivantes :

   ```env
   # Configuration Supabase
   NUXT_SUPABASE_URL=https://votre-projet.supabase.co
   NUXT_SUPABASE_ANON_KEY=votre-cle-anonyme
   SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
   ```

5. **Démarrer le serveur de développement** :
   ```bash
   pnpm dev
   ```

   L'application sera accessible sur `http://localhost:3000`.

## Variables d'environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `NUXT_SUPABASE_URL` | URL de votre projet Supabase | Oui |
| `NUXT_SUPABASE_ANON_KEY` | Clé anonyme Supabase pour les opérations client | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase pour les opérations serveur | Oui |

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `pnpm dev` | Démarre le serveur de développement |
| `pnpm build` | Construit l'application pour la production |
| `pnpm preview` | Prévisualise la version de production localement |
| `pnpm postinstall` | Prépare l'environnement Nuxt après installation |
| `pnpm lint` | Exécute le linter ESLint |
| `pnpm typecheck` | Vérifie les types TypeScript |

## Structure du projet

```
utblearn-admin/
├── app/                          # Pages et composants Vue
│   ├── components/               # Composants réutilisables
│   │   ├── agents/              # Composants pour la gestion des agents
│   │   ├── modules/             # Composants pour les modules
│   │   ├── settings/            # Composants des paramètres
│   │   └── ...
│   ├── layouts/                 # Layouts de l'application
│   ├── pages/                   # Pages de l'application
│   │   ├── agents.vue           # Gestion des agents
│   │   ├── modules/             # Pages liées aux modules
│   │   ├── settings/            # Pages des paramètres
│   │   └── ...
│   ├── types/                   # Types TypeScript
│   └── composables/             # Composables Vue
├── server/                      # API et utilitaires serveur
│   ├── api/                     # Endpoints API
│   │   ├── agent/               # API agents
│   │   ├── module/              # API modules
│   │   ├── service/             # API services
│   │   └── ...
│   └── utils/                   # Utilitaires serveur
├── public/                      # Assets statiques
├── .nuxt/                       # Fichiers générés par Nuxt
├── node_modules/                # Dépendances
├── nuxt.config.ts               # Configuration Nuxt
├── package.json                 # Dépendances et scripts
├── tsconfig.json                # Configuration TypeScript
└── README.md                    # Ce fichier
```

## Endpoints API disponibles

### Gestion des agents
- `GET /api/agent` - Liste tous les agents
- `POST /api/agent/create` - Crée un nouvel agent
- `PATCH /api/agent/update` - Met à jour un agent
- `PATCH /api/agent/soft-delete` - Supprime doucement un agent
- `PATCH /api/agent/{id}/activate` - Active un agent
- `PATCH /api/agent/{id}/deactivate` - Désactive un agent

### Gestion des modules
- `GET /api/module` - Liste tous les modules
- `GET /api/module/{id}` - Récupère un module spécifique
- `POST /api/module/create` - Crée un nouveau module
- `PATCH /api/module/update` - Met à jour un module
- `PATCH /api/module/publish` - Publie un module
- `PATCH /api/module/{id}/unpublish` - Retire un module
- `PATCH /api/module/{id}/republish` - Republie un module
- `PATCH /api/module/soft-delete` - Supprime doucement un module

### Gestion des cours
- `GET /api/cours/{moduleId}` - Liste les cours d'un module
- `POST /api/cours/create` - Crée un nouveau cours
- `PATCH /api/cours/update` - Met à jour un cours
- `PATCH /api/cours/reorder` - Réordonne les cours
- `DELETE /api/cours/delete` - Supprime un cours

### Gestion des quiz et questions
- `GET /api/quiz/{coursId}` - Liste les quiz d'un cours
- `POST /api/quiz/create` - Crée un nouveau quiz
- `PATCH /api/quiz/update` - Met à jour un quiz
- `DELETE /api/quiz/delete` - Supprime un quiz
- `GET /api/question/{quizId}` - Liste les questions d'un quiz
- `POST /api/question/create` - Crée une nouvelle question
- `PATCH /api/question/update` - Met à jour une question
- `DELETE /api/question/delete` - Supprime une question

### Gestion des réponses
- `GET /api/reponse/{questionId}` - Liste les réponses d'une question
- `POST /api/reponse/create` - Crée une nouvelle réponse
- `PATCH /api/reponse/update` - Met à jour une réponse
- `DELETE /api/reponse/delete` - Supprime une réponse

### Gestion des catégories (tags)
- `GET /api/tag` - Liste toutes les catégories
- `POST /api/tag/create` - Crée une nouvelle catégorie
- `PATCH /api/tag/update` - Met à jour une catégorie
- `PATCH /api/tag/soft-delete` - Supprime doucement une catégorie

### Gestion des services
- `GET /api/service` - Liste tous les services
- `POST /api/service/addservice` - Crée un nouveau service
- `PATCH /api/service/{id}/activate` - Active un service
- `PATCH /api/service/{id}/deactivate` - Désactive un service
- `PATCH /api/service/soft-delete` - Supprime doucement un service

### Gestion des départements
- `GET /api/departement` - Liste tous les départements
- `POST /api/departement/adddepartement` - Crée un nouveau département
- `PATCH /api/departement/update` - Met à jour un département
- `PATCH /api/departement/soft-delete` - Supprime doucement un département

### Gestion des rôles
- `GET /api/role` - Liste tous les rôles
- `POST /api/role/addrole` - Crée un nouveau rôle
- `PATCH /api/role/update` - Met à jour un rôle
- `PATCH /api/role/soft-delete` - Supprime doucement un rôle

### Autres endpoints
- `GET /api/activity/recent` - Récupère les activités récentes
- `GET /api/notifications` - Liste les notifications
- `GET /api/members` - Liste les membres (statique)
