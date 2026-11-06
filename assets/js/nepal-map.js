/* Nepal Districts Interactive Map
   Edit the VISITED set below to mark districts you've been to.
   District names must match the `TARGET` property in the 77-district TopoJSON.
*/

const VISITED = new Set([
    "KATHMANDU",
    "LALITPUR",
    "BHAKTAPUR",
    "KABHREPALANCHOK", // Kavre
    "NUWAKOT",
    "KASKI",
    "GORKHA",
    "TANAHU",
    "SYANGJA",
    "PARBAT",
    "NAWALPARASI4", // Nawalparasi East/West
    "NAWALPARASI5", // Nawalparasi East/West
    "RUPANDEHI",
    "PALPA",
    "GULMI",
    "CHITAWAN", // Chitwan
]);

// Map raw topojon names to nicer display names
const DISPLAY_NAMES = {
    "KABHREPALANCHOK": "Kavrepalanchok",
    "CHITAWAN": "Chitwan",
    "NAWALPARASI4": "Nawalpur (Nawalparasi East)",
    "NAWALPARASI5": "Parasi (Nawalparasi West)",
    "RUKUM5": "Eastern Rukum",
    "RUKUM6": "Western Rukum",
};

function getDisplayName(rawName) {
    if (DISPLAY_NAMES[rawName]) return DISPLAY_NAMES[rawName];
    if (!rawName) return "";
    return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
}

const DISTRICT_NOTES = {
    "KATHMANDU": "Home base — lived here for years",
    "LALITPUR": "Alma mater — Patan Multiple Campus",
    "KASKI": "Pokhara — lake city gateway",
    "CHITAWAN": "Safari vibes",
    "MORANG": "Biratnagar — eastern hub",
    "RUPANDEHI": "Lumbini — Buddha's birthplace",
};

const CDN_DATA_URL = "https://cdn.jsdelivr.net/gh/Parajulibkrm/new-nepal-geojson-and-topojson@master/topojson/Nepaltopo.json";
// Same 77-district TopoJSON, bundled at the repo root, so the map works
// offline/onlocalhost with zero network dependency. CDN is the fallback.
// Absolute site-root path: all_districts.json lives at the repo root, so a
// page-served URL like /nepal/ would otherwise resolve relative to it.
const LOCAL_DATA_URL = "/all_districts.json";
const PROP_KEY = "TARGET";
const IS_TOPO = true;
let selectedDistrict = null;

function resolveDataUrl(url) {
    // Keep absolute paths absolute; only resolve relative ones against the
    // current page (so a sub-path deployment still works for the CDN URL).
    if (url.startsWith("/")) return url;
    return new URL(url, window.location.href).href;
}

