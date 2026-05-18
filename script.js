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

    function applyTheme(isDark) {
        const lightLogo = document.querySelector('.light-logo');
        const darkLogo = document.querySelector('.dark-logo');
        if (isDark) {
            document.body.classList.add('dark');
            if (sunIcon) sunIcon.classList.remove('active');
            if (moonIcon) moonIcon.classList.add('active');
            if (lightLogo) lightLogo.style.display = 'none';
            if (darkLogo) darkLogo.style.display = 'block';
        } else {
            document.body.classList.remove('dark');
            if (sunIcon) sunIcon.classList.add('active');
            if (moonIcon) moonIcon.classList.remove('active');
            if (lightLogo) lightLogo.style.display = 'block';
            if (darkLogo) darkLogo.style.display = 'none';
        }
    };

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        applyTheme(true);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = !document.body.classList.contains('dark');
            applyTheme(isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    /* =========================================================================
       2. Sidebar Toggle
       ========================================================================= */
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const leftSidebar = document.getElementById('left-sidebar');

    const isMobileViewport = () => window.innerWidth <= 768;

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
                anchor.innerHTML = '⧉';

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
       5. Command Palette Logic
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

    const loadSearchIndex = async () => {
        if (searchIndexLoaded) return;
        try {
            const res = await fetch('/search.json');
            searchDB = await res.json();
            searchIndexLoaded = true;
        } catch (e) {
            searchDB = [];
        }
    };

    const highlightMatch = (text, query) => {
        if (!query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    };

    const getExcerpt = (content, query) => {
        if (!query || !content) return content ? content.slice(0, 120) + '...' : '';
        const idx = content.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return content.slice(0, 120) + '...';
        const start = Math.max(0, idx - 60);
        const end = Math.min(content.length, idx + query.length + 80);
        let excerpt = (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
        return excerpt;
    };

    const buildPalette = (items, query) => {
        if (!paletteLinksContainer) return;
        paletteLinksContainer.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.className = 'palette-link-item';
            button.dataset.url = item.url;

            const titleDiv = document.createElement('div');
            titleDiv.style.display = 'flex';
            titleDiv.style.alignItems = 'center';
            titleDiv.style.gap = '8px';
            titleDiv.style.width = '100%';

            const titleSpan = document.createElement('span');
            titleSpan.style.fontWeight = '500';
            titleSpan.style.flex = '1';
            titleSpan.innerHTML = query ? highlightMatch(item.title, query) : item.title;

            const badge = document.createElement('span');
            badge.className = 'palette-badge';
            badge.textContent = item.category || 'page';

            titleDiv.appendChild(titleSpan);
            titleDiv.appendChild(badge);

            const excerptDiv = document.createElement('div');
            excerptDiv.className = 'palette-excerpt';
            const excerpt = getExcerpt(item.content || item.excerpt || '', query);
            excerptDiv.innerHTML = query ? highlightMatch(excerpt, query) : excerpt;

            button.appendChild(titleDiv);
            button.appendChild(excerptDiv);

            button.addEventListener('click', () => {
                closePalette();
                if (item.url !== window.location.pathname) loadPage(item.url);
            });

            li.appendChild(button);
            paletteLinksContainer.appendChild(li);
        });
    };

    const scrollPaletteItemIntoView = (index) => {
        const item = listItems[index];
        if (item) item.scrollIntoView({ block: 'nearest' });
    };

    const setSelectedPaletteItem = (index) => {
        if (!listItems.length) return;
        listItems.forEach(item => item.classList.remove('selected'));
        selectedIndex = ((index % listItems.length) + listItems.length) % listItems.length;
        listItems[selectedIndex].classList.add('selected');
        scrollPaletteItemIntoView(selectedIndex);
    };

    const openPalette = async () => {
        if (dialog) {
            dialog.showModal();
            if (searchInput) {
                searchInput.value = '';
                await loadSearchIndex();
                filterPalette('');
                searchInput.focus();
            }
        }
    };

    const closePalette = () => { if (dialog) dialog.close(); };

    const filterPalette = (query) => {
        const lowerQuery = query.toLowerCase().trim();
        let filteredDB = searchDB;

        if (lowerQuery.length > 0) {
            filteredDB = searchDB.filter(item =>
                item.title.toLowerCase().includes(lowerQuery) ||
                (item.content && item.content.toLowerCase().includes(lowerQuery)) ||
                item.url.toLowerCase().includes(lowerQuery)
            ).slice(0, 30);
        } else {
            filteredDB = searchDB.slice(0, 20);
        }

        if (paletteFooter) {
            const count = filteredDB.length;
            const total = searchDB.length;
            paletteFooter.innerHTML = lowerQuery
                ? `<span>${count} of ${total} pages</span><span><kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>↵</kbd> open</span>`
                : `<span>${total} pages</span><span><kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>↵</kbd> open</span>`;
        }

        buildPalette(filteredDB, lowerQuery);
        listItems = Array.from(paletteLinksContainer.querySelectorAll('.palette-link-item'));
        if (listItems.length > 0) {
            const currentPathIndex = listItems.findIndex(item => item.dataset.url === window.location.pathname);
            setSelectedPaletteItem(currentPathIndex >= 0 ? currentPathIndex : 0);
        }
    };

    if (cmdKBtn) cmdKBtn.addEventListener('click', openPalette);

    document.addEventListener('click', (e) => {
        if (!dialog || !dialog.open) return;
        if (!dialog.contains(e.target) && cmdKBtn && !cmdKBtn.contains(e.target)) {
            closePalette();
        }
    });

    if (dialog) {
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) closePalette();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterPalette(e.target.value));
        searchInput.addEventListener('focus', () => filterPalette(searchInput.value));
    }

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (dialog) dialog.open ? closePalette() : openPalette();
        }

        if (dialog && dialog.open) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedPaletteItem(selectedIndex + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedPaletteItem(selectedIndex - 1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                listItems[selectedIndex]?.click();
            } else if (e.key === 'Escape') {
                closePalette();
            }
        }
    });

});
