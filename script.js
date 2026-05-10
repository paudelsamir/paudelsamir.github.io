document.addEventListener('DOMContentLoaded', () => {
    const loadingBar = document.getElementById('loading-bar');
    const mainContent = document.getElementById('main-content');

    /* =========================================================================
       1. Theme Management
       ========================================================================= */
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = themeToggle ? themeToggle.querySelector('.sun-icon') : null;
    const moonIcon = themeToggle ? themeToggle.querySelector('.moon-icon') : null;

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const applyTheme = (isDark) => {
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

    themeToggle.addEventListener('click', () => {
        const isDark = !document.body.classList.contains('dark');
        applyTheme(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

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

    const syncMobileSidebarState = () => {
        const sidebarOpen = !leftSidebar.classList.contains('collapsed');
        if (isMobileViewport() && sidebarOpen) {
            document.body.classList.add('mobile-sidebar-open');
            closeMobileToc();
        } else {
            document.body.classList.remove('mobile-sidebar-open');
        }
    };

    const collapseSidebarMobile = () => {
        if (isMobileViewport() && !leftSidebar.classList.contains('collapsed')) {
            leftSidebar.classList.add('collapsed');
            syncMobileSidebarState();
        }
    };

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

    /* =========================================================================
       3. Dynamic Page Loading Logic
       ========================================================================= */
    const initPage = () => {
        const currentPath = window.location.pathname;

        // Update active tree link
        let activeTreeLink = document.querySelector(`.tree-item.is-link[href="${currentPath}"]`);
        if (!activeTreeLink && currentPath === '/') {
            activeTreeLink = document.querySelector(`.tree-item.is-link[href="/intro/"]`);
        }

        document.querySelectorAll('.tree-item.is-link').forEach(link => link.classList.remove('active'));
        if (activeTreeLink) {
            activeTreeLink.classList.add('active');

            const breadcrumbs = [];
            let treeContainer = activeTreeLink.closest('.tree-children');

            while (treeContainer) {
                treeContainer.style.display = 'block';
                const folderId = treeContainer.id;
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

        // Right TOC logic based on actual page content
        const tocContainer = document.getElementById('toc-links');
        const rightSidebar = document.querySelector('.right-sidebar');
        if (tocContainer) tocContainer.innerHTML = ''; // Clear old TOC

        const h2s = Array.from(document.querySelectorAll('.center-reading-column h2'));
        let activeH2s = {};
        const tocObserverOptions = { root: null, rootMargin: '-80px 0px -60% 0px', threshold: 0 };

        const updateMobileTocState = () => {
            const mobileBtn = document.getElementById('mobile-toc-button');
            if (!mobileBtn) return;

            const activeLink = tocContainer ? tocContainer.querySelector('a.active') : null;
            const activeLabel = activeLink ? activeLink.textContent.trim() : 'On this page';
            const fabText = mobileBtn.querySelector('.mobile-toc-fab-text');
            if (fabText) {
                fabText.textContent = activeLabel;
            }

            const scrollRoot = mainContent || document.documentElement;
            const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
            const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollRoot.scrollTop / maxScroll)) : 0;
            mobileBtn.style.setProperty('--toc-progress', progress.toFixed(4));

            const mobilePanel = document.getElementById('mobile-toc-panel');
            if (!mobilePanel) return;

            const mobileLinks = Array.from(mobilePanel.querySelectorAll('.mobile-toc-sheet-links a'));
            mobileLinks.forEach(link => {
                const shouldBeActive = activeLink && link.getAttribute('href') === activeLink.getAttribute('href');
                link.classList.toggle('active', Boolean(shouldBeActive));
            });
        };

        const updateTocHighlight = (id) => {
            if (!tocContainer) return;
            tocContainer.querySelectorAll('a').forEach(link => link.classList.remove('active'));
            const activeTocLink = tocContainer.querySelector(`a[data-target-id="${id}"]`);
            if (activeTocLink) activeTocLink.classList.add('active');
            updateMobileTocState();
        };

        const h2Observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { activeH2s[entry.target.id] = entry.isIntersecting; });
            const currentlyVisibleIds = Object.keys(activeH2s).filter(id => activeH2s[id]);
            if (currentlyVisibleIds.length > 0) {
                updateTocHighlight(currentlyVisibleIds[0]);
            }
        }, tocObserverOptions);

        if (tocContainer && rightSidebar) {
            if (h2s.length === 0) {
                rightSidebar.classList.add('no-headings');
            } else {
                rightSidebar.classList.remove('no-headings');
                h2s.forEach(h2 => {
                    if (!h2.id) h2.id = h2.textContent.trim().toLowerCase().replace(/\s+/g, '-');
                    h2Observer.observe(h2);

                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = `#${h2.id}`;
                    a.textContent = h2.textContent;
                    a.dataset.targetId = h2.id;

                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        h2.scrollIntoView({ behavior: 'smooth' });
                    });

                    li.appendChild(a);
                    tocContainer.appendChild(li);
                });
                // Build or refresh mobile TOC panel
                buildMobileToc();
                updateMobileTocState();
            }
        }

        mainContent.onscroll = () => {
            updateMobileTocState();
        };

        // Re-bind all internal links for dynamic loading
        document.querySelectorAll('a[href^="/"]').forEach(link => {
            // Skip external links or non-page links if any
            if (link.getAttribute('href').startsWith('//')) return;

            link.onclick = (e) => {
                e.preventDefault();
                const url = link.getAttribute('href');
                collapseSidebarMobile();
                if (url !== window.location.pathname) {
                    loadPage(url);
                }
            };
        });
    };

    // Mobile TOC: polished bottom-sheet navigation for small screens
    const buildMobileToc = () => {
        const h1 = document.querySelector('.center-reading-column h1');
        const mainToc = document.getElementById('toc-links');
        const headingLinks = mainToc ? Array.from(mainToc.querySelectorAll('a')) : [];
        const shouldShow = window.innerWidth <= 768 && h1;

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
        fabText.textContent = activeLabel || 'On this page';

        const mobileLinks = mobilePanel.querySelector('.mobile-toc-sheet-links');
        const emptyState = mobilePanel.querySelector('.mobile-toc-empty');
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

        if (emptyState) {
            emptyState.style.display = headingLinks.length > 0 ? 'none' : 'block';
        }

        mobileBtn.onclick = () => {
            const isOpen = mobilePanel.classList.contains('open');
            setOpen(!isOpen);
        };

        const closeBtn = mobilePanel.querySelector('.mobile-toc-close');
        closeBtn.onclick = () => setOpen(false);
        mobileBackdrop.onclick = () => setOpen(false);

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

        const scrollRoot = mainContent || document.documentElement;
        const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollRoot.scrollTop / maxScroll)) : 0;
        mobileBtn.style.setProperty('--toc-progress', progress.toFixed(4));
    };

    const loadPage = async (url, { push = true } = {}) => {
        // Start loading bar
        loadingBar.classList.remove('finishing');
        loadingBar.classList.add('loading');
        mainContent.classList.add('content-swapping');

        try {
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');

            const newContent = newDoc.getElementById('main-content');
            const newTitle = newDoc.querySelector('title').textContent;

            // Update DOM
            document.title = newTitle;
            mainContent.innerHTML = newContent.innerHTML;
            if (push) window.history.pushState({}, '', url);

            // Finish loading
            loadingBar.classList.add('finishing');
            setTimeout(() => {
                loadingBar.classList.remove('loading', 'finishing');
                mainContent.classList.remove('content-swapping');
                initPage();
                window.scrollTo(0, 0);
            }, 300);

        } catch (error) {
            console.error('Failed to load page:', error);
            window.location.href = url; // Fallback to normal navigation
        }
    };

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
        if (leftSidebar.classList.contains('collapsed')) return;

        const clickedInsideSidebar = leftSidebar.contains(e.target);
        const clickedSidebarToggle = sidebarToggle.contains(e.target);
        if (clickedInsideSidebar || clickedSidebarToggle) return;

        collapseSidebarMobile();
    });

    /* =========================================================================
       4. File Tree Folder Toggle Logic
       ========================================================================= */
    const folders = document.querySelectorAll('.tree-item.is-folder');
    folders.forEach(folder => {
        folder.addEventListener('click', (e) => {
            // If the user actually clicked a link inside the folder, let the
            // link's own handler manage navigation.
            if (e.target.closest('a')) return;

            folder.classList.toggle('expanded');
            const targetId = folder.getAttribute('data-folder');
            const childrenContainer = document.getElementById(targetId);

            if (folder.classList.contains('expanded')) {
                if (childrenContainer) childrenContainer.style.display = 'block';
            } else {
                if (childrenContainer) childrenContainer.style.display = 'none';
            }

            // On small screens, if a folder expands and it only contains a
            // single page link, open that page and collapse the sidebar for
            // a better reading experience.
            if (isMobileViewport() && folder.classList.contains('expanded') && childrenContainer) {
                const childLinks = childrenContainer.querySelectorAll('.tree-item.is-link');
                if (childLinks.length === 1) {
                    const singleLinkAnchor = childLinks[0].querySelector('a');
                    if (singleLinkAnchor) {
                        const href = singleLinkAnchor.getAttribute('href');
                        setTimeout(() => {
                            collapseSidebarMobile();
                            if (href && href !== window.location.pathname) {
                                loadPage(href);
                            }
                        }, 150);
                    }
                }
            }

            // Ensure mobile TOC and other mobile state sync when sidebar changes
            syncMobileSidebarState();
        });
    });

    const breadcrumbs = document.getElementById('breadcrumbs');
    if (breadcrumbs) {
        breadcrumbs.addEventListener('click', (e) => {
            const breadcrumbFolder = e.target.closest('[data-breadcrumb-folder]');
            if (!breadcrumbFolder) return;

            const folderId = breadcrumbFolder.getAttribute('data-breadcrumb-folder');
            const folderToggle = document.querySelector(`.tree-item.is-folder[data-folder="${folderId}"]`);
            const childrenContainer = document.getElementById(folderId);

            if (leftSidebar.classList.contains('collapsed')) {
                leftSidebar.classList.remove('collapsed');
            }

            if (folderToggle && !folderToggle.classList.contains('expanded')) {
                folderToggle.classList.add('expanded');
            }

            if (childrenContainer) {
                childrenContainer.style.display = 'block';
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

    let searchDB = [];
    if (typeof sitePages !== 'undefined') {
        searchDB = sitePages;
    }

    const buildPalette = (items) => {
        paletteLinksContainer.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.className = 'palette-link-item';

            const titleSpan = document.createElement('span');
            titleSpan.style.fontWeight = '500';
            titleSpan.style.minWidth = '120px';
            titleSpan.textContent = item.title;

            button.dataset.url = item.url;

            button.appendChild(titleSpan);

            button.addEventListener('click', () => {
                closePalette();
                if (item.url !== window.location.pathname) {
                    loadPage(item.url);
                }
            });

            li.appendChild(button);
            paletteLinksContainer.appendChild(li);
        });
    };

    buildPalette(searchDB);
    let listItems = Array.from(paletteLinksContainer.querySelectorAll('.palette-link-item'));
    let selectedIndex = 0;

    const scrollPaletteItemIntoView = (index) => {
        const item = listItems[index];
        if (item) {
            item.scrollIntoView({ block: 'nearest' });
        }
    };

    const setSelectedPaletteItem = (index) => {
        if (!listItems.length) return;
        listItems.forEach(item => item.classList.remove('selected'));
        selectedIndex = ((index % listItems.length) + listItems.length) % listItems.length;
        listItems[selectedIndex].classList.add('selected');
        scrollPaletteItemIntoView(selectedIndex);
    };

    const openPalette = () => {
        dialog.showModal();
        searchInput.value = '';
        filterPalette('');
        searchInput.focus();
    };

    const closePalette = () => { dialog.close(); };

    const filterPalette = (query) => {
        const lowerQuery = query.toLowerCase().trim();
        let filteredDB = searchDB;

        if (lowerQuery.length > 0) {
            filteredDB = searchDB.filter(item =>
                item.title.toLowerCase().includes(lowerQuery) || item.url.toLowerCase().includes(lowerQuery)
            );
        }

        buildPalette(filteredDB);
        listItems = Array.from(paletteLinksContainer.querySelectorAll('.palette-link-item'));

        if (listItems.length > 0) {
            const currentPathIndex = listItems.findIndex(item => item.dataset.url === window.location.pathname);
            setSelectedPaletteItem(currentPathIndex >= 0 ? currentPathIndex : 0);
        }
    };

    const getVisibleItems = () => listItems;

    cmdKBtn.addEventListener('click', openPalette);

    // Close palette on outside click.
    document.addEventListener('click', (e) => {
        if (!dialog.open) return;
        if (!dialog.contains(e.target) && !cmdKBtn.contains(e.target)) {
            closePalette();
        }
    });

    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            closePalette();
        }
    });

    searchInput.addEventListener('input', (e) => filterPalette(e.target.value));

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            dialog.open ? closePalette() : openPalette();
        }

        if (dialog.open) {
            const visibleItems = getVisibleItems();
            if (visibleItems.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedPaletteItem(selectedIndex + 1);
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedPaletteItem(selectedIndex - 1);
            }
            else if (e.key === 'Enter') {
                e.preventDefault();
                visibleItems[selectedIndex].click();
            }
            else if (e.key === 'Escape') {
                closePalette();
            }
        }
    });
});
