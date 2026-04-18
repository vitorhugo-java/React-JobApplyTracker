# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:8080
ARG VITE_BASE_PATH=/
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

RUN npm run build

# Stage 2: Serve
FROM nginx:1.27-alpine AS serve

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html/React-JobApplyTracker

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
