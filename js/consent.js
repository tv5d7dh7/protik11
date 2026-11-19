/* ============================================================
   Cookie consent — Meta Pixel is loaded only after "Accetta tutti"
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'skysper_consent_v1';
  var banner = document.getElementById('cookieBanner');
  var acceptBtn = document.getElementById('cookieAccept');
  var rejectBtn = document.getElementById('cookieReject');
  var settingsBtn = document.getElementById('cookieSettings');

  if (!banner || !acceptBtn || !rejectBtn) return;

  function read() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function write(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* storage blocked */ }
  }

  function apply(granted) {
    if (granted && typeof window.skysperInitPixel === 'function') {
      window.skysperInitPixel();
    }
    document.dispatchEvent(new CustomEvent('skysper:consent', { detail: { granted: granted } }));
  }

  function show() {
    banner.hidden = false;
    document.documentElement.classList.add('cookie-open');
  }

  function hide() {
    banner.hidden = true;
    document.documentElement.classList.remove('cookie-open');
  }

  function decide(granted) {
    var previous = read();
    write(granted ? 'granted' : 'denied');
    apply(granted);
    hide();
    if (!granted && previous === 'granted') {
      // Rimuove i cookie già impostati dal pixel.
      window.location.reload();
    }
  }

  acceptBtn.addEventListener('click', function () { decide(true); });
  rejectBtn.addEventListener('click', function () { decide(false); });

  if (settingsBtn) {
    settingsBtn.addEventListener('click', function (event) {
      event.preventDefault();
      show();
    });
  }

  var stored = read();
  if (stored === 'granted') {
    apply(true);
    hide();
  } else if (stored === 'denied') {
    hide();
  } else {
    show();
  }
})();
