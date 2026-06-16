// Custom Cursor
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const cursor = document.querySelector('[data-cursor]');
    const cursorDot = document.querySelector('[data-cursor-dot]');
    if (!cursor || !cursorDot) return;

    let mouseX = 0, mouseY = 0;
    let curX = 0, curY = 0;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });

    // Lagged follower
    function animateCursor() {
      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;
      cursor.style.transform = `translate(${curX}px, ${curY}px)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover states
    document.querySelectorAll('a, button, [data-hover]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursor.classList.add('cursor--hover');
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('cursor--hover');
      });
    });

    // Show cursor
    document.addEventListener('mouseenter', function () {
      cursor.style.opacity = '1';
      cursorDot.style.opacity = '1';
    });
    document.addEventListener('mouseleave', function () {
      cursor.style.opacity = '0';
      cursorDot.style.opacity = '0';
    });
  });
})();
