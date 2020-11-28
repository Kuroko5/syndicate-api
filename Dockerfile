FROM mhart/alpine-node:10 as builder
## Upgrade musl package for Vulnerability Advisor
RUN apk update && apk upgrade musl
## Install build toolchain, install node deps and compile native add-ons
RUN apk add --no-cache --virtual builds-deps build-base python
RUN npm config set python /usr/bin/python

WORKDIR /node-app
COPY package*.json ./

RUN npm install
RUN npm rebuild bcrypt --build-from-source
RUN apk del builds-deps

COPY . .
FROM mhart/alpine-node:10 as app
WORKDIR /node-app
RUN apk update && apk upgrade musl libstdc++
## Copy build node modules and binaries without including the toolchain
COPY --from=builder /node-app /node-app
CMD ["npm","start"]
EXPOSE 3000