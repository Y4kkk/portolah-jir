// Page Fade Transitions
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    // Fade in on load
    document.body.classList.add('page-loaded');

    // Intercept internal links for smooth transition
    document.querySelectorAll('a[href]').forEach(function (link) {
      const href = link.getAttribute('href');
      // Only intercept same-origin, non-anchor, non-external links
      if (
        href &&
        !href.startsWith('#') &&
        !href.startsWith('http') &&
        !href.startsWith('mailto') &&
        !href.startsWith('tel')
      ) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          const target = link.href;
          document.body.classList.add('page-leaving');
          setTimeout(function () {
            window.location.href = target;
          }, 400);
        });
      }
    });
  });
})();
