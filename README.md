# electrotrash.co.za

The source for [electrotrash.co.za](https://electrotrash.co.za), a South African
electronic music site. This repository migrates the original WordPress site to
a static site built with [Hugo](https://gohugo.io/), preserving historical posts,
downloads, galleries, and the site's custom look.

The `etQuadro` theme lives in this repository. Hugo generates the HTML, RSS feeds,
and a JSON search index used by Lunr.js. Audio is also served from
`https://media.electrotrash.co.za/`; a local build does not mirror that service.

## Getting started

Install **Hugo Extended v0.168.0**, matching the version in the [Dockerfile](Dockerfile).
The Extended edition is needed for the theme's Sass assets. Alternatively, use
Docker to build and run the site without installing Hugo locally.

Clone the repository and run these commands from its root:

```sh
git clone https://github.com/rick-roche/electrotrash.co.za.git
cd electrotrash.co.za
hugo server --source site --buildFuture
```

Open <http://localhost:1313>. Hugo rebuilds as source files change. Add
`--buildDrafts` when previewing draft content; drafts are not included in the
production build. External media and embeds may require an internet connection.

There is no separate npm install or frontend bundler step.

## Production build

```sh
hugo --source site --gc --minify --buildFuture --cleanDestinationDir
```

The generated site is written to `site/public/`. This uses the same build flags
as the Docker image, including future-dated content. `--cleanDestinationDir`
cleans the output directory: do not point it at a directory containing source
files or other work.

### Run with Docker

With Docker running:

```sh
docker build --tag electrotrash:local .
docker run --rm --publish 127.0.0.1:8080:80 electrotrash:local
```

Open <http://localhost:8080>. The multi-stage image builds the site with Hugo and
serves the result with Nginx. This is a production-style preview, not a live-reload
development server; rebuild the image after changing source files.

## Repository layout

| Path | Purpose |
| --- | --- |
| `site/config.toml` | Site URL, permalinks, taxonomies, outputs, and media base URL |
| `site/content/` | Markdown content and front matter |
| `site/archetypes/` | Defaults for new content |
| `site/data/` | Data available to Hugo templates |
| `site/static/` | Files copied unchanged, including historical WordPress uploads |
| `site/layouts/` | Site-level template overrides (currently empty) |
| `site/themes/etQuadro/` | Custom templates, shortcodes, styles, scripts, and theme assets |
| `site/staticwebapp.config.json` | Azure Static Web Apps configuration |
| `infra/` | Azure Bicep templates for a static web app and media blob storage |
| `.github/workflows/ci.yml` | Docker build and HTTP smoke tests |
| `Dockerfile` | Hugo build and Nginx runtime |

`site/public/`, `site/resources/_gen/`, and `site/.hugo_build.lock` are generated
and ignored by Git. `cleanup/` and `.wip/` are ignored local migration/work areas,
not prerequisites for building the site.

## Validation

[CI](.github/workflows/ci.yml) runs on pushes and pull requests targeting `main`
and `migrate-from-wp`, and can also be triggered manually. It builds the Docker
image and checks that:

- the homepage responds successfully;
- `/2009/11/03/don-diablo-is-never-too-late/` remains accessible;
- `/js/jquery/jquery.min.js` is served;
- a nonexistent page returns HTTP 404.

To check the successful responses locally, leave the Docker container running
and use a second terminal:

```sh
curl --fail http://localhost:8080/ --output /dev/null
curl --fail http://localhost:8080/2009/11/03/don-diablo-is-never-too-late/ --output /dev/null
curl --fail http://localhost:8080/js/jquery/jquery.min.js --output /dev/null
curl --silent --output /dev/null --write-out '%{http_code}\n' http://localhost:8080/this-page-should-not-exist/
```

The last command should print `404`. Also preview affected pages in a browser
when changing content, layout, search, galleries, or audio playback. These smoke
tests do not validate every page or external media URL.

An optional [htmltest configuration](site/.htmltest.yml) is present. If you have
`htmltest` installed, run `cd site` followed by `htmltest` after building. It checks
external links, disables internal-link checks, and ignores URLs matching
`electrotrash.co.za`. It is not run by the current CI workflow, and archived
external links may no longer resolve.

## Hosting and infrastructure

The repository includes Azure Bicep templates for Static Web Apps, a storage
account, and a public `music` blob container. See [infra/main.bicep](infra/main.bicep)
for parameters and outputs. These templates are distinct from the Docker/Nginx
runtime; the current GitHub Actions workflow **only builds and tests**, and does
not deploy either hosting option or upload media.

Infrastructure changes require appropriate Azure access and an explicit review
of credentials, public access, and resource changes. Never commit repository
tokens or other secrets. The templates alone do not establish the live site's
current deployment process.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for content and theme changes, and
[AGENTS.md](AGENTS.md) for coding-agent guidance. Preserve historical URLs and
media paths when maintaining the archive.

## Licence and third-party material

The repository includes an [MIT licence](LICENSE). Bundled third-party libraries
retain their own notices and licence terms. Do not assume that the repository's
software licence grants rights to redistribute music, photography, artwork, or
other third-party editorial material; check the relevant permissions separately.
