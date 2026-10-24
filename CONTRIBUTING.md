# Contributing

## Set up

Follow the [README](README.md#getting-started) for Hugo Extended or Docker setup.
Run commands below from the repository root. Keep changes scoped to one purpose
and avoid unrelated formatting changes to the historical archive.

## Content changes

1. Find the relevant Markdown file under `site/content/` and review nearby pages
   for front matter and shortcode conventions.
2. Preserve existing dates, slugs, explicit URLs, aliases, author information, and
   media paths unless correcting them is the purpose of the change. Post URLs
   include the title by default, so even a title edit can break historical links.
3. For new content, use the default archetype, for example:

   ```sh
   hugo new content --source site posts/my-post.md
   ```

   It starts with `draft: true`. Add metadata consistent with neighbouring posts
   and set `draft: false` only when ready to publish.
4. Reuse shortcodes from `site/themes/etQuadro/layouts/shortcodes/` for supported
   media. Check their parameters rather than inventing a new embed format.
5. Preview with `hugo server --source site --buildFuture --buildDrafts`. Check the
   rendered page, images, links, and any audio or embedded media you changed.

New static files belong in `site/static/` or the theme's `static/` directory as
appropriate. Keep existing `wp-content/uploads/` paths intact. Do not commit
downloaded audio or other third-party material without checking permissions;
audio may be hosted separately at `media.electrotrash.co.za`.

## Theme changes

The custom theme is maintained in `site/themes/etQuadro/`:

- `layouts/`: page templates, partials, render hooks, and shortcodes.
- `assets/`: CSS, Sass, and JavaScript processed by Hugo.
- `static/`: assets copied unchanged, including bundled legacy libraries.

Check for site-level overrides in `site/layouts/`. Follow the style of the files
you touch, preserve library licence notices, and avoid hand-editing minified
vendor code when a source-level change is possible. Do not edit generated files
in `site/public/` or `site/resources/_gen/`.

For shared template or asset changes, preview the homepage, an archived post,
and relevant download/gallery pages. Exercise search or audio controls when
those features are affected, and check the browser console for errors.

## Validate and submit

- Run the [production build](README.md#production-build).
- Run `python3 tests/archive_test.py` to catch missing local assets and obsolete
  local download endpoints. Keep archive notes for unavailable originals explicit.
- For site or container changes, build and run the Docker image and perform the
  [HTTP smoke checks](README.md#validation). CI performs these checks, but not a
  full external-link audit. Run the browser regression tests documented in the
  README for interactive changes; CI also runs them against the container.
- Run `git diff --check` and inspect `git status --short`. Exclude generated
  output, local migration material, and credentials.
- In your pull request, describe the reason for the change, affected pages or
  URLs, and commands/checks you ran. Include screenshots for visual changes and
  call out checks you could not run or broken external links you encountered.

Coolify builds the root Dockerfile and routes traffic to container port 80.
Review container, domain, TLS, proxy, and media-host changes separately. Do not
deploy, change live Coolify settings, or modify live media as an incidental part
of a content or theme update. Never commit deployment credentials.

For bug reports, include the affected URL, reproduction steps, expected and
actual behaviour, and relevant browser or build errors. Never include secrets
in an issue or pull request.
