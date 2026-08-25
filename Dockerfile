# --- Étape build ---
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Pas de --frozen-lockfile : le lockfile a été généré sous Windows et ne
# contient pas le binaire natif Linux de rolldown (utilisé par Nuxt/Vite) —
# laisser pnpm résoudre les dépendances optionnelles pour la vraie
# plateforme de build évite l'erreur "Cannot find native binding".
RUN pnpm install

COPY . .
RUN pnpm run build

# --- Étape exécution ---
# Nitro (le serveur de Nuxt) produit un bundle autonome dans .output/ — pas
# besoin de réinstaller les dépendances dans l'étape finale.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3005

COPY --from=builder /app/.output ./.output

EXPOSE 3005
CMD ["node", ".output/server/index.mjs"]
