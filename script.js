'use strict';



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

  testimonialsItem[i].addEventListener("click", function () {

    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

    testimonialsModalFunc();

  });

}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);



// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function () { elementToggleFunc(this); });

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);

  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {

  for (let i = 0; i < filterItems.length; i++) {
    const itemCategory = filterItems[i].dataset.category;

    if (selectedValue === "all") {
      // Show all items that have "all" or "machine learning" or "deep learning" categories (not "others")
      if (itemCategory === "all" || itemCategory === "machine learning" || itemCategory === "deep learning") {
        filterItems[i].classList.add("active");
      } else {
        filterItems[i].classList.remove("active");
      }
    } else if (selectedValue === "others") {
      // Show only items with "others" category
      if (itemCategory === "others") {
        filterItems[i].classList.add("active");
      } else {
        filterItems[i].classList.remove("active");
      }
    } else if (selectedValue === itemCategory) {
      // Show items that match selected category (machine learning, deep learning)
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }

  }

}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {

  filterBtn[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;

  });

}



// Handle "Explore More" (Others) card click
function filterByCategory(category) {
  selectValue.innerText = category.charAt(0).toUpperCase() + category.slice(1);
  filterFunc(category);
  
  // Update active button
  for (let i = 0; i < filterBtn.length; i++) {
    if (filterBtn[i].innerText.toLowerCase() === category) {
      lastClickedBtn.classList.remove("active");
      filterBtn[i].classList.add("active");
      lastClickedBtn = filterBtn[i];
      break;
    }
  }
}

// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {

    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }

  });
}



// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    for (let i = 0; i < pages.length; i++) {
      if (this.innerHTML.toLowerCase() === pages[i].dataset.page) {
        pages[i].classList.add("active");
        navigationLinks[i].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[i].classList.remove("active");
        navigationLinks[i].classList.remove("active");
      }
    }

  });
}

// JavaScript
const toggleButton = document.getElementById('toggle-button');
const body = document.body;

// Check if a dark mode preference is stored in LocalStorage
const isDarkMode = localStorage.getItem('darkMode');

// Set the initial toggle state based on the stored preference
toggleButton.checked = isDarkMode === 'true';
body.classList.toggle('dark-theme', toggleButton.checked);

toggleButton.addEventListener('click', () => {
  const isDarkModeActive = body.classList.contains('dark-theme');
  
  // Toggle the class and store the dark mode preference in LocalStorage
  body.classList.toggle('dark-theme', !isDarkModeActive);
  localStorage.setItem('darkMode', !isDarkModeActive);
});


document.addEventListener("DOMContentLoaded", function () {
  const mediumUrl = "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@paudelsamir";

  fetch(mediumUrl)
      .then(response => response.json())
      .then(data => {
          const postsContainer = document.getElementById("medium-posts");
          let postsHtml = "";

          data.items.slice(0, 6).forEach(post => { // fetch only the latest 6 posts
              let postImage = post.thumbnail || "./assets/images/default-thumbnail.jpg"; // fallback image
              let postDate = new Date(post.pubDate).toDateString(); // format date

              postsHtml += `
                  <li class="blog-post-item">
                      <a href="${post.link}" target="_blank">
                          <figure class="blog-banner-box">
                              <img src="${postImage}" alt="${post.title}" loading="lazy">
                          </figure>

                          <div class="blog-content">
                              <div class="blog-meta">
                                  <p class="blog-category">Medium Blog</p>
                                  <span class="dot"></span>
                                  <time datetime="${post.pubDate}">${postDate}</time>
                              </div>

                              <h3 class="h3 blog-item-title">${post.title}</h3>
                              <p class="blog-text">${post.description.substring(0, 100)}...</p>
                          </div>
                      </a>
                  </li>
              `;
          });

          postsContainer.innerHTML = postsHtml;
      })
      .catch(error => console.error("Error fetching Medium RSS feed:", error));

  // Fetch Featured Repositories from GitHub API
  const repoList = [
    { owner: "paudelsamir", repo: "365DaysOfData" },
    { owner: "paudelsamir", repo: "Coding-Interview-Preparation" }
  ];

  const reposContainer = document.getElementById("featured-repos-list");
  
  if (!reposContainer) {
    console.warn("Featured repos container not found");
  } else {
    let reposHtml = "";
    let loadedRepos = 0;

    repoList.forEach(({ owner, repo }) => {
      fetch(`https://api.github.com/repos/${owner}/${repo}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.message === "Not Found") {
            console.error(`Repository ${owner}/${repo} not found`);
            loadedRepos++;
            if (loadedRepos === repoList.length) {
              if (!reposHtml.trim()) {
                reposContainer.innerHTML = "<p>Unable to load repositories. Please try again later.</p>";
              } else {
                reposContainer.innerHTML = reposHtml;
              }
            }
            return;
          }

          const stars = data.stargazers_count || 0;
          const forks = data.forks_count || 0;
          const language = data.language || "N/A";
          const description = data.description || "No description available";
          const url = data.html_url;
          const name = data.name;

          const repoCard = `
            <li class="repo-card">
              <div class="repo-header">
                <h3 class="repo-title">
                  <a href="${url}" target="_blank" title="View on GitHub">
                    <ion-icon name="logo-github" class="repo-icon"></ion-icon> ${name}
                  </a>
                </h3>
              </div>
              <p class="repo-description">${description}</p>
              ${language !== "N/A" ? `<span class="repo-language">📝 ${language}</span>` : ""}
              <div class="repo-stats">
                <div class="repo-stat">
                  <ion-icon name="star"></ion-icon>
                  <span>${stars} Stars</span>
                </div>
                <div class="repo-stat">
                  <ion-icon name="git-branch"></ion-icon>
                  <span>${forks} Forks</span>
                </div>
              </div>
            </li>
          `;

          reposHtml += repoCard;
          loadedRepos++;

          console.log(`Loaded ${name} (${loadedRepos}/${repoList.length})`);

          if (loadedRepos === repoList.length) {
            console.log("All repos loaded, updating DOM");
            reposContainer.innerHTML = reposHtml;
          }
        })
        .catch(error => {
          console.error(`Error fetching repo ${owner}/${repo}:`, error);
          loadedRepos++;
          if (loadedRepos === repoList.length) {
            if (!reposHtml.trim()) {
              reposContainer.innerHTML = "<p>Error loading repositories</p>";
            } else {
              reposContainer.innerHTML = reposHtml;
            }
          }
        });
    });
  }
});
