// ============================================================
// PORTFOLIO — main.js
// Combines: live clock · custom cursor · terminal boot sequence
//           GSAP scroll animations · nav morph · side-aware cursor
//           Dither backgrounds · ScrollReveal · DecryptedText
// Requires: GSAP + ScrollTrigger + Three.js loaded before this file
// ============================================================

(function () {
  'use strict';

  // ── 0. Guard: wait for GSAP ───────────────────────────────
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[main.js] GSAP or ScrollTrigger not found.');
    document.body.classList.add('page-loaded');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ── 1. Page Fade-in ───────────────────────────────────────
  document.body.classList.add('page-loaded');

  // ── 2. Live Clock ─────────────────────────────────────────
  (function initClock() {
    const pad = n => String(n).padStart(2, '0');

    function tick() {
      const now = new Date();
      const str = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      document.querySelectorAll('[data-clock]').forEach(el => (el.textContent = str));
    }

    tick();
    setInterval(tick, 1000);
  })();

  // ── 3. Custom Cursor ──────────────────────────────────────
  (function initCursor() {
    const ring = document.querySelector('[data-cursor]');
    const dot  = document.querySelector('[data-cursor-dot]');
    if (!ring || !dot) return;

    let mx = 0, my = 0, cx = 0, cy = 0, visible = false;

    // Track mouse
    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      if (!visible) {
        ring.style.opacity = '1';
        dot.style.opacity  = '1';
        visible = true;
      }
    });

    document.addEventListener('mouseleave', () => {
      ring.style.opacity = '0';
      dot.style.opacity  = '0';
      visible = false;
    });

    // Lagged ring follower
    (function animate() {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      ring.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(animate);
    })();

    // Hover: grow ring on interactive elements
    document.querySelectorAll('a, button, [data-hover]').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('cursor--hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('cursor--hover'));
    });

    // Side-aware color — switches when design-side enters viewport
    ring.classList.add('cursor--dev'); // default

    ScrollTrigger.create({
      trigger: '#design-side',
      start: 'top 52px',
      onEnter() {
        ring.classList.replace('cursor--dev', 'cursor--design');
        dot.classList.add('cursor-dot--design');
      },
      onLeaveBack() {
        ring.classList.replace('cursor--design', 'cursor--dev');
        dot.classList.remove('cursor-dot--design');
      },
    });
  })();

  // ── 4. Nav Morph ──────────────────────────────────────────
  const nav = document.getElementById('main-nav');

  ScrollTrigger.create({
    trigger: '#design-side',
    start: 'top 52px', // nav height
    onEnter() {
      nav.classList.remove('nav--dev');
      nav.classList.add('nav--design');
    },
    onLeaveBack() {
      nav.classList.remove('nav--design');
      nav.classList.add('nav--dev');
    },
  });

  // ── 5. Active Nav Link Tracker ────────────────────────────
  (function initActiveLinks() {
    const allLinks   = document.querySelectorAll('.nav__link');
    const sectionIds = ['dev-hero', 'certs', 'skills', 'ctf', 'design-hero', 'works', 'about-design', 'contact'];
    const sections   = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        allLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      });
    }, { threshold: 0.45 });

    sections.forEach(s => obs.observe(s));
  })();

  // ── 6. Terminal Boot Sequence ─────────────────────────────
  const BOOT_LINES = [
    { prefix: '[BOOT]  ', text: 'Initializing kernel modules...',    dim: true },
    { prefix: '[SEC]   ', text: 'Loading encryption layer...',       dim: true },
    { prefix: '[NET]   ', text: 'Scanning network interfaces...',    dim: true },
    { prefix: '[AUTH]  ', text: 'Verifying operator credentials...', dim: true },
    { prefix: '[OK]    ', text: 'Access granted. Clearance: OPERATOR', success: true },
    { prefix: '        ', text: 'Welcome back.', white: true },
  ];

  function runTerminal(onDone) {
    const output = document.getElementById('terminal-output');
    if (!output) { onDone?.(); return; }

    let lineIdx = 0, charIdx = 0;
    let currentEl = null;

    function tick() {
      if (lineIdx >= BOOT_LINES.length) { onDone?.(); return; }

      const line = BOOT_LINES[lineIdx];

      if (charIdx === 0) {
        // Create new line element
        currentEl = document.createElement('div');
        let cls = 'terminal__line';
        if (line.success) cls += ' terminal__line--success';
        if (line.white)   cls += ' terminal__line--white';
        currentEl.className = cls;
        currentEl.innerHTML =
          `<span class="terminal__prefix">${line.prefix}</span>` +
          `<span class="terminal__text"></span>`;
        output.appendChild(currentEl);
      }

      // Append next character
      const textEl = currentEl.querySelector('.terminal__text');
      textEl.textContent += line.text[charIdx];
      charIdx++;

      if (charIdx >= line.text.length) {
        // Line complete — pause before next
        lineIdx++;
        charIdx = 0;
        setTimeout(tick, lineIdx < BOOT_LINES.length ? 200 : 500);
      } else {
        // Character delay (faster on success line)
        setTimeout(tick, line.success ? 14 : 24);
      }
    }

    setTimeout(tick, 600); // brief pause before boot starts
  }

  function animateDevHero() {
    gsap.to('.dev-hero__title-line', {
      opacity: 1,
      x: 0,
      stagger: 0.14,
      duration: 1.0,
      ease: 'power3.out',
    });
  }

  // Set initial position for the title lines (GSAP will animate from this)
  // Opacity starts at 0; DecryptedText will flip to 1 per-element before scrambling
  gsap.set('.dev-hero__title-line', { opacity: 0, x: -50 });

  // Chain: terminal → slide-in → decrypted-text scramble
  runTerminal(() => {
    animateDevHero();
    // After slide-in delay, start the scramble
    setTimeout(() => {
      if (typeof initDecryptedText === 'function') {
        // Reset lines to visible so DecryptedText can scramble them
        gsap.set('.dev-hero__title-line', { opacity: 1, x: 0 });
        initDecryptedText('.dev-hero__title-line');
      }
    }, 800);
  });

  // ── 7. Transition Zone ────────────────────────────────────

  // Parallax: black top layer scrolls up as user enters zone
  gsap.to('.tz__bg-top', {
    yPercent: -18,
    ease: 'none',
    scrollTrigger: {
      trigger: '#transition-zone',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });

  // Fade/rise the center label when zone reaches center
  ScrollTrigger.create({
    trigger: '#transition-zone',
    start: 'top 55%',
    onEnter() {
      gsap.to('.tz__content', {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'power3.out',
      });
    },
    onLeaveBack() {
      gsap.to('.tz__content', { opacity: 0, y: 24, duration: 0.4 });
    },
  });

  // ── 8. Design Hero Entrance ───────────────────────────────
  gsap.set('.design-hero__title', { y: -40 });

  ScrollTrigger.create({
    trigger: '#design-hero',
    start: 'top 65%',
    onEnter() {
      gsap.to('.design-hero__title', {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 1.5,
        ease: 'power3.out',
      });
    },
  });

  // ── 9. Cert Cards ─────────────────────────────────────────
  gsap.fromTo('.cert-card',
    { opacity: 0, y: 50 },
    {
      opacity: 1, y: 0,
      stagger: 0.12,
      duration: 0.95,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#certs', start: 'top 72%' },
    }
  );

  // ── 10. Skill Tags ────────────────────────────────────────
  gsap.fromTo('.skill-tag',
    { opacity: 0, scale: 0.75 },
    {
      opacity: 1, scale: 1,
      stagger: 0.04,
      duration: 0.5,
      ease: 'back.out(1.4)',
      scrollTrigger: { trigger: '#skills', start: 'top 72%' },
    }
  );

  // Skill category labels
  gsap.fromTo('.skill-category__label',
    { opacity: 0, x: -20 },
    {
      opacity: 0.65, x: 0,
      stagger: 0.1,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#skills', start: 'top 75%' },
    }
  );

  // ── 11. CTF Items ─────────────────────────────────────────
  gsap.fromTo('.ctf-item',
    { opacity: 0, x: -40 },
    {
      opacity: 1, x: 0,
      stagger: 0.14,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#ctf', start: 'top 72%' },
    }
  );

  // ── 12. Works Cards ───────────────────────────────────────
  gsap.fromTo('.design-project-card',
    { opacity: 0, y: 60 },
    {
      opacity: 1, y: 0,
      stagger: 0.1,
      duration: 1.0,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#works', start: 'top 72%' },
    }
  );

  // ── 13. About (design side) ───────────────────────────────
  gsap.fromTo('.design-about__title',
    { opacity: 0, y: 40, filter: 'blur(6px)' },
    {
      opacity: 1, y: 0, filter: 'blur(0px)',
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#about-design', start: 'top 72%' },
    }
  );

  // Note: .design-about__bio text is animated per-word by initScrollReveal()

  // ── 14. Contact Links ─────────────────────────────────────
  gsap.fromTo('.design-contact__link',
    { opacity: 0, y: 24 },
    {
      opacity: 1, y: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#contact', start: 'top 75%' },
    }
  );

  // ── 15. Section headings (generic) ────────────────────────
  gsap.utils.toArray('.dev-section__title, .design-section__title, .design-contact__title, .design-about__title').forEach(el => {
    // Already targeted above for about — skip duplicates handled by GSAP
  });

  gsap.utils.toArray('.dev-section .dev-section__header, .design-section .design-section__header').forEach(header => {
    gsap.fromTo(header.querySelector('.dev-section__title, .design-section__title'),
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: header, start: 'top 78%' },
      }
    );
  });

  // ── 16. Smooth anchor scroll (offset for fixed nav) ───────
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href').slice(1);
      const target   = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── 17. GATE — Interactive Splash Screen ─────────────────
  (function initGate() {
    const gate      = document.getElementById('gate');
    const gateLeft  = document.getElementById('gate-left');
    const gateRight = document.getElementById('gate-right');
    if (!gate || !gateLeft || !gateRight) return;

    // Set initial off-screen positions for text panels
    gsap.set('.gate__content--left',  { x: -50, opacity: 0 });
    gsap.set('.gate__content--right', { x:  50, opacity: 0 });

    let lastSide   = null; // tracks current hover state
    let idleTimer  = null; // 3.5s idle timer
    const IDLE_MS  = 3500;

    // ── Activate left (Design) ──
    function activateLeft() {
      if (lastSide === 'left') return;
      lastSide = 'left';

      gate.classList.remove('gate--hovered-right');
      gate.classList.add('gate--hovered-left');

      // Slide in left content
      gsap.to('.gate__content--left', {
        x: 0, opacity: 1,
        duration: 0.7, ease: 'power3.out',
      });
      // Push right content away
      gsap.to('.gate__content--right', {
        x: 50, opacity: 0,
        duration: 0.35, ease: 'power3.in',
      });
    }

    // ── Activate right (Dev) ──
    function activateRight() {
      if (lastSide === 'right') return;
      lastSide = 'right';

      gate.classList.remove('gate--hovered-left');
      gate.classList.add('gate--hovered-right');

      // Slide in right content
      gsap.to('.gate__content--right', {
        x: 0, opacity: 1,
        duration: 0.7, ease: 'power3.out',
      });
      // Push left content away
      gsap.to('.gate__content--left', {
        x: -50, opacity: 0,
        duration: 0.35, ease: 'power3.in',
      });
    }

    // ── Reset (cursor leaves gate OR idle timer fires) ──
    function resetGate() {
      if (lastSide === null) return;
      lastSide = null;

      gate.classList.remove('gate--hovered-left', 'gate--hovered-right');

      gsap.to('.gate__content--left', {
        x: -50, opacity: 0,
        duration: 0.4, ease: 'power3.in',
      });
      gsap.to('.gate__content--right', {
        x: 50, opacity: 0,
        duration: 0.4, ease: 'power3.in',
      });
    }

    // ── Idle timer helpers ──
    function scheduleIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(resetGate, IDLE_MS);
    }

    function cancelIdle() {
      clearTimeout(idleTimer);
    }

    // ── Mousemove detection ──
    gate.addEventListener('mousemove', e => {
      cancelIdle(); // reset idle timer on every move
      if (e.clientX < window.innerWidth / 2) {
        activateLeft();
      } else {
        activateRight();
      }
      scheduleIdle(); // start fresh 3.5s countdown
    });

    // On mouse leave: start the idle timer so it fires 3.5s after leaving
    gate.addEventListener('mouseleave', () => {
      resetGate();
      cancelIdle(); // leaving resets immediately, no need for idle delay
    });

    // ── Touch support (mobile — tap left/right half) ──
    gateLeft.addEventListener('touchstart', e => {
      e.preventDefault();
      activateLeft();
    }, { passive: false });

    gateRight.addEventListener('touchstart', e => {
      e.preventDefault();
      activateRight();
    }, { passive: false });

    // ── Click to scroll to respective world ──
    function scrollToSection(id) {
      const target = document.getElementById(id);
      if (!target) return;
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 52;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    }

    gateLeft.addEventListener('click', () => scrollToSection('design-hero'));
    gateRight.addEventListener('click', () => scrollToSection('dev-hero'));

    // ── Keyboard accessibility ──
    gateLeft.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollToSection('design-hero');
      }
    });

    gateRight.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollToSection('dev-hero');
      }
    });
  })();

  // ── 18. Dither Backgrounds ────────────────────────────────
  (function initDithers() {
    if (typeof initDither !== 'function' || typeof THREE === 'undefined') return;

    // Design hero — purple dither
    const designCanvas = document.getElementById('dither-design');
    if (designCanvas) {
      initDither(designCanvas, {
        waveColor: [0.48627, 0.22745, 0.9294],  // #7C3AED purple
        colorNum: 5.7,
        waveAmplitude: 0.3,
        waveFrequency: 3,
        waveSpeed: 0.05,
        mouseRadius: 0.3,
        enableMouseInteraction: true,
        pixelSize: 2,
      });
    }

    // Dev hero — rgba(86,86,86) grayscale dither (matches DevTools screenshot)
    const devCanvas = document.getElementById('dither-dev');
    if (devCanvas) {
      initDither(devCanvas, {
        waveColor: [0.337, 0.337, 0.337],  // rgba(86,86,86) normalized
        colorNum: 4,
        waveAmplitude: 0.3,
        waveFrequency: 3,
        waveSpeed: 0.05,
        mouseRadius: 0.3,
        enableMouseInteraction: true,
        pixelSize: 2,
      });
    }
  })();

  // ── 19. ScrollReveal — design side text ──────────────────
  if (typeof initScrollReveal === 'function') {
    initScrollReveal('.design-scroll-reveal', {
      baseOpacity: 0,
      enableBlur: true,
      baseRotation: 2,
      blurStrength: 7,
      wordAnimationEnd: 'bottom bottom',
    });
  }

})();

