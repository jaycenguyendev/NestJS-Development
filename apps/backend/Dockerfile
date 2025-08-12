FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages

# Generate Prisma client
WORKDIR /app/apps/backend
RUN pnpm exec prisma generate

# Build the application
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]
