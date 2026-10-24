# Repository guidance

## Project and source locations

This is a Hugo migration of a historical South African electronic music site,
not a running WordPress application. Read `README.md` and `CONTRIBUTING.md` for
setup and contributor workflows.

- Content: `site/content/`; configuration: `site/config.toml`.
- Custom theme: `site/themes/etQuadro/`. Templates and shortcodes belong under
  its `layouts/`, processed assets under `assets/`, and copied files under `static/`.
- `site/layouts/` can override theme templates; inspect both locations before editing.
- `site/static/` contains historical uploads. WordPress-named asset directories
  are static compatibility assets, not evidence that PHP or WordPress is required.
- Azure templates: `infra/`; build and smoke tests: `.github/workflows/ci.yml`.

## Change constraints

- Preserve archive content, front matter, dates, slugs, explicit URLs, aliases,
  and media paths unless the task specifically requires changing them. Posts use
  `/:year/:month/:day/:title/`; title changes can change published URLs.
- Use existing shortcodes and neighbouring content as examples. Check template
  callers before changing shortcode parameters or shared assets.
- Do not edit generated `site/public/`, `site/resources/_gen/`, or build locks.
  Do not use ignored `cleanup/`, `.wip/`, or `site/tmp/` as required build inputs.
- Avoid bulk reformatting archived Markdown, HTML, or bundled/minified libraries.
  Preserve third-party notices and do not infer media rights from `LICENSE`.
- Keep changes focused. Do not add a package manager or framework without a
  task-specific reason; Hugo currently builds the frontend directly.
- Do not deploy infrastructure, upload media, or commit credentials as part of a
  routine site change. CI currently builds and tests only.
- Check `git status` before editing and preserve unrelated user changes.

## Verification

Run commands from the repository root. Use Hugo Extended v0.168.0, matching
`Dockerfile`; no npm install is needed.

```sh
hugo --source site --gc --minify --buildFuture --cleanDestinationDir
docker build --tag electrotrash:local .
```

For changes affecting served output or the container, run the image and perform
the HTTP checks documented in `README.md`, matching the CI smoke tests. Browser
checks are also needed for visual or interactive changes (search, galleries,
audio). A successful Hugo build does not prove that external media works.

Before handing off, run `git diff --check`, review changed and untracked files,
and report exactly which checks ran and any failures or unavailable tools. Do
not claim Docker or browser checks passed if only the Hugo build was run.
