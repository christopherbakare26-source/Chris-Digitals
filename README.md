# Chris Digitals — Portfolio Website

Portfolio website for **Christopher Bakare** — WordPress Developer & Website Designer (Chris Digitals), Akure, Nigeria.

A static, five-page site built with hand-written HTML, CSS and vanilla JavaScript. No build step, no framework, no dependencies to install — open `index.html` and it runs.

## Pages

| File | Page |
|---|---|
| `index.html` | Home — hero, services preview, featured work, why-work-with-me, testimonial, CTA |
| `about.html` | About — story, full technical skills, timeline |
| `services.html` | Services — all eight services in detail |
| `work.html` | Work — the three portfolio projects with screenshots and live links |
| `contact.html` | Contact — enquiry form and booking panel |

## Structure

```
.
├── index.html
├── about.html
├── services.html
├── work.html
├── contact.html
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/
    │   └── styles.css        # all styling, design tokens at the top
    ├── js/
    │   └── app.js            # nav, reveals, form handling, config flags
    └── images/
        ├── logo-header.png   # header logo (wordmark, no tagline)
        ├── logo-footer.png   # footer logo (full lockup with tagline)
        ├── chris-digitals-logo.png  # original full-resolution source
        ├── christopher-bakare.png   # portrait
        ├── project-alevongreen.jpg
        ├── project-rva.jpg
        └── project-english-rose.jpg
```

## Running locally

Any static server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly from the filesystem also works.

## Deploying

The site is fully static — upload the whole folder to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any cPanel/static host. `index.html` is the entry point.

To publish with GitHub Pages: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / root**.

## Configuration

Two values in `assets/js/app.js` control the enquiry flow:

- `FORM_ENDPOINT` — POST endpoint for the contact form (Formspree, Basin, etc.). While empty, the form falls back to opening the visitor's mail client with all fields pre-filled and addressed to the site owner.
- `BOOKING_URL` — an embeddable booking link (e.g. Cal.com). While empty, the booking panel shows the preferred date/time fields collected by the form instead.

**Email notifications require one of these to be configured** — the raw static form does not send mail on its own.

## Editing

- **Colours, type, spacing** — CSS custom properties at the top of `assets/css/styles.css`.
- **Copy** — edit the HTML directly; each page has commented section markers (`<!-- ============ HERO ============ -->`).
- **Images** — replace files in `assets/images/` keeping the same filenames.
- **New project** — copy a project `<article>` block in `work.html` and update the image, title, description, tags and links.

## Canonical domain

Page metadata and `sitemap.xml` reference `https://chrisdigitals.com`. If the site lives at a different domain, find and replace that string across the HTML files, `sitemap.xml` and `robots.txt`.

## Notes

- Contact form, booking panel and email delivery need live credentials before launch — see Configuration above.
- Project links point to the real live client sites.
- Built to be responsive from 320px up, keyboard accessible, and respectful of `prefers-reduced-motion`.

---

© 2026 Chris Digitals. All rights reserved.
