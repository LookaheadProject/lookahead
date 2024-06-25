# syntax=docker/dockerfile:1
# choose bookworm for Node v18 and Python 3.11 support

# build the client-side code
FROM node:18 AS build-client
ENV NODE_ENV=production

# https://github.com/wojtekmaj/react-pdf/issues/496#issuecomment-566200248
ENV GENERATE_SOURCEMAP=false

WORKDIR /usr/src/lookahead-client
COPY client/package.json client/package-lock.json .

# install packages
RUN npm install

COPY client/ .

# build
RUN npm run build

FROM python:3.11 AS build-server
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=true \
    POETRY_CACHE_DIR=/tmp/poetry_cache

RUN pip install poetry

WORKDIR /usr/src/lookahead-server
COPY server/pyproject.toml .

# install packages
RUN poetry install

COPY server/ .


FROM python:3.11 AS serve
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=true \
    POETRY_CACHE_DIR=/tmp/poetry_cache
EXPOSE 8096

RUN pip install poetry

WORKDIR /usr/src/lookahead

COPY --from=build-client /usr/src/lookahead-client client
COPY --from=build-server /usr/src/lookahead-server server

WORKDIR /usr/src/lookahead/server
RUN poetry install

WORKDIR /usr/src/lookahead/server
CMD [ "poetry", "run", "server" ]
