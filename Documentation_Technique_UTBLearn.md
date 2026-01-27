## 1. Vue d'ensemble

### Description du système
UTBLearn Admin est une interface d'administration web pour la plateforme de formation UTBLearn. Elle permet la gestion complète des utilisateurs, modules de formation, cours, quiz et statistiques. Développée avec Nuxt 3 et TypeScript, elle utilise Supabase comme backend pour la base de données, l'authentification et le stockage de fichiers.

### Architecture globale
L'application suit une architecture client-serveur :
- **Frontend** : Nuxt 3 (Vue 3) avec Nuxt UI pour l'interface utilisateur
- **Backend** : API serverless via Nuxt Server API, connectée à Supabase
- **Base de données** : PostgreSQL via Supabase
- **Stockage** : Supabase Storage pour les documents et images
- **Authentification** : Supabase Auth avec gestion des rôles

### Flux de données
1. L'utilisateur se connecte via Supabase Auth
2. Les données sont récupérées depuis l'API Nuxt (server/api/)
3. Les mutations passent par les endpoints API qui interagissent avec Supabase
4. Les fichiers sont uploadés vers Supabase Storage
5. Les activités sont loggées dans la table `activity_log`

## 2. Base de données

### Schéma des tables principales

#### Table `agent`
- **Rôle** : Stocke les informations des utilisateurs (agents)
- **Champs clés** : `id_agent`, `nom`, `prenom`, `email`, `actif`, `id_departement`, `id_service`
- **Relations** : FK vers `departement`, `service`, `role` (via `user_role`)

#### Table `module`
- **Rôle** : Contient les modules de formation
- **Champs clés** : `id_module`, `titre`, `description`, `publish`, `id_agent` (créateur)
- **Relations** : FK vers `agent`, liée à `cours`, `document`, `module_tag`, `module_service`

#### Table `cours`
- **Rôle** : Leçons au sein d'un module
- **Champs clés** : `id_cours`, `titre`, `description`, `documents` (array), `ordre`, `id_module`
- **Relations** : FK vers `module`

#### Table `quiz`
- **Rôle** : Évaluations associées aux cours
- **Champs clés** : `id_quiz`, `titre`, `id_cours`
- **Relations** : FK vers `cours`, liée à `question`

#### Table `role`
- **Rôle** : Définition des rôles utilisateur
- **Champs clés** : `id_role`, `designation`
- **Relations** : Table pivot `user_role` avec `agent`

#### Table `service` et `departement`
- **Rôle** : Organisation hiérarchique des agents
- **Champs clés** : `id_service`/`id_departement`, `designation`, `actif`
- **Relations** : FK dans `agent`

#### Table `document`
- **Rôle** : Fichiers associés aux modules
- **Champs clés** : `id_document`, `fichier` (chemin), `id_module`
- **Relations** : FK vers `module`

### Relations entre les tables
- `agent` → `departement` (many-to-one)
- `agent` → `service` (many-to-one)
- `agent` → `user_role` → `role` (many-to-many)
- `module` → `agent` (many-to-one, créateur)
- `module` → `cours` (one-to-many)
- `module` → `document` (one-to-many)
- `module` → `module_tag` → `tag` (many-to-many)
- `module` → `module_service` → `service` (many-to-many)
- `cours` → `quiz` (one-to-many)
- `quiz` → `question` → `reponse` (hiérarchie)

## 3. Backend (Supabase)

### Configuration Supabase
- **URL** : Configurée via `NUXT_SUPABASE_URL`
- **Clés** : `NUXT_SUPABASE_ANON_KEY` (client), `SUPABASE_SERVICE_ROLE_KEY` (serveur)
- **Client** : Créé via `createSupabaseServerClient` et `createSupabaseAdminClient`

### Tables et leur rôle
Voir section 2. Les tables utilisent des soft deletes (`deleted_at`) pour la plupart des entités.

### Storage (buckets)
- **module-images** : Images des descriptions de modules
- **documents** : Fichiers PDF/doc associés aux modules
- Upload géré via upload.post.ts

### Authentification
- Basée sur Supabase Auth
- Sessions gérées via `getUserSession`
- Rôles : SUPERADMIN, ADMIN, FORMATEUR, AGENT
- Vérification des rôles dans les composables comme `useAuth`

## 4. Interface Admin (Nuxt.js)

### Architecture des pages
- **Layout** : default.vue avec navigation basée sur les rôles
- **Pages principales** :
  - index.vue : Liste des modules
  - create.vue : Création de module
  - [`app/pages/modules/edit/[id].vue`](app/pages/modules/edit/[id].vue) : Édition multi-étapes
  - agents.vue : Gestion des agents
  - roles.vue : Gestion des rôles

### Endpoints API (server/api/)
- **Agents** : index.get.ts, soft-delete.patch.ts
- **Modules** : index.get.ts, create.post.ts, update.patch.ts
- **Cours** : [`server/api/cours/[moduleId].get.ts`](server/api/cours/[moduleId].get.ts)
- **Documents** : upload.post.ts, remove.delete.ts
- **Services/Départements** : index.get.ts, adddepartement.post.ts

### Gestion des modules, cours, quiz
- **Création** : Étapes dans create.vue avec éditeur Tiptap
- **Édition** : Multi-étapes avec Step2Cours.vue pour drag & drop des cours
- **Quiz** : Gestion via endpoints dédiés (non détaillés dans les extraits)

### Upload de fichiers
- Composant AddDocumentModal.vue
- Endpoint upload.post.ts
- Support des formats courants, stockage dans Supabase Storage

## 5. Sécurité

### Authentification
- Basée sur Supabase Auth avec JWT
- Middleware pour protéger les routes
- Sessions persistantes côté serveur

### Gestion des rôles
- Rôles hiérarchiques : SUPERADMIN > ADMIN > FORMATEUR > AGENT
- Vérifications dans default.vue pour masquer/afficher les menus
- Permissions granulaires (ex: seuls SUPERADMIN voient les rôles)

### Bonnes pratiques appliquées
- Soft deletes pour éviter la perte de données
- Validation des entrées avec Zod (ex: index.vue)
- Logs d'activité dans `activity_log` via `logActivity`
- Sanitisation des descriptions HTML avec Tiptap
- Gestion des erreurs avec `createError`

## 6. Déploiement

### Prérequis
- Node.js 18+
- Compte Supabase configuré
- Variables d'environnement définies

### Étapes de déploiement
1. **Build** : `pnpm build`
2. **Configuration Supabase** : Créer les tables via migrations ou scripts SQL
3. **Storage** : Configurer les buckets `module-images` et `documents`
4. **Auth** : Configurer les politiques RLS (Row Level Security)
5. **Déploiement** : Via Vercel/Netlify ou serveur Node.js
6. **Variables** : Définir `NUXT_SUPABASE_*` en production

### Scripts disponibles
- `pnpm dev` : Développement
- `pnpm build` : Production
- `pnpm preview` : Test local de la build
- `pnpm lint` : Vérification du code

Cette documentation couvre l'essentiel du système. Pour des détails spécifiques, consulter les fichiers sources liés.
