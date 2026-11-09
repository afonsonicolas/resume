// Make non-native interactive elements (spans/divs used as buttons or close
// triggers) keyboard-accessible: focusable + activatable with Enter / Space.
document.addEventListener("DOMContentLoaded", function() {
    const interactive = document.querySelectorAll(
      ".button[data-modal-target], .button[data-modal-targets], [data-modal-close], .exp-card, .recommendation"
    );
    interactive.forEach(el => {
      const tag = el.tagName.toLowerCase();
      if (tag === "a" || tag === "button") return; // already accessible
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
      if (!el.hasAttribute("role")) el.setAttribute("role", "button");
      el.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          el.click();
        }
      });
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const WORK_MODALS = ['#modal10', '#modal11', '#modal12', '#modal13', '#modal14', '#modal15', '#modal16'];

    function hideWorkDetails() {
      WORK_MODALS.forEach(id => {
        const modal = document.querySelector(id);
        if (modal) modal.style.display = 'none';
      });
      // reset the work modal back to its project-picker (grid) view
      document.querySelectorAll('.content-gallery.detail-open')
        .forEach(g => g.classList.remove('detail-open'));
    }

    function closeAllModals() {
      hideWorkDetails();
      document.body.classList.remove('modal-open');
    }

    const buttons = document.querySelectorAll(".button");
    buttons.forEach(button => {
      button.addEventListener("click", function() {
        closeAllModals();
        let targets = [];
        if (this.hasAttribute("data-modal-targets")) {
          targets = this.getAttribute("data-modal-targets").split(',').map(s => s.trim());
        } else if (this.hasAttribute("data-modal-target")) {
          targets = [this.getAttribute("data-modal-target")];
        }
        targets.forEach(id => {
          const modal = document.querySelector(id);
          if (modal) modal.style.display = "block";
        });

        // A work-example tile: switch the modal to its detail (content-focus) view
        if (this.classList.contains('click-me-box')) {
          const gallery = this.closest('.content-gallery');
          if (gallery) {
            gallery.classList.add('detail-open');
            const active = document.querySelector(targets[0]);
            const cd = active && active.querySelector('.content-description');
            if (cd) cd.scrollTop = 0;
          }
        }
        document.body.classList.add('modal-open');
      });
    });

    // "All projects" back button — return from a detail view to the picker grid
    document.querySelectorAll('[data-work-back]').forEach(btn => {
      btn.addEventListener('click', function() {
        const gallery = this.closest('.content-gallery');
        if (gallery) {
          gallery.classList.remove('detail-open');
          const rerow = gallery.querySelector('.rerow');
          if (rerow) rerow.scrollTop = 0;
        }
        WORK_MODALS.forEach(id => {
          const modal = document.querySelector(id);
          if (modal) modal.style.display = 'none';
        });
      });
    });
  
    const closeButtons = document.querySelectorAll("[data-modal-close]");
    closeButtons.forEach(button => {
      button.addEventListener("click", function() {
        document.body.classList.remove('modal-open');  // Enable scrolling first
        const modal = button.closest(".modal");
        if (modal) {
          modal.style.display = "none";
        }
      });
    });
  
    const modals = document.querySelectorAll(".modal");
    modals.forEach(modal => {
      modal.addEventListener("click", function(e) {
        if (e.target === modal) {
          modal.style.display = "none";
          document.body.classList.remove('modal-open');
        }
      });
    });
  });
  
  document.addEventListener('DOMContentLoaded', function() {
    var popup = document.querySelector('.popup');
    var introPopup = document.querySelector('.introduction_popup');
    if (!popup || !introPopup) return;
    var closeButton = popup.querySelector('.close-button');

    function hidePopup() { popup.style.display = 'none'; }

    // Show the welcome intro only ONCE per visitor (it used to pop on every load),
    // and never stack it on top of the privacy consent prompt — defer until the
    // visitor has made a consent choice (or has Do-Not-Track / GPC enabled).
    var SEEN_KEY = 'na_intro_seen';
    var alreadySeen = null, consentDecided = false;
    try { alreadySeen = localStorage.getItem(SEEN_KEY); } catch (e) {}
    try { consentDecided = !!localStorage.getItem('na_consent'); } catch (e) {}
    var privacySignal = navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes' ||
                        navigator.globalPrivacyControl === true;
    var consentBannerWillShow = !consentDecided && !privacySignal;
    if (!alreadySeen && !consentBannerWillShow) {
      setTimeout(function() {
        popup.style.display = 'flex';
        try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
      }, 1200);
    }

    document.addEventListener('click', function(event) {
      if (popup.style.display === 'flex' && !introPopup.contains(event.target)) {
        hidePopup();
      }
    });
    if (closeButton) closeButton.addEventListener('click', hidePopup);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') hidePopup();
    });
  });