const fs = require('fs');

let content = fs.readFileSync('_layouts/blog.html', 'utf8');

// I will extract the original header from git
const { execSync } = require('child_process');
const oldContent = execSync('git show HEAD:_layouts/blog.html').toString();

// Extract old style
const oldStyleMatch = oldContent.match(/<style>([\s\S]*?)<\/style>/);
const oldStyle = oldStyleMatch ? oldStyleMatch[1] : '';

// I need to replace my modified style with the old style, except maybe keeping my .blog-top-bar stuff?
const currentStyleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
// The user wants their original blog-header css back. I will replace the full <style> block, but append the top-bar css I added.
