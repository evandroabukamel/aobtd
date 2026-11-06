# Uma imagem para os dois processos (API+site e coletor MCP); o comando escolhe qual roda.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
COPY apps/collector/package.json apps/collector/
COPY apps/web/package.json apps/web/
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/packages/core/package.json /app/packages/core/
COPY --from=build /app/packages/core/dist packages/core/dist
COPY --from=build /app/packages/core/migrations packages/core/migrations
COPY --from=build /app/apps/api/package.json apps/api/
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/collector/package.json apps/collector/
COPY --from=build /app/apps/collector/dist apps/collector/dist
COPY --from=build /app/apps/web/dist apps/web/dist
USER node
CMD ["node", "apps/api/dist/index.js"]
