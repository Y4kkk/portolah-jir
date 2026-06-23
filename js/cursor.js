// Custom Cursor
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const cursor = document.querySelector('[data-cursor]');
    const cursorDot = document.querySelector('[data-cursor-dot]');
    if (!cursor || !cursorDot) return;

    let mouseX = 0, mouseY = 0;
    let curX = 0, curY = 0;
    let visible = false;

    function showCursor() {
      if (!visible) {
        cursor.style.opacity = '1';
        cursorDot.style.opacity = '1';
        visible = true;
      }
    }

    function hideCursor() {
      cursor.style.opacity = '0';
      cursorDot.style.opacity = '0';
      visible = false;
    }

    // Show on first move and keep tracking position
    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      showCursor();
    });

    // Hide only when mouse leaves the browser window
    document.addEventListener('mouseleave', hideCursor);

    // Lagged follower
    function animateCursor() {
      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;
      cursor.style.transform = `translate(${curX}px, ${curY}px)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover states — grow ring and change color on interactive elements
    document.querySelectorAll('a, button, [data-hover]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursor.classList.add('cursor--hover');
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('cursor--hover');
      });
    });

    // Dark section awareness — check element under cursor and update ring color
    document.addEventListener('mousemove', function (e) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;
      const onDark = !!el.closest('.hero, .footer, .nav--dark');
      cursor.classList.toggle('cursor--light', onDark);
      cursorDot.classList.toggle('cursor-dot--light', onDark);
    });
  });
})();
