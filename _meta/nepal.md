---
layout: default
title: Nepal
category: meta
order: 3
description: A map of the districts Samir has visited across Nepal.
hide_toc: true
---

{::nomarkdown}
<style>
/* Typographic, borderless take. Only your theme variables are used. */
.nepal-page {
    width: 100%;
    max-width: 1080px;
    margin: 0 auto;
    padding: 1.5rem 0 4rem;
}

.nepal-page .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
}

.nepal-main {
    display: grid;
    grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
    gap: clamp(1.5rem, 5vw, 4rem);
    align-items: start;
}

/* ---------- Left column ---------- */
.nepal-side {
    position: sticky;
    top: calc(var(--header-height, 0px) + 1.5rem);
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
}

.nepal-header h1 {
    margin: 0;
    font-size: clamp(2.25rem, 5vw, 3.25rem);
    font-weight: 500;
    letter-spacing: -0.05em;
    line-height: 1;
    text-transform: none;
}

.nepal-header p {
    margin: .75rem 0 0;
    color: var(--text-muted);
    line-height: 1.5;
}

.nepal-count {
    font-family: var(--font-ui);
    color: var(--text-muted);
    font-size: .85rem;
    line-height: 1.4;
}

.nepal-count strong {
    display: block;
    color: var(--text-main);
    font-size: clamp(3rem, 7vw, 4.5rem);
    font-weight: 500;
    letter-spacing: -0.07em;
    line-height: 1;
}

.nepal-count em {
    font-style: normal;
}

/* Selected district */
.nepal-details {
    min-height: 9rem;
}

.nepal-label {
    margin: 0 0 .5rem;
    color: var(--text-muted);
    font: .75rem var(--font-ui);
}

.nepal-details h2 {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 500;
    letter-spacing: -0.04em;
    line-height: 1.15;
}

.nepal-status {
    margin: .5rem 0 0;
    color: var(--text-main);
    font: .85rem var(--font-ui);
}

.nepal-status.not-visited {
    color: var(--text-muted);
}

.nepal-note {
    margin: .75rem 0 0;
    color: var(--text-muted);
    font-size: .95rem;
    line-height: 1.6;
}

/* The summary block is kept for your script, but the numbers live in .nepal-count */
.nepal-summary {
    display: none;
}

/* ---------- Map ---------- */
.nepal-map-wrapper {
    position: relative;
    width: 100%;
    height: min(76vh, 640px);
    min-height: 320px;
}

.nepal-map-wrapper svg {
    display: block;
    width: 100%;
    height: 100%;
}

.nepal-loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--text-muted);
    font: .85rem var(--font-ui);
}

/* Line map: unvisited districts are outlines, visited ones are filled in */
.nepal-map-wrapper .district {
    fill: transparent;
    stroke: var(--border-hover);
    stroke-width: .7;
    stroke-linejoin: round;
    cursor: pointer;
    outline: none;
    transition: fill .15s ease, stroke .15s ease;
}

.nepal-map-wrapper .district:hover {
    fill: var(--border);
}

.nepal-map-wrapper .district.visited {
    fill: var(--text-main);
    stroke: var(--bg-surface);
}

.nepal-map-wrapper .district.active,
.nepal-map-wrapper .district.visited:hover {
    fill: var(--accent);
    stroke: var(--bg-surface);
}

.nepal-map-wrapper .district:focus-visible {
    stroke: var(--accent);
    stroke-width: 2.5;
}

/* ---------- District index: flows like a paragraph ---------- */
.nepal-index {
    margin-top: clamp(2.5rem, 6vw, 4.5rem);
    padding-top: 1.25rem;
    border-top: 1px solid var(--border);
}

.nepal-index-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: .75rem 2rem;
    margin-bottom: 1.25rem;
}

.nepal-index-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
}

.nepal-tools {
    display: flex;
    align-items: baseline;
    gap: 1.25rem;
    flex-wrap: wrap;
}

.nepal-chips {
    display: inline-flex;
    gap: 1rem;
}

.nepal-chips button {
    padding: 0 0 2px;
    border: 0;
    border-bottom: 1px solid transparent;
    background: none;
    color: var(--text-muted);
    font: .8rem var(--font-ui);
    cursor: pointer;
}

