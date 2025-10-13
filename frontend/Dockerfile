# syntax=docker/dockerfile:1
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/build ./build
RUN npm install -g serve
EXPOSE 5173
CMD ["serve", "-s", "build", "-l", "5173"]
