# --- Build stage (собираем фронтенд) ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime stage (Express + API) ---
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# Только production-зависимости (express, pg и т.д. — pure JS, без нативной сборки)
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/index.mjs"]
