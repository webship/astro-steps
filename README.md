<p align="center"><img src="https://raw.githubusercontent.com/webship/astro-steps/2.0.x/assets/logo.svg" alt="Astro logo" width="96"></p>

# astro-steps

A [webship-js](https://webship.co/docs/webship-js/2.0.x) step pack for
[Astro](https://astro.build) sites. It tests what Astro itself does: static
HTML with no JavaScript by default, islands and their client directives, view
transitions, optimized images, scoped styles, the 404 page, the sitemap and the
RSS feed. Combine it with webship-js's built-in steps in `.feature` files.

Published to npm as [`@webship-js/astro-steps`](https://www.npmjs.com/package/@webship-js/astro-steps).

## From nothing to a green run

What the machine needs: git and Node.js 22.12 or later with npm (Astro 7
asks for it). No container: the site is a static production build that
`astro preview` serves.

**1. The site.** The demo site of this repository, built the way CI builds
it: the pages of [The demo site](#the-demo-site) with islands, view
transitions, optimized images, a content collection, the sitemap and the RSS
feed. Leave `astro preview` running in its own terminal (run by an AI coding
agent, Astro 7 starts it in the background by itself; `npx astro preview stop`
stops it).

```bash
git clone https://github.com/webship/astro-steps.git
cd astro-steps/demo
npm ci
npm run build
npx astro preview --port 4321
```

The site answers at `http://localhost:4321`.

In the [Webship Workspace](https://github.com/webship/workspace), its Astro
plugin makes the same demo from this repository (as the template of a new
site), builds it and serves the production build in a container with the
Node.js Astro asks for, so the machine needs no Node.js 22 for the site. In a
sites folder of the workspace (`test/` here; `dev/`, `sandboxes/` and `demos/`
work the same):

```bash
bash core/scripts/plugins.sh --require astro --with-needs
bash core/scripts/plugins.sh --activate astro --with-needs
bash core/scripts/plugins.sh --install astro
bash test/cmd-astro-project.sh mysite --install --template webship/astro-steps/demo
```

That site answers at `https://mysite.ddev.site` (step 5); the first feature
and the features of [`tests/features/`](tests/features/) pass on it.

**2. A test project**, in another terminal:

```bash
mkdir astro-tests && cd astro-tests
npm init -y
npm install --save-dev webship-js @webship-js/astro-steps
npx init-webship-js
```

`npx init-webship-js` writes `cucumber.js`, `playwright.config.ts`, the
`tests/` folders with a first feature and the `npm test` scripts, and installs
Chromium. npm usually runs it already when it installs webship-js; a second
run changes nothing.

**3. `cucumber.js`.** Replace the file with the wiring of the pack: the step
files of webship-js and the entry file of the pack, and the address of the
site. The suite needs no account (see [Test users](#test-users)).

```javascript
module.exports = {
  default: {
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',
      'node_modules/@webship-js/astro-steps/tests/step-definitions/astro.steps.js',
      'tests/step-definitions/**/*.js',
    ],
    paths: ['tests/features/**/*.feature'],
    format: ['@cucumber/pretty-formatter', 'json:tests/reports/cucumber_report.json'],
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'http://localhost:4321',
      // The waits webship-js adds around each page, scenario and step (milliseconds).
      minWaitTime: { page: 3000, before_scenario: 0, after_scenario: 0, before_step: 0, after_step: 0 },
    },
  },
};
```

**4. A first feature**, `tests/features/first-run.feature`:

```gherkin
Feature: First run
  Scenario: The home page is a production build
    Given I am on the homepage
    Then the site should be a production build
    And the page generator version should start with "7"

  Scenario: The islands hydrate as their directives say
    Given I am on "/islands/"
    Then the page should have 4 islands
    And the "client:load" island should be hydrated
```

**5. Run it.**

```bash
npm test
```

(`LAUNCH_URL=https://mysite.ddev.site npm test` for a site at another address.)
A green first run prints every step, then the summary (the starter feature of
`npx init-webship-js` and the two scenarios above, passed) and the HTML report
it wrote:

```
3 scenarios (3 passed)
8 steps (8 passed)
0m01.843s (executing steps: 0m01.811s)
[webship-js] HTML report → …/astro-tests/tests/reports/cucumber_report.html
```

From there, copy the features of [`tests/features/`](tests/features/) (they
also ship in the package, under
`node_modules/@webship-js/astro-steps/tests/features/`): together they use
every step of the pack, against the pages of [the demo site](#the-demo-site).

### What the suite tests

The features of this repository run every step of the pack against the demo
site's production build, and CI builds it and runs them on every change: the
build itself (the generator, a production build and not the development
server, the 404 page it wrote, the sitemap and the RSS feed of
@astrojs/sitemap and @astrojs/rss); pages with no JavaScript at all and pages
that ship only what they ask for; islands (each client directive hydrating
when it should, a hydrated island responding, a component without a
directive staying plain HTML) and scoped styles; view transitions (links and
the back button without a full page reload, the router's events, the
direction of a transition, an element that persists, the route announcer, an
animated area, prefetching a link under the mouse); optimized images of
`astro:assets` (dimensions, lazy loading, modern formats, loaded in the
browser); a content collection (its list, a page built from an entry, a draft
that is not built); the navigation; a form; the custom 404 page; and the
structural and serious accessibility checks of the main pages.

Not tested: server-side rendering (`output: 'server'`), actions, the
middleware, sessions and anything else that needs an adapter and a running
server; other UI frameworks than Preact for the islands; `astro dev` (the
pack refuses it on purpose); internationalised routes. A run leaves nothing:
the site is static.

## Install in your own project

```bash
npm install --save-dev webship-js @webship-js/astro-steps
```

Add the entry file to `require` in your `cucumber.js`:

```javascript
module.exports = {
  default: {
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',                      // webship-js core steps
      'node_modules/@webship-js/astro-steps/tests/step-definitions/astro.steps.js',  // this pack
      'tests/step-definitions/**/*.js',                                              // your own steps, if any
    ],
    paths: ['tests/features/**/*.feature'],
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'https://your-astro-site.example',
    },
  },
};
```

Point `LAUNCH_URL` at a **production build**: `astro build`, served by
`astro preview` or any static host. `astro dev` adds a toolbar, the Vite client
and different image addresses; the step "the site should be a production build"
tells you at once when the wrong server is behind `LAUNCH_URL`.

## Test users

None. The suite tests a production build (`astro build`, served by
`astro preview`), which has no sign-in: `cucumber.js` lists no accounts (its
`worldParameters` has no `users`), no scenario logs in, and the demo site of
[`demo/`](demo/README.md) has no account to create. The JSON of the accounts
is empty:

```json
{}
```

## Steps

Every Then step takes `should` or `should not`, every step takes `I`, `we` or
no pronoun, and every failure is a message with a hint, never a raw assertion
or Playwright stack. Each assertion polls its condition for the
`minWaitTime.page` budget (at least 10 seconds). Each step is documented in its
step file with five examples.

### The build (`astro-site.steps.js`)

| Step | What it relies on in Astro |
| --- | --- |
| `the page generator should( not) (be\|start with\|contain) "Astro"` | `<meta name="generator" content="Astro v7.x.y">` (`Astro.generator` in the layout); the name is a value of the step |
| `the page generator version should( not) (be\|start with) "7.4"` | the first number of the generator meta tag, matched by whole parts from its start |
| `the site should( not) be a production build` | `astro dev` adds `script[src*="/@vite/client"]`, `astro-dev-toolbar` and `data-astro-source-file` |
| `the page should( not) ship JavaScript` | the HTML the server sent has no executable `<script>` and no `<astro-island>`; Astro sends none unless a directive, `<ClientRouter />` or a script asks for it |
| `the page should( not) have scoped styles` | elements of a component with a `<style>` carry `data-astro-cid-<hash>` |
| `the 404 page should( not) be available` | `404.html`, built from `src/pages/404.astro` |
| `the sitemap should( not) list "/about/"` | `sitemap-index.xml` and the sitemaps it points at (@astrojs/sitemap); the path of every address is compared |
| `the RSS feed( at "/rss.xml") should be valid` | `<rss>` with a channel title and items (@astrojs/rss) |
| `the RSS feed( at "/rss.xml") should( not) list "title"` | the item titles |
| `the page title should( not) end with "\| Site"` | the end of `document.title` |

### Navigation (`astro-navigation.steps.js`)

| Step | What it checks |
| --- | --- |
| `I should( not) see a navigation menu with the following links:` | links of the page's `<nav>` by text (the link whose whole text it is, else one that contains it), and optionally part of the `href` (a table with `text` and `path`) |
| `all navigation links should resolve successfully` | every `<nav>` link answers below 400 |

### Islands (`astro-islands.steps.js`)

| Step | What it relies on in Astro |
| --- | --- |
| `the page should have 4 islands` / `should not have any islands` | `<astro-island>` elements; a component without a client directive is plain HTML |
| `the "client:visible" island should( not) be hydrated` | an island has the attribute `ssr` until its component has hydrated, then Astro removes it; `client:load`, `client:idle`, `client:visible`, `client:media` and `client:only` hydrate at different times |

### View transitions and prefetching (`astro-routing.steps.js`)

| Step | What it relies on in Astro |
| --- | --- |
| `the page should( not) use view transitions` | `<ClientRouter />` writes `<meta name="astro-view-transitions-enabled" content="true">` |
| `I click the link "text" without a full page reload` | after `astro:page-load` the router swaps the document; a marker on `window` survives it and not a page load, and `astro:page-load` fires again |
| `I go back without a full page reload` | the same for the back button |
| `the "astro:page-load" event should( not) have fired` | the five router events, recorded from the start of every document |
| `the last transition should have gone "forward"` | `data-astro-transition="forward"` or `"back"` on `<html>` during the swap |
| `the persistent elements should( not) have been kept` | `transition:persist` elements (`data-astro-transition-persist`) are moved, not recreated |
| `the "main" element should( not) have a view transition` | `transition:animate` / `transition:name` put `data-astro-transition-scope` on the element |
| `the page should( not) have a route announcer` | `.astro-route-announcer` with `aria-live`, added after the first navigation |
| `the route announcer should( not) announce "title"` | the announcer says the title of the new page |
| `the page "/about/" should( not) be prefetched` | `<link rel="prefetch">` after a hover (or a viewport prefetch), or a `speculationrules` script |

### Images (`astro-images.steps.js`)

| Step | What it relies on in Astro |
| --- | --- |
| `I should( not) see an optimized image` | an `<img>` served from `/_astro/` (`astro:assets`) |
| `every optimized image should have a width and a height` | Astro writes the dimensions of the imported image |
| `every optimized image should( not) load lazily` | `loading="lazy"` and `decoding="async"`, the defaults |
| `the optimized image should( not) offer the "avif" format` | one `<source type="image/...">` per format of `<Picture formats>` |
| `every optimized image should( not) be loaded` | the image is decoded in the browser |

Not covered: server-side rendering (`output: 'server'`), actions and the
middleware, which need an adapter and a running server rather than a static
build.

`npm run test:examples` checks that every example matches its own step (and no
webship-js core step) and that every feature step is defined exactly once; CI
runs it before the suite.

## The demo site

`demo/` is a small Astro site, the fixture of the suite. It is built with
`astro build` and served with `astro preview`, which is what CI does. See
[demo/README.md](demo/README.md) for its pages. It uses Astro 7, Preact for the
islands, @astrojs/sitemap, @astrojs/rss, a content collection of posts (one of
them a draft) and `<ClientRouter />`.

## Running locally

Requires Node.js 22.12 or later (Astro 7).

```bash
npm install
npx playwright install chromium
(cd demo && npm ci && npm run build && npx astro preview --port 4321 &)
npm test                      # LAUNCH_URL defaults to http://localhost:4321
```

### Lanes, subsets and the settings webship-js reads

- `npx cucumber-js tests/features/homepage.feature` runs one feature and `npx cucumber-js tests/features/homepage.feature:<line>` one scenario (the line of its `Scenario:`; the paths of `cucumber.js` are left out when the command line names any, and `npm run test:paths` checks it); `FEATURES=tests/features/a.feature,tests/features/b.feature npm test` runs a subset of the feature files too; `CUCUMBER_TAGS=@critical npm test` runs a tag lane (the default run leaves `@wip` out).
- `cucumber.js` carries the `video` block (`WEBSHIP_VIDEO=on-failure` records the browser) and the `javascript` block (`WEBSHIP_JS_ERROR_MODE=fail` fails a scenario on a JavaScript error; `@js-off` silences one scenario) that webship-js reads.
- The step timeout is webship-js's own (45 seconds, set when it loads); `WEBSHIP_STEP_TIMEOUT=<milliseconds>` changes it, a `timeout` key in `cucumber.js` does not.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the identity and the branching rules.
See [tests/features/README.md](tests/features/README.md) for the feature files.

## License

[MIT](LICENSE)

## Logo

The Astro logo in this README comes from Simple Icons 16.37.0 (CC0-1.0), filled with the colour the set lists for the brand. The Astro name and logo are trademarks of their owner; this pack is not affiliated with or endorsed by them.
