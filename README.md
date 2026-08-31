# resume

**[View it live →](https://nuterian.github.io/resume/)** · [Download PDF](https://nuterian.github.io/resume/jugal-manjeshwar-resume.pdf)

A one-page, data-driven resume. All content lives in
[`src/data/resume.yaml`](src/data/resume.yaml), validated by a zod schema at
build time and rendered by [Astro](https://astro.build) with zero client-side
JavaScript. The same DOM renders as a centered US-Letter sheet on screen
(light & dark) and as the print/PDF layout.

On every push, GitHub Actions:

1. builds the site,
2. renders a PDF with Playwright and checks the layout — the build **fails if
   the resume spills past one page, or fills less than 92% of it** (a resume
   that stops two-thirds down the page looks unfinished),
3. deploys both to GitHub Pages.

So the one-page format can't silently break: add a bullet too many and CI
tells you, remove too much and it tells you that too.

## Developing

```sh
npm install
npm run dev      # local preview
npm run build    # build to dist/
npm run pdf      # generate dist/*.pdf + enforce the one-page rule
```
