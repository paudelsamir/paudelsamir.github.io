#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, extname } from 'path';

const SITE_DIR = join(process.cwd(), '_site');
const OUTPUT = join(SITE_DIR, 'rag-data.json');

const SKIP_PREFIXES = ['assets/', 'comingsoon/', 'old/', 'public/', 'feed/', 'resume/', 'worker/', 'scripts/'];
const SKIP_FILES = ['404.html', 'robots.txt', 'rag-data.json'];

// Index every page. (This used to drop all /blogs/, /quests/ and /journal/
// entries, which left the chat with almost nothing to answer from.)
const EXCLUDE_PATTERN = null;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

function stripHTML(html, url) {
  let content = html;

  const main = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (main) content = main[1];
  else {
    const article = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (article) content = article[1];
    else {
      const body = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (body) content = body[1];
    }
  }

  content = content
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ');

  content = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return content;
}

function getTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s*\|\s*Samir Paudel$/, '').trim() : '';
}

function chunk(text, url, title) {
  const sentences = text.match(/[^.!?\n]+[.!?]*\s*/g) || [text];
  const chunks = [];
  let buf = [];
  let len = 0;

  for (const s of sentences) {
    const wc = s.split(/\s+/).length;
    if (len + wc > 250 && buf.length > 0) {
      chunks.push(buf.join('').trim());
      buf = [s];
      len = wc;
    } else {
      buf.push(s);
      len += wc;
    }
  }
  if (buf.length > 0) chunks.push(buf.join('').trim());

  return chunks
    .filter(t => t.length > 40)
    .map((t, i) => ({
      id: `${url}#c${i}`,
      url,
      title,
      text: t.slice(0, 3000),
    }));
}

// ── Main ──
if (!existsSync(SITE_DIR)) {
  console.error('Run "jekyll build" first — _site/ not found.');
  process.exit(1);
}

const allChunks = [];
let pageCount = 0;

for (const file of walk(SITE_DIR)) {
  const rel = relative(SITE_DIR, file);
  if (SKIP_PREFIXES.some(p => rel.startsWith(p))) continue;
  if (SKIP_FILES.includes(rel)) continue;

  const html = readFileSync(file, 'utf-8');
  const url = '/' + rel.replace(/\/index\.html$/, '').replace(/\.html$/, '');
  if (EXCLUDE_PATTERN && EXCLUDE_PATTERN.test(url)) continue;
  const title = getTitle(html);
  const text = stripHTML(html, url);

  if (text.length < 40) continue;

  const c = chunk(text, url, title);
  allChunks.push(...c);
  pageCount++;
}

writeFileSync(OUTPUT, JSON.stringify(allChunks));
console.log(`✓ ${allChunks.length} chunks from ${pageCount} pages → ${OUTPUT}`);
