/* ==========================================================================
   Chris Digitals — motion layer
   --------------------------------------------------------------------------
   Additive animation only: hero particles, custom cursor, hero mouse
   parallax. No libraries, no layout changes, no content changes.

   Everything is disabled when the visitor prefers reduced motion, and the
   cursor / parallax are disabled on touch and coarse-pointer devices.
   ========================================================================== */

(function () {
  "use strict";

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fineQuery = window.matchMedia("(pointer: fine) and (hover: hover)");

  function reduced() { return reduceQuery.matches; }
  function finePointer() { return fineQuery.matches; }

  /* ---------- Shared animation loop ---------- */
  var tickers = [];
  var rafId = null;

  function loop(t) {
    for (var i = 0; i < tickers.length; i++) tickers[i](t);
    rafId = window.requestAnimationFrame(loop);
  }

  function startLoop() {
    if (rafId === null && tickers.length) rafId = window.requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopLoop();
    else startLoop();
  });

  /* ======================================================================
     1. Hero glowing particles
     ====================================================================== */
  function initParticles() {
    var hosts = document.querySelectorAll(".hero, .page-hero");
    if (!hosts.length) return;

    // One pre-rendered glow sprite, reused for every particle.
    var sprite = (function () {
      var s = document.createElement("canvas");
      s.width = s.height = 64;
      var c = s.getContext("2d");
      var g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(196, 181, 253, 1)");
      g.addColorStop(0.35, "rgba(139, 108, 255, 0.55)");
      g.addColorStop(1, "rgba(124, 92, 255, 0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
      return s;
    })();

    var scenes = [];

    function sizeScene(scene) {
      var rect = scene.host.getBoundingClientRect();
      scene.w = Math.max(1, Math.round(rect.width));
      scene.h = Math.max(1, Math.round(rect.height));
      scene.dpr = Math.min(window.devicePixelRatio || 1, 2);

      scene.canvas.width = Math.round(scene.w * scene.dpr);
      scene.canvas.height = Math.round(scene.h * scene.dpr);
      scene.canvas.style.width = scene.w + "px";
      scene.canvas.style.height = scene.h + "px";
      scene.ctx.setTransform(scene.dpr, 0, 0, scene.dpr, 0, 0);
    }

    function seedScene(scene) {
      var density = (scene.w * scene.h) / 24000;
      var count = Math.round(Math.min(34, Math.max(10, density)));
      if (!finePointer()) count = Math.round(count * 0.55);

      scene.particles = [];
      for (var i = 0; i < count; i++) {
        scene.particles.push({
          x: Math.random() * scene.w,
          y: Math.random() * scene.h,
          r: 1 + Math.random() * 1.9,
          vx: (Math.random() - 0.5) * 0.16,
          vy: -0.06 - Math.random() * 0.16,
          a: 0.16 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0006 + Math.random() * 0.0011
        });
      }
    }

    Array.prototype.forEach.call(hosts, function (host) {
      var canvas = host.querySelector(".hero__particles, .page-hero__particles");
      if (!canvas) return;

      var ctx = canvas.getContext("2d");
      if (!ctx) return;

      var scene = {
        host: host,
        canvas: canvas,
        ctx: ctx,
        w: 0,
        h: 0,
        dpr: 1,
        particles: [],
        visible: true
      };

      sizeScene(scene);
      seedScene(scene);
      canvas.classList.add("is-ready");

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          scene.visible = entries[0].isIntersecting;
        }, { rootMargin: "120px" }).observe(host);
      }

      scenes.push(scene);
    });

    if (!scenes.length) return;

    // Re-measure on resize (debounced); only re-seed when the width really changed.
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        for (var i = 0; i < scenes.length; i++) {
          var s = scenes[i];
          var rect = s.host.getBoundingClientRect();
          var nextW = Math.max(1, Math.round(rect.width));
          if (Math.abs(nextW - s.w) > 2) {
            sizeScene(s);
            seedScene(s);
          }
        }
      }, 180);
    });

    tickers.push(function (t) {
      for (var i = 0; i < scenes.length; i++) {
        var s = scenes[i];
        if (!s.visible || !s.w) continue;

        s.ctx.clearRect(0, 0, s.w, s.h);

        for (var j = 0; j < s.particles.length; j++) {
          var p = s.particles[j];

          p.x += p.vx;
          p.y += p.vy;

          if (p.y < -12) { p.y = s.h + 12; p.x = Math.random() * s.w; }
          if (p.x < -12) p.x = s.w + 12;
          if (p.x > s.w + 12) p.x = -12;

          var twinkle = 0.72 + 0.28 * Math.sin(t * p.speed + p.phase);
          var size = p.r * 6;

          s.ctx.globalAlpha = p.a * twinkle;
          s.ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
        }

        s.ctx.globalAlpha = 1;
      }
    });
  }

  /* ======================================================================
     2. Custom cursor — glowing dot + trailing ring
     ====================================================================== */
  function initCursor() {
    if (!finePointer()) return;

    var dot = document.createElement("div");
    var ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    dot.setAttribute("aria-hidden", "true");
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var root = document.documentElement;
    var mx = window.innerWidth / 2;
    var my = window.innerHeight / 2;
    var rx = mx;
    var ry = my;
    var started = false;

    var HOVER_SELECTOR = [
      "a", "button", ".btn", ".card", ".project", ".nav__link",
      ".link-arrow", ".wa-float", ".contact-item", ".toolstrip__list li",
      ".card__shot-link", ".project__shot-link", ".chip", ".skill-list li",
      "input", "textarea", "select", "label"
    ].join(",");

    function onMove(e) {
      mx = e.clientX;
      my = e.clientY;
      if (!started) {
        started = true;
        rx = mx;
        ry = my;
        root.classList.add("has-cursor");
      }
      root.classList.remove("is-pointer-out");
    }

    function onOver(e) {
      var t = e.target;
      if (t && t.closest && t.closest(HOVER_SELECTOR)) {
        root.classList.add("is-hovering");
      } else {
        root.classList.remove("is-hovering");
      }
    }

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", function () {
      root.classList.add("is-pointer-out");
    });
    document.addEventListener("pointerenter", function () {
      root.classList.remove("is-pointer-out");
    });

    tickers.push(function () {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
    });
  }

  /* ======================================================================
     3. Hero mouse parallax — gentle drift of the portrait block
     ====================================================================== */
  function initHeroParallax() {
    if (!finePointer()) return;

    var hero = document.querySelector(".hero");
    if (!hero) return;

    var visual = hero.querySelector(".hero__visual");
    if (!visual) return;

    var targetX = 0;
    var targetY = 0;
    var curX = 0;
    var curY = 0;
    var active = false;

    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      var ny = (e.clientY - r.top) / r.height - 0.5;
      targetX = nx * 16;
      targetY = ny * 12;
      active = true;
    }, { passive: true });

    hero.addEventListener("pointerleave", function () {
      targetX = 0;
      targetY = 0;
      active = true;
    });

    tickers.push(function () {
      if (!active) return;
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;

      if (Math.abs(curX - targetX) < 0.05 && Math.abs(curY - targetY) < 0.05) {
        curX = targetX;
        curY = targetY;
        if (targetX === 0 && targetY === 0) {
          visual.style.transform = "";
          active = false;
          return;
        }
      }

      visual.style.transform =
        "translate3d(" + curX.toFixed(2) + "px," + curY.toFixed(2) + "px,0)";
    });
  }

  /* ======================================================================
     Boot
     ====================================================================== */
  function boot() {
    if (reduced()) return;
    initParticles();
    initCursor();
    initHeroParallax();
    startLoop();
  }

  function teardown() {
    stopLoop();
    tickers.length = 0;
    document.documentElement.classList.remove("has-cursor", "is-hovering");
    var d = document.querySelector(".cursor-dot");
    var r = document.querySelector(".cursor-ring");
    if (d) d.remove();
    if (r) r.remove();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // React to a change in the reduced-motion preference
  var onPrefChange = function () {
    if (reduced()) teardown();
    else if (!tickers.length) boot();
  };
  if (reduceQuery.addEventListener) reduceQuery.addEventListener("change", onPrefChange);
  else if (reduceQuery.addListener) reduceQuery.addListener(onPrefChange);
})();
