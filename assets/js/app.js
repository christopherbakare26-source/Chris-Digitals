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

var SITE_CONFIG = {
  // e.g. "https://formspree.io/f/xxxxxxxx"  — leave "" to use the email fallback
  FORM_ENDPOINT: "",
  // Where enquiries are delivered
  OWNER_EMAIL: "christopherbakare014@gmail.com",
  // Optional: Cal.com / Calendly booking page. When set, the booking panel
  // on contact.html embeds it automatically.
  BOOKING_URL: ""
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

  /* ---------- Booking embed ---------- */
  var bookingMount = document.querySelector("[data-booking-embed]");
  if (bookingMount && SITE_CONFIG.BOOKING_URL) {
    var iframe = document.createElement("iframe");
    iframe.src = SITE_CONFIG.BOOKING_URL;
    iframe.title = "Book a free discovery call with Christopher Bakare";
    iframe.loading = "lazy";
    bookingMount.innerHTML = "";
    bookingMount.appendChild(iframe);
    var note = bookingMount.querySelector(".booking-slot__text");
    if (note) note.remove();
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

  function mailtoFallback(data) {
    var subject = "Discovery call request — " + (data.fullName || "Website enquiry");
    var href = "mailto:" + SITE_CONFIG.OWNER_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(buildEmailBody(data));

    setStatus(
      "info",
      "<strong>One last step — send the email.</strong><br>" +
      "Your email app is opening with all your details already filled in. " +
      "Press <em>Send</em> there and your request reaches Christopher directly at " +
      "<a href=\"mailto:" + SITE_CONFIG.OWNER_EMAIL + "\" style=\"color:inherit;text-decoration:underline\">" +
      SITE_CONFIG.OWNER_EMAIL + "</a>.<br><br>" +
      "Nothing opened? <a href=\"" + href + "\" style=\"color:inherit;text-decoration:underline\">" +
      "Click here to open the email</a>, or copy your details below and send them yourself." +
      "<br><br><button type=\"button\" class=\"btn btn--ghost btn--sm\" id=\"copy-details\">Copy my details</button>"
    );

    var copyBtn = document.getElementById("copy-details");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var text = buildEmailBody(data);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            copyBtn.textContent = "Copied ✓";
          }).catch(function () {
            copyBtn.textContent = "Copy failed — please select the text manually";
          });
        } else {
          copyBtn.textContent = "Copy not supported in this browser";
        }
      });
    }

    window.location.href = href;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearStatus();

    if (!validate()) {
      setStatus("err", "Please check the highlighted fields and try again.");
      return;
    }

    var data = collect();

    if (!SITE_CONFIG.FORM_ENDPOINT) {
      mailtoFallback(data);
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Sending…";
    }

    fetch(SITE_CONFIG.FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Request failed with status " + res.status);
        return res;
      })
      .then(function () {
        form.reset();
        setStatus(
          "ok",
          "<strong>Thank you — your request has been sent.</strong><br>" +
          "Christopher will reply to <strong>" + data.email + "</strong> within one business day " +
          "to confirm your discovery call. A confirmation has also been sent to your inbox."
        );
        statusEl.scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(function () {
        setStatus(
          "err",
          "<strong>Something went wrong sending the form.</strong><br>" +
          "Please try again, or email <a href=\"mailto:" + SITE_CONFIG.OWNER_EMAIL +
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
