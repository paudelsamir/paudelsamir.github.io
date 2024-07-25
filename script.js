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
    'a Learner',
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

let scene, camera, renderer, stars, starGeo;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 1;
    camera.rotation.x = Math.PI / 2;

    renderer = new THREE.WebGLRenderer({ alpha: true });  // Enable transparency
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('galaxy-bg').appendChild(renderer.domElement);

    starGeo = new THREE.BufferGeometry();
    let starVertices = [];
    for (let i = 0; i < 6000; i++) {
        let x = Math.random() * 600 - 300;
        let y = Math.random() * 600 - 300;
        let z = Math.random() * 600 - 300;
        starVertices.push(x, y, z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    let sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');
    let starMaterial = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.7,
        map: sprite,
        transparent: true
    });

    stars = new THREE.Points(starGeo, starMaterial);
    scene.add(stars);

    animate();
}

function animate() {
    stars.rotation.y += 0.002;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

init();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
