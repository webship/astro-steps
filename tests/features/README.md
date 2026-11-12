# Features

Cucumber `.feature` files exercising the [demo Astro site](../../demo/) with
webship-js's built-in step definitions plus this project's
[Astro steps](../step-definitions/).

| File                       | Covers                                                              |
| -------------------------- | ------------------------------------------------------------------- |
| `homepage.feature`         | Home page: generator, version, production build, navigation menu, link health |
| `static-page.feature`      | A page that ships no JavaScript, and one that does                  |
| `islands.feature`          | Islands and their client directives, interaction, scoped styles     |
| `images.feature`           | Optimized images: dimensions, lazy loading, formats, loaded         |
| `collections.feature`      | The posts of a content collection, and the draft that is not built  |
| `seo.feature`              | The sitemap and the RSS feed                                        |
| `accessibility.feature`    | Language, title, landmarks, headings and an accessibility audit     |
| `about.feature`            | About page content and navigation back to home                      |
| `blog.feature`             | Blog index and individual post pages                                |
| `contact.feature`          | Contact form fields and filling them in                             |
| `not-found.feature`        | Custom 404 page and its status code                                 |

Run them with `npm test` (see the root [README](../../README.md): the demo site
must be built and served, and `LAUNCH_URL` set accordingly).
