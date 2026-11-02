'use strict';



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn?.addEventListener("click", function () {
  elementToggleFunc(sidebar);
  sidebarBtn.setAttribute("aria-expanded", String(sidebar?.classList.contains("active")));
});



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
  modalContainer?.classList.toggle("active");
  overlay?.classList.toggle("active");
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

  testimonialsItem[i].addEventListener("click", function () {

    const avatar = this.querySelector("[data-testimonials-avatar]");
    const title = this.querySelector("[data-testimonials-title]");
    const text = this.querySelector("[data-testimonials-text]");
    if (!avatar || !title || !text || !modalImg || !modalTitle || !modalText) return;

    modalImg.src = avatar.src;
    modalImg.alt = avatar.alt;
    modalTitle.innerHTML = title.innerHTML;
    modalText.innerHTML = text.innerHTML;

    testimonialsModalFunc();

  });

}

// add click event to modal close button
modalCloseBtn?.addEventListener("click", testimonialsModalFunc);
overlay?.addEventListener("click", testimonialsModalFunc);



// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select?.addEventListener("click", function () { elementToggleFunc(this); });

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    if (selectValue) selectValue.innerText = this.innerText;
    if (select) elementToggleFunc(select);
    filterFunc(selectedValue);

  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {

  for (let i = 0; i < filterItems.length; i++) {
    const itemCategory = filterItems[i].dataset.category;

    if (selectedValue === "all") {
      // Show all items except "others" category
      if (itemCategory !== "others") {
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
      // Show items that match selected category
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }

  }

}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0] || null;

for (let i = 0; i < filterBtn.length; i++) {

  filterBtn[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    if (selectValue) selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn?.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;

  });

}



