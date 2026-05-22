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

const DATA_URL = "https://cdn.jsdelivr.net/gh/Parajulibkrm/new-nepal-geojson-and-topojson@master/topojson/Nepaltopo.json";
const PROP_KEY = "TARGET";
const IS_TOPO = true;
let selectedDistrict = null;

async function initNepalMap() {
    const wrapper = document.getElementById("nepal-map-wrapper");
    if (!wrapper) return;

    const visitedEl = document.getElementById("visited-count");
    const pctEl = document.getElementById("visited-pct");

    const width = wrapper.clientWidth || 800;
    const height = wrapper.clientHeight || Math.max(400, width * 0.72);

    const svg = d3.select(wrapper)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

    try {
        const resp = await fetch(DATA_URL);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const geojson = IS_TOPO
            ? topojson.feature(data, data.objects[Object.keys(data.objects)[0]])
            : data;

        wrapper.querySelector(".nepal-loading")?.remove();

        const projection = d3.geoMercator().fitSize([width - 20, height - 20], geojson);
        const path = d3.geoPath().projection(projection);

        const total = geojson.features.length;

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
        visitedEl.textContent = visitedCount;
        pctEl.textContent = (visitedCount / total * 100).toFixed(1);

    } catch (err) {
        wrapper.querySelector(".nepal-loading").textContent = "Could not load map. Try refreshing.";
        console.error("Nepal map error:", err);
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
