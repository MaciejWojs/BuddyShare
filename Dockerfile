# Etap 1: Budowanie
FROM oven/bun:1.2.15-alpine AS builder
WORKDIR /app

COPY . .
RUN bun install --frozen-lockfile

# Budowanie aplikacji Nuxt
RUN bun run build

# Etap 2: Produkcja
FROM oven/bun:1.2.15-alpine
WORKDIR /app

# Pobieranie zbudowanej aplikacji z poprzedniego etapu
COPY --from=builder /app/.output ./

# Ustawienie portu
EXPOSE 3000

# Uruchomienie aplikacji (skrypt "preview" package.json)
CMD ["bun", "run", "server/index.mjs"]