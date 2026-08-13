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
  });
})();