.nepal-chips button:hover {
    color: var(--text-main);
}

.nepal-chips button[aria-pressed="true"] {
    color: var(--text-main);
    border-bottom-color: var(--text-main);
}

.nepal-filter {
    width: 10rem;
    padding: 0 0 3px;
    border: 0;
    border-bottom: 1px solid var(--border);
    border-radius: 0;
    background: transparent;
    color: var(--text-main);
    font: .85rem var(--font-ui);
}

.nepal-filter::placeholder {
    color: var(--text-muted);
}

.nepal-filter:focus {
    border-bottom-color: var(--text-main);
}

.nepal-chips button:focus-visible,
.nepal-filter:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
}

.nepal-district-grid {
    display: flex;
    flex-wrap: wrap;
    gap: .35rem 1.1rem;
}

.nepal-district {
    display: inline;
    color: var(--text-muted);
    font: .95rem/1.7 var(--font-ui);
    opacity: .75;
}

.nepal-district.is-visited {
    color: var(--text-main);
    opacity: 1;
    font-weight: 500;
}

.nepal-district-grid[data-show="visited"] .nepal-district:not(.is-visited),
.nepal-district-grid[data-show="todo"] .nepal-district.is-visited {
    display: none;
}

/* ---------- Small screens ---------- */
@media (max-width: 800px) {
    .nepal-main {
        grid-template-columns: 1fr;
    }

    .nepal-side {
        position: static;
        gap: 1.75rem;
    }

    .nepal-count strong {
        font-size: 3rem;
    }

    .nepal-details {
        min-height: 0;
    }

    .nepal-map-wrapper {
        height: 100vw;
        max-height: 70vh;
    }

    .nepal-filter {
        flex: 1 1 8rem;
        width: auto;
    }
}

@media (prefers-reduced-motion: reduce) {
    .nepal-map-wrapper .district {
        transition: none;
    }
}
</style>

<main class="nepal-page">
  <div class="nepal-main">
    <div class="nepal-side">
      <header class="nepal-header">
        <h1>Nepal</h1>
        <p>A simple record of the districts I have visited, and the ones still waiting.</p>
      </header>

      <div class="nepal-count">
        <strong id="visited-count">0</strong>
        of 77 districts visited, <em><span id="visited-pct-view">0</span>% explored</em>
      </div>

      <aside class="nepal-details" id="nepal-tooltip" aria-live="polite">
        <div>
          <p class="nepal-label">Selected district</p>
          <h2 id="tooltip-name">Select a district</h2>
          <p id="tooltip-status" class="nepal-status not-visited">Tap or click the map</p>
          <p id="tooltip-notes" class="nepal-note">Notes about the district will appear here.</p>
        </div>
        <div class="nepal-summary">
          <div><strong><span id="visited-pct">0</span>%</strong><span>explored</span></div>
          <div><strong>77</strong><span>total districts</span></div>
        </div>
      </aside>
    </div>

    <section class="nepal-map" aria-label="Nepal district map">
      <div class="nepal-map-wrapper" id="nepal-map-wrapper">
        <div class="nepal-loading">Loading map…</div>
      </div>
    </section>
  </div>

  <section class="nepal-index" aria-labelledby="district-index-title">
    <div class="nepal-index-header">
      <h2 id="district-index-title">All districts</h2>
      <div class="nepal-tools">
        <div class="nepal-chips" id="district-chips" role="group" aria-label="Show districts">
          <button type="button" data-show="all" aria-pressed="true">All</button>
          <button type="button" data-show="visited" aria-pressed="false">Visited</button>
          <button type="button" data-show="todo" aria-pressed="false">Not yet</button>
        </div>
        <label class="sr-only" for="district-filter">Search districts</label>
        <input class="nepal-filter" id="district-filter" type="search" placeholder="Search" autocomplete="off">
      </div>
    </div>
    <div class="nepal-district-grid" id="district-index" data-show="all"></div>
  </section>
</main>

{:/}

<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3"></script>
<script src="/assets/js/nepal-map.js"></script>