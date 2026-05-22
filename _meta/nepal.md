---
layout: default
title: Nepal Districts
category: meta
order: 3
description: Tracking my travels across Nepal's 77 districts. Still got a long way to go!
hide_toc: true
---

# Nepal Districts

tracking my travels across Nepal's 77 districts. still got a long way to go!

{::nomarkdown}
<style>
.map-dashboard {
    margin-top: 32px;
    display: flex;
    flex-direction: column;
}

.map-wrapper-minimal {
    position: relative;
    width: 100%;
    height: 480px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
}

.map-wrapper-minimal svg {
    display: block;
    width: 100%;
    height: 100%;
}

.nepal-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 0.95rem;
}

.map-info-minimal {
    display: flex;
    flex-direction: column;
    gap: 32px;
    margin-top: 32px;
}
@media (min-width: 650px) {
    .map-info-minimal {
        flex-direction: row;
        gap: 48px;
    }
}

.info-block {
    flex: 1;
}

.info-label {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 8px;
    font-weight: 600;
}

.stat-figure {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.2;
    margin-bottom: 4px;
}
.stat-figure .divider {
    font-size: 1.2rem;
    color: var(--text-muted);
    font-weight: 400;
}

.stat-subtext {
    font-size: 0.9rem;
    color: var(--text-muted);
}

.details-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--text-main);
}

.tooltip-visited-status {
    color: var(--accent);
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 8px !important;
}
body.dark .tooltip-visited-status {
    color: var(--success-text);
}
.tooltip-not-visited-status {
    color: var(--text-muted);
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 8px !important;
}

.tooltip-notes {
    color: var(--text-main);
    font-style: italic;
    font-size: 0.95rem !important;
    line-height: 1.5;
    margin: 0 !important;
}

/* SVG MAP STYLES */
.map-wrapper-minimal .district {
    fill: var(--border-hover);
    stroke: var(--bg-surface);
    stroke-width: 0.5;
    transition: fill 0.2s ease, opacity 0.2s ease;
    cursor: pointer;
}
.map-wrapper-minimal .district:hover {
    fill: #a3b1a8; 
}
body.dark .map-wrapper-minimal .district:hover {
    fill: #4c5a69;
}
body.dark .map-wrapper-minimal .district {
    stroke: var(--bg-surface);
}

.map-wrapper-minimal .district.visited {
    fill: var(--accent);
    opacity: 0.85;
}
.map-wrapper-minimal .district.visited:hover {
    opacity: 1;
}
body.dark .map-wrapper-minimal .district.visited {
    fill: var(--success-text);
}

.map-wrapper-minimal .district.active {
    stroke-width: 1.5;
    stroke: var(--text-main);
}
</style>

<div class="map-dashboard">
  <div class="map-wrapper-minimal" id="nepal-map-wrapper">
    <div class="nepal-loading">Loading map...</div>
  </div>

  <div class="map-info-minimal">
    <div class="info-block">
      <div class="info-label">Progress</div>
      <div class="stat-figure"><span id="visited-count">0</span><span class="divider"> / 77</span></div>
      <div class="stat-subtext"><span id="visited-pct">0</span>% of districts explored</div>
    </div>
    
    <div class="info-block" id="nepal-tooltip">
      <div class="info-label">District Profile</div>
      <div class="details-title" id="tooltip-name">Select a district</div>
      <div id="tooltip-status" class="tooltip-not-visited-status">Hover or tap on the map</div>
      <div id="tooltip-notes" class="tooltip-notes"></div>
    </div>
  </div>
</div>
{:/}

<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3"></script>
<script src="/assets/js/nepal-map.js"></script>
