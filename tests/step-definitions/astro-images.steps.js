'use strict';

// Step definitions for optimized images (`astro:assets`, the `<Image />` and
// `<Picture />` components). The build writes the image to `/_astro/` with a
// hash in its name, and renders `<img src="/_astro/name.HASH.webp" width
// height loading="lazy" decoding="async">`, inside a `<picture>` with one
// `<source type="image/...">` per format when a list of formats is given.
// An `<img>` with a path of `public/` or a remote address is not optimized.

const { Then } = require('@cucumber/cucumber');
const { poll, friendly } = require('./astro-helpers');

const OPTIMIZED = 'img[src*="/_astro/"]';
const IMAGE_HINT = 'Optimized images come from `<Image />` or `<Picture />` of astro:assets with an imported local image; an `<img>` that points into `public/` is served as it is.';

/**
 * Assert the page has (or has not) an optimized image: an `<img>` served from
 * `/_astro/`.
 *
 * Example #1: Then I should see an optimized image
 * Example #2: Then we should see an optimized image
 * Example #3: And I should not see an optimized image
 * Example #4: Then should see an optimized image
 * Example #5: And we should see an optimized image
 */
Then(/^(I |we )*should( not)* see an optimized image$/, async function (pronounCase, notCase) {
  const ok = await poll(this, async () => ((await this.page.locator(OPTIMIZED).count()) > 0) === !notCase, 5000);
  if (!ok) {
    throw friendly({
      message: notCase
        ? 'Expected no optimized image, but the page has an <img> served from /_astro/.'
        : 'Expected an optimized image (an <img> served from /_astro/), but the page has none.',
      hint: IMAGE_HINT,
    });
  }
});

/**
 * Assert every optimized image has a width and a height, so the browser can
 * reserve the space and the page does not jump while the image loads.
 *
 * Example #1: Then every optimized image should have a width and a height
 * Example #2: And every optimized image should have a width and a height
 * Example #3: But every optimized image should have a width and a height
 * Example #4: Then all optimized images should have a width and a height
 * Example #5: And every optimized image should have a width and a height
 */
Then(/^(?:every|all) optimized images? should have a width and a height$/, async function () {
  const missing = await this.page.evaluate((selector) => {
    const images = Array.from(document.querySelectorAll(selector));
    return { total: images.length, bad: images.filter((image) => !(Number(image.getAttribute('width')) > 0 && Number(image.getAttribute('height')) > 0)).map((image) => image.getAttribute('src')) };
  }, OPTIMIZED);
  if (missing.total === 0 || missing.bad.length) {
    throw friendly({
      message: missing.total === 0
        ? 'The page has no optimized image to check.'
        : `${missing.bad.length} of ${missing.total} optimized image(s) lack a width or a height: ${missing.bad.join(', ')}.`,
      hint: 'Astro writes the dimensions of an imported image itself; a remote image needs `width` and `height` props (or `inferSize`).',
    });
  }
});

/**
 * Assert every optimized image loads lazily (`loading="lazy"` and
 * `decoding="async"`, the defaults of `<Image />` and `<Picture />`), except
 * ones that opt out with `loading="eager"`, which the negative form finds.
 *
 * Example #1: Then every optimized image should load lazily
 * Example #2: And every optimized image should load lazily
 * Example #3: But every optimized image should not load lazily
 * Example #4: Then all optimized images should load lazily
 * Example #5: And every optimized image should load lazily
 */
Then(/^(?:every|all) optimized images? should( not)* load lazily$/, async function (notCase) {
  const state = await this.page.evaluate((selector) => {
    const images = Array.from(document.querySelectorAll(selector));
    const lazy = (image) => image.getAttribute('loading') === 'lazy' && image.getAttribute('decoding') === 'async';
    return { total: images.length, lazy: images.filter(lazy).length };
  }, OPTIMIZED);
  const ok = state.total > 0 && (notCase ? state.lazy === 0 : state.lazy === state.total);
  if (!ok) {
    throw friendly({
      message: state.total === 0
        ? 'The page has no optimized image to check.'
        : notCase
          ? `Expected no lazy optimized images, but ${state.lazy} of ${state.total} are.`
          : `Expected every optimized image to load lazily, but only ${state.lazy} of ${state.total} do.`,
      hint: 'Astro adds loading="lazy" and decoding="async" by default; `loading="eager"` (for the image at the top of the page) turns it off.',
    });
  }
});

/**
 * Assert the optimized images of the page offer (or do not offer) an image
 * format: `<Picture formats={['avif', 'webp']} />` writes one
 * `<source type="image/...">` per format.
 *
 * Example #1: Then the optimized image should offer the "avif" format
 * Example #2: And the optimized image should offer the "webp" format
 * Example #3: But the optimized image should not offer the "jpeg" format
 * Example #4: Then optimized image should offer the "webp" format
 * Example #5: And the optimized image should offer the "avif" format
 */
Then(/^(?:the )?optimized image should( not)* offer the "([^"]*)?" format$/, async function (notCase, format) {
  const mime = `image/${format.toLowerCase()}`;
  const ok = await poll(this, async () => ((await this.page.locator(`picture source[type="${mime}"]`).count()) > 0) === !notCase, 3000);
  if (!ok) {
    throw friendly({
      message: notCase
        ? `Expected the optimized image not to offer ${mime}, but a <source> for it is in a <picture>.`
        : `Expected the optimized image to offer ${mime}, but no <picture> has a <source type="${mime}">.`,
      hint: 'Use `<Picture formats={["avif", "webp"]} />` of astro:assets; `<Image />` writes a single <img>.',
    });
  }
});

/**
 * Assert every optimized image has loaded in the browser (it is decoded and
 * has a width). Lazy images load when they near the viewport, so scroll to
 * them first.
 *
 * Example #1: Then every optimized image should be loaded
 * Example #2: And every optimized image should be loaded
 * Example #3: But every optimized image should not be loaded
 * Example #4: Then all optimized images should be loaded
 * Example #5: And every optimized image should be loaded
 */
Then(/^(?:every|all) optimized images? should( not)* be loaded$/, async function (notCase) {
  let state;
  const ok = await poll(this, async () => {
    state = await this.page.evaluate((selector) => {
      const images = Array.from(document.querySelectorAll(selector));
      return { total: images.length, loaded: images.filter((image) => image.complete && image.naturalWidth > 0).length };
    }, OPTIMIZED);
    return state.total > 0 && (notCase ? state.loaded === 0 : state.loaded === state.total);
  }, notCase ? 2000 : undefined);
  if (!ok) {
    throw friendly({
      message: state.total === 0
        ? 'The page has no optimized image to check.'
        : notCase
          ? `Expected no optimized image to be loaded yet, but ${state.loaded} of ${state.total} are.`
          : `Expected every optimized image to be loaded, but ${state.loaded} of ${state.total} are.`,
      hint: 'A lazy image loads when it nears the viewport: scroll to it first. Check that the files in /_astro/ are served.',
    });
  }
});
