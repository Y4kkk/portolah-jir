// ============================================================
// dither.js — Vanilla Three.js Dither Background
// Translated from ReactBits Dither component (React → Vanilla JS)
// Requires: Three.js loaded globally (window.THREE)
// ============================================================

(function (global) {
  'use strict';

  // ── GLSL Shaders (verbatim from ReactBits source) ─────────
  const WAVE_VERT = `
    precision highp float;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      gl_Position = projectionMatrix * viewPosition;
    }
  `;

  const WAVE_FRAG = `
    precision highp float;
    uniform vec2 resolution;
    uniform float time;
    uniform float waveSpeed;
    uniform float waveFrequency;
    uniform float waveAmplitude;
    uniform vec3 waveColor;
    uniform vec2 mousePos;
    uniform int enableMouseInteraction;
    uniform float mouseRadius;

    vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

    float cnoise(vec2 P) {
      vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
      vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
      Pi = mod289(Pi);
      vec4 ix = Pi.xzxz;
      vec4 iy = Pi.yyww;
      vec4 fx = Pf.xzxz;
      vec4 fy = Pf.yyww;
      vec4 i = permute(permute(ix) + iy);
      vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
      vec4 gy = abs(gx) - 0.5;
      vec4 tx = floor(gx + 0.5);
      gx = gx - tx;
      vec2 g00 = vec2(gx.x, gy.x);
      vec2 g10 = vec2(gx.y, gy.y);
      vec2 g01 = vec2(gx.z, gy.z);
      vec2 g11 = vec2(gx.w, gy.w);
      vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
      g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
      float n00 = dot(g00, vec2(fx.x, fy.x));
      float n10 = dot(g10, vec2(fx.y, fy.y));
      float n01 = dot(g01, vec2(fx.z, fy.z));
      float n11 = dot(g11, vec2(fx.w, fy.w));
      vec2 fade_xy = fade(Pf.xy);
      vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
      return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
    }

    const int OCTAVES = 4;
    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 1.0;
      float freq = waveFrequency;
      for (int i = 0; i < OCTAVES; i++) {
        value += amp * abs(cnoise(p));
        p *= freq;
        amp *= waveAmplitude;
      }
      return value;
    }

    float pattern(vec2 p) {
      vec2 p2 = p - time * waveSpeed;
      return fbm(p + fbm(p2));
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      uv -= 0.5;
      uv.x *= resolution.x / resolution.y;
      float f = pattern(uv);
      if (enableMouseInteraction == 1) {
        vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
        mouseNDC.x *= resolution.x / resolution.y;
        float dist = length(uv - mouseNDC);
        float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
        f -= 0.5 * effect;
      }
      vec3 col = mix(vec3(0.0), waveColor, f);
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // Bayer matrix dither post-process (done as second pass using OffscreenCanvas + ImageData)
  // We implement the dither effect via a full-screen quad post-process pass with a custom shader.
  const DITHER_FRAG = `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float colorNum;
    uniform float pixelSize;
    uniform vec2 resolution;

    float bayerMatrix8x8[64];

    void buildBayer() {
      bayerMatrix8x8[0]  = 0.0/64.0;  bayerMatrix8x8[1]  = 48.0/64.0; bayerMatrix8x8[2]  = 12.0/64.0; bayerMatrix8x8[3]  = 60.0/64.0;
      bayerMatrix8x8[4]  = 3.0/64.0;  bayerMatrix8x8[5]  = 51.0/64.0; bayerMatrix8x8[6]  = 15.0/64.0; bayerMatrix8x8[7]  = 63.0/64.0;
      bayerMatrix8x8[8]  = 32.0/64.0; bayerMatrix8x8[9]  = 16.0/64.0; bayerMatrix8x8[10] = 44.0/64.0; bayerMatrix8x8[11] = 28.0/64.0;
      bayerMatrix8x8[12] = 35.0/64.0; bayerMatrix8x8[13] = 19.0/64.0; bayerMatrix8x8[14] = 47.0/64.0; bayerMatrix8x8[15] = 31.0/64.0;
      bayerMatrix8x8[16] = 8.0/64.0;  bayerMatrix8x8[17] = 56.0/64.0; bayerMatrix8x8[18] = 4.0/64.0;  bayerMatrix8x8[19] = 52.0/64.0;
      bayerMatrix8x8[20] = 11.0/64.0; bayerMatrix8x8[21] = 59.0/64.0; bayerMatrix8x8[22] = 7.0/64.0;  bayerMatrix8x8[23] = 55.0/64.0;
      bayerMatrix8x8[24] = 40.0/64.0; bayerMatrix8x8[25] = 24.0/64.0; bayerMatrix8x8[26] = 36.0/64.0; bayerMatrix8x8[27] = 20.0/64.0;
      bayerMatrix8x8[28] = 43.0/64.0; bayerMatrix8x8[29] = 27.0/64.0; bayerMatrix8x8[30] = 39.0/64.0; bayerMatrix8x8[31] = 23.0/64.0;
      bayerMatrix8x8[32] = 2.0/64.0;  bayerMatrix8x8[33] = 50.0/64.0; bayerMatrix8x8[34] = 14.0/64.0; bayerMatrix8x8[35] = 62.0/64.0;
      bayerMatrix8x8[36] = 1.0/64.0;  bayerMatrix8x8[37] = 49.0/64.0; bayerMatrix8x8[38] = 13.0/64.0; bayerMatrix8x8[39] = 61.0/64.0;
      bayerMatrix8x8[40] = 34.0/64.0; bayerMatrix8x8[41] = 18.0/64.0; bayerMatrix8x8[42] = 46.0/64.0; bayerMatrix8x8[43] = 30.0/64.0;
      bayerMatrix8x8[44] = 33.0/64.0; bayerMatrix8x8[45] = 17.0/64.0; bayerMatrix8x8[46] = 45.0/64.0; bayerMatrix8x8[47] = 29.0/64.0;
      bayerMatrix8x8[48] = 10.0/64.0; bayerMatrix8x8[49] = 58.0/64.0; bayerMatrix8x8[50] = 6.0/64.0;  bayerMatrix8x8[51] = 54.0/64.0;
      bayerMatrix8x8[52] = 9.0/64.0;  bayerMatrix8x8[53] = 57.0/64.0; bayerMatrix8x8[54] = 5.0/64.0;  bayerMatrix8x8[55] = 53.0/64.0;
      bayerMatrix8x8[56] = 42.0/64.0; bayerMatrix8x8[57] = 26.0/64.0; bayerMatrix8x8[58] = 38.0/64.0; bayerMatrix8x8[59] = 22.0/64.0;
      bayerMatrix8x8[60] = 41.0/64.0; bayerMatrix8x8[61] = 25.0/64.0; bayerMatrix8x8[62] = 37.0/64.0; bayerMatrix8x8[63] = 21.0/64.0;
    }

    vec3 dither(vec2 uv, vec3 color) {
      vec2 scaledCoord = floor(uv * resolution / pixelSize);
      int x = int(mod(scaledCoord.x, 8.0));
      int y = int(mod(scaledCoord.y, 8.0));
      float threshold = bayerMatrix8x8[y * 8 + x] - 0.25;
      float step = 1.0 / (colorNum - 1.0);
      color += threshold * step;
      float bias = 0.2;
      color = clamp(color - bias, 0.0, 1.0);
      return floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
    }

    void main() {
      buildBayer();
      vec2 uv = gl_FragCoord.xy / resolution;
      vec2 normalizedPixelSize = pixelSize / resolution;
      vec2 uvPixel = normalizedPixelSize * floor(uv / normalizedPixelSize);
      vec4 color = texture2D(tDiffuse, uvPixel);
      color.rgb = dither(uv, color.rgb);
      gl_FragColor = color;
    }
  `;

  const PASS_VERT = `
    precision highp float;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  /**
   * initDither(canvas, options)
   * Mounts a Three.js dither wave animation on the given canvas element.
   *
   * @param {HTMLCanvasElement} canvas
   * @param {Object} options
   */
  function initDither(canvas, options) {
    if (!canvas || typeof THREE === 'undefined') return;

    const cfg = Object.assign({
      waveSpeed: 0.05,
      waveFrequency: 3,
      waveAmplitude: 0.3,
      waveColor: [0.5, 0.5, 0.5],
      colorNum: 4,
      pixelSize: 2,
      enableMouseInteraction: true,
      mouseRadius: 0.3,
    }, options);

    // ── Renderer ─────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(1); // dpr=1 matches ReactBits source
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    // ── Scene + Camera ────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // ── Wave uniforms ─────────────────────────────────────────
    const waveUniforms = {
      resolution:            { value: new THREE.Vector2(canvas.offsetWidth, canvas.offsetHeight) },
      time:                  { value: 0 },
      waveSpeed:             { value: cfg.waveSpeed },
      waveFrequency:         { value: cfg.waveFrequency },
      waveAmplitude:         { value: cfg.waveAmplitude },
      waveColor:             { value: new THREE.Vector3(...cfg.waveColor) },
      mousePos:              { value: new THREE.Vector2(0, 0) },
      enableMouseInteraction:{ value: cfg.enableMouseInteraction ? 1 : 0 },
      mouseRadius:           { value: cfg.mouseRadius },
    };

    // ── Wave mesh (fills viewport) ────────────────────────────
    const waveMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: waveUniforms,
        vertexShader: WAVE_VERT,
        fragmentShader: WAVE_FRAG,
      })
    );
    scene.add(waveMesh);

    // ── Render target for dither post-pass ────────────────────
    let renderTarget = new THREE.WebGLRenderTarget(canvas.offsetWidth, canvas.offsetHeight);

    // ── Post-process scene (dither pass) ─────────────────────
    const postScene  = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const ditherUniforms = {
      tDiffuse:  { value: renderTarget.texture },
      colorNum:  { value: cfg.colorNum },
      pixelSize: { value: cfg.pixelSize },
      resolution:{ value: new THREE.Vector2(canvas.offsetWidth, canvas.offsetHeight) },
    };

    const postMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: ditherUniforms,
        vertexShader: PASS_VERT,
        fragmentShader: DITHER_FRAG,
      })
    );
    postScene.add(postMesh);

    // ── Mouse tracking ────────────────────────────────────────
    const mousePos = new THREE.Vector2(0, 0);
    if (cfg.enableMouseInteraction) {
      canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mousePos.set(
          (e.clientX - rect.left) * renderer.getPixelRatio(),
          (e.clientY - rect.top)  * renderer.getPixelRatio()
        );
        waveUniforms.mousePos.value.copy(mousePos);
      });
    }

    // ── Resize ────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      renderer.setSize(w, h);
      renderTarget.setSize(w, h);
      waveUniforms.resolution.value.set(w, h);
      ditherUniforms.resolution.value.set(w, h);
    });
    ro.observe(canvas.parentElement || canvas);

    // ── Animate ───────────────────────────────────────────────
    let animId;
    const clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);
      waveUniforms.time.value = clock.getElapsedTime();

      // First pass: render wave to render target
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);

      // Second pass: dither post-process to screen
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCamera);
    }

    animate();

    // Return cleanup fn
    return function destroy() {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      renderTarget.dispose();
    };
  }

  // Expose globally
  global.initDither = initDither;

})(window);
