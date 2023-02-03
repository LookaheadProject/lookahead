# syntax=docker/dockerfile:1
FROM node:18-slim AS build
ENV NODE_ENV production

# https://github.com/wojtekmaj/react-pdf/issues/496#issuecomment-566200248
ENV GENERATE_SOURCEMAP false

RUN apt-get update && apt-get install -y python3 build-essential

WORKDIR /usr/src/lookahead
COPY package.json ./
COPY server/package.json server/yarn.lock server/
COPY client/package.json client/yarn.lock client/

# https://stackoverflow.com/questions/65913706/how-do-i-make-yarn-cache-modules-when-building-containers
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn ci

COPY . .

# https://github.com/wojtekmaj/react-pdf/issues/496#issuecomment-566200248
RUN yarn build

# CMD yarn run prod

FROM node:18-alpine
ENV NODE_ENV production
EXPOSE 5000

WORKDIR /usr/src/lookahead

COPY --from=build /usr/src/lookahead/server/dist/ server/dist/
COPY --from=build /usr/src/lookahead/client/dist/ client/dist/
COPY --from=build /usr/src/lookahead/package.json ./

WORKDIR /usr/src/lookahead/server
CMD [ "node", "dist/server.cjs" ]