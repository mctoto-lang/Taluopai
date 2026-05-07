# Stage 1: Dependencies
FROM node:20-alpine AS deps

# Configure Alpine mirror (China)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies with China npm mirror
COPY package.json package-lock.json* ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder

# Configure Alpine mirror (China)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application with China npm mirror
RUN npm config set registry https://registry.npmmirror.com && \
    npm run build

# Prepare upload directory with only metadata.json (exclude images)
RUN mkdir -p /app/upload-dist/card-templates && \
    if [ -f /app/upload/card-templates/metadata.json ]; then \
        cp /app/upload/card-templates/metadata.json /app/upload-dist/card-templates/; \
    fi

# Stage 3: Runner
FROM node:20-alpine AS runner

# Configure Alpine mirror (China)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create directories for uploads and database
RUN mkdir -p /app/upload/card-templates /app/db

# Copy metadata.json from builder stage (if exists)
COPY --from=builder /app/upload-dist/card-templates ./upload/card-templates/

# Set ownership
RUN chown -R nextjs:nodejs /app/upload /app/db

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
