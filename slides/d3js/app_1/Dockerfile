# ---- build stage: compile the Vite + TypeScript app -------------------------
FROM node:20-alpine AS build
WORKDIR /app

# The data service URL is inlined into the bundle at build time (Vite reads any
# VITE_*-prefixed env var). The default works for the docker-compose setup.
ARG VITE_API_URL=http://localhost:8081
ENV VITE_API_URL=${VITE_API_URL}

# Install dependencies first; this layer is cached when only source changes.
COPY package.json package-lock.json ./
RUN npm ci

# Then the sources and the build.
COPY tsconfig.json vite.config.ts ./
COPY index.html ./
COPY src ./src
RUN npm run build

# ---- serve stage: a tiny nginx serving the built static files ---------------
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
