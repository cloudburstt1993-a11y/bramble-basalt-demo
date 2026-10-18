# Bramble & Basalt Garden Co. — feature demo site

A 55-page demo website for a **made-up business** (garden center + landscaping crew + café),
built to show prospects every page type and feature we can put on a small-business site.

**Live:** https://cloudburstt1993-a11y.github.io/bramble-basalt-demo/tour.html
(hosted on GitHub Pages from the public repo `cloudburstt1993-a11y/bramble-basalt-demo`,
which holds only this folder).

Start at [`tour.html`](tour.html): it lists all 87 features grouped by what they do for the
business, plus a "page types" index with one working example of each.

Same stack as client builds: hand-written HTML, Tailwind v4 standalone CLI, vanilla JS,
no framework, no `package.json`. Every page is `noindex` so it never shows up in Google.

## Presenting it

1. Open `tour.html` → **Start the tour with labels on** (or flip **Feature labels** in the
   dark bar on any page). Every feature gets a yellow tag.
2. Click through like a customer. Every flow finishes with a real confirmation:
   shop → product → cart (codes **FALL10**, **BLOOM5**) → checkout · booking · instant
   estimate → financing → 3-step quote · estimate approval with e-signature + deposit ·
   class waiver · rentals · catering · event tickets · café order-ahead · gift cards ·
   plans · donations · invoice payment · order tracking · job application · referral link.
3. With labels on, every call tap, form, booking and sale pops up the GA4 event it sends.
4. Good demo links:
   - `index.html?utm_source=google&utm_medium=cpc&labels=on` shows call tracking (the
     phone number swaps to the Google Ads tracking number).
   - `specials.html` has a real QR code; scanning it opens the promo page tagged as a
     flyer lead with the flyer's tracking number.
   - `index.html?ref=MARIA50` shows what a referred friend sees.

No card is ever charged. What's live is set in the `CONFIG` block at the top of
`js/main.js`; anything left empty there stays in demo mode:

| Service | Status | Account |
|---|---|---|
| GA4 | Live, `G-9CMP8DK83V` | "Bramble & Basalt demo site" property in the Bookcliff Web Analytics account |
| Cal.com | Live: the booking page embeds the real calendar | `cal.com/demo-bcw`, the separate demo login |
| Formspree | Live: every form and order request is emailed, with its lead source | Form `mkjoevop` in the separate demo login; free plan, 50 submissions a month |
| Stripe | Not yet: checkout opens the demo dialog | — |

Bookings made on the demo land in the `demo-bcw` Cal.com account and email the address
the visitor typed, so book with your own email when you show it. Form submissions go to
the demo login's inbox. Formspree's spam filter sent a test with an example.com
address and "test" in the message to its Spam tab, so demo with realistic details.

## Preview locally

```
serve demo
```

`demo/serve.json` turns off `serve`'s clean-URL redirect (it drops `?p=` from product
links) and serves `index.html` at `/`. GitHub Pages and Vercel don't need it.

## Rebuild the CSS

```
cd demo
tailwindcss -i ./src/input.css -o ./css/style.css --minify
```

Run it from `demo/` so Tailwind scans these pages and `js/`. Commit `css/style.css`.

## Update the live link

Copy this folder into a clone of `bramble-basalt-demo` and push `main`. GitHub Pages
redeploys in about a minute.

## What's simulated, and what it connects to on a real site

| In the demo | On a client site |
|---|---|
| Forms show a confirmation, nothing is sent | Formspree (`action` is already on the main forms); every form carries lead-source fields |
| “Secure checkout powered by Stripe · demo mode” dialog | Stripe Payment Links or hosted Checkout, publishable key only |
| Booking calendar (live Cal.com embed; generated open times if `CONFIG.cal` is empty) | The client's Cal.com or Calendly, lazy-loaded |
| Estimate approval, waiver signatures | Documenso, DocuSign or Dropbox Sign for legally tracked signatures |
| Chat assistant with scripted answers | HubSpot, Tidio or Crisp live chat, or an AI assistant |
| Phone number swap for ad visitors | CallRail (or similar) dynamic number insertion |
| Café order-ahead | Square, Toast or Clover online ordering |
| Gift card balance, order tracking | The shop's point-of-sale / order system |
| Client portal | A sign-in-by-email portal plus Stripe's customer billing portal |
| GA4 events go to the demo property | gtag.js in `<head>` with the client's ID; `BB.track()` already fires every event |
| Reviews marked “Sample” | The client's real Google reviews (never invented) |
| SVG illustrations | The client's own photos (WebP/AVIF with JPEG fallback) |
| Phone (970) 555-0142, `.example` email and domain | The client's real NAP, matching their Google Business Profile |

Already live, no account needed: the weather tip (National Weather Service API), the
OpenStreetMap embed, offline support, site search, add-to-calendar files and the PDF guide.

## Files

```
demo/
  *.html + services/ locations/ projects/ team/ jobs/ blog/ guides/ es/
                             55 pages; header, footer, sticky call bar and chat are
                             duplicated in each page. To change the nav, edit all of them.
  src/input.css              Tailwind v4 @theme tokens + @layer components
  css/style.css              compiled, committed
  js/main.js                 site-wide: nav, cart, forms, GA4 events, Stripe stand-in, hours,
                             lead source + call tracking, wishlist, countdowns, consent, offline
  js/chat.js                 chat assistant (every page)
  js/catalog.js, shop.js     products, shop filters, product page, cart, gift cards, saved items
  js/book.js quote.js events.js gallery.js cafe.js contact.js sign.js estimate.js rentals.js
     catering.js locations.js weather.js quiz.js search.js refer.js    page scripts
  search-index.json          site search data (titles, descriptions, headings); add an
                             entry by hand when you add a page
  sw.js, manifest.webmanifest, offline.html    offline support + add to home screen
  assets/img/                SVG illustrations, QR code
  assets/docs/               planting calendar PDF (printed from guides/planting-calendar.html)
  assets/og.png, icon-*.png  link-preview image and app icons
  assets/icons.svg           icon sprite (Lucide paths, ISC license)
  assets/fonts/              Inter + Playfair Display, self-hosted subsets
  serve.json                 local preview only
```
