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

  // ── 1. Loading Screen (2s auto-dismiss) ─────────────────
  (function initLoadingScreen() {
    const ls = document.getElementById('loading-screen');
    if (!ls) {
      document.body.classList.add('page-loaded');
      return;
    }

    // Dismiss after 2 seconds
    setTimeout(() => {
      ls.classList.add('loading-screen--done');
      document.body.classList.add('page-loaded');

      // Remove from DOM after transition completes (0.6s)
      setTimeout(() => ls.remove(), 700);

      // Start terminal boot sequence now that page is revealed
      startTerminalSequence();
    }, 2000);
  })();

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

    setTimeout(tick, 300); // brief pause before boot starts
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
  gsap.set('.dev-hero__title-line', { opacity: 0, x: -50 });

  // startTerminalSequence is called AFTER loading screen dismisses
  function startTerminalSequence() {
    // Chain: terminal → slide-in → decrypted-text scramble
    runTerminal(() => {
      animateDevHero();
      setTimeout(() => {
        if (typeof initDecryptedText === 'function') {
          gsap.set('.dev-hero__title-line', { opacity: 1, x: 0 });
          initDecryptedText('.dev-hero__title-line');
        }
      }, 800);
    });
  }

  // ── 7. Transition Zone ────────────────────────────────────

  // Parallax: black top layer scrolls up as user enters zone
  gsap.to('.tz__bg-top', {
    yPercent: -18,
    ease: 'none',
    scrollTrigger: {
      trigger: '#transition-zone',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.2,
    },
  });

  // Fade/rise the center label — toggles in/out on scroll up & down
  gsap.fromTo('.tz__content',
    { opacity: 0, y: 24 },
    {
      opacity: 1, y: 0,
      duration: 1.3,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#transition-zone',
        start: 'top 55%',
        toggleActions: 'play none none reverse',
      },
    }
  );

  // Seamless border-bleed: dev-side fades out at bottom as transition zone enters
  gsap.to('#dev-side', {
    opacity: 0.85,
    ease: 'none',
    scrollTrigger: {
      trigger: '#transition-zone',
      start: 'top 80%',
      end: 'top 20%',
      scrub: 1.2,
    },
  });

  // Design-side fades in as transition zone exits
  gsap.fromTo('#design-side',
    { opacity: 0.85 },
    {
      opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '#transition-zone',
        start: 'bottom 80%',
        end: 'bottom 20%',
        scrub: 1.2,
      },
    }
  );

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
    onLeaveBack() {
      gsap.to('.design-hero__title', {
        opacity: 0,
        filter: 'blur(14px)',
        y: -40,
        duration: 0.6,
        ease: 'power3.in',
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
      scrollTrigger: {
        trigger: '#certs', start: 'top 72%',
        toggleActions: 'play none none reverse',
      },
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
      scrollTrigger: {
        trigger: '#skills', start: 'top 72%',
        toggleActions: 'play none none reverse',
      },
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
      scrollTrigger: {
        trigger: '#skills', start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
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
      scrollTrigger: {
        trigger: '#ctf', start: 'top 72%',
        toggleActions: 'play none none reverse',
      },
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
      scrollTrigger: {
        trigger: '#works', start: 'top 72%',
        toggleActions: 'play none none reverse',
      },
    }
  );

  // ── 13. About (design side) ───────────────────────────────
  gsap.fromTo('.design-about__title',
    { opacity: 0, y: 40, filter: 'blur(6px)' },
    {
      opacity: 1, y: 0, filter: 'blur(0px)',
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#about-design', start: 'top 72%',
        toggleActions: 'play none none reverse',
      },
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
      scrollTrigger: {
        trigger: '#contact', start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
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
        scrollTrigger: {
          trigger: header, start: 'top 78%',
          toggleActions: 'play none none reverse',
        },
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
    let idleTimer  = null; // idle timer
    const IDLE_MS  = 2000; // 2s idle before dimming

    // ── Activate left (Design) ──
    function activateLeft() {
      if (lastSide === 'left') return;
      lastSide = 'left';
      gate.classList.remove('gate--hovered-right', 'gate--idle');
      gate.classList.add('gate--hovered-left');

      // Slide in left content
      gsap.to('.gate__content--left', {
        x: 0, opacity: 1,
        duration: 0.7, ease: 'power3.out',
      });
      // Dim (not hide) right content — opacity 0.35 so text still ghosted/visible
      gsap.to('.gate__content--right', {
        x: 20, opacity: 0.35,
        duration: 0.4, ease: 'power3.in',
      });
    }

    // ── Activate right (Dev) ──
    function activateRight() {
      if (lastSide === 'right') return;
      lastSide = 'right';
      gate.classList.remove('gate--hovered-left', 'gate--idle');
      gate.classList.add('gate--hovered-right');

      // Slide in right content
      gsap.to('.gate__content--right', {
        x: 0, opacity: 1,
        duration: 0.7, ease: 'power3.out',
      });
      // Dim (not hide) left content — opacity 0.35 so text still ghosted/visible
      gsap.to('.gate__content--left', {
        x: -20, opacity: 0.35,
        duration: 0.4, ease: 'power3.in',
      });
    }

    // ── Reset (cursor leaves gate OR idle timer fires) ──
    // Instead of opacity: 0, use a low opacity so content stays subtly visible
    function resetGate() {
      if (lastSide === null) return;
      lastSide = null;

      gate.classList.remove('gate--hovered-left', 'gate--hovered-right');
      gate.classList.add('gate--idle');

      // Dim both sides to low opacity (not fully hidden) — clearly visible ghost
      gsap.to('.gate__content--left', {
        x: -20, opacity: 0.35,
        duration: 0.5, ease: 'power3.in',
      });
      gsap.to('.gate__content--right', {
        x:  20, opacity: 0.35,
        duration: 0.5, ease: 'power3.in',
      });

      // After a pause, remove idle class so a fresh hover reactivates cleanly
      setTimeout(() => {
        gate.classList.remove('gate--idle');
        lastSide = null;
      }, 600);
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

    // On mouse leave: dim (not hide), cancel idle
    gate.addEventListener('mouseleave', () => {
      resetGate();
      cancelIdle();
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

    // ── Click to scroll: GSAP cinematic exit then scroll ──
    function enterWorld(id, accentColor) {
      const target = document.getElementById(id);
      if (!target) return;

      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 52;

      // Freeze pointer events during transition
      gate.style.pointerEvents = 'none';

      // 1. Expand the clicked half to full brightness, blur out the other
      gsap.timeline()
        .to(gate, {
          opacity: 0,
          duration: 0.55,
          ease: 'power2.in',
          onComplete() {
            // Instant scroll to target (gate is invisible)
            const top = target.getBoundingClientRect().top + window.scrollY - navH;
            window.scrollTo({ top, behavior: 'instant' });

            // Fade gate back in (it stays in DOM for scroll-back navigation)
            gsap.set(gate, { opacity: 1 });
            gate.style.pointerEvents = '';
          }
        });
    }

    gateLeft.addEventListener('click',  () => enterWorld('design-hero', '#7C3AED'));
    gateRight.addEventListener('click', () => enterWorld('dev-hero',    '#00ff41'));

    // ── Keyboard accessibility ──
    gateLeft.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        enterWorld('design-hero', '#7C3AED');
      }
    });

    gateRight.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        enterWorld('dev-hero', '#00ff41');
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

