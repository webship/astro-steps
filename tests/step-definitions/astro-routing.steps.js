'use strict';

// Step definitions for how an Astro site moves between pages with view
// transitions (`<ClientRouter />` of astro:transitions) and prefetching.
//
// What Astro does, and what these steps rely on:
//
//   - `<ClientRouter />` writes `<meta name="astro-view-transitions-enabled"
//     content="true">`. After its script has run (`astro:page-load` fired once)
//     a click on an internal link fetches the next page and swaps the
//     document: the page is not loaded again, `window` and the scripts live on.
//   - Around a navigation Astro fires `astro:before-preparation`,
//     `astro:after-preparation`, `astro:before-swap`, `astro:after-swap` and
//     `astro:page-load`. During the swap `<html data-astro-transition="forward">`
//     (or "back").
//   - Elements with `transition:persist` carry `data-astro-transition-persist`
//     and are moved into the new page, not recreated, so their state is kept.
//     Elements with `transition:animate` or `transition:name` carry
//     `data-astro-transition-scope`.
//   - Astro adds a route announcer (`.astro-route-announcer`, `aria-live`) that
//     says the title of the new page.
//   - A link under the mouse (or in the viewport, with
//     `data-astro-prefetch="viewport"`) is prefetched with
//     `<link rel="prefetch" href="...">`.
//
// The events are recorded from the start of every document (see
// `astro-helpers.js`), so the steps need no set-up.

const { When, Then } = require('@cucumber/cucumber');
const {
  budget, escapeRegExp, ROUTER_EVENTS, poll, friendly,
} = require('./astro-helpers');

const ROUTER_HINT = 'Add `<ClientRouter />` from astro:transitions to the `<head>` of the layout; without it a link is an ordinary page load.';

/**
 * Wait until Astro's client router has started on the page (the event
 * `astro:page-load` has fired), and say whether it did.
 *
 * @param {object} world
 * @returns {Promise<boolean>}
 */
function routerStarted(world) {
  return poll(world, () => world.page.evaluate(() => (window.__webshipAstroEvents || []).some((event) => event.name === 'astro:page-load')));
}

/**
 * Assert the page uses (or does not use) view transitions: its layout has
 * `<ClientRouter />`, which writes `<meta name="astro-view-transitions-enabled">`.
 *
 * Example #1: Then the page should use view transitions
 * Example #2: And the page should use view transitions
 * Example #3: But the page should not use view transitions
 * Example #4: Then page should use view transitions
 * Example #5: And the page should not use view transitions
 */
Then(/^(?:the )?page should( not)* use view transitions$/, async function (notCase) {
  const ok = await poll(this, async () => {
    const enabled = await this.page.evaluate(() => (document.querySelector('meta[name="astro-view-transitions-enabled"]') || {}).content === 'true');
    return enabled === !notCase;
  }, 3000);
  if (!ok) {
    throw friendly({
      message: notCase
        ? 'Expected a page without view transitions, but it has <meta name="astro-view-transitions-enabled">.'
        : 'Expected a page with view transitions (<meta name="astro-view-transitions-enabled" content="true">), but there is none.',
      hint: ROUTER_HINT,
    });
  }
});

/**
 * Click an internal link by its visible text and assert the navigation was a
 * client-side transition: the page is not loaded again and Astro fires
 * `astro:page-load` for the new page. The step waits until the router has
 * started, stamps a marker on `window` and on the elements that persist, and
 * clicks.
 *
 * Example #1: When I click the link "About" without a full page reload
 * Example #2: When we click the link "Blog" without a full page reload
 * Example #3: And I click the link "Back to home" without a full page reload
 * Example #4: When click the link "Contact" without a full page reload
 * Example #5: When I click the link "Islands" without a full page reload
 */
When(/^(I |we )*click the link "([^"]*)?" without a full page reload$/, async function (pronounCase, linkText) {
  const timeout = budget(this);
  const before = new URL(this.page.url()).pathname;
  if (!(await routerStarted(this))) {
    throw friendly({
      message: `Astro's client router did not start within ${timeout} ms (no astro:page-load event), so "${linkText}" would be an ordinary link.`,
      hint: `${ROUTER_HINT} Check the page script (/_astro/ClientRouter...js) loads.`,
    });
  }
  const link = this.page.getByRole('link', { name: linkText, exact: true }).or(
    this.page.locator('a').filter({ hasText: new RegExp(`^${escapeRegExp(linkText)}$`) })
  ).first();
  let loadsBefore = 0;
  try {
    await link.waitFor({ state: 'visible', timeout });
    loadsBefore = await markDocument(this);
    await link.click();
  } catch (err) {
    throw friendly({
      action: 'click the link',
      target: linkText,
      cause: err,
      hint: 'The link is matched by its exact visible text (accessible name); check the wording on the page.',
    });
  }
  await finishNavigation(this, `Clicking "${linkText}"`, before, loadsBefore, timeout);
});