// Handle "Explore More" (Others) card click
function filterByCategory(category) {
  if (selectValue) selectValue.innerText = category.charAt(0).toUpperCase() + category.slice(1);
  filterFunc(category);
  
  // Update active button
  for (let i = 0; i < filterBtn.length; i++) {
    if (filterBtn[i].innerText.toLowerCase() === category) {
      lastClickedBtn?.classList.remove("active");
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
    if (form?.checkValidity() && formBtn) {
      formBtn.removeAttribute("disabled");
    } else if (formBtn) {
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

    for (let j = 0; j < pages.length; j++) {
      if (this.innerHTML.toLowerCase() === pages[j].dataset.page) {
        pages[j].classList.add("active");
        navigationLinks[j].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active");
      }
    }

  });
}

// JavaScript - Dark mode toggle
const toggleButton = document.getElementById('toggle-button');
const body = document.body;

if (toggleButton) {
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
}


document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded event fired");

  const escapeHtml = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const processInlineMarkup = (root = document.body) => {
    if (!root) return;

    const textNodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.nodeValue || !/[+^~=]/.test(node.nodeValue)) {
          return NodeFilter.FILTER_REJECT;
        }

        const parentElement = node.parentElement;
        if (!parentElement) return NodeFilter.FILTER_REJECT;

        if (parentElement.closest('script, style, code, pre, textarea, kbd, samp, mark, ins, sup, sub')) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode);
      currentNode = walker.nextNode();
    }

    textNodes.forEach((node) => {
      const rawText = node.nodeValue;
      let converted = escapeHtml(rawText);

      converted = converted.replace(/\+\+([^\+\n]+?)\+\+/g, '<ins>$1</ins>');
      converted = converted.replace(/==([^=\n]+?)==/g, '<mark>$1</mark>');
      converted = converted.replace(/\^([^\^\n]+?)\^/g, '<sup>$1</sup>');
      converted = converted.replace(/~([^~\n]+?)~/g, '<sub>$1</sub>');

      if (converted === escapeHtml(rawText)) return;

      const wrapper = document.createElement('span');
      wrapper.innerHTML = converted;
      node.parentNode.replaceChild(wrapper, node);
      while (wrapper.firstChild) {
        wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
      }
      wrapper.remove();
    });
  };

  const openLinksInNewTabs = (root = document) => {
    root.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      const normalizedHref = href.trim().toLowerCase();
      if (normalizedHref.startsWith('#') || normalizedHref.startsWith('javascript:')) return;
      if (link.hasAttribute('download')) return;

      link.setAttribute('target', '_blank');
      const relValues = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      relValues.add('noopener');
      relValues.add('noreferrer');
      link.setAttribute('rel', Array.from(relValues).join(' '));
    });
  };

  openLinksInNewTabs();
  processInlineMarkup();

  const linkObserver = new MutationObserver(() => {
    openLinksInNewTabs();
    processInlineMarkup();
  });

  linkObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  // Set category tags based on data-category attribute
  const allFilterItems = document.querySelectorAll("[data-filter-item]");
  
  allFilterItems.forEach(item => {
    const category = item.dataset.category;
    const categoryElement = item.querySelector(".project-category");
    
    if (categoryElement && category) {
      // Convert data-category value to display text (e.g., "machine learning" -> "Machine Learning")
      const categoryText = category
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      
      categoryElement.textContent = categoryText;
    }
  });

  // Fetch and display Medium blog posts
  console.log("Starting Medium blog fetch...");
  const mediumUrl = "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@paudelsamir";
  const postsContainer = document.getElementById("medium-posts");
  
  console.log("Posts container found:", postsContainer ? "Yes" : "No");
  
  if (postsContainer) {
    fetch(mediumUrl)
        .then(response => {
          console.log("Response status:", response.status);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then(data => {
          console.log("Data received:", data);
          
          if (data.items && data.items.length > 0) {
            console.log("Number of posts available:", data.items.length);
            
            // Store all posts for pagination
            let allPosts = data.items;
            let postsToShow = 4;
            let currentIndex = 0;
            
            // Function to render posts
            function renderPosts(startIndex, count) {
              let postsHtml = "";
              const endIndex = Math.min(startIndex + count, allPosts.length);
              
              for (let i = startIndex; i < endIndex; i++) {
                const post = allPosts[i];
                console.log(`Processing post ${i + 1}:`, post.title);
                
                // Try to extract image from description HTML
                let postImage = null;
                const imgRegex = /<img[^>]+src="([^">]+)"/;
                const descMatch = post.description.match(imgRegex);
                
                if (descMatch && descMatch[1]) {
                  postImage = descMatch[1];
                  console.log(`Found image in description for post ${i + 1}:`, postImage);
                } else if (post.thumbnail && post.thumbnail.trim()) {
                  postImage = post.thumbnail;
                  console.log(`Found thumbnail for post ${i + 1}:`, postImage);
                } else {
                  // Fallback to horse image
                  postImage = "./assets/left_horse.jpg";
                  console.log(`No image found, using fallback for post ${i + 1}`);
                }
                
                let postDate = new Date(post.pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                
                // Extract categories/tags from the post (only 1 for shorter keywords)
                let categories = post.categories && post.categories.length > 0 
                    ? `<span class="blog-category">${post.categories[0].replace(/-/g, ' ')}</span>`
                    : '<span class="blog-category">Article</span>';

                postsHtml += `
                    <li class="blog-post-item">
                        <a href="${post.link}" target="_blank" rel="noopener noreferrer">
                            <figure class="blog-banner-box">
                                <img src="${postImage}" alt="${post.title}" loading="lazy" onerror="this.src='./assets/left_horse.jpg'">
                            </figure>

                            <div class="blog-content">
                                <h3 class="blog-item-title">${post.title}</h3>
                                
                                <div class="blog-categories-row">
                                    ${categories}
                                </div>
                                
                                <div class="blog-footer">
                                    <time datetime="${post.pubDate}">${postDate}</time>
                                    <span class="read-more">Read More →</span>
                                </div>
                            </div>
                        </a>
                    </li>
                `;
              }
              
              return postsHtml;
            }
            
            // Render initial 4 posts
            let initialHtml = renderPosts(0, postsToShow);
            postsContainer.innerHTML = initialHtml;
            openLinksInNewTabs(postsContainer);
            currentIndex = postsToShow;
            
            // Add Load More button if there are more posts
            if (allPosts.length > postsToShow) {
              const loadMoreBtn = document.createElement('button');
              loadMoreBtn.id = 'load-more-posts';
              loadMoreBtn.textContent = 'Load More Posts';
              loadMoreBtn.className = 'load-more-btn';
              
              const blogSection = postsContainer.closest('.blog-posts');
              blogSection.appendChild(loadMoreBtn);
              
              loadMoreBtn.addEventListener('click', function() {
                console.log(`Loading more posts from index ${currentIndex}`);
                const moreHtml = renderPosts(currentIndex, postsToShow);
                
                // Create temporary container to hold new items
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = moreHtml;
                
                // Append new items before the button
                while (tempContainer.firstChild) {
                  postsContainer.appendChild(tempContainer.firstChild);
                }

                openLinksInNewTabs(postsContainer);
                
                currentIndex += postsToShow;
                
                // Hide button if no more posts
                if (currentIndex >= allPosts.length) {
                  loadMoreBtn.style.display = 'none';
                }
              });
            }
            
            console.log("Initial posts rendered successfully");
          } else {
            console.log("No items found in data");
            postsContainer.innerHTML = '<li style="color: #999; padding: 2rem; text-align: center;">No blog posts found.</li>';
          }
        })
        .catch(error => {
          console.error("Error fetching Medium RSS feed:", error);
          postsContainer.innerHTML = '<li style="color: #999; padding: 2rem; text-align: center;">Failed to load blog posts. Please try again later.</li>';
        });
  }

   const galleryImages = [
     { src: './assets/Gallery/1_typing_.png', alt: 'Typing in Kathmandu', caption: 'Typing in Kathmandu' },
     { src: './assets/Gallery/2_selfie_hiking.jpg', alt: 'Selfie Hiking', caption: 'Selfie Hiking' },
     { src: './assets/Gallery/3_chitwan.jpeg', alt: 'Chitwan Eco-Tour', caption: 'Chitwan Eco-Tour' },
     { src: './assets/Gallery/4_hiking.jpeg', alt: 'Mountain Trail', caption: 'Mountain Trail' },
     { src: './assets/Gallery/5_basantapur.jpeg', alt: 'Basantapur Vibes', caption: 'Basantapur Vibes' },
     { src: './assets/Gallery/5_horse_ride.jpg', alt: 'Horse Ride', caption: 'Horse Ride' },
     { src: './assets/Gallery/6_dadama.jpeg', alt: 'Dadama Waterfall', caption: 'Dadama Waterfall' },
     { src: './assets/Gallery/6_sidelook.jpg', alt: 'Sidelook Portrait', caption: 'Sidelook Portrait' },
     { src: './assets/Gallery/6_skylook.jpg', alt: 'Skylook Panorama', caption: 'Skylook Panorama' },
     { src: './assets/Gallery/7_hiking.jpeg', alt: 'Hiking Crew', caption: 'Hiking Crew' },
     { src: './assets/Gallery/8_hiking.jpeg', alt: 'Slope Shot', caption: 'Slope Shot' },
     { src: './assets/Gallery/9_buffon.jpeg', alt: 'Buffon Meetup', caption: 'Buffon Meetup' },
     { src: './assets/Gallery/11_flagpoint.jpg', alt: 'Flagpoint Lookout', caption: 'Flagpoint Lookout' },
     { src: './assets/Gallery/11_godawari.jpeg', alt: 'Godawari Walk', caption: 'Godawari Walk' },
     { src: './assets/Gallery/12_swambhu.jpeg', alt: 'Swambhu Rituals', caption: 'Swambhu Rituals' },
     { src: './assets/Gallery/13_dashain.jpeg', alt: 'Dashain Fest', caption: 'Dashain Fest' },
     { src: './assets/Gallery/14_hero_sanako.jpeg', alt: 'Hero Sanako', caption: 'Hero Sanako' },
     { src: './assets/Gallery/15_vai_ra_ma.png', alt: 'Vai Ra Ma', caption: 'Vai Ra Ma' },
     { src: './assets/Gallery/16_me_2015.jpeg', alt: 'Throwback 2015', caption: 'Throwback 2015' }
   ];

   const galleryGrid = document.getElementById('gallery-grid');

   if (galleryGrid && galleryImages.length > 0) {
     const fragment = document.createDocumentFragment();

     galleryImages.forEach(image => {
       const card = document.createElement('div');
       card.className = 'gallery-item';

       card.innerHTML = `
         <img src="${image.src}" alt="${image.alt}" loading="lazy">
         <div class="gallery-caption">${image.caption}</div>
       `;

       fragment.appendChild(card);
     });

     galleryGrid.appendChild(fragment);
   }

   // Wiki Knowledge Gallery
   const wikiGalleryItems = [
     {
       icon: 'school',
       title: 'Knowledge Synthesis',
       description: 'Connecting disparate ideas into coherent understanding'
     },
     {
       icon: 'lightbulb',
       title: 'Insight Generation',
       description: 'The moment when understanding clicks into place'
     },
     {
       icon: 'trending-up',
       title: 'Skill Progression',
       description: 'Tracking growth from novice to mastery'
     },
     {
       icon: 'book',
       title: 'Deep Learning',
       description: 'Immersive study that transforms perspective'
     },
     {
       icon: 'sync',
       title: 'Iterative Improvement',
       description: 'Continuous refinement through practice'
     },
     {
       icon: 'shield',
       title: 'Resilience Building',
       description: 'Developing mental fortitude through challenges'
     },
     {
       icon: 'heart',
       title: 'Passion Cultivation',
       description: 'Nurturing intrinsic motivation for lifelong learning'
     },
     {
       icon: 'brain',
       title: 'Cognitive Flexibility',
       description: 'Adapting thinking patterns to new contexts'
     },
     {
       icon: 'target',
       title: 'Focused Intention',
       description: 'Directing attention toward meaningful goals'
     }
   ];

   const wikiGalleryGrid = document.getElementById('wiki-gallery-grid');

   if (wikiGalleryGrid && wikiGalleryItems.length > 0) {
     const fragment = document.createDocumentFragment();

     wikiGalleryItems.forEach((item, index) => {
       const card = document.createElement('div');
       card.className = 'wiki-gallery-item';

       // Use different images from the gallery for variety
       const galleryIndex = (index * 2) % galleryImages.length;
       const imageSrc = galleryImages[galleryIndex].src;
       const imageAlt = galleryImages[galleryIndex].alt;

       card.innerHTML = `
         <div class="wiki-gallery-card">
           <div class="wiki-gallery-face wiki-gallery-front">
             <img src="${imageSrc}" alt="${imageAlt}" loading="lazy">
           </div>
           <div class="wiki-gallery-face wiki-gallery-back">
             <ion-icon name="${item.icon}" class="wiki-gallery-icon"></ion-icon>
             <h3 class="wiki-gallery-title">${item.title}</h3>
             <p class="wiki-gallery-description">${item.description}</p>
           </div>
         </div>
       `;

       fragment.appendChild(card);
     });

     wikiGalleryGrid.appendChild(fragment);
   }
 });
