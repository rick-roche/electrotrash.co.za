# Build the Hugo static site
FROM ghcr.io/gohugoio/hugo:v0.168.0 AS builder

USER root
WORKDIR /src
RUN chown hugo:hugo /src
COPY --chown=hugo:hugo site/ ./

USER hugo
RUN hugo --gc --minify --buildFuture --cleanDestinationDir

# Serve generated files with Nginx
FROM nginx:stable-alpine

COPY --from=builder /src/public/ /usr/share/nginx/html/

EXPOSE 80
