# syntax=docker/dockerfile:1
FROM node:14-slim
ENV NODE_ENV production
EXPOSE 5000

# https://github.com/wojtekmaj/react-pdf/issues/496#issuecomment-566200248
ENV GENERATE_SOURCEMAP false

WORKDIR /usr/src/lookahead
COPY package.json ./
COPY server/package.json server/
COPY client/package.json client/
# https://stackoverflow.com/questions/65913706/how-do-i-make-yarn-cache-modules-when-building-containers
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn ci

COPY . .
# https://github.com/wojtekmaj/react-pdf/issues/496#issuecomment-566200248
RUN NODE_OPTIONS="--max-old-space-size=4096" yarn build

CMD yarn run prod
