// Live Clock for Navigation
(function () {
  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function updateClock() {
    const now = new Date();
    const h = pad(now.getHours());
    const m = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    const timeStr = `${h}:${m}:${s}`;
    const clocks = document.querySelectorAll('[data-clock]');
    clocks.forEach(el => { el.textContent = timeStr; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateClock();
    setInterval(updateClock, 1000);
  });
})();
