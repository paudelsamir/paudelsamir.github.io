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

            if (typeof lunr === 'undefined') return;
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
       6. AI Chat Widget (multi-turn)
       ========================================================================= */

    const aiChatToggle = document.getElementById('ai-chat-toggle');
    const aiChatToggleMobile = document.getElementById('ai-chat-toggle-mobile');
    const aiChatWindow = document.getElementById('ai-chat-window');
    const aiChatClose = document.querySelector('.ai-chat-close');
    const aiChatMessages = document.getElementById('ai-chat-messages');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatSend = document.getElementById('ai-chat-send');
    const aiChatQuickActions = document.getElementById('ai-chat-quick-actions');
    const aiChatScrollBottom = document.getElementById('ai-chat-scroll-bottom');

    const AI_CHAT_WORKER_URL = 'https://ai-chat-proxy.samirpaudel.workers.dev';

    let isGenerating = false;
    let chatHistory = [{ role: 'model', text: "Hi! I'm Sam — ask me anything about myself, my work, or what I'm building." }];
    let prewarmed = false;

    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function formatAI(text) {
        var s = text;
        s = s.replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '[$2]($1)');
        s = escapeHTML(s);
        s = s.replace(/—/g, '-');
        s = s.replace(/---/g, '-');
        s = s.replace(/--/g, '-');
        s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
        s = s.replace(/`(.+?)`/g, '<code>$1</code>');
        s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        s = s.replace(/(https?:\/\/[^\s<"')]+)(?![^<]*<\/a>)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        s = s.replace(/\n/g, '<br>');
        return s;
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
        aiChatInput.focus();
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

    function addMessage(text, type) {
        var messageDiv = document.createElement('div');
        messageDiv.className = 'ai-chat-message ai-chat-message-' + type;
        var bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'ai-chat-message-bubble';
        bubbleDiv.innerHTML = (type === 'ai') ? formatAI(text) : escapeHTML(text).replace(/\n/g, '<br>');
        messageDiv.appendChild(bubbleDiv);
        aiChatMessages.appendChild(messageDiv);
        requestAnimationFrame(scrollToBottom);
    }

    function showTypingIndicator() {
        var typingDiv = document.createElement('div');
        typingDiv.className = 'ai-chat-message ai-chat-message-ai';
        typingDiv.id = 'ai-chat-typing-indicator';
        typingDiv.innerHTML = '<div class="ai-chat-message-bubble"><div class="ai-chat-typing"><span></span><span></span><span></span></div></div>';
        aiChatMessages.appendChild(typingDiv);
        requestAnimationFrame(scrollToBottom);
    }

    function hideTypingIndicator() {
        var indicator = document.getElementById('ai-chat-typing-indicator');
        if (indicator) indicator.remove();
    }

    function scrollToBottom() {
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
        if (aiChatScrollBottom) aiChatScrollBottom.classList.remove('visible');
    }

    function toggleScrollButton() {
        if (!aiChatScrollBottom) return;
        var threshold = 80;
        var atBottom = aiChatMessages.scrollHeight - aiChatMessages.scrollTop - aiChatMessages.clientHeight < threshold;
        aiChatScrollBottom.classList.toggle('visible', !atBottom);
    }

    async function sendMessage(message) {
        if (!message.trim() || isGenerating) return;

        if (aiChatQuickActions) aiChatQuickActions.style.display = 'none';

        addMessage(message, 'user');
        chatHistory.push({ role: 'user', text: message });
        aiChatInput.value = '';
        aiChatSend.disabled = true;

        showTypingIndicator();
        isGenerating = true;

        try {
            var response = await fetch(AI_CHAT_WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            });

            if (!response.ok) throw new Error('Server error: ' + response.status);

            var data = await response.json();
            if (data.error) throw new Error(data.error);

            hideTypingIndicator();
            addMessage(data.response, 'ai');
            chatHistory.push({ role: 'model', text: data.response });

        } catch (error) {
            hideTypingIndicator();
            console.error('AI Chat error:', error);
            addMessage('Sorry, I hit an error. Please try again.', 'ai');
        } finally {
            isGenerating = false;
            aiChatSend.disabled = false;
            aiChatInput.focus();
        }
    }

    if (aiChatToggle) aiChatToggle.addEventListener('click', toggleChat);
    if (aiChatToggleMobile) aiChatToggleMobile.addEventListener('click', toggleChat);
    if (aiChatClose) aiChatClose.addEventListener('click', closeChat);
    if (aiChatSend) aiChatSend.addEventListener('click', function () { sendMessage(aiChatInput.value); });

    if (aiChatInput) {
        aiChatInput.addEventListener('input', function () {
            aiChatSend.disabled = !aiChatInput.value.trim() || isGenerating;
        });
        aiChatInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(aiChatInput.value);
            }
        });
    }

    if (aiChatQuickActions) {
        aiChatQuickActions.addEventListener('click', function (e) {
            var btn = e.target.closest('.ai-chat-quick-btn');
            if (btn) sendMessage(btn.getAttribute('data-question'));
        });
    }

    if (aiChatScrollBottom) {
        aiChatScrollBottom.addEventListener('click', scrollToBottom);
    }

    if (aiChatMessages) {
        aiChatMessages.addEventListener('scroll', toggleScrollButton);
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

});