/**
 * The number of `astro:page-load` events of the current document.
 *
 * @param {object} world
 * @returns {Promise<number>}
 */
function pageLoads(world) {
  return world.page.evaluate(() => (window.__webshipAstroEvents || []).filter((event) => event.name === 'astro:page-load').length);
}

/**
 * Stamp the document and the persistent elements before a navigation, and
 * return the number of page loads so far.
 *
 * @param {object} world
 * @returns {Promise<number>}
 */
async function markDocument(world) {
  await world.page.evaluate(() => {
    window.__astroStepsMarker = true;
    document.querySelectorAll('[data-astro-transition-persist]').forEach((element) => { element.__astroStepsPersisted = true; });
  });
  return pageLoads(world);
}

/**
 * Assert a navigation has finished client-side: the path changed, Astro fired
 * `astro:page-load` again and the marker of the document is still there.
 */
async function finishNavigation(world, what, before, loadsBefore, timeout) {
  try {
    await world.page.waitForURL((url) => url.pathname !== before, { timeout });
  } catch {
    throw friendly({
      message: `${what} did not change the URL path from "${before}" within ${timeout} ms.`,
      hint: 'The link must point at another route of the site; a link to the current page or an external URL cannot be checked this way.',
    });
  }
  const marker = await world.page.evaluate(() => window.__astroStepsMarker).catch(() => false);
  if (!marker) {
    throw friendly({
      message: `${what} loaded the page again instead of using a view transition.`,
      hint: `${ROUTER_HINT} Links with \`data-astro-reload\` and \`target\` attributes also load the page again.`,
    });
  }
  const loaded = await poll(world, async () => (await pageLoads(world)) > loadsBefore);
  if (!loaded) {
    throw friendly({
      message: `${what} changed the address, but Astro did not fire astro:page-load for the new page within ${timeout} ms.`,
      hint: 'The new page may have failed to swap in; look for errors in the browser console.',
    });
  }
}

/**
 * Go back in the browser history and assert the previous page came back
 * through the client router, not as a page load.
 *
 * Example #1: When I go back without a full page reload
 * Example #2: When we go back without a full page reload
 * Example #3: And I go back without a full page reload
 * Example #4: When go back without a full page reload
 * Example #5: And we go back without a full page reload
 */
When(/^(I |we )*go back without a full page reload$/, async function (pronounCase) {
  const timeout = budget(this);
  const before = new URL(this.page.url()).pathname;
  const loadsBefore = await markDocument(this);
  await this.page.goBack({ timeout });
  await finishNavigation(this, 'Going back', before, loadsBefore, timeout);
});

/**
 * Assert an event of Astro's client router has (or has not) fired in the
 * current document. A client-side navigation keeps the record, a page load
 * starts it again. `astro:page-load` fires on the first load and after every
 * navigation, so a page without `<ClientRouter />` never fires it.
 *
 * Example #1: Then the "astro:page-load" event should have fired
 * Example #2: And the "astro:after-swap" event should have fired
 * Example #3: But the "astro:after-swap" event should not have fired
 * Example #4: Then the "astro:before-swap" event should have fired
 * Example #5: And the "astro:page-load" event should not have fired
 */
Then(/^the "(astro:[a-z-]+)" event should( not)* have fired$/, async function (name, notCase) {
  if (!ROUTER_EVENTS.includes(name)) {
    throw friendly({ message: `"${name}" is not an event this step knows.`, hint: `Use one of ${ROUTER_EVENTS.map((event) => `"${event}"`).join(', ')}.` });
  }
  const ok = await poll(this, async () => {
    const fired = await this.page.evaluate((event) => (window.__webshipAstroEvents || []).some((entry) => entry.name === event), name);
    return fired === !notCase;
  }, 3000);
  if (!ok) {
    throw friendly({
      message: notCase
        ? `Expected "${name}" not to have fired on this page, but it has.`
        : `Expected "${name}" to have fired on this page, but it has not.`,
      hint: `${ROUTER_HINT} The record starts again after a full page load, so the event is expected after a client-side navigation (${name === 'astro:page-load' ? 'and on the first load' : 'not on the first load'}).`,
    });
  }
});

