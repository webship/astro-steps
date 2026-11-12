# Astro Steps Demo Site

A minimal [Astro](https://astro.build) site used as the test fixture for the
[Astro-steps](../README.md) webship-js test project. It has a handful of main
pages (home, about, blog index + 2 posts, contact form, 404) so the custom
step definitions and feature files have real pages to exercise.

## Pages

| Path                  | Purpose                                              |
| ---------------------- | ----------------------------------------------------- |
| `/`                     | Home page with navigation links                       |
| `/about/`               | Static content page                                   |
| `/blog/`                | Blog index listing posts (hand-written pages)         |
| `/blog/hello-world/`    | Sample blog post                                      |
| `/blog/astro-steps/`    | Sample blog post                                      |
| `/contact/`             | A form (name, email, message) for testing form steps  |
| `/islands/`             | A `Counter` island per client directive, one without a directive, a component with a scoped style |
| `/static/`              | A page with no scripts at all (its own layout)        |
| `/images/`              | `<Image />` and `<Picture />` of `astro:assets`       |
| `/posts/`, `/posts/<id>/` | A content collection of posts; the draft is not built |
| `/rss.xml`              | RSS feed of the published posts                       |
| `/sitemap-index.xml`    | Sitemap written by @astrojs/sitemap                   |
| `/nonexistent`          | Falls through to the custom `404.astro` page          |

## Running locally

```sh
cd demo
npm ci
npm run build
npx astro preview --port 4321
```

Serves the production build at `http://localhost:4321`. The test suite needs
the production build, not `npm run dev`: the development server adds a toolbar
and different image addresses.

This site is a test fixture only; it is not meant to be deployed.
