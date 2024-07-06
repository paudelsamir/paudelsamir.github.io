const toggleBtn = document.querySelector('.toggle_btn');
const toggleBtnIcon = document.querySelector('.toggle_btn i');
const dropDownMenu = document.querySelector('.dropdownMenu');

toggleBtn.onclick = function () {
    dropDownMenu.classList.toggle('open');
    const isOpen = dropDownMenu.classList.contains('open');

    toggleBtnIcon.classList = isOpen
        ? 'fa-solid fa-xmark'
        : 'fa-solid fa-bars';
}

const typingSpan = document.querySelector('.typing');
const words = [
    'an Innovator',
    'an Enthusiast',
    'a Developer'
];

let wordIndex = 0;
let charIndex = 0;

function type() {
    if (charIndex < words[wordIndex].length) {
        typingSpan.textContent += words[wordIndex].charAt(charIndex);
        charIndex++;
        setTimeout(type, 100);
    } else {
        setTimeout(erase, 1500);
    }
}

function erase() {
    if (charIndex > 0) {
        typingSpan.textContent = words[wordIndex].substring(0, charIndex - 1);
        charIndex--;
        setTimeout(erase, 50);
    } else {
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(type, 500);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(type, 500);
    // Check if the viewport width is less than or equal to 992px
    if (window.innerWidth <= 992) {
        // Close the mobile dropdown by removing the 'open' class
        document.getElementById('mobileDropdown').classList.remove('open');
    }
});

// Optional: Close the dropdown when the window is resized
window.addEventListener('resize', function () {
    if (window.innerWidth <= 992) {
        document.getElementById('mobileDropdown').classList.remove('open');
    }
});
