# 1. Giai đoạn cài đặt dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 2. Giai đoạn build ứng dụng Next.js
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js dạng standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Nhận các biến môi trường NEXT_PUBLIC_* truyền vào từ build-args (nếu có)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

RUN npm run build

# 3. Giai đoạn chạy ứng dụng tối ưu (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy các thư mục cần thiết từ builder
COPY --from=builder /app/public ./public

# Tự động cấp quyền sở hữu thư mục .next cho non-root user
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy output standalone và static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
