FROM node:22-slim AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-slim AS production

ENV NODE_ENV=production
ENV NODE_PATH=./build

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /home/node/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /home/node/app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /home/node/app/build ./build

USER node

CMD ["node", "build/src/index.js"]
