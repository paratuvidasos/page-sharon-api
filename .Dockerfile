# syntax=docker/dockerfile:1

# Fija exactamente la misma versión de Node para todo el equipo: dev, build y runtime.
# Cambiar de versión de Node en el futuro es editar este único número.
ARG NODE_VERSION=20.18.1

# ---------- deps: instala TODAS las dependencias (incluye devDependencies, hacen falta para compilar TS) ----------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build: compila TypeScript -> dist/ ----------
FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- prod-deps: node_modules solo de producción, para no arrastrar devDependencies a la imagen final ----------
FROM node:${NODE_VERSION}-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- dev: usada por docker-compose para desarrollo local con hot-reload ----------
FROM node:${NODE_VERSION}-bookworm-slim AS dev
ENV NODE_ENV=development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ---------- runtime: imagen final, mínima ----------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Usuario sin privilegios (la imagen base ya trae "node" con uid/gid 1000)
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node

COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node package.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
