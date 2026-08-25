## Description

UTBLearn Admin est l'interface d'administration de la plateforme de formation UTBLearn. Elle permet de gérer les agents, les modules de formation, les cours, les quiz, les rôles/permissions, et de consulter les statistiques de suivi.

Développée avec **Nuxt 4** et **Nuxt UI**, l'application ne parle plus directement à Supabase : chaque route serveur (`server/api/**`) sert de **pont (bridge)** vers l'**API NestJS** `utblearn-api`, en y attachant le token Keycloak de l'agent connecté. L'authentification elle-même passe par **Keycloak** (Authorization Code, client confidentiel `utblearn-admin`), avec une session applicative Nuxt (cookie signé) côté navigateur.

## Fonctionnalités principales

- **Gestion des agents** : création, modification, activation/désactivation, suppression douce et **restauration d'agents archivés** (avec modification d'email pour libérer une adresse déjà prise)
- **Gestion des modules** : création et édition avec éditeur riche (Tiptap), upload vidéo par URL signée, association documents/catégories/départements
- **Gestion des cours, quiz, questions, réponses**
- **Gestion des rôles et permissions** (SUPERADMIN, ADMIN, FORMATEUR)
- **Gestion des directions, départements, catégories (tags)**
- **Suivi des activités** : journal d'audit
- **Statistiques et tableau de bord** : agents connectés en temps réel (ventilé admin/mobile), modules publiés, taux de réussite, progression par service
- **Notifications** : slideover de notifications internes

## Technologies utilisées

| Composant | Usage |
|---|---|
| Nuxt 4 (Vue 3) | Framework |
| TypeScript | Typage |
| Nuxt UI (Tailwind CSS) | UI/UX |
| Tiptap | Éditeur riche (contenu des cours, upload vidéo intégré) |
| Keycloak | Authentification (Authorization Code, session serveur signée) |
| API NestJS (`utblearn-api`) | Toutes les données — aucun accès direct à la base ou à Supabase |
| pnpm | Gestionnaire de paquets |

## Prérequis

- Node.js 18+
- pnpm
- L'API `utblearn-api` accessible
- Un realm Keycloak avec un client confidentiel `utblearn-admin` (Standard flow + Direct access grants activés, redirect URI enregistrée)

## Installation et configuration

```bash
git clone <url-du-repository>
cd dashboard
pnpm install
pnpm run postinstall
```

Créer un fichier `.env` à la racine :

```env
# API NestJS (utblearn-api)
NUXT_API_BASE_URL=http://localhost:3000/api/v1

# Realm Keycloak — même realm que l'API
NUXT_KEYCLOAK_ISSUER=https://<host-keycloak>/realms/utblearn

# Client Keycloak "utblearn-admin" (confidentiel, Standard flow +
# Direct access grants). Redirect URI à enregistrer côté Keycloak :
# http://localhost:3005/api/auth/callback en dev.
NUXT_KEYCLOAK_ADMIN_CLIENT_ID=...
NUXT_KEYCLOAK_ADMIN_CLIENT_SECRET=...

# Secret de signature du cookie de session (HMAC) — générer via
# `openssl rand -hex 32`, ne jamais versionner.
SESSION_SECRET=...
```

Démarrer :

```bash
pnpm dev
```

L'application est accessible sur `http://localhost:3005` (voir le port configuré dans `nuxt.config.ts`/script `dev`).

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `pnpm dev` | Démarre le serveur de développement |
| `pnpm dev:local` | Démarre avec `.env.local` |
| `pnpm build` | Construit l'application pour la production |
| `pnpm preview` | Prévisualise la version de production localement |
| `pnpm lint` | Exécute ESLint |
| `pnpm typecheck` | Vérifie les types TypeScript (`nuxt typecheck`) |
| `pnpm test:e2e` | Tests Playwright |

## Structure du projet

```
dashboard/
├── app/
│   ├── components/               # Composants par domaine (agents, modules, permissions...)
│   ├── layouts/
│   ├── pages/                    # Pages de l'application
│   ├── composables/
│   └── utils/
├── server/
│   ├── api/                      # Routes-pont vers l'API NestJS, par domaine
│   │   └── agent/, module/, quiz/, dashboard/, auth/...
│   ├── middleware/                # Vérification de session sur les routes protégées
│   └── utils/
│       ├── apiBridge.ts           # Point d'entrée unique : attache le token, retraduit les erreurs
│       └── keycloakAuth.ts        # Session Keycloak, rafraîchissement silencieux
├── nuxt.config.ts
└── package.json
```

## Fonctionnement du pont API (`server/utils/apiBridge.ts`)

Chaque route sous `server/api/**` suit le même schéma : récupérer un token Keycloak valide pour l'agent connecté (`getValidAccessToken`), appeler l'API NestJS correspondante, et retraduire une erreur `{statusCode, message}` NestJS en erreur Nuxt (`statusCode` + `statusMessage` **et** `message`, les deux étant lus selon les composants). Aucune route ne doit appeler l'API NestJS autrement que via `callApi()`.

## Domaines exposés (`server/api/`)

| Domaine | Contenu |
|---|---|
| `agent/` | CRUD, activation, réinitialisation mot de passe, agents archivés (restauration, modification email) |
| `module/`, `cours/`, `quiz/`, `question/`, `reponse/` | Contenu pédagogique, upload vidéo par URL signée |
| `document/` | Documents annexes |
| `departement/`, `direction/`, `autorite-superieure/` | Organisation |
| `tag/` | Catégories de modules |
| `role/`, `user-role/` | Rôles et attributions |
| `dashboard/` | Statistiques agrégées |
| `activity-log/`, `activity/` | Journal d'audit |
| `progression/` | Suivi de progression par module/agent |
| `auth/` | Login/callback/logout Keycloak, profil de session |

## Notes

- Le stockage de fichiers (documents, vidéos) passe par un service S3-compatible auto-hébergé (RustFS), jamais par un stockage propre à l'admin
- La restriction de certaines actions à SUPERADMIN (réinitialisation de mot de passe, restauration d'agent) est appliquée à la fois côté API (`@Roles`) et côté interface (visibilité conditionnelle)
