/* Bramble & Basalt demo: product catalog + card markup.
   One source for the shop grid, product page and cart. Prices are demo values.
   ship: 'all' = can ship; 'local' = pickup or local delivery only (live plants, bulk). */
(function (root) {
  'use strict';
  const CATS = { plants: 'Plants', pottery: 'Pottery', tools: 'Tools', soil: 'Soil & seed', gifts: 'Gifts & café' };
  const BADGE = { Native: 'chip-juniper', 'Water-wise': 'chip-juniper', Pollinator: 'chip-sun', Sale: 'chip-clay', New: 'chip-dark', Bulk: 'chip-outline' };

  const P = [
    { id: 'blue-grama', traits: { sun: ['full'], water: 1, size: 'm', goals: ['grass', 'structure', 'native'] }, name: 'Blue grama grass ‘Blonde Ambition’', cat: 'plants', price: 14.99, variants: [['1 gallon', 14.99], ['2 gallon', 24.99]], badges: ['Native', 'Water-wise'], ship: 'local',
      short: 'A Colorado native bunchgrass with chartreuse “eyelash” seed heads that dance all fall. Shrugs off heat, wind and clay soil.',
      specs: { Sun: 'Full sun', Water: 'Low once established', 'Hardy to': 'USDA zone 4', 'Mature size': '30 in tall × 30 in wide' } },
    { id: 'hens-chicks', traits: { sun: ['full', 'part'], water: 0, size: 's', goals: ['containers', 'groundcover'] }, name: 'Hens & chicks succulent trio', cat: 'plants', price: 18, badges: ['Water-wise'], ship: 'local',
      short: 'Three tough little rosettes in a 10-inch terracotta bowl. They multiply every year and laugh at winter.',
      specs: { Sun: 'Full sun to part shade', Water: 'Very low', 'Hardy to': 'USDA zone 3', 'Mature size': '4 in tall, spreading' } },
    { id: 'apache-plume', traits: { sun: ['full'], water: 0, size: 'l', goals: ['structure', 'color', 'native'] }, name: 'Apache plume', cat: 'plants', price: 39, variants: [['5 gallon', 39]], badges: ['Native', 'Water-wise'], ship: 'local',
      short: 'White spring flowers followed by feathery pink seed heads that glow in low sun. A star of high-desert yards.',
      specs: { Sun: 'Full sun', Water: 'Very low', 'Hardy to': 'USDA zone 4', 'Mature size': '5 ft × 5 ft' } },
    { id: 'penstemon', traits: { sun: ['full'], water: 1, size: 'm', goals: ['pollinators', 'color', 'native'] }, name: 'Rocky Mountain penstemon', cat: 'plants', price: 12.99, badges: ['Native', 'Pollinator'], ship: 'local',
      short: 'Spikes of blue-violet flowers in late spring that hummingbirds and native bees go wild for.',
      specs: { Sun: 'Full sun', Water: 'Low', 'Hardy to': 'USDA zone 3', 'Mature size': '24 in × 18 in' } },
    { id: 'claret-cup', traits: { sun: ['full'], water: 0, size: 's', goals: ['color', 'containers', 'native'] }, name: 'Claret cup cactus', cat: 'plants', price: 16, badges: ['Native'], stock: false, ship: 'local',
      short: 'A clumping hedgehog cactus with brilliant scarlet cups in spring. Next shipment arrives in March.',
      specs: { Sun: 'Full sun', Water: 'Very low', 'Hardy to': 'USDA zone 4', 'Mature size': '12 in tall, clumping' } },
    { id: 'lavender', traits: { sun: ['full'], water: 1, size: 's', goals: ['pollinators', 'color', 'containers'] }, name: '‘Munstead’ lavender', cat: 'plants', price: 13.99, sale: 10.99, badges: ['Sale', 'Pollinator'], ship: 'local',
      short: 'Compact, early-blooming English lavender. Fragrant, deer-resistant and happiest in hot, dry beds.',
      specs: { Sun: 'Full sun', Water: 'Low', 'Hardy to': 'USDA zone 5', 'Mature size': '18 in × 24 in' } },
    { id: 'basalt-planter', name: 'Basalt glaze planter', cat: 'pottery', price: 28, variants: [['Small · 8 in', 28], ['Medium · 12 in', 42], ['Large · 16 in', 64]], badges: ['New'], ship: 'all',
      short: 'Hand-glazed stoneware in charcoal with a river-blue drip. Frost-resistant, with a drainage hole and plug.',
      specs: { Material: 'Glazed stoneware', Drainage: 'Hole with rubber plug', 'Frost-safe': 'Yes, when drained', Care: 'Wipe clean; empty in winter' } },
    { id: 'terracotta-bowl', name: 'Terracotta bowl, 14 in', cat: 'pottery', price: 24, ship: 'all',
      short: 'A wide, shallow clay bowl, perfect for a succulent garden or herbs on a sunny table.',
      specs: { Material: 'Unglazed terracotta', Size: '14 in wide × 5 in tall', Drainage: 'Yes', Care: 'Bring indoors below freezing' } },
    { id: 'hori-hori', name: 'Hori-hori garden knife', cat: 'tools', price: 34, ship: 'all',
      short: 'The one tool our crew never leaves behind: digs, weeds, divides and cuts twine. Stainless blade, ash handle, leather sheath.',
      specs: { Blade: '7 in stainless steel', Handle: 'Ash wood', Includes: 'Leather belt sheath', Warranty: 'Lifetime' } },
    { id: 'gloves', name: 'Goatskin garden gloves', cat: 'tools', price: 22, variants: [['Small', 22], ['Medium', 22], ['Large', 22]], ship: 'all',
      short: 'Soft, thorn-resistant goatskin with a snug knit cuff. Wash with mild soap and they last for years.',
      specs: { Material: 'Goatskin leather', Cuff: 'Knit, juniper green', Fit: 'Runs true to size', Care: 'Hand wash, air dry' } },
    { id: 'watering-can', name: 'Steel watering can, 2 gal', cat: 'tools', price: 38, ship: 'all',
      short: 'Powder-coated steel with a long-reach spout and a removable brass rose for gentle watering of seedlings.',
      specs: { Capacity: '2 gallons', Material: 'Powder-coated steel', Rose: 'Removable brass', Color: 'Sage green' } },
    { id: 'potting-mix', name: 'High-desert potting mix, 1 cu ft', cat: 'soil', price: 16.99, ship: 'local',
      short: 'Our own blend of compost, pumice and a little native soil. Drains fast but holds moisture longer in dry air.',
      specs: { Size: '1 cubic foot', Contains: 'Compost, pumice, native loam', 'Best for': 'Containers & raised beds', Organic: 'Yes' } },
    { id: 'wildflower-seed', name: 'Western Slope wildflower seed mix', cat: 'soil', price: 9.99, badges: ['Pollinator'], ship: 'all',
      short: 'Fourteen regionally adapted wildflowers. One packet covers about 100 sq ft. Sow in fall for spring color.',
      specs: { Coverage: 'About 100 sq ft', Sow: 'Fall or early spring', Sun: 'Full sun', Contents: '14 native & adapted species' } },
    { id: 'cedar-mulch', name: 'Shredded cedar mulch, per cubic yard', cat: 'soil', price: 42, badges: ['Bulk'], ship: 'local',
      short: 'Shredded cedar that knits together and stays put in the wind. We load your truck, or deliver locally.',
      specs: { Coverage: 'About 100 sq ft at 3 in deep', Pickup: 'We load your truck', Delivery: 'Local, 2 yard minimum', Color: 'Natural red-brown' } },
    { id: 'house-coffee', name: 'Potting Shed house roast, 12 oz', cat: 'gifts', price: 16, variants: [['Whole bean', 16], ['Ground', 16]], ship: 'all',
      short: 'The chocolatey medium roast we pour in the café every morning, roasted in small batches just for us.',
      specs: { Roast: 'Medium', Notes: 'Cocoa, toasted almond, cherry', Origin: 'Colombia & Guatemala', Size: '12 oz bag' } },
    { id: 'trucker-cap', name: 'Bramble & Basalt cap', cat: 'gifts', price: 26, badges: ['New'], ship: 'all',
      short: 'Our crew cap in juniper green with an embroidered mesa patch. Adjustable snapback, one size.',
      specs: { Fit: 'One size, snapback', Front: 'Cotton twill', Back: 'Breathable mesh', Patch: 'Embroidered' } },
  ];

  const usd = v => '$' + Number(v).toFixed(2);
  const priceHTML = p => p.sale
    ? `<span class="price price-sale">${usd(p.sale)}</span> <span class="price-was text-sm">${usd(p.price)}</span><span class="sr-only"> (on sale)</span>`
    : `<span class="price">${p.variants && p.variants.length > 1 && p.variants.some(v => v[1] !== p.price) ? 'From ' : ''}${usd(p.price)}</span>`;
  const badgeHTML = p => (p.badges || []).slice(0, 2).map(b => `<span class="chip ${BADGE[b] || 'chip-outline'}">${b}</span>`).join('');

  function card(p, i) {
    const href = `product.html?p=${p.id}`;
    const inStock = p.stock !== false;
    const multi = p.variants && p.variants.length > 1;
    const action = !inStock
      ? `<a class="btn btn-light btn-sm btn-block" href="${href}#notify">Notify me</a>`
      : multi
        ? `<a class="btn btn-outline btn-sm btn-block" href="${href}">Choose options</a>`
        : `<button type="button" class="btn btn-primary btn-sm btn-block" data-add="${p.id}">Add to cart</button>`;
    return `<article class="card card-link relative flex flex-col overflow-hidden" data-product data-cat="${p.cat}" data-price="${p.sale ?? p.price}" data-order="${i}" data-instock="${inStock ? 1 : 0}" data-name="${p.name.toLowerCase()} ${(p.badges || []).join(' ').toLowerCase()} ${CATS[p.cat].toLowerCase()}">
  <a href="${href}" class="relative block aspect-square bg-sand-100" tabindex="-1" aria-hidden="true">
    <img src="assets/img/product-${p.id}.svg" alt="" width="600" height="600" loading="lazy" decoding="async" class="h-full w-full object-cover">
    <span class="absolute left-3 top-3 flex flex-wrap gap-1">${badgeHTML(p)}</span>
    ${inStock ? '' : '<span class="absolute bottom-3 left-3 chip chip-dark">Out of stock</span>'}
  </a>
  <button type="button" class="wish" data-wish="${p.id}" aria-pressed="false" aria-label="Save ${p.name.replace(/"/g, '')} for later"><svg class="icon-sm" aria-hidden="true"><use href="assets/icons.svg#heart"/></svg></button>
  <div class="flex flex-1 flex-col gap-1.5 p-4">
    <p class="text-xs font-semibold uppercase tracking-wider text-basalt-600">${CATS[p.cat]}</p>
    <h3 class="font-sans text-base font-semibold leading-snug"><a href="${href}" class="hover:underline">${p.name}</a></h3>
    <p>${priceHTML(p)}</p>
    <div class="mt-auto pt-2">${action}</div>
  </div>
</article>`;
  }

  const giftCard = `<article class="card card-link flex flex-col overflow-hidden" data-product data-cat="gifts" data-price="25" data-order="99" data-instock="1" data-name="gift card gifts">
  <a href="gift-cards.html" class="relative block aspect-square bg-sand-100" tabindex="-1" aria-hidden="true">
    <img src="assets/img/product-gift-card.svg" alt="" width="600" height="600" loading="lazy" decoding="async" class="h-full w-full object-cover">
    <span class="absolute left-3 top-3 flex gap-1"><span class="chip chip-sun">Emailed instantly</span></span>
  </a>
  <div class="flex flex-1 flex-col gap-1.5 p-4">
    <p class="text-xs font-semibold uppercase tracking-wider text-basalt-600">Gifts &amp; café</p>
    <h3 class="font-sans text-base font-semibold leading-snug"><a href="gift-cards.html" class="hover:underline">Digital gift card</a></h3>
    <p><span class="price">$25 – $500</span></p>
    <div class="mt-auto pt-2"><a class="btn btn-outline btn-sm btn-block" href="gift-cards.html">Design a card</a></div>
  </div>
</article>`;

  root.BB_CATALOG = P;
  root.BB_CATS = CATS;
  root.BB_BADGE = BADGE;
  root.bbCard = card;
  root.bbGiftCard = giftCard;
  root.bbPriceHTML = priceHTML;
  root.bbBadgeHTML = badgeHTML;
})(typeof window !== 'undefined' ? window : globalThis);
