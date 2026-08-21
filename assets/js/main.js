// Shared site behavior: mobile nav toggle, current year stamp.
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.querySelector('.nav-toggle');
    var mobileNav = document.querySelector('.mobile-nav');
    if (toggle && mobileNav) {
      toggle.addEventListener('click', function () {
        var open = mobileNav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    var yearEls = document.querySelectorAll('[data-current-year]');
    var thisYear = new Date().getFullYear();
    yearEls.forEach(function (el) { el.textContent = thisYear; });

    var todayStr = new Date().toISOString().slice(0, 10);
    document.querySelectorAll('input[type="date"].js-max-today').forEach(function (el) {
      el.max = todayStr;
    });

    // Close the language dropdown when clicking outside it.
    var langSwitch = document.querySelector('details.lang-switch');
    if (langSwitch) {
      document.addEventListener('click', function (e) {
        if (langSwitch.hasAttribute('open') && !langSwitch.contains(e.target)) {
          langSwitch.removeAttribute('open');
        }
      });
    }

    // Generic share-row handler. Any .share-row with data-text/data-url set
    // (by the page's own result script, once a result is computed) works with
    // this single handler - no per-page share code needed.
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.share-btn');
      if (!btn) return;
      var row = btn.closest('.share-row');
      var text = (row && row.dataset.text) || document.title;
      var url = (row && row.dataset.url) || window.location.href;
      var platform = btn.getAttribute('data-share');

      if (platform === 'copy') {
        var label = btn.querySelector('.share-label');
        var restore = label ? label.textContent : null;
        var done = function () {
          if (label) { label.textContent = 'Copied!'; setTimeout(function () { label.textContent = restore; }, 1500); }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done).catch(function () {});
        }
        return;
      }
      if (platform === 'native') {
        if (navigator.share) { navigator.share({ text: text, url: url }).catch(function () {}); }
        return;
      }
      var links = {
        whatsapp: 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url),
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '&quote=' + encodeURIComponent(text),
        x: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url)
      };
      if (links[platform]) {
        window.open(links[platform], '_blank', 'noopener,width=600,height=520');
        if (window.gtag) { window.gtag('event', 'share_click', { platform: platform, page: window.location.pathname }); }
      }
    });

    // Show the native-share button only when the browser actually supports it
    // (mostly mobile); desktop keeps the explicit WhatsApp/Facebook/X row.
    if (navigator.share) {
      document.querySelectorAll('.share-btn[data-share="native"]').forEach(function (el) {
        el.hidden = false;
      });
    }
  });
})();
