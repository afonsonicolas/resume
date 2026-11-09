// The stylistic line shrinks toward its center, so each letter is revealed only
// once the line's *actual* (live, eased) edge has swept past its position. We
// store every letter's horizontal distance from the line's center, then a
// requestAnimationFrame loop reads the line's animating width each frame and
// shows the letters the receding edge has already uncovered (outer letters
// first; letters left of center go L→R, letters right of center go R→L; center
// letters last).
var navChars = [];

function layoutNavCascade() {
  var nav = document.querySelector('.navigation_items');
  navChars = [];
  if (!nav) return;
  var chars = nav.querySelectorAll('.na-char');
  if (!chars.length) return;
  var navRect = nav.getBoundingClientRect();
  var center = navRect.left + navRect.width / 2;   // same center the line collapses to
  chars.forEach(function(c) {
    var r = c.getBoundingClientRect();
    navChars.push({ el: c, dist: Math.abs((r.left + r.width / 2) - center) });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Split each nav label into per-letter spans for the reveal cascade.
  document.querySelectorAll('.nav_item').forEach(function(item) {
    var text = item.textContent.trim();
    item.textContent = '';
    text.split('').forEach(function(ch) {
      var span = document.createElement('span');
      span.className = 'na-char';
      span.textContent = ch;
      item.appendChild(span);
    });
  });
  layoutNavCascade();

  // Recompute when layout changes (fonts finish loading, viewport resizes).
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(layoutNavCascade); }
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutNavCascade, 150);
  });

  if (!('ontouchstart' in window)) {
    let topBar = document.querySelector('.top_bar');

    topBar.addEventListener('mouseenter', function() {
      toggleItems(true);
    });

    topBar.addEventListener('mouseleave', function() {
      toggleItems(false);
    });
  }
});

const menu = document.querySelector(".burgermenu");
const menuItems = document.querySelector(".menuItem1");
const hamburger = document.querySelector(".hamburger");
const closeIcon = document.querySelector(".closeIcon");
const menuIcon = document.querySelector(".menuIcon");

function toggleMenu() {
  if (menu.classList.contains("showMenu")) {
    menu.classList.remove("showMenu");
    closeIcon.style.display = "none";
    menuIcon.style.display = "block";
  } else {
    menu.classList.add("showMenu");
    closeIcon.style.display = "block";
    menuIcon.style.display = "none";
  }
}

hamburger.addEventListener("click", toggleMenu);

let navRevealTimer;
let navRAF = null;
let navOpen = false;

// Each frame: read the line's current (animating) half-width and reveal every
// letter whose distance from center exceeds it — i.e. letters the receding edge
// has already passed. Keeps the reveal locked to the line, easing and all.
function revealLettersByLine() {
  var line = document.querySelector('.menu_line');
  if (!line) { navRAF = null; return; }
  var halfWidth = (parseFloat(getComputedStyle(line).width) || 0) / 2;
  var pending = false;
  navChars.forEach(function(c) {
    if (c.dist > halfWidth) {
      if (c.el.style.opacity !== '1') c.el.style.opacity = '1';
    } else {
      pending = true;
    }
  });
  navRAF = (navOpen && pending) ? requestAnimationFrame(revealLettersByLine) : null;
}

function toggleItems(hovered) {
  let navItems = document.querySelector('.navigation_items');
  let menuLines = document.querySelectorAll('.menu_line');
  let lifts = document.querySelectorAll('.menutype');
  let planes = document.querySelectorAll('.plane-wrapper');

  clearTimeout(navRevealTimer);
  if (navRAF) { cancelAnimationFrame(navRAF); navRAF = null; }

  if (hovered) {
    navOpen = true;
    if (!navChars.length) layoutNavCascade();
    // Start the line shrinking, hide the "Menu" label, then track the line's
    // receding edge to reveal letters exactly as it passes them.
    menuLines.forEach(function(line) { line.style.width = '0'; });
    lifts.forEach(function(lift) { lift.style.display = 'none'; });
    planes.forEach(function(p) { p.style.display = 'none'; });
    if (navItems) navItems.classList.add('is-open');
    navRAF = requestAnimationFrame(revealLettersByLine);
  } else {
    navOpen = false;
    // Hide the letters immediately, then bring the line + "Menu" label back.
    navChars.forEach(function(c) { c.el.style.opacity = '0'; });
    if (navItems) navItems.classList.remove('is-open');
    navRevealTimer = setTimeout(function() {
      menuLines.forEach(function(line) { line.style.width = '100%'; });
      lifts.forEach(function(lift) { lift.style.display = ''; });
      planes.forEach(function(p) { p.style.display = ''; });
    }, 200);
  }
}

document.addEventListener("DOMContentLoaded", function() {
    const clickMeBoxes = document.querySelectorAll('.click-me-box');

    clickMeBoxes.forEach(box => {
        box.addEventListener('click', function(e) {
            clickMeBoxes.forEach(otherBox => {
                otherBox.classList.remove('hover');
            });
            this.classList.add('hover');
        });
    });

    document.addEventListener('click', function(event) {
        const isTappable = event.target.closest('.clickable, .button, a');

        if (isTappable) {
            clickMeBoxes.forEach(box => {
                box.classList.remove('hover');
            });
        }
    });
});

