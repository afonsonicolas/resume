/* =============================================================================
   nafonsocv.com — first-party, privacy-first analytics
   -----------------------------------------------------------------------------
   • No third parties. No advertising. No cross-site tracking.
   • No PII collected (no names, emails, phone numbers, or precise location).
   • Cookieless: a random, per-session ID lives in sessionStorage and disappears
     when the tab/session closes. There is no persistent cross-visit identifier.
   • Respects the browser Do-Not-Track and Global Privacy Control signals.
   • Consent-gated: nothing is recorded until the visitor accepts (see consent
     banner below). The visitor can withdraw consent at any time.
   • Transport-agnostic: events are buffered locally now and POSTed to
     CONFIG.endpoint when one is configured (a dashboard can be added later
     without touching this file's instrumentation).
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = {
    site: "nafonsocv",
    // Set this to your collector URL (e.g. a Cloudflare Worker / serverless fn)
    // when the ingestion backend exists. While empty, events are buffered in
    // first-party localStorage only (capped ring buffer) and console-logged in
    // debug mode — nothing leaves the browser.
    endpoint: "",
    consentVersion: 1, // bump to re-ask for consent if the policy changes
    debug: /[?&]na_debug=1/.test(location.search) ||
           location.hostname === "localhost" ||
           location.hostname === "127.0.0.1",
    respectDoNotTrack: true,
    maxStoredEvents: 300, // local ring buffer cap when no endpoint is set
    flushIntervalMs: 15000,
    batchSize: 12
  };

  var LS = {
    consent: "na_consent",       // {choice, version, ts}
    events: "na_events"          // capped local event buffer (pre-backend)
  };
  var SS_SID = "na_sid";

  /* ---------- tiny helpers ---------- */
  function now() { return Date.now(); }
  function log() { if (CONFIG.debug && window.console) console.log.apply(console, ["[analytics]"].concat([].slice.call(arguments))); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function rid() {
    try {
      if (crypto && crypto.randomUUID) return crypto.randomUUID();
      var a = new Uint8Array(16); crypto.getRandomValues(a);
      return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    } catch (e) {
      return "s-" + now().toString(36) + "-" + Math.floor(performance.now()).toString(36);
    }
  }

  /* ---------- privacy signals ---------- */
  function dntOn() {
    if (!CONFIG.respectDoNotTrack) return false;
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    if (dnt === "1" || dnt === "yes") return true;
    if (navigator.globalPrivacyControl === true) return true;
    return false;
  }

  /* ---------- consent state ---------- */
  function readConsent() {
    var raw = lsGet(LS.consent);
    if (!raw) return null;
    try {
      var c = JSON.parse(raw);
      if (c && c.version === CONFIG.consentVersion) return c;
    } catch (e) {}
    return null;
  }
  function consentGranted() {
    if (dntOn()) return false;
    var c = readConsent();
    return !!(c && c.choice === "granted");
  }
  function writeConsent(choice) {
    lsSet(LS.consent, JSON.stringify({ choice: choice, version: CONFIG.consentVersion, ts: now() }));
  }

  /* ---------- session ---------- */
  function sessionId() {
    var sid;
    try { sid = sessionStorage.getItem(SS_SID); } catch (e) {}
    if (!sid) {
      sid = rid();
      try { sessionStorage.setItem(SS_SID, sid); } catch (e) {}
      return { id: sid, fresh: true };
    }
    return { id: sid, fresh: false };
  }

  function deviceType() {
    var w = window.innerWidth;
    if (w <= 600) return "mobile";
    if (w <= 1024) return "tablet";
    return "desktop";
  }

  // Only the referring *host* is kept — never full referrer URLs / query strings.
  function referrerHost() {
    try {
      if (!document.referrer) return "";
      var u = new URL(document.referrer);
      if (u.hostname === location.hostname) return ""; // internal nav
      return u.hostname;
    } catch (e) { return ""; }
  }

  function utm() {
    var p = new URLSearchParams(location.search), o = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
      var v = p.get(k); if (v) o[k] = v.slice(0, 120);
    });
    return o;
  }

  function context() {
    return {
      path: location.pathname,
      title: document.title.slice(0, 120),
      ref: referrerHost(),
      lang: (navigator.language || "").slice(0, 12),
      tz: (Intl.DateTimeFormat().resolvedOptions().timeZone) || "",
      vw: window.innerWidth,
      vh: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
      device: deviceType(),
      utm: utm()
    };
  }

  /* ---------- queue + transport ---------- */
  var queue = [];
  var sess = null;
  var started = false;

  function persistLocal(evt) {
    // Keep a capped, first-party local log so a future dashboard has data even
    // before the backend endpoint exists. Cleared if consent is withdrawn.
    var arr = [];
    try { arr = JSON.parse(lsGet(LS.events) || "[]"); } catch (e) { arr = []; }
    arr.push(evt);
    if (arr.length > CONFIG.maxStoredEvents) arr = arr.slice(arr.length - CONFIG.maxStoredEvents);
    lsSet(LS.events, JSON.stringify(arr));
  }

  function flush(useBeacon) {
    if (!queue.length) return;
    var batch = queue.splice(0, queue.length);
    var payload = { site: CONFIG.site, sid: sess.id, sentAt: now(), events: batch };

    if (!CONFIG.endpoint) {
      log("buffered (no endpoint set):", batch);
      return; // already persisted locally as each event was tracked
    }
    var body = JSON.stringify(payload);
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(CONFIG.endpoint, new Blob([body], { type: "application/json" }));
      } else {
        fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true, mode: "cors", credentials: "omit" });
      }
      log("sent batch of", batch.length);
    } catch (e) {
      // put them back to retry next flush
      queue = batch.concat(queue);
    }
  }

  function track(event, props) {
    if (!started) return;
    var evt = { v: 1, event: event, ts: now(), props: props || {}, ctx: context() };
    queue.push(evt);
    persistLocal(evt);
    log("event:", event, props || {});
    if (queue.length >= CONFIG.batchSize) flush(false);
  }

  /* ---------- engagement (scroll depth + engaged time) ---------- */
  function instrumentEngagement() {
    var marks = { 25: false, 50: false, 75: false, 100: false };
    function onScroll() {
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      var pct = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      [25, 50, 75, 100].forEach(function (m) {
        if (!marks[m] && pct >= m) { marks[m] = true; track("scroll_depth", { percent: m }); }
      });
    }
    window.addEventListener("scroll", throttle(onScroll, 400), { passive: true });

    // Engaged time: count seconds the tab is visible & focused.
    var engaged = 0, last = now(), visible = !document.hidden;
    setInterval(function () {
      if (visible) { engaged += now() - last; }
      last = now();
    }, 1000);
    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden; last = now();
      if (document.hidden) flush(true);
    });
    window.addEventListener("pagehide", function () {
      track("page_end", { engaged_seconds: Math.round(engaged / 1000) });
      flush(true);
    });
  }

  function throttle(fn, ms) {
    var t = 0, queued = false;
    return function () {
      var n = now();
      if (n - t >= ms) { t = n; fn(); }
      else if (!queued) { queued = true; setTimeout(function () { queued = false; t = now(); fn(); }, ms - (n - t)); }
    };
  }

  /* ---------- click auto-instrumentation ---------- */
  var EXP_TO_PROJECT = null;
  function instrumentClicks() {
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;

      // Experience background carousel slide → project interest
      var heroSlide = t.closest(".swiper-slide[data-company]");
      if (heroSlide) { track("project_open", { source: "hero_carousel", company: heroSlide.getAttribute("data-company") || "" }); }

      // "My Work" launchers (hero button, nav item, side tab) open the work modal
      var workOpen = t.closest('[data-modal-target="#modal100"], [data-modal-targets]');
      if (workOpen && !heroSlide) { track("work_open", { source: (workOpen.className || "").indexOf("bottom_banner") > -1 ? "side_tab" : "button" }); }

      // "My Work" launcher / work-modal project tiles
      var workTile = t.closest(".click-me-box");
      if (workTile) {
        var title = (workTile.querySelector(".reference") && workTile.querySelector(".reference").textContent || "").trim();
        track("project_open", { source: "work_modal", project: title.slice(0, 80) });
      }

      // Certification tiles
      var cert = t.closest(".squares");
      if (cert) track("certification_view", { name: (cert.textContent || "").trim().slice(0, 60) });

      // Reference cards
      var refCard = t.closest(".container_2 .column_2v2");
      if (refCard && refCard.querySelector(".company")) {
        track("recommendation_view", { from: (refCard.querySelector(".company").textContent || "").trim().slice(0, 60) });
      }

      // Resume (download / open)
      var link = t.closest("a, button, [onclick]");
      if (link) {
        var href = link.getAttribute("href") || (link.getAttribute("onclick") || "");
        if (/Resume[^"']*\.pdf/i.test(href) || /resume/i.test(link.className)) {
          track("resume_open", { label: (link.textContent || "").trim().slice(0, 40) });
        }
      }

      // Contact actions
      var a = t.closest("a");
      if (a) {
        var h = a.getAttribute("href") || "";
        if (/^mailto:/i.test(h)) track("contact_click", { method: "email" });
        else if (/^tel:/i.test(h)) track("contact_click", { method: "phone" });
        else if (/linkedin\.com/i.test(h)) track("contact_click", { method: "linkedin" });
        else if (/^https?:\/\//i.test(h) && h.indexOf(location.hostname) === -1) {
          track("outbound_click", { host: hostOf(h) });
        }
      }
      var contactBtn = t.closest(".contact-button");
      if (contactBtn) track("contact_click", { method: "contact_panel" });

      // Primary nav / burger nav
      var nav = t.closest(".nav_item, .menuItem1, .home-button");
      if (nav) track("nav_click", { label: (nav.textContent || "").trim().slice(0, 30) });
    }, true);
  }

  function hostOf(url) { try { return new URL(url).hostname; } catch (e) { return ""; } }

  /* ---------- lifecycle ---------- */
  function start() {
    if (started) return;
    started = true;
    sess = sessionId();
    if (sess.fresh) track("session_start", {});
    track("page_view", {});
    instrumentEngagement();
    instrumentClicks();
    setInterval(function () { flush(false); }, CONFIG.flushIntervalMs);
    log("started. session:", sess.id);
  }

  function stopAndForget() {
    started = false;
    queue = [];
    lsDel(LS.events);
    try { sessionStorage.removeItem(SS_SID); } catch (e) {}
  }

  /* ---------- consent banner UI ---------- */
  function injectBannerStyles() {
    if (document.getElementById("na-consent-style")) return;
    var css = document.createElement("style");
    css.id = "na-consent-style";
    css.textContent = [
      ".na-consent{position:fixed;left:50%;bottom:1rem;transform:translateX(-50%);z-index:10001;",
      "width:min(94%,40rem);background:#fff;color:#1a1a1a;border:1px solid #d9d8d4;",
      "border-radius:0;box-shadow:0 18px 50px rgba(0,0,0,.18);padding:1.1rem 1.25rem;",
      "font-family:'Montserrat',system-ui,sans-serif;font-size:.92rem;line-height:1.5;",
      "display:flex;flex-wrap:wrap;gap:.75rem 1rem;align-items:center;justify-content:space-between;}",
      ".na-consent p{margin:0;flex:1 1 18rem;color:#434343;}",
      ".na-consent a{color:#006AAB;text-decoration:underline;}",
      ".na-consent .na-actions{display:flex;gap:.5rem;flex:0 0 auto;}",
      ".na-consent button{font:inherit;cursor:pointer;border-radius:0;padding:.5rem 1.1rem;border:1px solid #d9d8d4;background:#fff;color:#1a1a1a;transition:transform .2s ease,background .2s ease;}",
      ".na-consent button:hover{transform:translateY(-1px);}",
      ".na-consent button.na-accept{background:#006AAB;border-color:#006AAB;color:#fff;}",
      ".na-consent button:focus-visible{outline:3px solid #006AAB;outline-offset:2px;}",
      "@media(max-width:600px){.na-consent .na-actions{flex:1 1 100%;}.na-consent button{flex:1;}}"
    ].join("");
    document.head.appendChild(css);
  }

  function showBanner() {
    if (document.querySelector(".na-consent")) return;
    injectBannerStyles();
    var bar = document.createElement("div");
    bar.className = "na-consent";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-live", "polite");
    bar.setAttribute("aria-label", "Privacy and analytics consent");
    bar.innerHTML =
      '<p>This site uses <strong>privacy-first, first-party analytics</strong> (no cookies, no third parties, no personal data) to understand which work gets viewed. ' +
      '<a href="privacy.html">Privacy&nbsp;Policy</a>.</p>' +
      '<div class="na-actions">' +
      '<button type="button" class="na-decline">Decline</button>' +
      '<button type="button" class="na-accept">Accept</button>' +
      '</div>';
    document.body.appendChild(bar);
    bar.querySelector(".na-accept").addEventListener("click", function () {
      writeConsent("granted"); removeBanner(); start();
    });
    bar.querySelector(".na-decline").addEventListener("click", function () {
      writeConsent("denied"); removeBanner(); stopAndForget();
    });
  }
  function removeBanner() { var b = document.querySelector(".na-consent"); if (b) b.remove(); }

  /* ---------- public API (used by footer "Privacy choices" link) ---------- */
  window.naAnalytics = {
    track: function (e, p) { track(e, p); },
    openConsent: function () { showBanner(); },
    grant: function () { writeConsent("granted"); removeBanner(); start(); },
    revoke: function () { writeConsent("denied"); removeBanner(); stopAndForget(); },
    status: function () { return { consent: (readConsent() || {}).choice || "unset", dnt: dntOn(), started: started }; },
    _config: CONFIG
  };

  /* ---------- boot ---------- */
  function boot() {
    if (dntOn()) { log("Do-Not-Track / GPC on — analytics disabled, no banner."); return; }
    var c = readConsent();
    if (c && c.choice === "granted") { start(); }
    else if (c && c.choice === "denied") { /* respect prior decline, stay silent */ }
    else { showBanner(); } // first visit, no decision yet
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
