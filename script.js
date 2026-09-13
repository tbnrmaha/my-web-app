/* ==========================================================================
   Nexbyte AI — site scripts
   Vanilla JS · no dependencies
   ========================================================================== */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.getElementById("site-header");
  var backToTop = document.getElementById("back-to-top");
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("nav-toggle");

  if (document.getElementById("year")) {
    document.getElementById("year").textContent = new Date().getFullYear();
  }

  /* ---------- Header state ---------- */
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle("scrolled", y > 10);
    backToTop.classList.toggle("visible", y > 600);
  }

  /* ---------- Mobile navigation ---------- */
  function toggleNav(force) {
    var open = typeof force === "boolean" ? force : !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  }

  navToggle.addEventListener("click", function () { toggleNav(); });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (nav.classList.contains("open")) toggleNav(false);
    });
  });

  document.addEventListener("click", function (e) {
    if (nav.classList.contains("open") && !nav.contains(e.target) && !navToggle.contains(e.target)) {
      toggleNav(false);
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900 && nav.classList.contains("open")) toggleNav(false);
  });

  /* ---------- Active nav indicator (scrollspy) ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + id);
    });
  }

  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });

  sections.forEach(function (s) { spy.observe(s); });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var siblings = entry.target.parentElement.children;
          var idx = Array.prototype.indexOf.call(siblings, entry.target);
          entry.target.style.setProperty("--reveal-delay", Math.min(idx * 0.08, 0.4) + "s");
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Back to top ---------- */
  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  /* ---------- Contact form validation ---------- */
  var form = document.getElementById("contact-form");
  var successMsg = document.getElementById("form-success");

  var validators = {
    name: function (v) { return v.trim().length >= 2; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
    phone: function (v) { return /^[+()\-.\s\d]{7,20}$/.test(v.trim()); },
    "project-type": function (v) { return v.trim() !== ""; },
    message: function (v) { return v.trim().length >= 10; }
  };

  var messages = {
    name: "Please enter your name (at least 2 characters).",
    email: "Please enter a valid email address.",
    phone: "Please enter a valid phone number.",
    "project-type": "Please select a project type.",
    message: "Please describe your project (at least 10 characters)."
  };

  function fieldWrap(el) { return el.closest(".field"); }

  function setError(el, hasError) {
    fieldWrap(el).classList.toggle("invalid", hasError);
    var errEl = document.getElementById(el.id + "-error");
    if (errEl) {
      errEl.hidden = !hasError;
      errEl.textContent = hasError ? messages[el.name] : "";
    }
    el.setAttribute("aria-invalid", String(hasError));
  }

  function validateField(el) {
    var valid;
    if (validators[el.name]) {
      valid = validators[el.name](el.value);
    } else {
      valid = true;
    }
    setError(el, !valid);
    return valid;
  }

  Object.keys(validators).forEach(function (name) {
    var el = form.elements[name];
    if (!el) return;
    el.addEventListener("blur", function () { validateField(el); });
    el.addEventListener("input", function () {
      if (fieldWrap(el).classList.contains("invalid")) validateField(el);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var firstInvalid = null;
    Object.keys(validators).forEach(function (name) {
      var el = form.elements[name];
      if (el && !validateField(el) && !firstInvalid) firstInvalid = el;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    successMsg.hidden = false;
    form.reset();
    form.querySelectorAll(".field").forEach(function (f) { f.classList.remove("invalid"); });
    successMsg.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });

    setTimeout(function () { successMsg.hidden = true; }, 8000);
  });

  /* ---------- HERO: neural network canvas ---------- */
  var canvas = document.getElementById("neural-canvas");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (canvas && !prefersReduced.matches) {
    var ctx = canvas.getContext("2d");
    var particles = [];
    var raf = 0;
    var cols = ["79, 140, 255", "168, 85, 247", "56, 189, 248"];

    var orb = canvas.parentElement.querySelector(".orb");
    var orbRect = function () {
      var r = orb.getBoundingClientRect();
      return { x: r.width / 2, y: r.height / 2, r: r.width * 0.34 };
    };

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var o = orbRect();

      var count = Math.min(70, Math.floor((rect.width * rect.height) / 5200));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.32,
          vy: (Math.random() - 0.5) * 0.32,
          r: Math.random() * 2.1 + 0.8,
          c: cols[Math.floor(Math.random() * cols.length)],
          outside: Math.random() > 0.42
        });
      }
      /* keep nodes near the orb shell lightly biased */
      particles.forEach(function (p) {
        if (!p.outside) {
          var a = Math.random() * Math.PI * 2;
          p.x = o.x + Math.cos(a) * o.r * (0.7 + Math.random() * 0.6);
          p.y = o.y + Math.sin(a) * o.r * (0.7 + Math.random() * 0.6);
        }
      });
    }

    function distance(ax, ay, bx, by) {
      return Math.hypot(ax - bx, ay - by);
    }

    function draw() {
      var rect = canvas.parentElement.getBoundingClientRect();
      var o = orbRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      var r = Math.random() * 2 - 1;
      particles.forEach(function (p) {
        p.x += p.vx + r * 0.05;
        p.y += p.vy + r * 0.05;

        if (p.x < -20) p.x = rect.width + 20;
        if (p.x > rect.width + 20) p.x = -20;
        if (p.y < -20) p.y = rect.height + 20;
        if (p.y > rect.height + 20) p.y = -20;
      });

      /* links */
      var linkDist = 110;
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var a = particles[i], b = particles[j];
          var d = distance(a.x, a.y, b.x, b.y);
          if (d < linkDist) {
            var alpha = (1 - d / linkDist) * 0.5;
            ctx.strokeStyle = "rgba(" + a.c + "," + alpha.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      /* nodes */
      particles.forEach(function (p) {
        ctx.fillStyle = "rgba(" + p.c + ",0.85)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      /* soft core glow */
      var g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0, "rgba(79,140,255,0.10)");
      g.addColorStop(1, "rgba(79,140,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, rect.width, rect.height);

      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    prefersReduced.addEventListener("change", function (e) {
      cancelAnimationFrame(raf);
      if (e.matches) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  /* ---------- Init ---------- */
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();