/**
 * Assert the view transition went in a direction: Astro sets
 * `data-astro-transition` on the document while it swaps, "forward" for a
 * link and "back" for the back button.
 *
 * Example #1: Then the last transition should have gone "forward"
 * Example #2: And the last transition should have gone "back"
 * Example #3: Then last transition should have gone "forward"
 * Example #4: And the last transition should have gone "forward"
 * Example #5: Then the last transition should have gone "back"
 */
Then(/^(?:the )?last transition should have gone "(forward|back)"$/, async function (direction) {
  const seen = await this.page.evaluate(() => {
    const swaps = (window.__webshipAstroEvents || []).filter((entry) => entry.name === 'astro:after-swap');
    return swaps.length ? swaps[swaps.length - 1].direction : null;
  });
  if (seen !== direction) {
    throw friendly({
      message: seen === null
        ? 'No view transition has happened on this page yet.'
        : `Expected the last transition to go "${direction}", but it went "${seen}".`,
      hint: 'Use it after "I click the link ... without a full page reload" (forward) or "I go back without a full page reload" (back).',
    });
  }
});

/**
 * Assert the elements that persist across navigation (`transition:persist`)
 * were kept: after the last client-side navigation they are the same
 * elements that were on the page before, not new copies, so their state
 * (a playing video, an island's counter) is kept.
 *
 * Example #1: Then the persistent elements should have been kept
 * Example #2: And the persistent elements should have been kept
 * Example #3: But the persistent elements should not have been kept
 * Example #4: Then persistent elements should have been kept
 * Example #5: And the persistent elements should have been kept
 */
Then(/^(?:the )?persistent elements should( not)* have been kept$/, async function (notCase) {
  const state = await this.page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('[data-astro-transition-persist]'));
    return { total: elements.length, kept: elements.filter((element) => element.__astroStepsPersisted === true).length };
  });
  const ok = state.total > 0 && (notCase ? state.kept === 0 : state.kept === state.total);
  if (!ok) {
    throw friendly({
      message: state.total === 0
        ? 'The page has no element with transition:persist (data-astro-transition-persist).'
        : notCase
          ? `Expected the persistent elements to be new copies, but ${state.kept} of ${state.total} are the same elements as before.`
          : `Expected the persistent elements to be kept, but only ${state.kept} of ${state.total} are the same elements as before.`,
      hint: 'Add `transition:persist` to the element in the layout, and use it after "I click the link ... without a full page reload", which marks the elements first.',
    });
  }
});

/**
 * Assert an element has (or has not) a view transition: `transition:animate`
 * or `transition:name` puts `data-astro-transition-scope` on it.
 *
 * Example #1: Then the "main" element should have a view transition
 * Example #2: And the "main" element should have a view transition
 * Example #3: But the "footer" element should not have a view transition
 * Example #4: Then the "header" element should not have a view transition
 * Example #5: And the "main" element should have a view transition
 */
Then(/^the "([^"]*)?" element should( not)* have a view transition$/, async function (selector, notCase) {
  const ok = await poll(this, async () => {
    const scope = await this.page.locator(selector).first().getAttribute('data-astro-transition-scope').catch(() => null);
    return Boolean(scope) === !notCase;
  }, 3000);
  if (!ok) {
    throw friendly({
      message: notCase
        ? `Expected "${selector}" without a view transition, but it has data-astro-transition-scope.`
        : `Expected "${selector}" to have a view transition (data-astro-transition-scope), but it has none or is not on the page.`,
      hint: 'Add `transition:animate="slide"` or `transition:name="..."` to the element; the page needs `<ClientRouter />` for it to take effect.',
    });
  }
});

/**
 * Assert the page has (or has not) Astro's route announcer: the live region
 * (`.astro-route-announcer`, `aria-live`) that tells screen readers about a
 * navigation. Astro adds it after the first client-side navigation.
 *
 * Example #1: Then the page should have a route announcer
 * Example #2: And the page should have a route announcer
 * Example #3: But the page should not have a route announcer
 * Example #4: Then page should have a route announcer
 * Example #5: And the page should have a route announcer
 */
