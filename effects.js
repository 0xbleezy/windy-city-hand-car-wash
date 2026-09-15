/* =====================================================================
   Immersive effects for Windy City Hand Car Wash.
   Additive enhancement layer — scroll-driven motion, a WebGL bubble
   field in the hero, 3D tilt, parallax, and scroll-spy navigation.
   Fails silently and degrades gracefully if WebGL / features are absent.
   ===================================================================== */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- WebGL bubble field (hero) ---------------- */
  (function bubbles() {
    var canvas = document.getElementById('bubbleCanvas');
    if (!canvas || reduce || !window.THREE) return;
    var THREE = window.THREE;
    var COUNT = window.innerWidth < 700 ? 130 : 260;
    var RX = 64, RY = 44, RZ = 34;
    var positions = new Float32Array(COUNT * 3);
    var colors = new Float32Array(COUNT * 3);
    var speed = new Float32Array(COUNT);
    var swayA = new Float32Array(COUNT);
    var phase = new Float32Array(COUNT);
    var AQUA = [0.30, 0.82, 0.94], WHITE = [0.86, 0.96, 1.0], SUN = [1.0, 0.78, 0.28];

    function makeSprite() {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var g = c.getContext('2d');
      var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, 'rgba(255,255,255,0.95)');
      grd.addColorStop(0.28, 'rgba(206,240,255,0.5)');
      grd.addColorStop(0.55, 'rgba(120,210,240,0.18)');
      grd.addColorStop(1, 'rgba(120,210,240,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 32, 0, 6.2832); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2;
      g.beginPath(); g.arc(32, 32, 21, 0, 6.2832); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(25, 23, 3.4, 0, 6.2832); g.fill();
      return new THREE.CanvasTexture(c);
    }

    for (var i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() * 2 - 1) * RX;
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * RY;
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * RZ;
      speed[i] = 3 + Math.random() * 7;
      swayA[i] = 0.4 + Math.random() * 1.7;
      phase[i] = Math.random() * 6.28;
      var r = Math.random(), col = r < 0.72 ? AQUA : (r < 0.93 ? WHITE : SUN);
      colors[i * 3] = col[0]; colors[i * 3 + 1] = col[1]; colors[i * 3 + 2] = col[2];
    }

    var scene, camera, renderer, geo, points, W, H;
    try {
      geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      var mat = new THREE.PointsMaterial({
        size: 2.4, map: makeSprite(), vertexColors: true, transparent: true,
        opacity: 0.95, depthWrite: false, depthTest: false,
        blending: THREE.AdditiveBlending, sizeAttenuation: true
      });
      points = new THREE.Points(geo, mat);
      scene = new THREE.Scene(); scene.add(points);
      camera = new THREE.PerspectiveCamera(58, 1, 1, 220); camera.position.z = 64;
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      renderer.setClearColor(0x000000, 0);
    } catch (e) { return; }

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
    }
    resize();
    canvas.classList.add('ready');
    window.addEventListener('resize', resize, { passive: true });

    var tmx = 0, tmy = 0, mx = 0, my = 0;
    window.addEventListener('pointermove', function (e) {
      tmx = e.clientX / window.innerWidth - 0.5;
      tmy = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    var last = performance.now(), running = true;
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) { last = performance.now(); requestAnimationFrame(frame); }
    });

    function frame() {
      if (!running) return;
      var now = performance.now();
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      var t = now * 0.001;
      var p = geo.attributes.position.array;
      for (var i = 0; i < COUNT; i++) {
        p[i * 3 + 1] += speed[i] * dt;
        p[i * 3] += Math.sin(t * swayA[i] + phase[i]) * dt * 2.2;
        if (p[i * 3 + 1] > RY) { p[i * 3 + 1] = -RY; p[i * 3] = (Math.random() * 2 - 1) * RX; }
      }
      geo.attributes.position.needsUpdate = true;
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      points.rotation.y = mx * 0.35; points.rotation.x = -my * 0.22;
      camera.position.x = mx * 10; camera.position.y = -my * 7; camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ---------------- Scroll: progress, hero fade, parallax ---------------- */
  (function scrollFx() {
    var bar = document.getElementById('scrollProgress');
    var hero = document.querySelector('.hero');
    var heroCopy = document.querySelector('.hero-copy');
    var canvas = document.getElementById('bubbleCanvas');
    var cue = document.querySelector('.scroll-cue');
    var parEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
    var ticking = false;

    function update() {
      var y = window.pageYOffset || 0;
      var de = document.documentElement;
      var max = Math.max(1, de.scrollHeight - window.innerHeight);
      if (bar) bar.style.width = (Math.min(y / max, 1) * 100) + '%';

      if (!reduce && hero) {
        var h = hero.offsetHeight || 1, p = Math.min(y / h, 1);
        if (heroCopy) {
          heroCopy.style.transform = 'translateY(' + (p * 70).toFixed(1) + 'px)';
          heroCopy.style.opacity = (1 - p * 1.15).toFixed(3);
        }
        if (canvas && p > 0.004) canvas.style.opacity = (Math.max(0, 1 - p * 1.25)).toFixed(3);
        if (cue) cue.style.opacity = (Math.max(0, 1 - p * 3)).toFixed(3);
      }

      if (!reduce) {
        for (var i = 0; i < parEls.length; i++) {
          var el = parEls[i], r = el.getBoundingClientRect();
          var off = ((r.top + r.height / 2) - window.innerHeight / 2) / window.innerHeight;
          var f = parseFloat(el.getAttribute('data-parallax')) || 0.1;
          el.style.transform = 'translate3d(0,' + (off * -f * 100).toFixed(1) + 'px,0) scale(1.08)';
        }
      }
      ticking = false;
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  })();

  /* ---------------- Stagger indices for grid reveals ---------------- */
  (function stagger() {
    var grids = document.querySelectorAll('.cards, .price-grid, .detail-grid, .gallery, .reviews, .locations');
    Array.prototype.forEach.call(grids, function (grid) {
      var kids = grid.children;
      for (var i = 0; i < kids.length; i++) kids[i].style.setProperty('--rv', (i % 6));
    });
  })();

  /* ---------------- Scroll-spy navigation ---------------- */
  (function spy() {
    var links = [].slice.call(document.querySelectorAll('.main-nav a'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && href.charAt(0) === '#') map[href.slice(1)] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('active'); });
          if (map[e.target.id]) map[e.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    ['services', 'pricing', 'book', 'gallery', 'visit'].forEach(function (id) {
      var s = document.getElementById(id); if (s) io.observe(s);
    });
  })();

  /* ---------------- 3D tilt on cards ---------------- */
  (function tilt() {
    if (reduce) return;
    if (!(window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches)) return;
    var els = document.querySelectorAll('.card,.price-card,.detail-item,.review,.loc-card,.gallery figure,.stat');
    Array.prototype.forEach.call(els, function (el) {
      var raf = 0;
      el.addEventListener('pointerenter', function () {
        el.style.transition = 'transform .12s ease, box-shadow .25s ease';
      });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        var lift = el.classList.contains('featured') ? -11 : -6;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.transform = 'perspective(900px) rotateX(' + (-py * 7).toFixed(2) +
            'deg) rotateY(' + (px * 8).toFixed(2) + 'deg) translateY(' + lift + 'px)';
        });
      });
      el.addEventListener('pointerleave', function () {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  })();
})();
