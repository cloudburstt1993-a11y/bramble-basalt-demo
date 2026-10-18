# Bramble & Basalt Garden Co. — feature demo site

A 25-page demo website for a **made-up business** (garden center + landscaping crew + café),
built to show prospects everything we can put on a small-business site. Start at
[`tour.html`](tour.html): it lists all 54 features and links straight to each one.

Same stack as client builds: hand-written HTML, Tailwind v4 standalone CLI, vanilla JS,
no framework, no `package.json`. Every page is `noindex` so it never shows up in Google.

## Presenting it

1. Open `tour.html` → **Start the tour with labels on** (or flip **Feature labels** in the
   dark bar at the top of any page). Every feature gets a yellow tag.
2. Click through like a customer. Every flow finishes with a real confirmation screen:
   - Shop → product (pick a size) → cart → promo code **FALL10** or **BLOOM5** → checkout
   - Book a visit (calendar, time slots, staff, add-to-calendar file)
   - Instant estimate → financing calculator → 3-step quote form with photo upload
   - Event tickets, café order-ahead, gift card builder, yard-care plan sign-up,
     invoice payment, order tracking, job application with resume upload
3. With labels on, every call tap, form, booking and sale pops up the GA4 event it sends.

Nothing leaves the browser: no form is submitted and no card is charged.

## Preview locally

```
serve demo
```

`demo/serve.json` turns off `serve`'s clean-URL redirect. Without it, links like
`product.html?p=lavender` lose their `?p=` and every product opens as the default one.
Vercel keeps the query string on its redirect, so the live site doesn't need this.

## Rebuild the CSS

```
cd demo
tailwindcss -i ./src/input.css -o ./css/style.css --minify
```

Run it from `demo/` so Tailwind scans these pages and `js/`. Commit `css/style.css`.

## What's simulated, and what it connects to on a real site

| In the demo | On a client site |
|---|---|
| Forms show a confirmation, nothing is sent | Formspree endpoint (`action` is already on the main forms) |
| “Secure checkout powered by Stripe · demo mode” dialog | Stripe Payment Links or hosted Checkout, publishable key only |
| Booking calendar with generated open times | Cal.com or Calendly embed, lazy-loaded |
| Café order-ahead | Square, Toast or Clover online ordering |
| Gift card balance always shows $50 | The shop's point-of-sale |
| Order tracking shows a sample status | The store's order system |
| GA4 events go to `window.dataLayer` | Add the gtag.js snippet in `<head>` with the client's ID; `BB.track()` already fires every event |
| Reviews marked “Sample review” | The client's real Google reviews |
| SVG illustrations | The client's own photos (WebP/AVIF with JPEG fallback) |
| Phone (970) 555-0142, `.example` email and domain | The client's real NAP, matching their Google Business Profile |

## Files

```
demo/
  *.html, services/, blog/   25 pages; header, footer and sticky call bar are duplicated
                             in each page. To change the nav, grep and edit all of them.
  src/input.css              Tailwind v4 @theme tokens + @layer components
  css/style.css              compiled, committed
  js/main.js                 site-wide: nav, cart, forms, GA4 events, Stripe stand-in,
                             open-now hours, feature labels
  js/catalog.js              product data + card markup
  js/shop.js                 shop filters, product page, cart/checkout, gift cards
  js/book.js, quote.js, events.js, gallery.js, cafe.js, contact.js   page scripts
  assets/img/                SVG illustrations (scenes, products, team, map, logo)
  assets/icons.svg           icon sprite (Lucide paths, ISC license)
  assets/fonts/              Inter + Playfair Display, self-hosted subsets
  serve.json                 local preview only (see above)
```
