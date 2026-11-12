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

The default branch is `2.0.x`. Every change starts with an issue and goes in
through one pull request that says `Closes #N`, with the Checkpoints list at
the end. Only one pull request is open at a time; the next one is opened after
the previous one is merged on green CI.

## Project conventions

- This is both a self-contained webship-js test project and the
  `@webship-js/astro-steps` npm package: `package.json` publishes only
  `tests/step-definitions/*.js` plus the README and LICENSE.
- Custom webship-js step definitions live in `tests/step-definitions/`:
  `astro.steps.js` is the entry file and requires the other step files.
- The `demo/` Astro site is a test fixture only, not meant to be
  deployed. CI builds it with `astro build` and serves the production build
  with `astro preview` before running the test suite against it (see
  [.github/workflows/test.yml](.github/workflows/ci.yml)).
