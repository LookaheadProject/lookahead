# syntax=docker/dockerfile:1
FROM node:18-slim
ENV NODE_ENV production
EXPOSE 5000

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
RUN NODE_OPTIONS="--max-old-space-size=4096" yarn build

CMD yarn run prod
