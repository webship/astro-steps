'use strict';

// Step definitions for an Astro site's navigation menu: the links of the
// page's <nav> and a health check that crawls them.

const { Then } = require('@cucumber/cucumber');
const {
  budget, escapeRegExp, poll, friendly,
} = require('./astro-helpers');

/**
 * Assert that the page's <nav> element contains (or does not contain)
 * links with the given text. Optionally assert each link's href contains a
 * given substring. A link whose whole text is the given text is preferred
 * to one that only contains it, so "Blog" is the "Blog" link and not the
 * site title "My Blog". The table has a `text` column and an optional `path`
 * (or `href`) column; the examples below show the step line, the table
 * follows it in the feature file.
 *
 * Example #1: Then I should see a navigation menu with the following links:
 * Example #2: And we should see a navigation menu with the following links:
 * Example #3: Then should see a navigation menu with the following links:
 * Example #4: But I should not see a navigation menu with the following links:
 * Example #5: And I should see a navigation menu with the following links:
 *
 */
Then(/^(I |we )*should( not)* see a navigation menu with the following links:$/, async function (pronounCase, notCase, table) {
  const timeout = budget(this);
  for (const row of table.hashes()) {
    const text = row.text || row.Text;
    // The link whose whole text is the wanted text wins; a link that only
    // contains it ("Astro Blog" for "Blog") is taken when no link is exact.
    const exact = this.page.locator('nav a').filter({ hasText: new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`) });
    const partial = this.page.locator('nav a', { hasText: text });
    try {
      if (notCase) {
        await partial.first().waitFor({ state: 'hidden', timeout });
      } else {
        await exact.or(partial).first().waitFor({ state: 'visible', timeout });
      }
    } catch {
      throw friendly({
        message: notCase
          ? `Expected no navigation link with text "${text}", but one is visible.`
          : `Expected a visible navigation link with text "${text}" within ${timeout} ms.`,
        hint: 'Links are looked up inside the page `<nav>` by their visible text; check the wording and that the menu is not collapsed on this viewport.',
      });
    }
    if (notCase) continue;

    const path = row.path || row.href || row.Path || row.Href;
    if (path) {
      const link = (await exact.count()) ? exact.first() : partial.first();
      let href = null;
      const ok = await poll(this, async () => {
        href = await link.getAttribute('href').catch(() => null);
        return (href || '').includes(path);
      });
      if (!ok) {
        throw friendly({
          message: `Expected the navigation link "${text}" href to contain "${path}" but got "${href}".`,
          hint: 'The link whose whole text is the `text` column is read first, then a link that contains it; the `path` column is matched as a substring of the link href, so with a trailing-slash site write "/about/" or just "/about".',
        });
      }
    }
  }
});

/**
 * Crawl every link inside the page's <nav> element and assert each one
 * resolves with a non-error HTTP status. Skips mailto:, tel:, and
 * fragment-only (#...) links, which aren't page navigations.
 *
 * Example #1: Then all navigation links should resolve successfully
 * Example #2: And all navigation links should resolve successfully
 * Example #3: But all navigation links should resolve successfully
 * Example #4: Then all the navigation links should resolve successfully
 * Example #5: And all navigation links should resolve
 *
 */
Then(/^all (?:the )?navigation links should resolve(?: successfully)?$/, async function () {
  const timeout = budget(this);
  const links = this.page.locator('nav a[href]');
  try {
    await links.first().waitFor({ state: 'attached', timeout });
  } catch {
    throw friendly({
      message: `Expected the navigation menu to contain at least one link, but none appeared within ${timeout} ms.`,
      hint: 'Links are read from the page `<nav>` element; check the page has one and that it holds `<a href>` links.',
    });
  }
  const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

  const skip = /^(mailto:|tel:|javascript:|#)/i;
  const failures = [];

  for (const href of hrefs) {
    if (!href || skip.test(href)) continue;

    const url = new URL(href, this.page.url()).toString();
    let status;
    try {
      const response = await this.context.request.get(url, { timeout });
      status = response.status();
    } catch (error) {
      failures.push(`${url} -> request failed: ${error.message.split('\n')[0]}`);
      continue;
    }
    if (status >= 400) {
      failures.push(`${url} -> HTTP ${status}`);
    }
  }

  if (failures.length) {
    throw friendly({
      message: `Expected all navigation links to resolve successfully, but found:\n  ${failures.join('\n  ')}`,
      hint: 'Each href is requested with the browser context; a 404 means the route is missing from the build, a request failure usually means an external host the test machine cannot reach.',
    });
  }
});
