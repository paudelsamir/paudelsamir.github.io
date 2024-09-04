// <!-- typed js effect starts -->
var typed = new Typed(".typing-text", {
  strings: ["Python development", "machine learning", "website design", "Frontend development"],
  loop: true,
  typeSpeed: 50,
  backSpeed: 25,
  backDelay: 500,
});

// <!-- typed js effect ends -->

// Select the menu and navbar elements
const menuIcon = document.getElementById('menu');
const navbar = document.querySelector('header .navbar');

menuIcon.addEventListener('click', () => {
  navbar.classList.toggle('nav-toggle');
  menuIcon.classList.toggle('fa-bars');
  menuIcon.classList.toggle('fa-times');
});
