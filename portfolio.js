document.addEventListener('DOMContentLoaded', function() {
  // Check if device is non-touchscreen
  if (!('ontouchstart' in window)) {
    // Get the top_bar element
    let topBar = document.querySelector('.top_bar');

    // Add event listener for mouseenter
    topBar.addEventListener('mouseenter', function() {
      toggleItems(true);
    });

    // Add event listener for mouseleave
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

function toggleItems(hovered) {
  // Existing code for toggling menu items and lines
  let menuLines = document.querySelectorAll('.menu_line');
  let item1 = document.querySelector('.item-1');
  let item2 = document.querySelector('.item-2');
  let item3 = document.querySelector('.item-3');
  let item4 = document.querySelector('.item-4');
  let item5 = document.querySelector('.item-5');
  [item1, item2, item3, item4, item5].forEach(function(item) {
    if (item) {
      item.style.opacity = hovered ? '1' : '0';
      item.style.visibility = hovered ? 'visible' : 'hidden';
    }
  });
  menuLines.forEach(function(line) {
    line.style.width = hovered ? '0' : '100%';
  });

  // New code to toggle .lift elements
  document.querySelectorAll('.plane-wrapper').forEach(function(planeline) {
    planeline.style.display = hovered ? 'none' : '';
  });

  let lifts = document.querySelectorAll('.menutype');
  lifts.forEach(function(lift) {
    lift.style.display = hovered ? 'none' : '';
  });
}