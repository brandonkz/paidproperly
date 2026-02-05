#!/usr/bin/env node

/**
 * PaidProperly - Generate Redirect Pages
 * 
 * This script reads data/platforms.json and generates /go/<slug>.html
 * redirect pages for each platform.
 * 
 * Usage: node scripts/generate-go-pages.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const rootDir = path.join(__dirname, '..');
const dataPath = path.join(rootDir, 'data', 'platforms.json');
const goDir = path.join(rootDir, 'go');

// Ensure go directory exists
if (!fs.existsSync(goDir)) {
  fs.mkdirSync(goDir, { recursive: true });
  console.log('Created /go directory');
}

// Load platforms
let platforms;
try {
  const data = fs.readFileSync(dataPath, 'utf8');
  platforms = JSON.parse(data);
  console.log(`Loaded ${platforms.length} platforms from data/platforms.json`);
} catch (error) {
  console.error('Error loading platforms.json:', error.message);
  process.exit(1);
}

// Generate redirect page HTML
function generateRedirectPage(platform) {
  const { name, slug, ref_url, url } = platform;
  const targetUrl = ref_url || url;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0; url=${escapeHtml(targetUrl)}">
  <meta name="robots" content="noindex, nofollow">
  <title>Redirecting to ${escapeHtml(name)} - PaidProperly</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #faf9f7;
      color: #1a1916;
      padding: 20px;
      text-align: center;
    }
    .container { max-width: 400px; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    p { color: #5c5a55; margin-bottom: 1.5rem; line-height: 1.6; }
    a {
      display: inline-block;
      padding: 12px 24px;
      background: #2d6a4f;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: background 0.2s;
    }
    a:hover { background: #1b4332; }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e8e5e1;
      border-top-color: #2d6a4f;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Redirecting to ${escapeHtml(name)}</h1>
    <p>You're being redirected. If nothing happens, click the link below.</p>
    <a href="${escapeHtml(targetUrl)}">Continue to ${escapeHtml(name)} →</a>
  </div>
  <script>
    window.location.href = ${JSON.stringify(targetUrl)};
  </script>
</body>
</html>`;
}

// HTML escape utility
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Generate pages
let created = 0;
let errors = 0;

for (const platform of platforms) {
  const { slug, name, ref_url, url } = platform;
  
  if (!slug) {
    console.warn(`Skipping platform without slug: ${name || 'unknown'}`);
    errors++;
    continue;
  }
  
  const targetUrl = ref_url || url;
  if (!targetUrl) {
    console.warn(`Skipping ${slug}: no ref_url or url defined`);
    errors++;
    continue;
  }
  
  const filePath = path.join(goDir, `${slug}.html`);
  const html = generateRedirectPage(platform);
  
  try {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✓ Created: /go/${slug}.html → ${targetUrl.substring(0, 50)}${targetUrl.length > 50 ? '...' : ''}`);
    created++;
  } catch (error) {
    console.error(`✗ Error creating ${slug}.html:`, error.message);
    errors++;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Generated ${created} redirect page(s)`);
if (errors > 0) {
  console.log(`Encountered ${errors} error(s)`);
}
console.log('='.repeat(50));

// Check for placeholder URLs
const placeholders = platforms.filter(p => 
  (p.ref_url && p.ref_url.includes('PASTE_')) || 
  (p.url && p.url.includes('PASTE_'))
);

if (placeholders.length > 0) {
  console.log('\n⚠️  Warning: The following platforms have placeholder URLs:');
  placeholders.forEach(p => {
    console.log(`   - ${p.name} (${p.slug}): ${p.ref_url || p.url}`);
  });
  console.log('\nRemember to update these with actual referral links!');
}
