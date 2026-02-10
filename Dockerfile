FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY client/package*.json ./client/
RUN cd client && npm ci

COPY . .
RUN cd client && npm run build

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node", "server/src/index.js"]
