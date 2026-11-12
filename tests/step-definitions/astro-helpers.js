'use strict';

// Shared helpers for the Astro step files.
//
// Not a step file: it registers no step definitions, except the Before hook
// that records the client router's events. It holds the plumbing the step
// files use: the wait budget, polling, fetching a file of the site and
// friendly errors.
//
// What the steps rely on, from Astro (checked on Astro 7.4):
//
//   - A page is static HTML. Astro sends no JavaScript unless the page uses
//     a client directive, `<ClientRouter />`, or a script.
//   - An island is `<astro-island client="load|idle|visible|media|only">`. It
//     carries the attribute `ssr` until its component has hydrated, then
//     Astro removes it and dispatches `astro:hydrate` on the island.
//   - `<ClientRouter />` (view transitions) writes
//     `<meta name="astro-view-transitions-enabled" content="true">` and
//     replaces the document by itself on navigation. It fires
//     `astro:page-load` on the first load and on every navigation, and
//     `astro:before-preparation`, `astro:after-preparation`,
//     `astro:before-swap` and `astro:after-swap` around a navigation.
//   - Optimized images (`astro:assets`) are `<img src="/_astro/name.HASH.ext"
//     width height loading="lazy" decoding="async">`, in a `<picture>` with one
//     `<source type="image/...">` per format when a format list is given.

const { friendly } = require('webship-js/tests/step-definitions/webship');
const { Before } = require('@cucumber/cucumber');

/**
 * The per-assertion wait budget: `minWaitTime.page` from cucumber.js, and at
 * least 10 seconds, because islands hydrate after the load.
 *
 * @param {object} world
 * @returns {number}
 */
function budget(world) {
  return Math.max((world.minWaitTime && world.minWaitTime.page) || 0, 10000);
}

/**
 * Escape a literal string for use inside a RegExp.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Poll a condition evaluated in Node until it holds or the budget is spent.
 *
 * @param {object} world
 * @param {() => Promise<boolean>} condition
 * @param {number} [timeout]
 * @returns {Promise<boolean>}
 */
async function poll(world, condition, timeout = budget(world)) {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (await condition()) return true;
    if (Date.now() >= deadline) return false;
    await world.page.waitForTimeout(100);
  }
}

/**
 * Run an action and turn a Playwright error into a friendly one.
 *
 * @param {string} action
 * @param {string} target
 * @param {string} hint
 * @param {() => Promise<*>} fn
 */
async function actOrExplain(action, target, hint, fn) {
  try {
    return await fn();
  } catch (cause) {
    throw friendly({ action, target, cause, hint });
  }
}

/**
 * Fetch a file of the site, relative to the current page, with the browser
 * context's request client. Resolves with `{ url, status, type, text }`.
 *
 * @param {object} world
 * @param {string} path
 * @param {string} hint
 */
async function fetchSiteFile(world, path, hint) {
  const url = new URL(path, world.page.url()).toString();
  const response = await actOrExplain('fetch', url, hint, () => world.context.request.get(url, { timeout: budget(world) }));
  return {
    url,
    status: response.status(),
    type: response.headers()['content-type'] || '',
    text: await response.text(),
  };
}

// The events of Astro's client router, recorded in `window.__webshipAstroEvents`
// from the start of every document. A client-side navigation keeps the list, a
// full page load starts it again, so the list also shows whether the page was
// reloaded.
const ROUTER_EVENTS = [
  'astro:before-preparation',
  'astro:after-preparation',
  'astro:before-swap',
  'astro:after-swap',
  'astro:page-load',
];

Before({ order: 210 }, async function () {
  if (!this.context) return;
  await this.context.addInitScript((names) => {
    window.__webshipAstroEvents = [];
    for (const name of names) {
      document.addEventListener(name, () => {
        window.__webshipAstroEvents.push({ name, direction: document.documentElement.getAttribute('data-astro-transition') || '' });
      });
    }
  }, ROUTER_EVENTS);
});

module.exports = {
  budget,
  escapeRegExp,
  poll,
  actOrExplain,
  fetchSiteFile,
  ROUTER_EVENTS,
  friendly,
};
