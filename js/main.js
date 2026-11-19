/* ============================================================
   SKYSPER ISHE30 - interactions, color picker, Meta Pixel events
   ============================================================ */
(function () {
  'use strict';

  var AMAZON_BASE = 'https://www.amazon.it/dp/';
  var CURRENCY = 'EUR';

  var cards = Array.prototype.slice.call(document.querySelectorAll('.color-card[data-asin]'));
  if (!cards.length) return;

  var els = {
    swatches: document.getElementById('swatches'),
    colorName: document.getElementById('colorName'),
    priceNow: document.getElementById('priceNow'),
    priceOld: document.getElementById('priceOld'),
    priceSave: document.getElementById('priceSave'),
    heroImage: document.getElementById('heroImage'),
    finalImage: document.getElementById('finalImage'),
    finalPrice: document.getElementById('finalPrice'),
    finalOld: document.getElementById('finalOld'),
    finalColor: document.getElementById('finalColor'),
    barPrice: document.getElementById('barPrice'),
    barColor: document.getElementById('barColor'),
    barDot: document.getElementById('barDot'),
    live: document.getElementById('liveRegion'),
    mobileBar: document.getElementById('mobileBar'),
    heroBuy: document.getElementById('heroBuy'),
    header: document.getElementById('siteHeader')
  };

  function readCard(card) {
    return {
      asin: card.getAttribute('data-asin'),
      name: card.getAttribute('data-name'),
      price: parseFloat(card.getAttribute('data-price')),
      old: parseFloat(card.getAttribute('data-old')),
      image: card.getAttribute('data-image'),
      swatch: card.getAttribute('data-swatch'),
      card: card
    };
  }

  var products = cards.map(readCard);
  var byAsin = {};
  products.forEach(function (p) { byAsin[p.asin] = p; });

  var state = { current: null };

  function formatPrice(value) {
    return Number(value).toFixed(2).replace('.', ',') + ' \u20AC';
  }

  function savePercent(product) {
    if (!product.old || product.old <= product.price) return 0;
    return Math.round((1 - product.price / product.old) * 100);
  }

  function buildSwatches() {
    products.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.setAttribute('style', '--sw:' + p.swatch);
      b.setAttribute('aria-label', 'Colore: ' + p.name);
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('title', p.name);
      b.setAttribute('data-asin', p.asin);
      b.addEventListener('click', function () { select(p.asin, { announce: true }); });
      els.swatches.appendChild(b);
    });
  }

  function swatchButtons() {
    return Array.prototype.slice.call(els.swatches.querySelectorAll('.swatch'));
  }

  function setButtonState() {
    swatchButtons().forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-asin') === state.current.asin ? 'true' : 'false');
    });
    products.forEach(function (p) {
      var selected = p.asin === state.current.asin;
      p.card.setAttribute('data-selected', selected ? 'true' : 'false');
      var pick = p.card.querySelector('.color-card__pick');
      if (pick) pick.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
  }

  function setText(el, value) {
    if (el) el.textContent = value;
  }

  function imageAlt(product) {
    return 'Zaino SKYSPER ISHE30 30 litri, colore ' + product.name.toLowerCase();
  }

  function swapImage(img, product) {
    if (!img) return;
    var preload = new Image();
    preload.onload = function () {
      img.classList.add('is-switching');
      window.setTimeout(function () {
        img.src = product.image;
        img.alt = imageAlt(product);
        img.classList.remove('is-switching');
      }, 60);
    };
    preload.onerror = function () {
      img.src = product.image;
      img.alt = imageAlt(product);
    };
    preload.src = product.image;
  }

  function select(asin, options) {
    var opts = options || {};
    var product = byAsin[asin];
    if (!product) return;

    var changed = !state.current || state.current.asin !== asin;
    state.current = product;

    setButtonState();
    setText(els.colorName, product.name);
    setText(els.priceNow, formatPrice(product.price));
    setText(els.priceOld, formatPrice(product.old));
    setText(els.finalPrice, formatPrice(product.price));
    setText(els.finalOld, formatPrice(product.old));
    setText(els.finalColor, product.name);
    setText(els.barPrice, formatPrice(product.price));
    setText(els.barColor, product.name);
    if (els.barDot) els.barDot.style.background = product.swatch;

    var pct = savePercent(product);
    if (els.priceSave) {
      els.priceSave.textContent = pct > 0 ? '\u2212' + pct + '%' : '';
      els.priceSave.style.display = pct > 0 ? '' : 'none';
    }
    if (els.priceOld) els.priceOld.style.display = product.old > product.price ? '' : 'none';
    if (els.finalOld) els.finalOld.style.display = product.old > product.price ? '' : 'none';

    var url = AMAZON_BASE + product.asin + '/';
    Array.prototype.forEach.call(document.querySelectorAll('[data-buy]'), function (link) {
      link.setAttribute('href', url);
    });

    if (!opts.instant && changed) {
      swapImage(els.heroImage, product);
      swapImage(els.finalImage, product);
    } else {
      if (els.heroImage) {
        els.heroImage.src = product.image;
        els.heroImage.alt = imageAlt(product);
      }
      if (els.finalImage) {
        els.finalImage.src = product.image;
        els.finalImage.alt = imageAlt(product);
      }
    }

    if (opts.announce) {
      setText(els.live, 'Colore selezionato: ' + product.name + ', prezzo ' + formatPrice(product.price));
    }
  }

  /* ---------- Meta Pixel helpers ---------- */
  function pixelReady() {
    return typeof window.fbq === 'function' && window.FB_PIXEL_ID;
  }

  function track(eventName, params) {
    if (pixelReady()) {
      window.fbq('track', eventName, params);
    }
  }

  function productPayload(product) {
    return {
      content_ids: [product.asin],
      content_name: 'SKYSPER ISHE30 30L - ' + product.name,
      content_type: 'product',
      contents: [{ id: product.asin, quantity: 1, item_price: Number(product.price) }],
      value: Number(product.price),
      currency: CURRENCY,
      num_items: 1
    };
  }

  function pushDataLayer(product, eventName) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ecommerce: {
        currency: CURRENCY,
        value: Number(product.price),
        items: [{
          item_id: product.asin,
          item_name: 'SKYSPER ISHE30 30L',
          item_variant: product.name,
          price: Number(product.price),
          quantity: 1
        }]
      }
    });
  }

  function viewContent(product) {
    track('ViewContent', {
      content_ids: [product.asin],
      content_name: 'SKYSPER ISHE30 30L - ' + product.name,
      content_type: 'product',
      value: Number(product.price),
      currency: CURRENCY
    });
  }

  function bindCardPickers() {
    products.forEach(function (p) {
      var pick = p.card.querySelector('.color-card__pick');
      if (!pick) return;
      pick.addEventListener('click', function () {
        select(p.asin, { announce: true });
      });
    });
  }

  function bindBuyTracking() {
    Array.prototype.forEach.call(document.querySelectorAll('.js-buy'), function (link) {
      link.addEventListener('click', function () {
        var card = link.closest('.color-card');
        var product = card ? readCard(card) : state.current;
        if (!product) return;

        if (card && (!state.current || state.current.asin !== product.asin)) {
          select(product.asin, { announce: false, instant: true });
        }

        track('Lead', productPayload(product));
        pushDataLayer(product, 'lead');
      });
    });
  }

  /* ---------- UI chrome ---------- */
  function bindHeader() {
    var ticking = false;
    function update() {
      var scrolled = window.scrollY > 8;
      if (els.header) els.header.classList.toggle('is-scrolled', scrolled);
      if (els.mobileBar && els.heroBuy) {
        var pastHero = els.heroBuy.getBoundingClientRect().bottom < 0;
        els.mobileBar.classList.toggle('is-visible', pastHero && window.scrollY > 300);
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  function bindReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---------- init ---------- */
  buildSwatches();

  var initial = products.filter(function (p) {
    return p.card.getAttribute('data-default') === 'true';
  })[0] || products[0];

  select(initial.asin, { announce: false, instant: true });
  viewContent(initial);

  document.addEventListener('skysper:consent', function (event) {
    if (event.detail && event.detail.granted && state.current) {
      viewContent(state.current);
    }
  });

  bindCardPickers();
  bindBuyTracking();
  bindHeader();
  bindReveal();
})();
