'use strict';

// Entry point of @webship-js/astro-steps: require this one file and the step
// definitions for Astro sites are registered.
//
//   astro-site.steps.js        the build: generator, production build, shipped
//                              JavaScript, scoped styles, 404 page, sitemap,
//                              RSS feed, page title
//   astro-navigation.steps.js  the navigation menu and a link health check
//   astro-islands.steps.js     islands and their client directives
//   astro-routing.steps.js     view transitions, route announcer, prefetching
//   astro-images.steps.js      optimized images
//   astro-helpers.js           shared helpers and the router event recorder
//                              (not a step file)
//
// Every assertion waits for its condition for the `minWaitTime.page` budget
// (at least 10 s) and every failure is a friendly error with a hint, instead
// of a raw assertion stack. The target must be a production build (`astro
// build`, served by `astro preview` or any static host), not `astro dev`.

require('./astro-site.steps');
require('./astro-navigation.steps');
require('./astro-islands.steps');
require('./astro-routing.steps');
require('./astro-images.steps');
