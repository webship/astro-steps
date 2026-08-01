# Astro Steps Demo Site

A minimal [Astro](https://astro.build) site used as the test fixture for the
[Astro-steps](../README.md) webship-js test project. It has a handful of main
pages (home, about, blog index + 2 posts, contact form, 404) so the custom
step definitions and feature files have real pages to exercise.

## Pages

| Path                  | Purpose                                              |
| ---------------------- | ----------------------------------------------------- |
| `/`                     | Home page with navigation links                       |
| `/about/`               | Static content page                                   |
| `/blog/`                | Blog index listing posts                              |
| `/blog/hello-world/`    | Sample blog post                                      |
| `/blog/astro-steps/`    | Sample blog post                                      |
| `/contact/`             | A form (name, email, message) for testing form steps  |
| `/nonexistent`          | Falls through to the custom `404.astro` page          |

## Running locally

### Option 1: Plain Node

```sh
cd demo
npm install
npm run dev
```

Serves the site at `http://localhost:4321`.

### Option 2: DDEV

No `.ddev/` config is committed to this repo (CI generates one on the
fly — see [.github/workflows/test.yml](../.github/workflows/test.yml)).
To run the demo site under DDEV locally, generate a config yourself:

```sh
cd demo
ddev config --project-type=generic --docroot=dist --webserver-type=generic
ddev start
ddev exec "npm install && npm run dev -- --host 0.0.0.0 --port 4321 &"
```

## Notes

`astro.config.mjs` sets `vite.server.allowedHosts: true` so the dev server
accepts requests from any hostname (e.g. a DDEV-routed one), not just
`localhost`. This site is a test fixture only — it is not meant to be
deployed.
