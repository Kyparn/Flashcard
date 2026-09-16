FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV EXPO_NO_TELEMETRY=1
RUN npm run build:web

FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/data/catalog.json ./src/data/catalog.json
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV DATA_DIR=/data
EXPOSE 3001
CMD ["node", "server/index.cjs"]
