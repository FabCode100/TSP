# Stage 1: Build the Static Frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate --schema=src/prisma/schema.prisma
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/out ./out
COPY --from=builder /app/the-symbiotic-protocol-firebase-adminsdk-fbsvc-0effdcdda6.json ./

EXPOSE 3001
CMD ["npm", "run", "start:api"]
