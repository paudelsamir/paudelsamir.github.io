const fs = require('fs');

let oldContent = fs.readFileSync('old_blog.html', 'utf8');
let newContent = fs.readFileSync('_layouts/blog.html', 'utf8');

// 1. Extract original styles from old_blog.html
const oldStyleMatch = oldContent.match(/<style>([\s\S]*?)<\/style>/);
const originalStyles = oldStyleMatch[1];

// 2. Extract MY injected styles from newContent (the dropdowns, blog-top-bar, blog-action-btn, etc)
// Everything from /* Top nav bar containing back link and actions */ down to </style>
const myStylesMatch = newContent.match(/\/\* Top nav bar containing back link and actions \*\/[\s\S]*?(?=<\/style>)/);
const myStyles = myStylesMatch[1]; // these are just the dropdown/top bar styles

// 3. Assemble new style block
const combinedStyles = `<style>
${originalStyles}
  /* --- Added for Top Bar & Dropdowns --- */
  ${myStyles}
</style>`;

newContent = newContent.replace(/<style>[\s\S]*?<\/style>/, combinedStyles);

// 4. Extract original header HTML from old_blog.html
const oldHeaderMatch = oldContent.match(/<header class="blog-header">[\s\S]*?<\/header>/);
const originalHeader = oldHeaderMatch[0];

// 5. Replace my modified header HTML with the original one
newContent = newContent.replace(/<header class="blog-header">[\s\S]*?<\/header>/, originalHeader);

// 6. Address dropdown item requests:
// Change "View as Markdown" to "Copy as Markdown"
newContent = newContent.replace(/View as Markdown/g, 'Copy as Markdown');
// Ensure headings are entirely gone:
// Looking at the dropdowns, maybe the dividers need to be removed too.
newContent = newContent.replace(/<div class="dropdown-header">[\s\S]*?<\/div>[\s\n]*<div class="dropdown-divider"><\/div>/g, '');
// Wait, I did that in a script earlier! Let's just make sure there's no leftover dropdown-header or dropdown-divider.
newContent = newContent.replace(/<div class="dropdown-header">[\s\S]*?<\/div>/g, '');
newContent = newContent.replace(/<div class="dropdown-divider"><\/div>/g, '');

fs.writeFileSync('_layouts/blog.html', newContent);
console.log("Fixed!");