async function initNepalMap() {
    const wrapper = document.getElementById("nepal-map-wrapper");
    if (!wrapper) return;

    const visitedEl = document.getElementById("visited-count");
    // The visible counter is #visited-pct-view; #visited-pct is the hidden
    // one inside .nepal-summary. Keep both in sync so neither stays stale.
    const pctEls = [
        document.getElementById("visited-pct"),
        document.getElementById("visited-pct-view"),
    ].filter(Boolean);

    const indexEl = document.getElementById("district-index");
    const chipsEl = document.getElementById("district-chips");
    const filterEl = document.getElementById("district-filter");

    // Guard against the double-init that happens on AJAX navigation
    // (nepal-map.js auto-inits AND script.js also calls initNepalMap).
    if (wrapper.querySelector("svg")) return;
    if (wrapper.dataset.initializing === "1") return;
    wrapper.dataset.initializing = "1";

    const width = wrapper.clientWidth || 800;
    const height = wrapper.clientHeight || Math.max(400, width * 0.72);

    try {
        // Try the bundled file first, fall back to the CDN copy.
        let data = null;
        let lastError = null;
        for (const url of [LOCAL_DATA_URL, CDN_DATA_URL]) {
            try {
                const resp = await fetch(resolveDataUrl(url));
                if (!resp.ok) throw new Error(`${url} -> HTTP ${resp.status}`);
                data = await resp.json();
                break;
            } catch (err) {
                lastError = err;
            }
        }
        if (!data) throw lastError || new Error("Could not load district data");
        const geojson = IS_TOPO
            ? topojson.feature(data, data.objects[Object.keys(data.objects)[0]])
            : data;

        const svg = d3.select(wrapper)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height]);

        wrapper.querySelector(".nepal-loading")?.remove();

        const projection = d3.geoMercator().fitSize([width - 20, height - 20], geojson);
        const path = d3.geoPath().projection(projection);

        const total = geojson.features.length;

        // Populate the "All districts" index list below the map.
        if (indexEl) {
            const names = geojson.features
                .map(f => f.properties[PROP_KEY])
                .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
            indexEl.innerHTML = "";
            names.forEach(raw => {
                const span = document.createElement("span");
                span.className = "nepal-district" + (VISITED.has(raw) ? " is-visited" : "");
                span.textContent = getDisplayName(raw);
                span.dataset.raw = raw;
                span.addEventListener("click", () => {
                    const path = document.querySelector('.district[data-name="' + raw + '"]');
                    if (path) path.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                });
                indexEl.appendChild(span);
            });
        }

        // Wire the All/Visited/Not-yet chips once.
        if (chipsEl && !chipsEl.dataset.wired) {
            chipsEl.dataset.wired = "1";
            chipsEl.addEventListener("click", (e) => {
                const btn = e.target.closest("button[data-show]");
                if (!btn || !indexEl) return;
                indexEl.dataset.show = btn.dataset.show;
                chipsEl.querySelectorAll("button").forEach(b => {
                    b.setAttribute("aria-pressed", String(b === btn));
                });
            });
        }

        // Wire the search filter once.
        if (filterEl && !filterEl.dataset.wired) {
            filterEl.dataset.wired = "1";
            filterEl.addEventListener("input", () => {
                if (!indexEl) return;
                const q = filterEl.value.trim().toLowerCase();
                indexEl.querySelectorAll(".nepal-district").forEach(span => {
                    const hay = (span.textContent + " " + (span.dataset.raw || "")).toLowerCase();
                    span.classList.toggle("is-hidden", !!q && !hay.includes(q));
                });
            });
        }

        const group = svg.append("g");

        group.selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", d => {
                const name = d.properties[PROP_KEY];
                return VISITED.has(name) ? "district visited" : "district";
            })
            .attr("data-name", d => d.properties[PROP_KEY])
            .on("click", function (e, d) {
                const name = d.properties[PROP_KEY];
                const visited = VISITED.has(name);
                const notes = DISTRICT_NOTES[name];

                if (selectedDistrict) {
                    selectedDistrict.classList.remove("active");
                }
                d3.select(this).classed("active", true);
                selectedDistrict = this;

                document.getElementById("tooltip-name").textContent = getDisplayName(name);
                const statusEl = document.getElementById("tooltip-status");
                statusEl.textContent = visited ? "Visited" : "Not yet";
                statusEl.className = visited ? "tooltip-visited-status" : "tooltip-not-visited-status";
                const notesEl = document.getElementById("tooltip-notes");
                if (notes) {
                    notesEl.textContent = notes;
                    notesEl.style.display = "";
                } else {
                    notesEl.textContent = "";
                    notesEl.style.display = "none";
                }
            })
            .on("mouseenter", function () {
                d3.select(this).classed("hovered", true);
            })
            .on("mouseleave", function () {
                d3.select(this).classed("hovered", false);
            });

        const visitedCount = geojson.features.filter(f => VISITED.has(f.properties[PROP_KEY])).length;
        const pct = (visitedCount / total * 100).toFixed(1);
        if (visitedEl) visitedEl.textContent = visitedCount;
        pctEls.forEach(el => { el.textContent = pct; });

    } catch (err) {
        // Ternary in the catch is intentional: if the loading element is
        // already gone, setting text on null would throw a second error.
        const loadingEl = wrapper.querySelector(".nepal-loading");
        if (loadingEl) loadingEl.textContent = "Could not load map. Try refreshing.";
        console.error("Nepal map error:", err);
    } finally {
        delete wrapper.dataset.initializing;
    }
}

window.initNepalMap = initNepalMap;

// Also auto-init on initial page load
if (document.getElementById("nepal-map-wrapper")) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initNepalMap);
    } else {
        initNepalMap();
    }
}
