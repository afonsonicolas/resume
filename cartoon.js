const menu = document.querySelector(".menu");
const menuItems = document.querySelector(".menuItem");
const hamburger = document.querySelector(".hamburger");
const closeIcon = document.querySelector(".closeIcon");
const menuIcon = document.querySelector(".menuIcon");

function toggleMenu(){
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

let slideIndex = 1;
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1} 
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none"; 
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block"; 
}

function hoverImage1(img) {
  img.src = "companies/2.png";
}

function originalImage1(img) {
  img.src = "companies/1.png";
}

function hoverImage2(img) {
  img.src = "companies/4.png";
}

function originalImage2(img) {
  img.src = "companies/3.png";
}

function hoverImage3(img) {
  img.src = "companies/6.png";
}

function originalImage3(img) {
  img.src = "companies/5.png";
}

function hoverImage4(img) {
  img.src = "companies/8.png";
}

function originalImage4(img) {
  img.src = "companies/7.png";
}

function hoverImage5(img) {
  img.src = "companies/10.png";
}

function originalImage5(img) {
  img.src = "companies/9.png";
}

function hoverImage6(img) {
  img.src = "companies/12.png";
}

function originalImage6(img) {
  img.src = "companies/11.png";
}

function showSweetAlert() {
  Swal.fire({
    icon: 'info',
    title: 'Contact Information',
    html: 'Phone: (857)-296-2688 <br> Email: nico.afonso1207@gmail.com <br><br> <a href="mailto:nico.afonso1207@gmail.com" class="formbutton">Send Email</a>',
  });
}