document.addEventListener('DOMContentLoaded', () => {
    const loadingBar = document.getElementById('loading-bar');
    const mainContent = document.getElementById('main-content');

    // Cross-browser scroll root accessor used by TOC and mobile helpers
    const getPageScrollRoot = () => document.scrollingElement || document.documentElement;

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

        let node;
        while (node = walker.nextNode()) textNodes.push(node);

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
            const normalizedHref = href.trim();
            if (normalizedHref.startsWith('#') || normalizedHref.toLowerCase().startsWith('javascript:')) return;
            if (link.hasAttribute('download')) return;

            // Only open truly external links in a new tab. Relative and same-origin
            // links (including absolute links that share the same origin) should
            // continue to open in the same tab so the site's AJAX loader can
            // intercept them.
            let isExternal = false;
            try {
                const urlObj = new URL(normalizedHref, window.location.origin);
                isExternal = urlObj.origin !== window.location.origin;
            } catch (e) {
                // If URL construction fails, treat as relative/internal link
                isExternal = false;
            }

            if (!isExternal) return;

            // Mark external links visually for dotted underline and open in new tab
            link.classList.add('external-link');
            if (!link.hasAttribute('target')) link.setAttribute('target', '_blank');
            const relValues = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
            relValues.add('noopener');
            relValues.add('noreferrer');
            link.setAttribute('rel', Array.from(relValues).join(' '));
        });
    };

    openLinksInNewTabs();
    processInlineMarkup();

    // Remove external-link marker from icon-only anchors (social icons, logos)
    const tidyExternalLinkIcons = () => {
        document.querySelectorAll('a.external-link').forEach(a => {
            // If anchor contains no visible text and only icon-like children (img or svg), don't style as external
            const text = a.textContent.replace(/\s+/g, '');
            if (text.length > 0) return;

            const children = Array.from(a.children);
            if (children.length === 0) {
                // no element children, but no text either — leave it alone
                return;
            }

            const allIcons = children.every(ch => {
                const tag = ch.tagName && ch.tagName.toLowerCase();
                if (tag === 'img' || tag === 'svg') return true;
                // some icon wrappers may contain an svg inside
                if (ch.querySelector && ch.querySelector('svg')) return true;
                // allow visually-hidden helper spans
                if (ch.classList && /sr-|visually-hidden/.test(ch.className)) return true;
                return false;
            });

            if (allIcons) a.classList.remove('external-link');
        });
    };

    tidyExternalLinkIcons();

    const linkObserver = new MutationObserver(() => {
        openLinksInNewTabs();
        processInlineMarkup();
        tidyExternalLinkIcons();
    });

    linkObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });

    /* =========================================================================
       1. Theme Management
       ========================================================================= */
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = themeToggle ? themeToggle.querySelector('.sun-icon') : null;
    const moonIcon = themeToggle ? themeToggle.querySelector('.moon-icon') : null;

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    function applyTheme(isDark, animate = false) {
        const lightLogos = document.querySelectorAll('.light-logo');
        const darkLogos = document.querySelectorAll('.dark-logo');
        if (isDark) {
            document.body.classList.add('dark');
            if (sunIcon) sunIcon.classList.remove('active');
            if (moonIcon) moonIcon.classList.add('active');
            lightLogos.forEach(el => el.style.display = 'none');
            darkLogos.forEach(el => el.style.display = 'block');
        } else {
            document.body.classList.remove('dark');
            if (sunIcon) sunIcon.classList.add('active');
            if (moonIcon) moonIcon.classList.remove('active');
            lightLogos.forEach(el => el.style.display = 'block');
            darkLogos.forEach(el => el.style.display = 'none');
        }
        if (animate) {
            document.body.classList.add('animation-ready');
            const onEnd = () => {
                document.body.classList.remove('animation-ready');
                document.getElementById('dappled-light')?.removeEventListener('animationend', onEnd);
            };
            document.getElementById('dappled-light')?.addEventListener('animationend', onEnd);
        }
    };

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        applyTheme(true);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = !document.body.classList.contains('dark');
            applyTheme(isDark, true);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    /* =========================================================================
       2. Sidebar Toggle
       ========================================================================= */
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const leftSidebar = document.getElementById('left-sidebar');

    // Treat anything below the desktop breakpoint (1101px) as a compact
    // viewport: collapse the sidebar by default and allow outside-click to
    // close it. Previously only <=768px behaved this way, leaving tablet /
    // half-screen widths in a broken in-between state.
    const isMobileViewport = () => window.innerWidth <= 1100;

    const closeMobileToc = () => {
        const btn = document.getElementById('mobile-toc-button');
        const panel = document.getElementById('mobile-toc-panel');
        const backdrop = document.getElementById('mobile-toc-backdrop');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        if (panel) panel.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
        document.body.classList.remove('mobile-toc-open');
    };

    function syncMobileSidebarState() {
        const sidebarOpen = leftSidebar && !leftSidebar.classList.contains('collapsed');
        if (isMobileViewport() && sidebarOpen) {
            document.body.classList.add('mobile-sidebar-open');
            closeMobileToc();
        } else {
            document.body.classList.remove('mobile-sidebar-open');
        }
    };

    function collapseSidebarMobile() {
        if (isMobileViewport() && leftSidebar && !leftSidebar.classList.contains('collapsed')) {
            leftSidebar.classList.add('collapsed');
            syncMobileSidebarState();
        }
    };

    if (sidebarToggle && leftSidebar) {
        sidebarToggle.addEventListener('click', () => {
            leftSidebar.classList.toggle('collapsed');
            syncMobileSidebarState();
        });

        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', () => {
                leftSidebar.classList.add('collapsed');
                syncMobileSidebarState();
            });
        }

        if (isMobileViewport()) {
            leftSidebar.classList.add('collapsed');
        }
        syncMobileSidebarState();
    }

    /* =========================================================================
       3. Dynamic Page Loading Logic
       ========================================================================= */
    
    // Shared TOC state and helpers
    let activeHeadings = {};
    let headingElements = {};
    const tocObserverOptions = { root: null, rootMargin: '-80px 0px -60% 0px', threshold: 0 };

    function updateMobileTocState() {
        const mobileBtn = document.getElementById('mobile-toc-button');
        const tocContainer = document.getElementById('toc-links');
        if (!mobileBtn || !tocContainer) return;
        const activeLink = tocContainer.querySelector('a.active');
        const activeLabel = activeLink ? activeLink.textContent.trim() : 'On this page';
        const fabText = mobileBtn.querySelector('.mobile-toc-fab-text');
        if (fabText) fabText.textContent = activeLabel;

        const scrollRoot = getPageScrollRoot();
        const scrollTop = window.pageYOffset || scrollRoot.scrollTop || document.documentElement.scrollTop || 0;
        const maxScroll = Math.max(document.documentElement.scrollHeight, scrollRoot.scrollHeight) - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
        mobileBtn.style.setProperty('--toc-progress', progress.toFixed(4));

        const mobilePanel = document.getElementById('mobile-toc-panel');
        if (mobilePanel) {
            const mobileLinks = Array.from(mobilePanel.querySelectorAll('.mobile-toc-sheet-links a'));
            mobileLinks.forEach(link => {
                const shouldBeActive = activeLink && link.getAttribute('href') === activeLink.getAttribute('href');
                link.classList.toggle('active', Boolean(shouldBeActive));
            });
        }
    }

    function updateTocHighlight(id) {
        const tocContainer = document.getElementById('toc-links');
        if (!tocContainer) return;
        tocContainer.querySelectorAll('a').forEach(link => link.classList.remove('active'));
        const activeTocLink = tocContainer.querySelector(`a[data-target-id="${id}"]`);
        if (activeTocLink) activeTocLink.classList.add('active');
        updateMobileTocState();
    }

    const headingObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { activeHeadings[entry.target.id] = entry.isIntersecting; });
        const currentlyVisibleIds = Object.keys(activeHeadings).filter(id => activeHeadings[id]);
        if (currentlyVisibleIds.length > 0) {
            const middleOfViewport = window.innerHeight / 2;
            let selectedId = null;
            for (let id of currentlyVisibleIds) {
                if (!headingElements[id]) continue;
                const top = headingElements[id].getBoundingClientRect().top;
                if (top > middleOfViewport) { selectedId = id; break; }
            }
            if (!selectedId) {
                let topmost = currentlyVisibleIds[0];
                let topmostTop = headingElements[topmost] ? headingElements[topmost].getBoundingClientRect().top : 9999;
                currentlyVisibleIds.forEach(id => {
                    if (!headingElements[id]) return;
                    const top = headingElements[id].getBoundingClientRect().top;
                    if (top < topmostTop) { topmostTop = top; topmost = id; }
                });
                selectedId = topmost;
            }
            updateTocHighlight(selectedId);
        }
    }, tocObserverOptions);

    function initPage() {
        // Ensure file-tree handlers are (re)initialized for current DOM
        if (typeof initFileTree === 'function') initFileTree();
        if (window.initLinkPreviews) try{ window.initLinkPreviews(); }catch(e){}

        const currentPath = window.location.pathname;

        // Update active tree link
        let activeTreeLink = document.querySelector(`.tree-item.is-link[href="${currentPath}"], .tree-branch-link[href="${currentPath}"]`);
        if (!activeTreeLink && currentPath === '/') {
            activeTreeLink = document.querySelector(`.tree-item.is-link[href="/about/"]`);
        }
        if (!activeTreeLink && currentPath.includes('/blogs/')) {
            activeTreeLink = document.querySelector('.tree-item.is-link[href="/blogs/"]');
        }

        document.querySelectorAll('.tree-item.is-link, .tree-branch-link').forEach(link => link.classList.remove('active'));
        if (activeTreeLink) {
            activeTreeLink.classList.add('active');

            const breadcrumbs = [];
            let treeContainer = activeTreeLink.closest('.tree-children');

            while (treeContainer) {
                treeContainer.classList.add('is-open');
                const folderId = treeContainer.id;
                const branch = treeContainer.parentElement
                    ? treeContainer.parentElement.closest('.tree-branch')
                    : null;
                if (branch) {
                    branch.classList.add('is-open');
                    const toggle = branch.querySelector('.tree-branch-toggle');
                    if (toggle) toggle.setAttribute('aria-expanded', 'true');
                    const label = branch.querySelector('.tree-branch-link span');
                    const folderName = label ? label.textContent.trim() : folderId;
                    breadcrumbs.unshift({ label: folderName, folderId });
                    treeContainer = branch.parentElement ? branch.parentElement.closest('.tree-children') : null;
                    continue;
                }

                const folderToggle = treeContainer.parentElement
                    ? treeContainer.parentElement.querySelector(`.tree-item.is-folder[data-folder="${folderId}"]`)
                    : null;

                if (!folderToggle) break;

                folderToggle.classList.add('expanded');
                const folderMatch = folderToggle.querySelector('span');
                const folderName = folderMatch ? folderMatch.textContent.trim() : folderId;
                breadcrumbs.unshift({ label: folderName, folderId });

                const parentContainer = treeContainer.parentElement;
                treeContainer = parentContainer && parentContainer.classList.contains('tree-children') ? parentContainer : null;
            }

            breadcrumbs.push({ label: activeTreeLink.textContent.trim(), current: true });

            // Truncate long breadcrumb labels
            breadcrumbs.forEach(function (crumb) {
                if (crumb.label.length > 10) {
                    crumb.label = crumb.label.slice(0, 8) + '..';
                }
            });

            const breadcrumbsContainer = document.getElementById('breadcrumbs');
            if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = breadcrumbs.map((crumb, index) => {
                    const separator = index < breadcrumbs.length - 1 ? '<span class="crumb-separator">/</span>' : '';
                    if (crumb.current) {
                        return `${separator}<span class="crumb current">${crumb.label}</span>`;
                    }
                    return `${separator}<button type="button" class="crumb crumb-button" data-breadcrumb-folder="${crumb.folderId}">${crumb.label}</button>`;
                }).join('');
            }
        }

        function populateToc() {
            const tocContainer = document.getElementById('toc-links');
            const rightSidebar = document.querySelector('.right-sidebar');
            if (!tocContainer || !rightSidebar) return;

            tocContainer.innerHTML = ''; // Clear old TOC
            activeHeadings = {};
            headingElements = {};

            const headings = Array.from(document.querySelectorAll('h2')).filter(h => {
                return !h.closest('.left-sidebar, .right-sidebar, .top-header, .toc, .bi-aside');
            });

            if (headings.length === 0) {
                rightSidebar.classList.remove('no-headings');
                tocContainer.innerHTML = '<li class="toc-empty">No sections on this page</li>';
            } else {
                rightSidebar.classList.remove('no-headings');
                headings.forEach(h => {
                    if (!h.id) h.id = h.textContent.trim().toLowerCase().replace(/[^a-z0-9\s\-]/g, '').replace(/\s+/g, '-');
                    headingElements[h.id] = h;
                    headingObserver.observe(h);

                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = `#${h.id}`;
                    a.textContent = h.textContent;
                    a.dataset.targetId = h.id;

                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        h.scrollIntoView({ behavior: 'smooth' });
                    });

                    li.appendChild(a);
                    tocContainer.appendChild(li);
                });
                buildMobileToc();
                addHeadingPermalinks();
                updateMobileTocState();
            }
        };

        // Initialize TOC with a slight delay to ensure DOM is settled
        setTimeout(populateToc, 100);

        // Add small hash anchors to headings for quick linking/copying
        function addHeadingPermalinks() {
            const headings = Array.from(document.querySelectorAll('h2, h3, h4, h5, h6')).filter(h => {
                return !h.closest('.left-sidebar, .right-sidebar, .top-header, .toc, .bi-aside');
            });
            headings.forEach(h => {
                if (!h.id) {
                    h.id = h.textContent.trim().toLowerCase().replace(/[^a-z0-9\s\-]/g, '').replace(/\s+/g, '-');
                }

                // If anchor already exists, skip
                if (h.querySelector('.heading-anchor')) return;

                const anchor = document.createElement('button');
                anchor.className = 'heading-anchor';
                anchor.setAttribute('type', 'button');
                anchor.setAttribute('aria-label', `Copy link to ${h.id}`);
                anchor.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const fullUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + `#${h.id}`;

                    const showCopiedToast = () => {
                        const toast = document.createElement('div');
                        toast.className = 'permalink-copied';
                        toast.textContent = 'Copied';
                        document.body.appendChild(toast);
                        setTimeout(() => toast.classList.add('visible'), 10);
                        setTimeout(() => {
                            toast.classList.remove('visible');
                            setTimeout(() => toast.remove(), 280);
                        }, 1500);
                    };

                    const fallbackCopy = (text) => {
                        try {
                            const ta = document.createElement('textarea');
                            ta.value = text;
                            ta.setAttribute('readonly', '');
                            ta.style.position = 'absolute';
                            ta.style.left = '-9999px';
                            document.body.appendChild(ta);
                            ta.select();
                            document.execCommand('copy');
                            ta.remove();
                        } catch (err) {
                            // ignore
                        }
                    };

                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(fullUrl).then(() => {
                            showCopiedToast();
                        }).catch(() => {
                            fallbackCopy(fullUrl);
                            showCopiedToast();
                        });
                    } else {
                        fallbackCopy(fullUrl);
                        showCopiedToast();
        }
    });

                // Append anchor after heading text
                h.appendChild(anchor);
            });
        };

        if (mainContent) {
            mainContent.onscroll = () => {
                updateMobileTocState();
            };
        }

        // Enhance GitHub-style markdown callouts with icons
        function enhanceCallouts() {
            const callouts = document.querySelectorAll('.markdown-alert');
            const icons = {
                note: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
                tip: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path d="M10 21h4"/></svg>',
                warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
                important: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
                caution: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
            };

            callouts.forEach(callout => {
                // Determine type from class
                let type = 'note';
                if (callout.classList.contains('markdown-alert-tip')) type = 'tip';
                else if (callout.classList.contains('markdown-alert-warning')) type = 'warning';
                else if (callout.classList.contains('markdown-alert-important')) type = 'important';
                else if (callout.classList.contains('markdown-alert-caution')) type = 'caution';

                // Check if title already exists
                if (!callout.querySelector('.markdown-alert-title')) {
                    const title = document.createElement('p');
                    title.className = 'markdown-alert-title';
                    title.innerHTML = `${icons[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
                    
                    // Insert title at the beginning
                    const firstChild = callout.firstChild;
                    if (firstChild) {
                        callout.insertBefore(title, firstChild);
                    } else {
                        callout.appendChild(title);
                    }
                }
            });
        }

        // Run callout enhancement after a short delay
        setTimeout(enhanceCallouts, 150);

        window.onscroll = () => {
            updateMobileTocState();
        };

        // Re-bind all internal links for dynamic loading
        document.querySelectorAll('a[href^="/"]').forEach(link => {
            // Skip external protocol-relative links
            if (link.getAttribute('href').startsWith('//')) return;
            // Skip download links and new-tab links
            if (link.hasAttribute('download') || link.getAttribute('target') === '_blank') return;

            link.onclick = (e) => {
                e.preventDefault();
                const url = link.getAttribute('href');

                // Collapse sidebar on mobile for cleaner reading
                collapseSidebarMobile();

                if (url !== window.location.pathname) {
                    loadPage(url);
                }
            };
        });

        // Age counter + today's date for /now/ page
        var ageEl = document.querySelector('.age-value');
        var todayEl = document.querySelector('.today-date');
        if (ageEl || todayEl) {
            var birth = new Date(2005, 1, 16);
            var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            function displayAge(now) {
                var age = now.getFullYear() - birth.getFullYear();
                var m = now.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                var b = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
                if (now < b) b.setFullYear(b.getFullYear() - 1);
                var days = Math.floor((now - b) / 86400000);
                if (ageEl) ageEl.textContent = age + ' years, ' + days + ' days';
                if (todayEl) todayEl.textContent = months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
            }
            displayAge(new Date());
            fetch('https://worldtimeapi.org/api/timezone/Asia/Kathmandu')
                .then(function(r) { return r.json(); })
                .then(function(d) { displayAge(new Date(d.datetime)); })
                .catch(function() {});
            function scheduleNext() {
                var ms = new Date().setHours(24, 0, 0, 0) - Date.now();
                setTimeout(function() { displayAge(new Date()); scheduleNext(); }, ms);
            }
            scheduleNext();
            window.addEventListener('pageshow', function() { displayAge(new Date()); });
        }

        // Lightbox for all images
        var lb = document.querySelector('.img-lightbox-overlay') || (function() {
            var el = document.createElement('div');
            el.className = 'img-lightbox-overlay';
            el.innerHTML = '<img src="" alt="">';
            document.body.appendChild(el);
            el.addEventListener('click', function() { el.classList.remove('active'); });
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') el.classList.remove('active');
            });
            return el;
        })();
        document.querySelectorAll('#main-content img').forEach(function(img) {
            img.style.cursor = 'pointer';
            img.addEventListener('click', function() {
                lb.querySelector('img').src = this.src;
                lb.classList.add('active');
            });
        });

        // Initialize Nepal districts map on AJAX navigation (skip if already rendered)
        var mapWrapper = document.getElementById('nepal-map-wrapper');
        if (mapWrapper && !mapWrapper.querySelector('svg')) {
            function initMapWhenReady() {
                var depsLoaded = typeof d3 !== 'undefined' && typeof topojson !== 'undefined';
                var mapLoaded = typeof window.initNepalMap === 'function';
                if (!depsLoaded || !mapLoaded) {
                    var loadingEl = mapWrapper.querySelector('.nepal-loading');
                    if (loadingEl) loadingEl.textContent = 'Loading map...';
                }
                if (mapLoaded && depsLoaded) {
                    window.initNepalMap();
                } else {
                    var promises = [];
                    if (!depsLoaded) {
                        promises.push(new Promise(function(resolve, reject) {
                            var s = document.createElement('script');
                            s.src = 'https://d3js.org/d3.v7.min.js';
                            s.onload = resolve;
                            s.onerror = reject;
                            document.head.appendChild(s);
                        }));
                        promises.push(new Promise(function(resolve, reject) {
                            var s = document.createElement('script');
                            s.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3';
                            s.onload = resolve;
                            s.onerror = reject;
                            document.head.appendChild(s);
                        }));
                    }
                    if (!mapLoaded) {
                        promises.push(new Promise(function(resolve, reject) {
                            var s = document.createElement('script');
                            s.src = '/assets/js/nepal-map.js';
                            s.onload = resolve;
                            s.onerror = reject;
                            document.head.appendChild(s);
                        }));
                    }
                    if (promises.length > 0) {
                        Promise.all(promises).then(function() {
                            if (typeof window.initNepalMap === 'function') {
                                window.initNepalMap();
                            }
                        }).catch(function() {
                            var loadingEl = mapWrapper.querySelector('.nepal-loading');
                            if (loadingEl) loadingEl.textContent = 'Could not load map. Try refreshing.';
                        });
                    }
                }
            }
            // Wait a tick for DOM to settle on AJAX nav
            setTimeout(initMapWhenReady, 50);
        }

        // Init blog/quest/journal dropdowns (open with, share) on AJAX nav
        var openWithBtn = document.getElementById('openWithBtn');
        var shareBtn = document.getElementById('sharePostBtn');
        if (openWithBtn && !openWithBtn.dataset.dropdownInit) {
            var openWithMenu = document.getElementById('openWithMenu');
            var shareMenu = document.getElementById('sharePostMenu');
            if (openWithMenu && shareMenu) {
                function closeAll() {
                    openWithBtn.setAttribute('aria-expanded', 'false');
                    openWithMenu.classList.remove('show');
                    shareBtn.setAttribute('aria-expanded', 'false');
                    shareMenu.classList.remove('show');
                }
                function createToggle(el, menu, otherBtn, otherMenu) {
                    return function (e) {
                        e.stopPropagation();
                        var isOpen = el.getAttribute('aria-expanded') === 'true';
                        el.setAttribute('aria-expanded', !isOpen);
                        menu.classList.toggle('show');
                        otherBtn.setAttribute('aria-expanded', 'false');
                        otherMenu.classList.remove('show');
                    };
                }
                openWithBtn.addEventListener('click', createToggle(openWithBtn, openWithMenu, shareBtn, shareMenu));
                shareBtn.addEventListener('click', createToggle(shareBtn, shareMenu, openWithBtn, openWithMenu));
                openWithMenu.addEventListener('click', function (e) { e.stopPropagation(); });
                shareMenu.addEventListener('click', function (e) { e.stopPropagation(); });
                document.addEventListener('click', closeAll);
                openWithBtn.dataset.dropdownInit = 'true';
                shareBtn.dataset.dropdownInit = 'true';
            }
        }
    }

    // Mobile TOC: polished bottom-sheet navigation for small screens
    function buildMobileToc() {
        const h1 = document.querySelector('.garden-flow h1') || document.querySelector('h1');
        const mainToc = document.getElementById('toc-links');
        const headingLinks = mainToc ? Array.from(mainToc.querySelectorAll('a')) : [];
        const shouldShow = window.innerWidth <= 1280 && h1;

        let mobileBtn = document.getElementById('mobile-toc-button');
        let mobilePanel = document.getElementById('mobile-toc-panel');
        let mobileBackdrop = document.getElementById('mobile-toc-backdrop');

        const setOpen = (open) => {
            if (!mobileBtn || !mobilePanel || !mobileBackdrop) return;
            mobileBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            mobilePanel.classList.toggle('open', open);
            mobileBackdrop.classList.toggle('open', open);
            document.body.classList.toggle('mobile-toc-open', open);
        };

        if (!shouldShow) {
            setOpen(false);
            if (mobileBtn) mobileBtn.remove();
            if (mobilePanel) mobilePanel.remove();
            if (mobileBackdrop) mobileBackdrop.remove();
            return;
        }

        if (!mobileBtn) {
            mobileBtn = document.createElement('button');
            mobileBtn.id = 'mobile-toc-button';
            mobileBtn.className = 'mobile-toc-fab';
            mobileBtn.setAttribute('type', 'button');
            mobileBtn.setAttribute('aria-expanded', 'false');
            mobileBtn.setAttribute('aria-controls', 'mobile-toc-panel');
            mobileBtn.innerHTML = `
                <span class="mobile-toc-fab-dot" aria-hidden="true"></span>
                <span class="mobile-toc-fab-text">On this page</span>
                <span class="mobile-toc-fab-icon" aria-hidden="true"></span>
            `;
            document.body.appendChild(mobileBtn);
        }

        if (!mobileBackdrop) {
            mobileBackdrop = document.createElement('div');
            mobileBackdrop.id = 'mobile-toc-backdrop';
            mobileBackdrop.className = 'mobile-toc-backdrop';
            document.body.appendChild(mobileBackdrop);
        }

        if (!mobilePanel) {
            mobilePanel = document.createElement('section');
            mobilePanel.id = 'mobile-toc-panel';
            mobilePanel.className = 'mobile-toc-sheet';
            mobilePanel.innerHTML = `
                <div class="mobile-toc-sheet-handle" aria-hidden="true"></div>
                <div class="mobile-toc-sheet-header">
                    <div class="mobile-toc-sheet-title">On this page</div>
                    <button type="button" class="mobile-toc-close" aria-label="Close on this page menu">✕</button>
                </div>
                <ul class="mobile-toc-sheet-links"></ul>
                <div class="mobile-toc-empty">No sections on this page.</div>
            `;
            document.body.appendChild(mobilePanel);
        }

        const activeLabel = headingLinks.find(link => link.classList.contains('active'))?.textContent?.trim();
        const fabText = mobileBtn.querySelector('.mobile-toc-fab-text');
        if (fabText) fabText.textContent = activeLabel || 'On this page';

        const mobileLinks = mobilePanel.querySelector('.mobile-toc-sheet-links');
        const emptyState = mobilePanel.querySelector('.mobile-toc-empty');
        if (mobileLinks) {
            mobileLinks.innerHTML = '';
            headingLinks.forEach(a => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.href = a.getAttribute('href');
                link.textContent = a.textContent;
                if (a.classList.contains('active')) {
                    link.classList.add('active');
                }

                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href');
                    const target = document.querySelector(targetId);
                    setOpen(false);
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                });

                li.appendChild(link);
                mobileLinks.appendChild(li);
            });
        }

        if (emptyState) {
            emptyState.style.display = headingLinks.length > 0 ? 'none' : 'block';
        }

        mobileBtn.onclick = () => {
            const isOpen = mobilePanel.classList.contains('open');
            setOpen(!isOpen);
        };

        const closeBtn = mobilePanel.querySelector('.mobile-toc-close');
        if (closeBtn) closeBtn.onclick = () => setOpen(false);
        if (mobileBackdrop) mobileBackdrop.onclick = () => setOpen(false);

        if (!document.body.dataset.mobileTocEscBound) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const btn = document.getElementById('mobile-toc-button');
                    const panel = document.getElementById('mobile-toc-panel');
                    const backdrop = document.getElementById('mobile-toc-backdrop');
                    if (btn) btn.setAttribute('aria-expanded', 'false');
                    if (panel) panel.classList.remove('open');
                    if (backdrop) backdrop.classList.remove('open');
                    document.body.classList.remove('mobile-toc-open');
                }
            });
            document.body.dataset.mobileTocEscBound = 'true';
        }

        // Hover-to-open on pointer devices (desktop/tablet with a mouse):
        // opening on hover and closing on hover-out, with a small grace delay.
        const canHover = window.matchMedia('(hover: hover)').matches;
        if (canHover && mobileBtn && mobilePanel && !mobileBtn.dataset.hoverBound) {
            mobileBtn.dataset.hoverBound = '1';
            let closeTimer = null;
            const openNow = () => {
                window.clearTimeout(closeTimer);
                setOpen(true);
            };
            const scheduleClose = () => {
                window.clearTimeout(closeTimer);
                closeTimer = window.setTimeout(() => setOpen(false), 180);
            };
            mobileBtn.addEventListener('mouseenter', openNow);
            mobileBtn.addEventListener('mouseleave', scheduleClose);
            mobilePanel.addEventListener('mouseenter', () => window.clearTimeout(closeTimer));
            mobilePanel.addEventListener('mouseleave', scheduleClose);
            if (mobileBackdrop) mobileBackdrop.addEventListener('mouseleave', scheduleClose);
        }

        const scrollRoot = getPageScrollRoot();
        const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollRoot.scrollTop / maxScroll)) : 0;
        mobileBtn.style.setProperty('--toc-progress', progress.toFixed(4));
    }

    let _loadingUrl = null;

    async function loadPage(url, { push = true } = {}) {
        if (_loadingUrl === url) return;
        _loadingUrl = url;

        // Start loading bar
        if (loadingBar) {
            loadingBar.classList.remove('finishing');
            loadingBar.classList.add('loading');
        }
        mainContent.classList.add('content-swapping');

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');

            const newContent = newDoc.getElementById('main-content');
            const newTitle = newDoc.querySelector('title')?.textContent;

            // If the page doesn't have #main-content (different layout, e.g. portfolio),
            // fall back to full navigation
            if (!newContent) {
                window.location.href = url;
                return;
            }

            // Update DOM
            document.title = newTitle;
            mainContent.innerHTML = newContent.innerHTML;
            if (push) window.history.pushState({}, '', url);

            // Finish loading
            if (loadingBar) loadingBar.classList.add('finishing');
            setTimeout(() => {
                _loadingUrl = null;
                if (loadingBar) loadingBar.classList.remove('loading', 'finishing');
                if (mainContent) mainContent.classList.remove('content-swapping');
                initPage();
                if (window.initLinkPreviews) try{ window.initLinkPreviews(); }catch(e){}
                window.scrollTo(0, 0);
            }, 300);

        } catch (error) {
            _loadingUrl = null;
            console.error('Failed to load page:', error);
            window.location.href = url;
        }
    }

    // Initial load
    initPage();

    // Handle back/forward buttons
    window.onpopstate = (e) => {
        // When navigating back/forward, load the current URL without
        // pushing a new history entry (avoid creating loops).
        loadPage(window.location.pathname, { push: false }).catch(() => {
            // Fallback: ensure UI state updates even if AJAX fails.
            initPage();
        });
    };

    window.addEventListener('resize', () => {
        // Keep the sidebar consistent when crossing the compact/desktop
        // breakpoint: collapse it when entering tablet/mobile widths.
        if (isMobileViewport() && leftSidebar && !leftSidebar.classList.contains('collapsed')) {
            leftSidebar.classList.add('collapsed');
        }
        buildMobileToc();
        syncMobileSidebarState();
    });

    // Mobile UX: tap outside the sidebar to close it.
    document.addEventListener('click', (e) => {
        if (!isMobileViewport()) return;

        // If we just toggled the sidebar programmatically from a meta/breadcrumb
        // click, ignore this outside-click handler for a short moment so we don't
        // immediately re-collapse it.
        if (document._justToggledSidebar) return;

        if (leftSidebar && leftSidebar.classList.contains('collapsed')) return;

        const clickedInsideSidebar = leftSidebar && leftSidebar.contains(e.target);
        const clickedSidebarToggle = sidebarToggle && sidebarToggle.contains(e.target);
        if (clickedInsideSidebar || clickedSidebarToggle) return;

        collapseSidebarMobile();
    });



    /* =========================================================================
       4. File Tree Folder Toggle Logic
       ========================================================================= */
    function bindTreeNavigation(anchor) {
        if (!anchor) return;
        anchor.onclick = (e) => {
            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) return;
            e.preventDefault();
            if (href !== window.location.pathname) loadPage(href);
            if (isMobileViewport()) collapseSidebarMobile();
        };
    }

    function initFileTree() {
        const folders = document.querySelectorAll('.tree-item.is-folder');
        folders.forEach(folder => folder.replaceWith(folder.cloneNode(true)));

        document.querySelectorAll('.tree-item.is-folder').forEach(folder => {
            folder.addEventListener('click', (e) => {
                if (e.target.closest('a')) return;
                if (folder.classList.contains('tree-item-nested')) e.stopPropagation();
                folder.classList.toggle('expanded');
                const targetId = folder.getAttribute('data-folder');
                const childrenContainer = document.getElementById(targetId);

                if (folder.classList.contains('expanded')) {
                    if (childrenContainer) childrenContainer.classList.add('is-open');
                } else if (childrenContainer) {
                    childrenContainer.classList.remove('is-open');
                }

                syncMobileSidebarState();
            });
        });

        document.querySelectorAll('.tree-branch-toggle').forEach(toggle => {
            toggle.replaceWith(toggle.cloneNode(true));
        });

        document.querySelectorAll('.tree-branch-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const branch = toggle.closest('.tree-branch');
                const targetId = toggle.getAttribute('aria-controls');
                const childrenContainer = targetId ? document.getElementById(targetId) : null;
                const isOpen = branch && branch.classList.toggle('is-open');
                toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                if (childrenContainer) childrenContainer.classList.toggle('is-open', isOpen);
                syncMobileSidebarState();
            });
        });

        document.querySelectorAll('a.tree-item.is-link, a.tree-branch-link').forEach(bindTreeNavigation);
    };

    const breadcrumbs = document.getElementById('breadcrumbs');
    if (breadcrumbs) {
        breadcrumbs.addEventListener('click', (e) => {
            const breadcrumbFolder = e.target.closest('[data-breadcrumb-folder]');
            if (!breadcrumbFolder) return;

            const folderId = breadcrumbFolder.getAttribute('data-breadcrumb-folder');
            const folderToggle = document.querySelector(`.tree-item.is-folder[data-folder="${folderId}"]`);
            const childrenContainer = document.getElementById(folderId);

            // Toggle sidebar when breadcrumbs are clicked (open/close)
            // prevent the outside-click handler from closing right after
            document._justToggledSidebar = true;
            setTimeout(() => { document._justToggledSidebar = false; }, 120);
            if (leftSidebar) leftSidebar.classList.toggle('collapsed');

            if (folderToggle && !folderToggle.classList.contains('expanded')) {
                folderToggle.classList.add('expanded');
            }

            if (childrenContainer) {
                childrenContainer.classList.add('is-open');
            }

            if (folderToggle) {
                folderToggle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            // When breadcrumbs open a folder on mobile, ensure mobile UI syncs
            // (hide mobile TOC, set mobile-sidebar state).
            syncMobileSidebarState();
        });
    }

    /* =========================================================================
       5. Command Palette Logic (Lunr.js powered)
       ========================================================================= */
    const dialog = document.getElementById('cmd-palette');
    const cmdKBtn = document.getElementById('cmd-k-btn');
    const searchInput = document.getElementById('palette-search');
    const paletteLinksContainer = document.getElementById('palette-links');
    const paletteFooter = document.querySelector('.palette-footer');

    let searchDB = [];
    let searchIndexLoaded = false;
    let listItems = [];
    let selectedIndex = 0;
    let lunrIndex = null;
    let currentSearchIndex = 0;

    async function loadSearchIndex() {
        if (searchIndexLoaded) return;
        try {
            const res = await fetch('/search.json');
            const docs = await res.json();
            searchDB = docs;

            lunr.tokenizer.separator = /[\s/]+/;
            lunrIndex = lunr(function () {
                this.ref('id');
                this.field('title', { boost: 500 });
                this.field('content', { boost: 1 });
                this.field('url');
                this.metadataWhitelist = ['position'];

                for (var i in docs) {
                    this.add({
                        id: i,
                        title: docs[i].title,
                        content: docs[i].content,
                        url: docs[i].url
                    });
                }
            });

            searchIndexLoaded = true;
        } catch (e) {
            console.warn('Failed to load search index:', e);
            searchDB = [];
        }
    }

    function scrollPaletteItemIntoView(index) {
        const item = listItems[index];
        if (item) item.scrollIntoView({ block: 'nearest' });
    }

    function setSelectedPaletteItem(index) {
        if (!listItems.length) return;
        listItems.forEach(item => item.classList.remove('selected'));
        selectedIndex = ((index % listItems.length) + listItems.length) % listItems.length;
        listItems[selectedIndex].classList.add('selected');
        scrollPaletteItemIntoView(selectedIndex);
    }

    async function openPalette() {
        if (dialog) {
            dialog.showModal();
            if (searchInput) {
                searchInput.value = '';
                await loadSearchIndex();
                filterPalette('');
                searchInput.focus();
            }
        }
    }

    function closePalette() {
        if (dialog) dialog.close();
    }

    function addHighlightedText(parent, text, start, end, positions) {
        var index = start;
        for (var i in positions) {
            var position = positions[i];
            var span = document.createElement('span');
            span.innerHTML = escapeHTML(text.substring(index, position[0]));
            parent.appendChild(span);
            index = position[0] + position[1];
            var highlight = document.createElement('mark');
            highlight.innerHTML = escapeHTML(text.substring(position[0], index));
            parent.appendChild(highlight);
        }
        var span = document.createElement('span');
        span.innerHTML = escapeHTML(text.substring(index, end));
        parent.appendChild(span);
    }

    function escapeHTML(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function filterPalette(query) {
        currentSearchIndex++;
        var searchIndex = currentSearchIndex;
        var input = query.trim();

        if (!paletteLinksContainer) return;
        paletteLinksContainer.innerHTML = '';

        if (input === '' && searchDB.length > 0) {
            var recent = searchDB.slice(0, 20);
            buildPalette(recent.map(function(r) { return { ref: searchDB.indexOf(r), doc: r }; }), input, searchIndex);
            if (paletteFooter) {
                paletteFooter.innerHTML = '<span>' + searchDB.length + ' pages</span><span><kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>↵</kbd> open</span>';
            }
            listItems = Array.from(paletteLinksContainer.querySelectorAll('.palette-link-item'));
            if (listItems.length > 0) setSelectedPaletteItem(0);
            return;
        }

        if (input === '') {
            if (paletteFooter) {
                paletteFooter.innerHTML = '<span>0 results</span><span><kbd>esc</kbd> close</span>';
            }
            listItems = [];
            return;
        }

        if (!lunrIndex) return;

        var results = lunrIndex.query(function (q) {
            var tokens = lunr.tokenizer(input);
            q.term(tokens, { boost: 10 });
            q.term(tokens, { wildcard: lunr.Query.wildcard.TRAILING });
        });

        if (results.length === 0 && input.length > 2) {
            var tokens = lunr.tokenizer(input).filter(function (token) {
                return token.str.length < 20;
            });
            if (tokens.length > 0) {
                results = lunrIndex.query(function (q) {
                    q.term(tokens, { editDistance: Math.round(Math.sqrt(input.length / 2 - 1)) });
                });
            }
        }

        if (results.length === 0) {
            var noResultsDiv = document.createElement('div');
            noResultsDiv.classList.add('search-no-result');
            noResultsDiv.textContent = 'No results found';
            paletteLinksContainer.appendChild(noResultsDiv);
            if (paletteFooter) {
                paletteFooter.innerHTML = '<span>0 results</span><span><kbd>esc</kbd> close</span>';
            }
            listItems = [];
            return;
        }

        buildPalette(results, input, searchIndex);

        if (paletteFooter) {
            paletteFooter.innerHTML = '<span>' + results.length + ' of ' + searchDB.length + ' pages</span><span><kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>↵</kbd> open</span>';
        }

        listItems = Array.from(paletteLinksContainer.querySelectorAll('.palette-link-item'));
        if (listItems.length > 0) setSelectedPaletteItem(0);
    }

    function buildPalette(results, query, searchIndex) {
        if (!paletteLinksContainer) return;
        if (searchIndex !== currentSearchIndex) return;

        results.forEach(function (result) {
            var doc = (result.doc) ? result.doc : searchDB[result.ref];
            if (!doc) return;

            var li = document.createElement('li');
            var button = document.createElement('button');
            button.className = 'palette-link-item';
            button.dataset.url = doc.url;

            var titleDiv = document.createElement('div');
            titleDiv.style.display = 'flex';
            titleDiv.style.alignItems = 'center';
            titleDiv.style.gap = '8px';
            titleDiv.style.width = '100%';

            var titleSpan = document.createElement('span');
            titleSpan.style.fontWeight = '500';
            titleSpan.style.flex = '1';
            titleSpan.textContent = doc.title;

            var badge = document.createElement('span');
            badge.className = 'palette-badge';
            badge.textContent = doc.category || 'page';

            titleDiv.appendChild(titleSpan);
            titleDiv.appendChild(badge);

            // Highlight title matches
            var metadata = result.matchData ? result.matchData.metadata : null;
            var titlePositions = [];
            var contentPositions = [];

            if (metadata) {
                for (var j in metadata) {
                    var meta = metadata[j];
                    if (meta.title) {
                        var positions = meta.title.position;
                        for (var k in positions) {
                            titlePositions.push(positions[k]);
                        }
                    }
                    if (meta.content) {
                        var positions = meta.content.position;
                        for (var k in positions) {
                            var position = positions[k];
                            var previewStart = position[0];
                            var previewEnd = position[0] + position[1];
                            var ellipsesBefore = true;
                            var ellipsesAfter = true;

                            for (var kk = 0; kk < 3; kk++) {
                                var nextSpace = doc.content.lastIndexOf(' ', previewStart - 2);
                                var nextDot = doc.content.lastIndexOf('. ', previewStart - 2);
                                if ((nextDot >= 0) && (nextDot > nextSpace)) {
                                    previewStart = nextDot + 1;
                                    ellipsesBefore = false;
                                    break;
                                }
                                if (nextSpace < 0) {
                                    previewStart = 0;
                                    ellipsesBefore = false;
                                    break;
                                }
                                previewStart = nextSpace + 1;
                            }

                            for (var kk = 0; kk < 3; kk++) {
                                var nextSpace = doc.content.indexOf(' ', previewEnd + 1);
                                var nextDot = doc.content.indexOf('. ', previewEnd + 1);
                                if ((nextDot >= 0) && (nextDot < nextSpace)) {
                                    previewEnd = nextDot;
                                    ellipsesAfter = false;
                                    break;
                                }
                                if (nextSpace < 0) {
                                    previewEnd = doc.content.length;
                                    ellipsesAfter = false;
                                    break;
                                }
                                previewEnd = nextSpace;
                            }

                            contentPositions.push({
                                highlight: position,
                                previewStart: previewStart, previewEnd: previewEnd,
                                ellipsesBefore: ellipsesBefore, ellipsesAfter: ellipsesAfter
                            });
                        }
                    }
                }
            }

            if (titlePositions.length > 0) {
                titlePositions.sort(function (p1, p2) { return p1[0] - p2[0]; });
                titleSpan.innerHTML = '';
                addHighlightedText(titleSpan, doc.title, 0, doc.title.length, titlePositions);
            }

            button.appendChild(titleDiv);

            if (contentPositions.length > 0) {
                contentPositions.sort(function (p1, p2) { return p1.highlight[0] - p2.highlight[0]; });
                var previewGroups = [];
                var currentGroup = {
                    highlight: [contentPositions[0].highlight],
                    previewStart: contentPositions[0].previewStart,
                    previewEnd: contentPositions[0].previewEnd,
                    ellipsesBefore: contentPositions[0].ellipsesBefore,
                    ellipsesAfter: contentPositions[0].ellipsesAfter
                };

                for (var j = 1; j < contentPositions.length; j++) {
                    var cp = contentPositions[j];
                    if (currentGroup.previewEnd < cp.previewStart) {
                        previewGroups.push(currentGroup);
                        currentGroup = {
                            highlight: [cp.highlight],
                            previewStart: cp.previewStart,
                            previewEnd: cp.previewEnd,
                            ellipsesBefore: cp.ellipsesBefore,
                            ellipsesAfter: cp.ellipsesAfter
                        };
                    } else {
                        currentGroup.highlight.push(cp.highlight);
                        currentGroup.previewEnd = cp.previewEnd;
                        currentGroup.ellipsesAfter = cp.ellipsesAfter;
                    }
                }
                previewGroups.push(currentGroup);

                var excerptDiv = document.createElement('div');
                excerptDiv.className = 'palette-excerpt';

                for (var j = 0; j < Math.min(previewGroups.length, 2); j++) {
                    var group = previewGroups[j];
                    if (group.ellipsesBefore) {
                        excerptDiv.appendChild(document.createTextNode('... '));
                    }
                    addHighlightedText(excerptDiv, doc.content, group.previewStart, group.previewEnd, group.highlight);
                    if (group.ellipsesAfter) {
                        excerptDiv.appendChild(document.createTextNode(' ...'));
                    }
                    if (j < Math.min(previewGroups.length, 2) - 1) {
                        excerptDiv.appendChild(document.createElement('br'));
                    }
                }
                button.appendChild(excerptDiv);
            }

            button.addEventListener('click', function () {
                closePalette();
                if (doc.url !== window.location.pathname) loadPage(doc.url);
            });

            li.appendChild(button);
            paletteLinksContainer.appendChild(li);
        });
    }

    if (cmdKBtn) cmdKBtn.addEventListener('click', openPalette);

    document.addEventListener('click', function (e) {
        if (!dialog || !dialog.open) return;
        if (!dialog.contains(e.target) && cmdKBtn && !cmdKBtn.contains(e.target)) {
            closePalette();
        }
    });

    if (dialog) {
        dialog.addEventListener('click', function (e) {
            if (e.target === dialog) closePalette();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function (e) { filterPalette(e.target.value); });
        searchInput.addEventListener('focus', function () { filterPalette(searchInput.value); });
        searchInput.addEventListener('keyup', function (e) {
            if (e.keyCode === 27) {
                searchInput.value = '';
                searchInput.blur();
                closePalette();
            }
        });
        searchInput.addEventListener('keydown', function (e) {
            switch (e.keyCode) {
                case 38:
                case 40:
                case 13:
                    e.preventDefault();
                    break;
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (dialog) dialog.open ? closePalette() : openPalette();
        }
        if (e.shiftKey && e.keyCode === 83) {
            e.preventDefault();
            openPalette();
        }

        if (dialog && dialog.open) {
            switch (e.keyCode) {
                case 38:
                    e.preventDefault();
                    var active = document.querySelector('.palette-link-item.selected');
                    if (active) {
                        active.classList.remove('selected');
                        if (active.parentElement.previousSibling) {
                            var previous = active.parentElement.previousSibling.querySelector('.palette-link-item');
                            if (previous) {
                                previous.classList.add('selected');
                                previous.scrollIntoView(false);
                            }
                        }
                    }
                    break;
                case 40:
                    e.preventDefault();
                    var active = document.querySelector('.palette-link-item.selected');
                    if (active) {
                        if (active.parentElement.nextSibling) {
                            var next = active.parentElement.nextSibling.querySelector('.palette-link-item');
                            if (next) {
                                active.classList.remove('selected');
                                next.classList.add('selected');
                                next.scrollIntoView(false);
                            }
                        }
                    } else {
                        var first = document.querySelector('.palette-link-item');
                        if (first) first.classList.add('selected');
                    }
                    break;
                case 13:
                    e.preventDefault();
                    var active = document.querySelector('.palette-link-item.selected');
                    if (active) active.click();
                    else {
                        var first = document.querySelector('.palette-link-item');
                        if (first) first.click();
                    }
                    break;
                case 27:
                    closePalette();
                    break;
            }
        }
    });

    /* =========================================================================
       7. Blog/Quest/Journal utilities (open with, share)
       ========================================================================= */

    window.openWith = function (platform) {
        var url = window.location.href.replace(/\/$/, '');
        var prompt = encodeURIComponent('Read ' + url + ', I want to ask questions about it.');
        if (platform === 'chatgpt') {
            window.open('https://chatgpt.com/?prompt=' + prompt, '_blank');
        } else if (platform === 'claude') {
            window.open('https://claude.ai/new?q=' + prompt, '_blank');
        }
    };

    window.shareTo = function (platform) {
        var url = encodeURIComponent(window.location.href);
        if (platform === 'copy') {
            navigator.clipboard.writeText(window.location.href).then(function () {
                var el = document.getElementById('copyLinkText');
                if (el) {
                    var orig = el.innerText;
                    el.innerText = 'Link Copied!';
                    setTimeout(function () { el.innerText = orig; }, 2000);
                }
            });
        } else if (platform === 'x') {
            window.open('https://x.com/intent/post?url=' + url, '_blank');
        } else if (platform === 'linkedin') {
            window.open('https://www.linkedin.com/feed/?shareActive=true&url=' + url + '&shareUrl=' + url, '_blank');
        }
    };

    // Pronunciation helper used by the About page button
    // In-site toast helper (no popups/alerts)
    window.showToast = function (message) {
        var toast = document.getElementById('site-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'site-toast';
            toast.className = 'site-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        window.clearTimeout(window._toastTimer);
        window._toastTimer = window.setTimeout(function () {
            toast.classList.remove('show');
        }, 2200);
    };

    // Keep a single audio instance so repeated clicks don't stack.
    var _pronounceAudio = null;
    /* =========================================================================
       6. AI Chat — shadcn-style (ghost replies, input group, stop button)
       ========================================================================= */

    const aiChatToggle = document.getElementById('ai-chat-toggle');
    const aiChatToggleMobile = document.getElementById('ai-chat-toggle-mobile');
    const aiChatWindow = document.getElementById('ai-chat-window');
    const aiChatClose = document.querySelector('.ai-chat-close');
    const aiChatMessages = document.getElementById('ai-chat-messages');
    const aiChatForm = document.getElementById('ai-chat-form');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatSend = document.getElementById('ai-chat-send');
    const aiChatEmpty = document.getElementById('ai-chat-empty');
    const aiChatQuickActions = document.getElementById('ai-chat-quick-actions');
    const aiChatScrollBottom = document.getElementById('ai-chat-scroll-bottom');

    const AI_CHAT_WORKER_URL = 'https://ai-chat-proxy.samirpaudel2.workers.dev';

    let isGenerating = false;
    let activeAbort = null;
    let prewarmed = false;
    let chatHistory = [{ role: 'model', text: 'Hey, I\'m Sam, an assistant created by @samir. Ask me anything about him and I\'ll answer from his site.' }];

    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* Markdown-ish -> HTML. Agent replies are unframed page text, so lists and
       code get real block elements rather than inline soup. */
    function formatReply(text) {
        var s = text;
        s = s.replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '[$2]($1)');
        s = escapeHTML(s);
        s = s.replace(/\r\n/g, '\n');

        var blocks = [];
        s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, function (_, lang, code) {
            blocks.push('<pre><code>' + code.replace(/\n$/, '') + '</code></pre>');
            return '\u0000' + (blocks.length - 1) + '\u0000';
        });

        var lines = s.split('\n');
        var out = [];
        var listType = null;

        function closeList() {
            if (listType) { out.push(listType === 'ul' ? '</ul>' : '</ol>'); listType = null; }
        }

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var blockMatch = line.match(/^\u0000(\d+)\u0000$/);

            if (blockMatch) {
                closeList();
                out.push(blocks[+blockMatch[1]]);
                continue;
            }

            var ul = line.match(/^\s*[-*]\s+(.*)$/);
            var ol = line.match(/^\s*\d+[.)]\s+(.*)$/);

            if (ul || ol) {
                var want = ul ? 'ul' : 'ol';
                if (listType !== want) { closeList(); out.push(want === 'ul' ? '<ul>' : '<ol>'); listType = want; }
                out.push('<li>' + inline(ul ? ul[1] : ol[1]) + '</li>');
                continue;
            }

            closeList();
            if (line.trim() === '') continue;
            out.push('<p>' + inline(line) + '</p>');
        }
        closeList();

        function inline(t) {
            t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
            t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
            t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            t = t.replace(/(https?:\/\/[^\s<"'`)]+)(?![^<]*<\/a>)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
            return t;
        }

        return out.join('');
    }

    function createOverlay() {
        var overlay = document.getElementById('ai-chat-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ai-chat-overlay';
            overlay.className = 'ai-chat-overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', closeChat);
        }
        return overlay;
    }

    function toggleChat() {
        aiChatWindow.classList.contains('open') ? closeChat() : openChat();
    }

    function openChat() {
        aiChatWindow.classList.add('open');
        createOverlay().classList.add('open');
        aiChatWindow.setAttribute('aria-hidden', 'false');
        setTimeout(function () { aiChatInput.focus(); }, 60);
        prewarmWorker();
    }

    function closeChat() {
        aiChatWindow.classList.remove('open');
        var overlay = document.getElementById('ai-chat-overlay');
        if (overlay) overlay.classList.remove('open');
        aiChatWindow.setAttribute('aria-hidden', 'true');
    }

    function prewarmWorker() {
        if (prewarmed) return;
        prewarmed = true;
        fetch(AI_CHAT_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', text: 'ping' }] })
        }).catch(function () {});
    }

    /* ── live-edge autoscroll: follow only while the reader is at the bottom ── */
    function atLiveEdge() {
        var threshold = 60;
        return aiChatMessages.scrollHeight - aiChatMessages.scrollTop - aiChatMessages.clientHeight < threshold;
    }

    function followIfLive(wasLive) {
        if (wasLive) aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    }

    function scrollToBottom(behavior) {
        aiChatMessages.scrollTo({ top: aiChatMessages.scrollHeight, behavior: behavior || 'smooth' });
        syncJumpButton();
    }

    function syncJumpButton() {
        if (!aiChatScrollBottom) return;
        aiChatScrollBottom.classList.toggle('visible', !atLiveEdge());
    }

    function appendTurn(role, html) {
        var wasLive = atLiveEdge();
        var wrap = document.createElement('div');
        wrap.className = 'ai-msg ai-msg-' + role;

        if (role === 'user') {
            var bubble = document.createElement('div');
            bubble.className = 'ai-bubble';
            bubble.textContent = html;
            wrap.appendChild(bubble);
        } else {
            var reply = document.createElement('div');
            reply.className = 'ai-reply';
            reply.innerHTML = html;
            wrap.appendChild(reply);
        }

        aiChatMessages.appendChild(wrap);
        requestAnimationFrame(function () { followIfLive(wasLive); });
        return wrap;
    }

    function showThinking() {
      var wasLive = atLiveEdge();
      var wrap = document.createElement('div');
      wrap.className = 'ai-msg ai-msg-assistant';
      wrap.id = 'ai-chat-typing-indicator';
      wrap.innerHTML = '<div class="ai-typing"><span class="ai-typing-dots"><span></span><span></span><span></span></span><span>thinking</span></div>';
      aiChatMessages.appendChild(wrap);
      requestAnimationFrame(function () { followIfLive(wasLive); });
    }

    function hideThinking() {
        var el = document.getElementById('ai-chat-typing-indicator');
        if (el) el.remove();
    }

    function dismissEmpty() {
        if (aiChatEmpty && aiChatEmpty.parentNode) aiChatEmpty.remove();
    }

    function autoGrow() {
        aiChatInput.style.height = 'auto';
        aiChatInput.style.height = Math.min(aiChatInput.scrollHeight, 132) + 'px';
    }

    function syncSendState() {
        if (isGenerating) return; // stop button owns its own enabled state
        aiChatSend.disabled = !aiChatInput.value.trim();
    }

    function setStreaming(streaming) {
        isGenerating = streaming;
        aiChatSend.classList.toggle('is-stopping', streaming);
        aiChatSend.disabled = false;
        aiChatSend.setAttribute('aria-label', streaming ? 'Stop response' : 'Send message');
        if (!streaming) syncSendState();
    }

    function stopReply() {
        if (activeAbort) activeAbort.abort();
    }

    async function sendMessage(message) {
        if (!message.trim() || isGenerating) return;

        dismissEmpty();
        appendTurn('user', message);
        chatHistory.push({ role: 'user', text: message });
        aiChatInput.value = '';
        autoGrow();

        showThinking();
        setStreaming(true);

        activeAbort = new AbortController();
        try {
            var response = await fetch(AI_CHAT_WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory }),
                signal: activeAbort.signal
            });

            if (!response.ok) throw new Error('Server error: ' + response.status);

            var data = await response.json();
            if (data.error) throw new Error(data.error);

            hideThinking();
            appendTurn('assistant', formatReply(data.response));
            chatHistory.push({ role: 'model', text: data.response });

        } catch (error) {
            hideThinking();
            if (error && error.name === 'AbortError') {
                appendTurn('assistant', '<p>Stopped.</p>');
            } else {
                console.error('AI Chat error:', error);
                appendTurn('assistant', '<p>Sorry, I hit an error. Please try again.</p>');
            }
        } finally {
            activeAbort = null;
            setStreaming(false);
            aiChatInput.focus();
        }
    }

    if (aiChatToggle) aiChatToggle.addEventListener('click', toggleChat);
    if (aiChatToggleMobile) aiChatToggleMobile.addEventListener('click', toggleChat);
    if (aiChatClose) aiChatClose.addEventListener('click', closeChat);

    if (aiChatForm) {
        aiChatForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (isGenerating) { stopReply(); return; }
            sendMessage(aiChatInput.value);
        });
    }

    if (aiChatSend) {
        aiChatSend.addEventListener('click', function (e) {
            if (isGenerating) { e.preventDefault(); stopReply(); }
        });
    }

    if (aiChatInput) {
        aiChatInput.addEventListener('input', function () { autoGrow(); syncSendState(); });
        aiChatInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (isGenerating) return; // Enter does nothing mid-reply
                if (aiChatInput.value.trim()) aiChatForm.requestSubmit();
            }
        });
    }

    if (aiChatQuickActions) {
        aiChatQuickActions.addEventListener('click', function (e) {
            var btn = e.target.closest('.ai-chat-suggestion');
            if (btn) sendMessage(btn.getAttribute('data-question'));
        });
    }

    if (aiChatScrollBottom) {
        aiChatScrollBottom.addEventListener('click', function () { scrollToBottom(); });
    }

    if (aiChatMessages) {
        aiChatMessages.addEventListener('scroll', syncJumpButton, { passive: true });
    }

    document.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
            e.preventDefault();
            toggleChat();
        }
        if (e.key === 'Escape' && aiChatWindow && aiChatWindow.classList.contains('open')) {
            closeChat();
        }
    });

    prewarmWorker();

    // Delegated click handler for pronunciation buttons (works under AJAX nav)
    document.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('.pronounce-btn') : null;
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            window.pronounceName();
        }
    });

    window.pronounceName = function () {
        try {
            if (!_pronounceAudio) {
                _pronounceAudio = new Audio('data:audio/mpeg;base64,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');
            }
            _pronounceAudio.pause();
            _pronounceAudio.currentTime = 0;
            _pronounceAudio.play().catch(function (e) {
                console.error('audio play failed:', e);
            });
        } catch (e) {
            console.error('pronounceName failed:', e);
        }
    };
});
