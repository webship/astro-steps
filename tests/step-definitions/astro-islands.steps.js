'use strict';

// Step definitions for Astro islands: the interactive components that a page
// hydrates with a client directive (`client:load`, `client:idle`,
// `client:visible`, `client:media`, `client:only`).
//
// An island is `<astro-island client="visible" ssr ...>`. The `ssr` attribute
// means the HTML came from the server; Astro removes it once the component
// has hydrated in the browser. A component without a directive is plain HTML
// and is not an island. Interacting with an island (a click on its button)
// uses the steps of webship-js.

const { Then } = require('@cucumber/cucumber');
const { poll, friendly } = require('./astro-helpers');

const DIRECTIVES = ['load', 'idle', 'visible', 'media', 'only'];

/**
 * Assert the page has a number of islands, or none. Islands are the
 * `<astro-island>` elements of the page.
 *
 * Example #1: Then the page should have 4 islands
 * Example #2: And the page should have 1 island
 * Example #3: But the page should not have any islands
 * Example #4: Then page should have 4 islands
 * Example #5: And the page should not have any islands
 */
Then(/^(?:the )?page should (?:have (\d+) islands?|not have any islands)$/, async function (count) {
  const expected = count === undefined ? 0 : Number(count);
  let found;
  const ok = await poll(this, async () => {
    found = await this.page.locator('astro-island').count();
    return found === expected;
  }, 3000);
  if (!ok) {
    throw friendly({
      message: expected === 0
        ? `Expected a page without islands, but it has ${found}.`
        : `Expected ${expected} island(s) on the page, but found ${found}.`,
      hint: 'A component becomes an island when it has a client directive (`client:load`, `client:idle`, `client:visible`, `client:media`, `client:only`); without one Astro renders it to plain HTML.',
    });
  }
});

/**
 * Assert the islands that use a client directive have (or have not) hydrated.
 * A hydrated island has lost its `ssr` attribute. `client:load` hydrates at
 * once, `client:idle` when the browser is idle, `client:visible` when the
 * island scrolls into view, so the negative form proves the island waits.
 *
 * Example #1: Then the "client:load" island should be hydrated
 * Example #2: And the "client:idle" island should be hydrated
 * Example #3: But the "client:visible" island should not be hydrated
 * Example #4: Then the "client:only" island should be hydrated
 * Example #5: And the "client:visible" island should be hydrated
 */
Then(/^the "client:([a-z]+)" island should( not)* be hydrated$/, async function (directive, notCase) {
  if (!DIRECTIVES.includes(directive)) {
    throw friendly({ message: `"client:${directive}" is not an Astro client directive.`, hint: `Use one of ${DIRECTIVES.map((name) => `"client:${name}"`).join(', ')}.` });
  }
  const state = () => this.page.evaluate((name) => {
    const islands = Array.from(document.querySelectorAll(`astro-island[client="${name}"]`));
    return { total: islands.length, hydrated: islands.filter((island) => !island.hasAttribute('ssr')).length };
  }, directive);
  let seen;
  const ok = await poll(this, async () => {
    seen = await state();
    if (seen.total === 0) return false;
    return notCase ? seen.hydrated === 0 : seen.hydrated === seen.total;
  }, notCase ? 3000 : undefined);
  if (!ok) {
    throw friendly({
      message: seen.total === 0
        ? `The page has no island with the directive "client:${directive}".`
        : notCase
          ? `Expected the "client:${directive}" island not to be hydrated, but ${seen.hydrated} of ${seen.total} are.`
          : `Expected the "client:${directive}" island to be hydrated, but ${seen.hydrated} of ${seen.total} are (the \`ssr\` attribute is still set on the others).`,
      hint: 'Hydration needs the island scripts to load (check the browser console and the /_astro/ files); `client:visible` waits until the island scrolls into view and `client:idle` until the browser is idle.',
    });
  }
});
