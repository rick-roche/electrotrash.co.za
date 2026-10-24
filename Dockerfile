# Build the Hugo static site
FROM ghcr.io/gohugoio/hugo:v0.168.0 AS builder

ARG HUGO_BASEURL=https://electrotrash.co.za
ARG HUGO_NOINDEX=false

USER root
WORKDIR /src
RUN chown hugo:hugo /src
COPY --chown=hugo:hugo site/ ./

USER hugo
RUN HUGO_NOINDEX="${HUGO_NOINDEX}" hugo --baseURL "${HUGO_BASEURL}" --gc --minify --buildFuture --cleanDestinationDir

# Serve generated files with Nginx
FROM nginx:stable-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/public/ /usr/share/nginx/html/

EXPOSE 80
