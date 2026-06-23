// ============================================================
// animations.js — ReactBits: ScrollReveal + DecryptedText
// Vanilla JS + GSAP translations (no React, no framework)
// Requires: GSAP + ScrollTrigger loaded before this file
// ============================================================

(function (global) {
  'use strict';

  // ── ScrollReveal ──────────────────────────────────────────
  // Translated from ReactBits ScrollReveal component.
  // Splits text into words, animates opacity + blur on scroll.
  //
  // Usage: initScrollReveal('.my-selector', { baseOpacity, enableBlur, ... })

  function initScrollReveal(selector, options) {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const cfg = Object.assign({
      baseOpacity: 0,
      enableBlur: true,
      baseRotation: 2,
      blurStrength: 7,
      rotationEnd: 'bottom bottom',
      wordAnimationEnd: 'bottom bottom',
    }, options);

    const containers = document.querySelectorAll(selector);
    if (!containers.length) return;

    containers.forEach(container => {
      // Split plain text into word spans preserving whitespace
      const rawText = container.textContent;
      container.textContent = '';

      rawText.split(/(\s+)/).forEach(part => {
        if (/^\s+$/.test(part)) {
          // Preserve whitespace nodes
          container.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.className = 'scroll-reveal__word';
          span.textContent = part;
          container.appendChild(span);
        }
      });

      const words = container.querySelectorAll('.scroll-reveal__word');

      // Rotation animation on the container
      gsap.fromTo(container,
        { transformOrigin: '0% 50%', rotate: cfg.baseRotation },
        {
          ease: 'none',
          rotate: 0,
          scrollTrigger: {
            trigger: container,
            start: 'top bottom',
            end: cfg.rotationEnd,
            scrub: true,
          },
        }
      );

      // Opacity reveal per word
      gsap.fromTo(words,
        { opacity: cfg.baseOpacity, willChange: 'opacity' },
        {
          ease: 'none',
          opacity: 1,
          stagger: 0.05,
          scrollTrigger: {
            trigger: container,
            start: 'top bottom-=20%',
            end: cfg.wordAnimationEnd,
            scrub: true,
          },
        }
      );

      // Blur reveal per word
      if (cfg.enableBlur) {
        gsap.fromTo(words,
          { filter: `blur(${cfg.blurStrength}px)` },
          {
            ease: 'none',
            filter: 'blur(0px)',
            stagger: 0.05,
            scrollTrigger: {
              trigger: container,
              start: 'top bottom-=20%',
              end: cfg.wordAnimationEnd,
              scrub: true,
            },
          }
        );
      }
    });
  }

  // ── DecryptedText ────────────────────────────────────────
  // Scrambles characters before revealing the real text.
  // Applied to dev-hero title lines after terminal sequence.
  //
  // Usage: initDecryptedText(element, onComplete)
  //   element:    DOM element (or selector string)
  //   onComplete: optional callback when reveal is done

  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*<>[]{}|\\/-_=+';

  function decryptElement(el, onComplete) {
    const original = el.textContent.trim();
    const length   = original.length;
    let   frame    = 0;
    const totalFrames = length * 3 + 10; // scramble then reveal
    let   rafId;

    function tick() {
      frame++;
      let display = '';

      for (let i = 0; i < length; i++) {
        if (original[i] === ' ') {
          display += ' ';
          continue;
        }
        const revealAt = Math.floor((i / length) * totalFrames * 0.7);
        if (frame > revealAt) {
          display += original[i];
        } else {
          display += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }

      el.textContent = display;

      if (frame < totalFrames) {
        rafId = requestAnimationFrame(tick);
      } else {
        el.textContent = original; // ensure clean final state
        onComplete && onComplete();
      }
    }

    tick();

    return function cancel() { cancelAnimationFrame(rafId); };
  }

  /**
   * initDecryptedText(selector)
   * Chains decryption across all matching elements in sequence.
   * Call this AFTER the terminal boot sequence completes.
   */
  function initDecryptedText(selector, onAllDone) {
    const elements = Array.from(document.querySelectorAll(selector));
    if (!elements.length) { onAllDone && onAllDone(); return; }

    let idx = 0;
    function next() {
      if (idx >= elements.length) { onAllDone && onAllDone(); return; }
      const el = elements[idx++];
      el.style.opacity = '1'; // make visible before scramble
      decryptElement(el, () => setTimeout(next, 80));
    }
    next();
  }

  // Expose globally
  global.initScrollReveal  = initScrollReveal;
  global.initDecryptedText = initDecryptedText;

})(window);
