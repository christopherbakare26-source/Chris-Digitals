/* ==========================================================================
   Chris Digitals — site behaviour
   --------------------------------------------------------------------------
   CONFIGURATION
   Set FORM_ENDPOINT to a real form/booking endpoint to enable direct
   submission (Formspree, Basin, Netlify Forms, a Google Apps Script Web App,
   or your own PHP handler). Leave it empty ("") and the form falls back to
   composing a pre-filled email in the visitor's mail client — which works
   with no backend at all, but requires the visitor to press Send.

   See SETUP-GUIDE.md for step-by-step instructions.
   ========================================================================== */

var SITE_CONFIG = window.CD_CONFIG || {
  FORM_ENDPOINT: "",
  FORM_ACCESS_KEY: "",
  OWNER_EMAIL: "christopherbakare014@gmail.com",
  CALENDLY_URL: "",
  CALENDLY_BRAND: ""
};

(function () {
  "use strict";

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");

  function closeNav() {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      mobileNav.classList.toggle("is-open", !open);
      document.body.style.overflow = !open ? "hidden" : "";
    });

    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealEls.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms";
        io.observe(el);
      });
    } else {
      revealEls.forEach(function (el) { el.classList.add("is-in"); });
    }
  }

  /* ---------- Card pointer glow ---------- */
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Calendly: popup + inline embed ---------- */
  var CALENDLY = SITE_CONFIG.CALENDLY_URL || "";
  var CALENDLY_FULL = CALENDLY
    ? CALENDLY + (CALENDLY.indexOf("?") > -1 ? "&" : "?") + (SITE_CONFIG.CALENDLY_BRAND || "")
    : "";

  // Load Calendly's official widget script once, only when needed.
  var calendlyLoading = false;
  function loadCalendly(cb) {
    if (window.Calendly) { cb(); return; }
    if (calendlyLoading) {
      document.addEventListener("calendly:ready", cb, { once: true });
      return;
    }
    calendlyLoading = true;
    document.addEventListener("calendly:ready", cb, { once: true });
    var s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    s.onload = function () { document.dispatchEvent(new Event("calendly:ready")); };
    s.onerror = function () { document.dispatchEvent(new Event("calendly:ready")); };
    document.head.appendChild(s);
  }

  // Any element with [data-calendly] opens the booking popup.
  // Delegated, so links injected later (e.g. in the form success message) work too.
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest ? e.target.closest("[data-calendly]") : null;
    if (!trigger) return;
    if (!CALENDLY_FULL) return; // no booking URL configured: let the link behave normally
    e.preventDefault();
    loadCalendly(function () {
      if (window.Calendly && window.Calendly.initPopupWidget) {
        window.Calendly.initPopupWidget({ url: CALENDLY_FULL });
      } else {
        window.open(CALENDLY_FULL, "_blank", "noopener");
      }
    });
  });

  // Inline embed in the contact sidebar.
  var bookingMount = document.querySelector("[data-booking-embed]");
  if (bookingMount && CALENDLY_FULL) {
    var inline = document.createElement("div");
    inline.className = "calendly-inline-widget";
    inline.setAttribute("data-url", CALENDLY_FULL);
    inline.style.minWidth = "280px";
    inline.style.height = "660px";
    bookingMount.innerHTML = "";
    bookingMount.appendChild(inline);
    loadCalendly(function () {
      if (window.Calendly && window.Calendly.initInlineWidget) {
        window.Calendly.initInlineWidget({ url: CALENDLY_FULL, parentElement: inline });
      }
    });
  }

  /* ---------- Enquiry form ---------- */
  var form = document.getElementById("enquiry-form");
  if (!form) return;

  var statusEl = document.getElementById("form-status");
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitLabel = submitBtn ? submitBtn.innerHTML : "";

  var REQUIRED = ["fullName", "email", "service", "budget", "description", "consent"];

  function setStatus(kind, html) {
    if (!statusEl) return;
    statusEl.className = "form-status is-visible form-status--" + kind;
    statusEl.innerHTML = html;
    statusEl.setAttribute("role", kind === "err" ? "alert" : "status");
  }

  function clearStatus() {
    if (!statusEl) return;
    statusEl.className = "form-status";
    statusEl.innerHTML = "";
  }

  function fieldWrap(input) {
    return input.closest(".field") || input.closest(".checkbox");
  }

  function showError(input, message) {
    input.setAttribute("aria-invalid", "true");
    var wrap = fieldWrap(input);
    if (!wrap) return;
    var err = wrap.querySelector(".field__error");
    if (err) {
      err.textContent = message;
      err.classList.add("is-visible");
    }
  }

  function clearError(input) {
    input.removeAttribute("aria-invalid");
    var wrap = fieldWrap(input);
    if (!wrap) return;
    var err = wrap.querySelector(".field__error");
    if (err) {
      err.textContent = "";
      err.classList.remove("is-visible");
    }
  }

  function validate() {
    var firstBad = null;
    var errors = 0;

    REQUIRED.forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      var value = (input.type === "checkbox") ? input.checked : String(input.value || "").trim();

      if (!value) {
        errors++;
        showError(input, input.type === "checkbox"
          ? "Please confirm you agree to be contacted."
          : "This field is required.");
        if (!firstBad) firstBad = input;
        return;
      }

      if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        errors++;
        showError(input, "Please enter a valid email address.");
        if (!firstBad) firstBad = input;
        return;
      }

      if (name === "description" && value.length < 20) {
        errors++;
        showError(input, "Please add a little more detail (at least 20 characters).");
        if (!firstBad) firstBad = input;
        return;
      }

      clearError(input);
    });

    // Optional phone: validate only if filled
    var phone = form.elements["phone"];
    if (phone && String(phone.value || "").trim()) {
      if (!/^[+()\d\s.-]{7,20}$/.test(phone.value.trim())) {
        errors++;
        showError(phone, "Please enter a valid phone number, or leave it blank.");
        if (!firstBad) firstBad = phone;
      } else {
        clearError(phone);
      }
    }

    if (firstBad) {
      firstBad.focus({ preventScroll: false });
      firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return errors === 0;
  }

  // Live clearing of errors
  form.querySelectorAll("input, select, textarea").forEach(function (input) {
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") clearError(input);
    });
    input.addEventListener("change", function () {
      if (input.getAttribute("aria-invalid") === "true") clearError(input);
    });
  });

  function collect() {
    var d = new FormData(form);
    var out = {};
    d.forEach(function (v, k) { out[k] = typeof v === "string" ? v.trim() : v; });
    out.consent = form.elements["consent"].checked ? "Yes" : "No";
    out.submittedAt = new Date().toISOString();
    out.page = window.location.href;
    return out;
  }

  function prettyDate(iso) {
    if (!iso) return "Not specified";
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  function buildEmailBody(data) {
    return [
      "New discovery call request — chrisdigitals.com",
      "",
      "Name: " + (data.fullName || ""),
      "Email: " + (data.email || ""),
      "Phone: " + (data.phone || "Not provided"),
      "Company: " + (data.company || "Not provided"),
      "Service required: " + (data.service || ""),
      "Project budget: " + (data.budget || ""),
      "Preferred meeting date: " + prettyDate(data.meetingDate),
      "Preferred meeting time: " + (data.meetingTime || "Not specified"),
      "",
      "Project description:",
      (data.description || ""),
      "",
      "Consent to be contacted: " + data.consent,
      "Submitted: " + data.submittedAt,
      "Page: " + data.page
    ].join("\n");
  }

  /* ---- Spam + duplicate protection ---------------------------------- */

  // Time trap: a real person cannot fill this form in under 3 seconds.
  var formRenderedAt = Date.now();
  var MIN_FILL_MS = 3000;

  // Duplicate guard: remember the last payload sent from this browser.
  var DUP_KEY = "cd_enquiry_last";
  var DUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

  function payloadFingerprint(data) {
    return [data.email, data.fullName, data.service, data.description]
      .join("|").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function isDuplicate(data) {
    try {
      var raw = window.localStorage.getItem(DUP_KEY);
      if (!raw) return false;
      var prev = JSON.parse(raw);
      if (!prev || !prev.fp || !prev.at) return false;
      if (Date.now() - prev.at > DUP_WINDOW_MS) return false;
      return prev.fp === payloadFingerprint(data);
    } catch (err) {
      return false; // storage blocked (private mode): never block a real enquiry
    }
  }

  function rememberSubmission(data) {
    try {
      window.localStorage.setItem(DUP_KEY, JSON.stringify({
        fp: payloadFingerprint(data),
        at: Date.now()
      }));
    } catch (err) { /* ignore */ }
  }

  function clearSubmissionMemory() {
    try { window.localStorage.removeItem(DUP_KEY); } catch (err) { /* ignore */ }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearStatus();

    if (!validate()) {
      setStatus("err", "Please check the highlighted fields and try again.");
      return;
    }

    // Honeypot: a hidden field only a bot would fill in.
    var honey = form.elements["company_website"];
    if (honey && String(honey.value || "").trim()) {
      setStatus("ok", "<strong>Thank you — your request has been received.</strong>");
      return;
    }

    // Time trap.
    if (Date.now() - formRenderedAt < MIN_FILL_MS) {
      setStatus("err", "That was a little too quick — please take a moment and submit again.");
      return;
    }

    var data = collect();

    // Duplicate guard.
    if (isDuplicate(data)) {
      setStatus(
        "info",
        "<strong>This enquiry has already been sent.</strong><br>" +
        "We received your details a few minutes ago and Christopher will reply to " +
        "<strong>" + data.email + "</strong> within one business day. " +
        "If you need to add something, email <a href=\"mailto:" + SITE_CONFIG.OWNER_EMAIL +
        "\" style=\"color:inherit;text-decoration:underline\">" + SITE_CONFIG.OWNER_EMAIL + "</a>."
      );
      return;
    }

    // Not configured yet: say so honestly instead of faking a send.
    if (!SITE_CONFIG.FORM_ENDPOINT || !SITE_CONFIG.FORM_ACCESS_KEY) {
      setStatus(
        "err",
        "<strong>The form is not connected yet.</strong><br>" +
        "Please email <a href=\"mailto:" + SITE_CONFIG.OWNER_EMAIL +
        "\" style=\"color:inherit;text-decoration:underline\">" + SITE_CONFIG.OWNER_EMAIL +
        "</a> directly and Christopher will reply within one business day."
      );
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Sending…";
    }

    // Web3Forms expects a flat JSON body with the access key included.
    var payload = {
      access_key: SITE_CONFIG.FORM_ACCESS_KEY,
      subject: "New project enquiry — " + (data.fullName || "Website visitor"),
      from_name: "Chris Digitals website",
      replyto: data.email,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || "Not provided",
      company: data.company || "Not provided",
      service: data.service,
      budget: data.budget,
      meetingDate: prettyDate(data.meetingDate),
      meetingTime: data.meetingTime,
      description: data.description,
      consent: data.consent,
      submittedAt: data.submittedAt,
      page: data.page
    };

    fetch(SITE_CONFIG.FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok || body.success === false) {
            throw new Error(body.message || ("Request failed with status " + res.status));
          }
          return body;
        });
      })
      .then(function () {
        rememberSubmission(data);
        form.reset();
        formRenderedAt = Date.now();
        setStatus(
          "ok",
          "<strong>Thank you — your enquiry has been sent.</strong><br>" +
          "Christopher will reply to <strong>" + data.email + "</strong> within one business day. " +
          "If you'd like to pick a time right now, " +
          "<a href=\"#\" data-calendly style=\"color:inherit;text-decoration:underline\">book a discovery call</a>."
        );
        if (statusEl) statusEl.scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(function (err) {
        setStatus(
          "err",
          "<strong>Something went wrong sending the form.</strong><br>" +
          (err && err.message ? "(" + err.message + ") " : "") +
          "Please try again in a moment, or email <a href=\"mailto:" + SITE_CONFIG.OWNER_EMAIL +
          "\" style=\"color:inherit;text-decoration:underline\">" + SITE_CONFIG.OWNER_EMAIL + "</a> directly."
        );
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitLabel;
        }
      });
  });

  /* ---------- Minimum date = today ---------- */
  var dateInput = form.elements["meetingDate"];
  if (dateInput) {
    var today = new Date();
    var iso = today.getFullYear() + "-" +
      String(today.getMonth() + 1).padStart(2, "0") + "-" +
      String(today.getDate()).padStart(2, "0");
    dateInput.min = iso;
  }
})();
