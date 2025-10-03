# api/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Ensure schema exists before generate
COPY prisma ./prisma

# ✅ Provide a dummy DATABASE_URL for prisma generate
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
ENV DATABASE_URL=${DATABASE_URL}

# Copy the rest (src, tsconfig, etc.) after prisma folder is in place
COPY . .

# Generate client, build, then prune dev deps
RUN npm run prisma:generate
RUN npm run build && npm prune --production

# --- runtime stage unchanged ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
