# Features

Cucumber `.feature` files exercising the main pages of the [demo Astro
site](../../demo/) using webship-js's built-in step definitions plus
this project's custom [`astro.steps.js`](../step-definitions/astro.steps.js).

| File                  | Covers                                              |
| ---------------------- | ---------------------------------------------------- |
| `homepage.feature`     | Home page content, links, nav menu, link health check |
| `about.feature`        | About page content and navigation back to home       |
| `blog.feature`         | Blog index and individual post pages                 |
| `contact.feature`      | Contact form fields and filling them in              |
| `not-found.feature`    | Custom 404 page and its status code                  |

Run them with `npm test` (see the root [README](../../README.md) for
prerequisites — the demo site must be running and `LAUNCH_URL` set
accordingly).
