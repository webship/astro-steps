# Contributing / project rules

Rules for working on this repo (`webship/astro-steps`):

## Git identity

All commits are authored as:

```
Webship.co
```

Every commit made with AI assistance includes a `Co-Authored-By:`
trailer for the model that did the work, e.g.:

```
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

## Branching

This repo uses **one branch: `2.0.x`**. Commit directly to it — do not
create long-lived feature branches or open PRs against it. (An earlier
iteration used a stacked branch-per-issue + PR workflow; it was
collapsed back into a single branch on 2026-07-11 after GitHub's PR
auto-retargeting got tangled across the stack.)

## Project conventions

- This is both a self-contained webship-js test project and the
  `@webship-js/astro-steps` npm package: `package.json` publishes only
  `tests/step-definitions/astro.steps.js` plus the README and LICENSE.
- Custom webship-js step definitions live in a single file,
  `tests/step-definitions/astro.steps.js` — no `custom.js`.
- The `demo/` Astro site is a test fixture only, not meant to be
  deployed. CI installs DDEV fresh on the runner and uses it to build
  and serve the demo site before running the test suite against it
  (see [.github/workflows/test.yml](.github/workflows/test.yml)) —
  there is no committed `.ddev/` config.
