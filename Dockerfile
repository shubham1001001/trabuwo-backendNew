# 1) Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# If you have build step, keep it:
# RUN npm run build

# 2) Runtime stage
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app /app

EXPOSE 5000
CMD ["npm","start"]