Then(/^(?:the )?page should( not)* have a route announcer$/, async function (notCase) {
  const ok = await poll(this, async () => {
    const found = await this.page.evaluate(() => {
      const node = document.querySelector('.astro-route-announcer');
      return Boolean(node) && Boolean(node.getAttribute('aria-live'));
    });
    return found === !notCase;
  }, notCase ? 2000 : undefined);
  if (!ok) {
    throw friendly({
      message: notCase
        ? 'Expected no route announcer, but .astro-route-announcer is on the page.'
        : 'Expected the route announcer (.astro-route-announcer with aria-live) on the page, but there is none.',
      hint: 'Astro adds the announcer after the first client-side navigation of a page with `<ClientRouter />`; click a link without a full page reload first.',
    });
  }
});

/**
 * Assert the route announcer has (or has not) announced a text after a
 * navigation. Astro announces the title of the new page (else its h1, else
 * its path).
 *
 * Example #1: Then the route announcer should announce "About | Astro Steps Demo"
 * Example #2: And the route announcer should announce "Blog | Astro Steps Demo"
 * Example #3: But the route announcer should not announce "Home | Astro Steps Demo"
 * Example #4: Then route announcer should announce "Contact | Astro Steps Demo"
 * Example #5: And the route announcer should announce "Islands | Astro Steps Demo"
 */
Then(/^(?:the )?route announcer should( not)* announce "([^"]*)?"$/, async function (notCase, expected) {
  let actual;
  const ok = await poll(this, async () => {
    actual = await this.page.evaluate(() => {
      const node = document.querySelector('.astro-route-announcer');
      return node ? node.textContent : null;
    });
    return (actual === expected) === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: notCase
        ? `Expected the route announcer not to say "${expected}", but it does.`
        : `Expected the route announcer to say "${expected}", but it says ${actual === null ? 'nothing (no .astro-route-announcer on the page)' : `"${actual}"`}.`,
      hint: 'The announcer speaks only after a client-side navigation; it says the title of the new page, so the text includes the site name when the title has it.',
    });
  }
});

/**
 * Assert a page has (or has not) been prefetched by the current page. Astro
 * prefetches a link on hover (and, with `data-astro-prefetch="viewport"`, when
 * it is in the viewport) with `<link rel="prefetch" href="...">`, or with a
 * `speculationrules` script where the browser supports it.
 *
 * Example #1: Then the page "/about/" should be prefetched
 * Example #2: And the page "/blog/" should be prefetched
 * Example #3: But the page "/contact/" should not be prefetched
 * Example #4: Then page "/about/" should be prefetched
 * Example #5: And the page "/about/" should not be prefetched
 */
Then(/^(?:the )?page "([^"]*)?" should( not)* be prefetched$/, async function (pagePath, notCase) {
  const prefetched = () => this.page.evaluate((wanted) => {
    const path = (url) => { try { return new URL(url, location.href).pathname; } catch { return url; } };
    const links = Array.from(document.querySelectorAll('link[rel="prefetch"], link[rel="prerender"]')).map((link) => path(link.href));
    const rules = Array.from(document.querySelectorAll('script[type="speculationrules"]')).flatMap((script) => {
      try { return JSON.stringify(JSON.parse(script.textContent)).match(/"\/[^"]*"/g) || []; } catch { return []; }
    }).map((text) => text.replace(/"/g, ''));
    return links.concat(rules).includes(wanted);
  }, pagePath);
  if (notCase) {
    await this.page.waitForTimeout(1000);
    if (await prefetched()) {
      throw friendly({ message: `Expected "${pagePath}" not to be prefetched, but it has been.`, hint: 'Astro prefetches a link that is hovered, tapped or in the viewport, as `data-astro-prefetch` says.' });
    }
    return;
  }
  if (!(await poll(this, prefetched))) {
    throw friendly({
      message: `Expected "${pagePath}" to be prefetched within ${budget(this)} ms, but no <link rel="prefetch"> for it is in the page.`,
      hint: 'Hover the link first ("I hover over ..."); prefetching needs `<ClientRouter />` or `prefetch: true` in astro.config, and a link with `data-astro-prefetch="false"` is skipped.',
    });
  }
});
