const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const site = "https://paidproperly.co.za";
const today = "2026-07-03";
const platforms = JSON.parse(fs.readFileSync(path.join(root, "data/platforms.json"), "utf8"))
  .sort((a, b) => a.recommended_rank - b.recommended_rank);

const blogPosts = [
  "avoiding-remote-work-scams.html",
  "best-freelance-platforms-south-africa-2026.html",
  "best-freelance-platforms-south-africans-2026-updated.html",
  "best-rental-platforms-south-africa-2026.html",
  "freelance-contracts-south-african-remote-workers.html",
  "freelance-rate-guide-south-africa-2026.html",
  "how-to-get-paid-south-african-freelancer.html",
  "how-to-price-freelance-services-south-africa-2026.html",
  "paypal-alternatives-south-africa-2026.html",
  "remote-job-offer-checklist-south-africa.html",
  "remote-jobs-south-africa-payment-tax-checklist.html",
  "remote-work-getting-started-south-africa.html",
  "remote-work-international-companies-technical.html",
  "sa-companies-hiring-remote-workers-2026.html",
  "sa-freelancer-ai-50-applications-day.html",
  "tax-guide-south-african-remote-workers.html",
  "twitter-side-hustle-sa-before-after-photos.html",
  "two-pot-withdrawal-step-by-step-2026.html",
  "usd-remote-work-payment-stack-south-africa.html",
  "why-companies-hire-south-african-remote-workers.html",
];

const canonicalMap = {
  "how-to-price-freelance-services-south-africa-2026.html": "freelance-rate-guide-south-africa-2026.html",
  "remote-jobs-south-africa-payment-tax-checklist.html": "remote-job-offer-checklist-south-africa.html",
};

function abs(rel) {
  return path.join(root, rel);
}

function read(rel) {
  return fs.readFileSync(abs(rel), "utf8");
}

function write(rel, content) {
  fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
  fs.writeFileSync(abs(rel), content);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "backups") continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(file));
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(file);
  }
  return out;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripTags(value) {
  return String(value || "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function titleOf(html) {
  return stripTags((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "");
}

function h1Of(html) {
  return stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || titleOf(html).replace(/\s+\|\s*PaidProperly$/i, ""));
}

function descOf(html) {
  const tag = html.match(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i);
  return tag ? (tag[0].match(/\bcontent=["']([^"']*)["']/i) || [])[1] || "" : "";
}

function dateOf(html) {
  const iso = html.match(/"datePublished"\s*:\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})"/i);
  if (iso) return iso[1];
  const pub = html.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+([0-9]{1,2}),\s+(2026)\b/i);
  if (!pub) return "2026-02-10";
  const months = { january: "01", february: "02", march: "03", april: "04", may: "05", june: "06", july: "07", august: "08", september: "09", october: "10", november: "11", december: "12" };
  return `${pub[3]}-${months[pub[1].toLowerCase()]}-${String(pub[2]).padStart(2, "0")}`;
}

function footer(depth = "") {
  return `<footer class="site-footer pp-trust-footer">
    <div class="container">
      <p class="footer-text">PaidProperly helps South Africans compare legitimate remote work platforms and payment routes.</p>
      <nav class="pp-footer-links" aria-label="Trust links">
        <a href="${depth}/about.html">About</a>
        <a href="${depth}/privacy.html">Privacy</a>
        <a href="${depth}/disclosure.html">Disclosure</a>
        <a href="${depth}/disclaimer.html">Disclaimer</a>
      </nav>
    </div>
  </footer>`;
}

function nav(depth = "", active = "") {
  const p = (href) => `${depth}${href}`;
  return `<header class="site-header">
    <div class="header-inner">
      <a href="${p("/")}" class="brand">
        <span class="brand-icon">✓</span>
        <span class="brand-name">PaidProperly</span>
      </a>
      <nav class="header-nav">
        <a href="${p("/platforms/")}" class="nav-link${active === "platforms" ? " active" : ""}">Platforms</a>
        <a href="${p("/blog/")}" class="nav-link${active === "blog" ? " active" : ""}">Blog</a>
        <a href="${p("/net-salary-calculator.html")}" class="nav-link">Net Salary</a>
        <a href="${p("/rate-calculator.html")}" class="nav-link">Rate Calculator</a>
        <a href="${p("/ai-tools.html")}" class="nav-link">AI Tools</a>
        <a href="${p("/hire.html")}" class="nav-link">For Employers</a>
      </nav>
      <div class="header-location">South Africa</div>
    </div>
  </header>`;
}

function trustPage(file, title, description, body) {
  write(file, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${site}/${file}">
  <meta property="og:title" content="${escapeHtml(title)} | PaidProperly">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${site}/${file}">
  <meta property="og:image" content="${site}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${site}/og-image.png">
  <title>${escapeHtml(title)} | PaidProperly</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
${nav("", "")}
<main class="container pp-static-page">
  <article class="pp-page-card">
    <h1>${escapeHtml(title)}</h1>
${body}
  </article>
</main>
${footer("")}
</body>
</html>
`);
}

function paymentMethods(p) {
  const text = `${p.payout_notes} ${p.description} ${p.tags.join(" ")}`.toLowerCase();
  const methods = [];
  if (text.includes("paypal")) methods.push("PayPal");
  if (text.includes("payoneer")) methods.push("Payoneer");
  if (text.includes("wise")) methods.push("Wise");
  if (text.includes("bank") || text.includes("eft") || text.includes("direct deposit") || text.includes("transfer")) methods.push("Bank transfer");
  if (text.includes("crypto")) methods.push("Crypto");
  return methods.length ? methods : ["Platform payout settings vary"];
}

function withdrawalTime(p) {
  const note = p.payout_notes || "";
  const match = note.match(/([^.]*(?:day|days|weekly|bi-weekly|monthly|month)[^.]*)/i);
  return match ? match[1].trim() : "Varies by platform and payment method";
}

function platformPage(p, related) {
  const methods = paymentMethods(p);
  const withdraw = withdrawalTime(p);
  const rate = p.payout_notes || "Rates vary by role, client and experience level.";
  const title = `${p.name} for South Africans: Payments, Rates & Payout Times (2026)`;
  const faq = [
    [`Does ${p.name} accept South Africans?`, `${p.sa_friendly ? "Yes" : "Check before applying"}. ${p.name} is listed on PaidProperly because it is relevant to South Africans looking for remote work or online income.`],
    [`How does ${p.name} pay South Africans?`, `${p.name} payout routes include ${methods.join(", ")} where available. Always confirm your payout method before doing paid work.`],
    [`How hard is it to get accepted on ${p.name}?`, `${p.name} is marked as ${p.difficulty} difficulty on PaidProperly.`],
  ];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(`${p.name} for South Africans: payments, rates, payout methods, withdrawal timing, difficulty and how to apply in 2026.`)}">
  <link rel="canonical" href="${site}/platforms/${p.slug}.html">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(p.description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${site}/platforms/${p.slug}.html">
  <meta property="og:image" content="${site}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${site}/og-image.png">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
}, null, 2)}
  </script>
</head>
<body>
${nav("", "platforms")}
<main class="platform-detail">
  <div class="container container--narrow">
    <a href="/platforms/" class="back-link">Back to all platforms</a>
    <article class="pp-platform-page">
      <div class="detail-header">
        <span class="detail-category">${escapeHtml(p.category)}</span>
        <h1>${escapeHtml(title)}</h1>
      </div>
      <div class="detail-meta">
        <div class="meta-item"><span class="meta-label">Difficulty</span><span class="meta-value">${escapeHtml(p.difficulty)}</span></div>
        <div class="meta-item"><span class="meta-label">SA friendly</span><span class="meta-value">${p.sa_friendly ? "Yes" : "Check first"}</span></div>
        <div class="meta-item"><span class="meta-label">Best for</span><span class="meta-value">${escapeHtml(p.best_for.join(", "))}</span></div>
      </div>
      <section class="detail-section">
        <h2>What ${escapeHtml(p.name)} is</h2>
        <p>${escapeHtml(p.description)}</p>
      </section>
      <section class="detail-section">
        <h2>Does ${escapeHtml(p.name)} pay South Africans?</h2>
        <p>${p.sa_friendly ? `${escapeHtml(p.name)} is listed as South Africa-friendly in the PaidProperly directory.` : `Check ${escapeHtml(p.name)}'s current country rules before applying.`} Confirm payout settings before accepting work, especially if the platform changes payment providers.</p>
      </section>
      <section class="detail-section">
        <h2>Payment methods and withdrawal times</h2>
        <ul>
          <li><strong>Payment methods:</strong> ${escapeHtml(methods.join(", "))}</li>
          <li><strong>Withdrawal timing:</strong> ${escapeHtml(withdraw)}</li>
        </ul>
      </section>
      <section class="detail-section">
        <h2>Typical rates</h2>
        <p>${escapeHtml(rate)}</p>
      </section>
      <section class="detail-section">
        <h2>How to apply from South Africa</h2>
        <ol>
          <li>Open the official ${escapeHtml(p.name)} application page.</li>
          <li>Confirm South Africa is accepted and choose a payout method you can withdraw locally.</li>
          <li>Prepare proof of skills, portfolio samples, or ID documents if required.</li>
          <li>Complete any profile, test, interview, or verification steps.</li>
        </ol>
        <p><a class="btn btn-primary" href="/go/${p.slug}.html" rel="sponsored noopener" target="_blank">Apply on ${escapeHtml(p.name)}</a></p>
      </section>
      <section class="detail-section">
        <h2>FAQ</h2>
${faq.map(([q, a]) => `        <h3>${escapeHtml(q)}</h3>\n        <p>${escapeHtml(a)}</p>`).join("\n")}
      </section>
      <section class="detail-section">
        <h2>Related platforms</h2>
        <ul>
${related.map((item) => `          <li><a href="/platforms/${item.slug}.html">${escapeHtml(item.name)} for South Africans</a></li>`).join("\n")}
        </ul>
      </section>
    </article>
  </div>
</main>
${footer("")}
</body>
</html>
`;
}

function platformCard(p) {
  return `<article class="platform-card" data-platform-static="${escapeHtml(p.slug)}">
        <div class="platform-logo">${escapeHtml(p.name.charAt(0).toUpperCase())}</div>
        <div class="platform-info">
          <div class="platform-header">
            <div class="platform-name"><a href="/platforms/${p.slug}.html">${escapeHtml(p.name)}</a></div>
            ${p.sa_friendly ? '<span class="platform-badge badge-sa">🇿🇦 SA Friendly</span>' : ''}
            <span class="platform-badge difficulty-${p.difficulty.toLowerCase()}">${escapeHtml(p.difficulty)}</span>
          </div>
          <div class="platform-meta">
            <span class="platform-meta-item">${escapeHtml(p.category)}</span>
            <span class="platform-meta-item">•</span>
            <span class="platform-meta-item">${escapeHtml(paymentMethods(p).join(", "))}</span>
          </div>
          <p class="platform-description">${escapeHtml(p.description)}</p>
          <div class="platform-tags">${p.tags.slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        </div>
        <div class="platform-actions">
          <div class="platform-salary">${escapeHtml((p.payout_notes || "").split(".")[0])}</div>
          <a href="/platforms/${p.slug}.html" class="btn btn-primary">Details</a>
        </div>
      </article>`;
}

function buildPlatforms() {
  for (const p of platforms) {
    const related = platforms.filter((item) => item.slug !== p.slug && item.category === p.category).slice(0, 3);
    write(`platforms/${p.slug}.html`, platformPage(p, related.length ? related : platforms.filter((item) => item.slug !== p.slug).slice(0, 3)));
  }
  const grouped = groupBy(platforms, (p) => p.category);
  write("platforms/index.html", `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Browse all 88 PaidProperly platform guides for South Africans, grouped by category.">
  <link rel="canonical" href="${site}/platforms/">
  <meta property="og:title" content="Remote Work Platforms for South Africans | PaidProperly">
  <meta property="og:description" content="Browse all 88 platform guides with payment methods, rates, payout times and SA-friendly notes.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${site}/platforms/">
  <meta property="og:image" content="${site}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${site}/og-image.png">
  <title>Remote Work Platforms for South Africans | PaidProperly</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
${nav("", "platforms")}
<main class="container pp-static-page">
  <h1>Remote Work Platforms for South Africans</h1>
  <p class="pp-page-intro">All 88 PaidProperly platform guides, grouped by category. Each page covers SA payment routes, payout timing, rates, difficulty and how to apply.</p>
${Object.entries(grouped).map(([category, items]) => `  <section class="pp-platform-group">
    <h2>${escapeHtml(category)}</h2>
    <div class="platforms-list">
${items.map(platformCard).join("\n")}
    </div>
  </section>`).join("\n")}
</main>
${footer("")}
</body>
</html>
`);
}

function groupBy(items, fn) {
  return items.reduce((acc, item) => {
    const key = fn(item);
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {});
}

function ensureCss() {
  let css = read("style.css");
  if (css.includes(".pp-trust-footer")) return;
  css += `

/* SEO trust and static directory additions */
.pp-trust-footer .container { display: flex; flex-direction: column; gap: 0.75rem; align-items: center; }
.pp-footer-links { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; }
.pp-static-page { padding: 3rem 1.5rem; }
.pp-page-card,
.pp-platform-page {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.pp-page-card h1,
.pp-static-page > h1 { color: var(--color-text); margin-bottom: 1rem; }
.pp-page-card h2,
.pp-platform-group h2 { margin: 1.75rem 0 0.75rem; color: var(--color-text); }
.pp-page-card p,
.pp-page-card li,
.pp-page-intro { color: var(--color-text-light); line-height: 1.7; }
.pp-platform-group { margin-top: 2rem; }
.platform-name a { color: inherit; text-decoration: none; }
.platform-name a:hover { color: var(--color-primary); }
.pp-author-bio,
.pp-related-guides {
  margin: 2rem 0;
  padding: 1.25rem;
  border: 1px solid #d1fae5;
  background: #f0fdf4;
  border-radius: 10px;
}
.pp-author-bio p,
.pp-related-guides p { margin: 0; color: #374151; line-height: 1.65; }
.pp-related-guides ul { margin: 0.75rem 0 0; }
.last-updated { color: #6b7280; font-size: 0.95rem; margin: 0.75rem 0 0; }
`;
  write("style.css", css);
}

function fixCorruptText(html) {
  const replacements = [
    [/\bubut\b/g, "but"],
    [/\buusually\b/g, "usually"],
    [/\buup\b/g, "up"],
  ];
  for (const [from, to] of replacements) html = html.replace(from, to);
  return html;
}

function normalizeSocial(html, rel, title, desc, type = "article") {
  const url = rel === "index.html" ? `${site}/` : `${site}/${rel.replace(/index\.html$/, "")}`;
  const tags = [
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(desc)}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${site}/og-image.png">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:image" content="${site}/og-image.png">`,
  ];
  html = html.replace(/<meta\b(?=[^>]*(?:property|name)=["'](?:og:title|og:description|og:type|og:url|og:image|twitter:card|twitter:image)["'])[^>]*>\s*/gi, "");
  return html.replace(/<\/head>/i, `${tags.join("\n  ")}\n</head>`);
}

function ensureCanonical(html, rel, target) {
  const href = target ? `${site}/blog/${target}` : (rel === "index.html" ? `${site}/` : `${site}/${rel.replace(/index\.html$/, "")}`);
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) return html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${href}">`);
  return html.replace(/<\/head>/i, `<link rel="canonical" href="${href}">\n</head>`);
}

function removeLd(html, types) {
  return html.replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, (block) => types.some((type) => block.includes(`"@type": "${type}"`) || block.includes(`"@type":"${type}"`)) ? "" : block);
}

function faqSchema(html) {
  const questions = [...html.matchAll(/<h[23][^>]*>([^<]*\?[^<]*)<\/h[23]>([\s\S]*?)(?=<h[23][^>]*>|<\/(?:section|article|main|div)>)/gi)]
    .map((m) => ({ q: stripTags(m[1]), a: stripTags((m[2].match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || "") }))
    .filter((item) => item.q && item.a)
    .slice(0, 8);
  if (!questions.length) return "";
  return `<script type="application/ld+json">\n${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  }, null, 2)}\n</script>`;
}

function articleLd(post, html, h1, desc, date, noindex) {
  const url = `${site}/blog/${post}`;
  return `<script type="application/ld+json">\n${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: h1,
    description: desc,
    datePublished: date,
    dateModified: today,
    author: { "@type": "Person", name: "Brandon Katz", url: `${site}/about.html` },
    publisher: { "@type": "Organization", name: "PaidProperly", url: site, logo: { "@type": "ImageObject", url: `${site}/og-image.png` } },
    mainEntityOfPage: url,
    image: `${site}/og-image.png`,
  }, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${site}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${site}/blog/` },
      { "@type": "ListItem", position: 3, name: h1, item: url },
    ],
  }, null, 2)}\n</script>`;
}

function authorBio() {
  return `<section class="pp-author-bio" aria-label="Author bio">
  <p><strong>By Brandon Katz.</strong> PaidProperly helps South Africans compare remote work platforms, payment routes, tax basics and practical earning tools. Learn more on the <a href="/about.html">About page</a>.</p>
</section>`;
}

function relatedGuides(post) {
  const options = blogPosts.filter((item) => item !== post && !canonicalMap[item] && item !== "best-rental-platforms-south-africa-2026.html").slice(0, 3);
  return `<section class="pp-related-guides" aria-label="Related guides">
  <h2>Related guides</h2>
  <ul>
${options.map((item) => `    <li><a href="/blog/${item}">${escapeHtml(item.replace(/-/g, " ").replace(".html", ""))}</a></li>`).join("\n")}
  </ul>
</section>`;
}

function insertBeforeArticleEnd(html, block) {
  if (html.includes("pp-related-guides")) return html;
  if (/<\/article>/i.test(html)) return html.replace(/<\/article>/i, `${block}\n</article>`);
  return html.replace(/<\/main>/i, `${block}\n</main>`);
}

function addLastUpdated(html) {
  if (html.includes("Last updated")) return html;
  const marker = `<p class="last-updated">Last updated: ${today}</p>`;
  if (/<\/header>/i.test(html)) return html.replace(/<\/header>/i, `${marker}\n</header>`);
  const h1 = html.match(/<\/h1>/i);
  return h1 ? html.slice(0, h1.index + 5) + `\n${marker}` + html.slice(h1.index + 5) : html;
}

function normalizeHeadings(html) {
  let previous = 0;
  const stack = [];
  return html.replace(/<(\/?)h([1-6])\b([^>]*)>/gi, (m, close, level, attrs) => {
    level = Number(level);
    if (close) {
      const mapped = stack.pop() || level;
      return `</h${mapped}>`;
    }
    if (previous && level > previous + 1) level = previous + 1;
    previous = level;
    stack.push(level);
    return `<${close || ""}h${level}${attrs}>`;
  });
}

function processBlog() {
  for (const post of blogPosts) {
    let html = read(`blog/${post}`);
    html = fixCorruptText(html);
    html = html
      .replace(/href=["']\.\.\/index\.html["']/g, 'href="/"')
      .replace(/href=["']index\.html["']/g, 'href="/blog/"')
      .replace(/href=["']blog\/index\.html["']/g, 'href="/blog/"');

    if (post === "tax-guide-south-african-remote-workers.html") {
      html = html
        .replace(/For 2025\/2026:/g, "For the 2026/2027 tax year:")
        .replace(/If your freelance\/remote income is going to exceed R1 million in a tax year, you need to register for provisional tax with SARS\./g, "If you earn freelance or business income outside PAYE, you should treat provisional tax as likely and check your position with SARS or a registered tax practitioner.")
        .replace(/Below R1 million\? You just declare on your annual tax return \(ITR12\)\. No provisional payments needed\./g, "Do not use a R1 million shortcut here. Freelancers usually need to estimate and pay tax during the year, then reconcile everything on the annual ITR12.")
        .replace(/Earning over R1 million \(provisional tax\)/g, "Earning freelance or business income that needs provisional tax planning")
        .replace(/Register for provisional tax<\/strong> if you'll earn over R1 million/g, "Check provisional tax</strong> if you earn freelance or business income outside PAYE")
        .replace(/steep\. up to 200%/g, "steep, up to 200%");
    }
    if (post === "two-pot-withdrawal-step-by-step-2026.html") {
      html = html
        .replace(/Tax:<\/strong> Deducted at source \(20% withholding, final amount depends on your marginal rate\)/g, "Tax:</strong> Deducted at source using a SARS tax directive; the final rate depends on your marginal tax rate")
        .replace(/Issues a directive \(usually 20% withholding upfront\)/g, "Issues a directive based on your tax profile and marginal rate");
    }

    const h1 = h1Of(html);
    const desc = descOf(html) || h1;
    const date = dateOf(html);
    const noindex = post === "best-rental-platforms-south-africa-2026.html" || Boolean(canonicalMap[post]);
    html = ensureCanonical(html, `blog/${post}`, canonicalMap[post]);
    html = normalizeSocial(html, `blog/${post}`, `${h1} | PaidProperly`, desc);
    html = removeLd(html, ["Article", "BreadcrumbList", "FAQPage"]);
    html = html.replace(/<\/head>/i, `${articleLd(post, html, h1, desc, date, noindex)}\n${faqSchema(html)}\n</head>`);
    if (noindex) {
      if (/<meta\s+name=["']robots["'][^>]*>/i.test(html)) html = html.replace(/<meta\s+name=["']robots["'][^>]*>/i, '<meta name="robots" content="noindex, follow">');
      else html = html.replace(/<\/head>/i, '<meta name="robots" content="noindex, follow">\n</head>');
      if (canonicalMap[post] && !html.includes("http-equiv=\"refresh\"")) html = html.replace(/<\/head>/i, `<meta http-equiv="refresh" content="0; url=/blog/${canonicalMap[post]}">\n</head>`);
    }
    html = addLastUpdated(html);
    if (!html.includes("pp-author-bio")) {
      if (/<\/header>/i.test(html)) html = html.replace(/<\/header>/i, `</header>\n${authorBio()}`);
      else if (/<p class="last-updated">[\s\S]*?<\/p>/i.test(html)) html = html.replace(/<p class="last-updated">[\s\S]*?<\/p>/i, (m) => `${m}\n${authorBio()}`);
      else html = html.replace(/<\/h1>/i, `</h1>\n${authorBio()}`);
    }
    html = insertBeforeArticleEnd(html, relatedGuides(post));
    if (/(tax|rate)/i.test(post)) {
      html = html.replace(/<\/article>/i, `<p><a href="/net-salary-calculator.html">Net Salary Calculator</a> and <a href="/rate-calculator.html">Rate Calculator</a> can help sanity-check the numbers.</p>\n</article>`);
    }
    if (/(payment|paypal|paid)/i.test(post) && !html.includes("/platforms/usertesting.html")) {
      html = html.replace(/<\/article>/i, `<p>Compare payout examples on <a href="/platforms/usertesting.html">UserTesting</a>, <a href="/platforms/respondent.html">Respondent</a>, and <a href="/platforms/upwork.html">Upwork</a>.</p>\n</article>`);
    }
    html = normalizeHeadings(html);
    write(`blog/${post}`, html);
  }
}

function buildBlogIndex() {
  let html = read("blog/index.html");
  html = ensureCanonical(html, "blog/index.html");
  html = normalizeSocial(html, "blog/index.html", "PaidProperly Blog | Remote Work Guides for South Africans", descOf(html) || "Remote work, freelance tax, payment and platform guides for South Africans.", "website");
  html = html.replace(/href=["']\.\.\/index\.html["']/g, 'href="/"').replace(/href=["']index\.html["']/g, 'href="/blog/"');
  write("blog/index.html", html);
}

function processHomepage() {
  let html = read("index.html");
  html = html.replace(/<a href="index\.html" class="brand">/, '<a href="/" class="brand">');
  html = html.replace(/<a href="#" class="nav-link active">/, '<a href="/platforms/" class="nav-link active">');
  html = html.replace(/<a href="#" class="nav-link">\s*<svg[\s\S]*?Saved\s*<\/a>/, "");
  html = html.replace(/<a href="#employers" class="nav-link">/, '<a href="/hire.html" class="nav-link">');
  html = html.replace(/<div class="popular-grid" id="popular-grid">\s*<!-- Populated by JS -->\s*<\/div>/, `<div class="popular-grid" id="popular-grid">\n${platforms.filter((p) => ["somewhere", "wing-assistant", "usertesting"].includes(p.slug)).map(platformCard).join("\n")}\n        </div>`);
  html = html.replace(/<div class="platforms-list" id="platforms-list">\s*<!-- Populated by JS -->\s*<\/div>/, `<div class="platforms-list" id="platforms-list">\n${platforms.map(platformCard).join("\n")}\n        </div>`);
  html = removeLd(html, ["Organization"]);
  html = html.replace(/<\/head>/i, `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "PaidProperly", url: `${site}/`, logo: `${site}/og-image.png` }, null, 2)}\n</script>\n</head>`);
  write("index.html", html);
}

function updateAppLinks() {
  let js = read("app.js");
  js = js
    .replace(/href="go\/\$\{platform\.slug\}\.html" target="_blank" rel="noopener" class="popular-card featured-platform"/g, 'href="platforms/${platform.slug}.html" class="popular-card featured-platform"')
    .replace(/<h3 class="platform-name">\$\{escapeHtml\(p\.name\)\}<\/h3>/g, '<div class="platform-name"><a href="platforms/${p.slug}.html">${escapeHtml(p.name)}</a></div>')
    .replace(/<a href="go\/\$\{p\.slug\}\.html" target="_blank" rel="noopener" class="btn btn-primary">/g, '<a href="platforms/${p.slug}.html" class="btn btn-primary">')
    .replace(/Apply\s*\n\s*<svg/g, 'Details\n              <svg');
  write("app.js", js);
}

function buildTrustPages() {
  trustPage("about.html", "About PaidProperly", "Who runs PaidProperly, how platforms are verified, and how independence works.", `
    <p>PaidProperly is run by Brandon Katz as part of a South African publishing portfolio focused on practical money, remote work and online income tools.</p>
    <h2>How platforms get verified</h2>
    <p>Platforms are checked for South Africa access, public payout information, realistic earning potential, application friction, payment methods and obvious scam signals. Listings are updated when a platform changes terms or stops being useful for South Africans.</p>
    <h2>Independence statement</h2>
    <p>Some platform links may be affiliate links. Affiliate availability does not decide whether a platform appears in the directory. The goal is to help South Africans avoid dead-end platforms and understand how they get paid.</p>`);
  trustPage("privacy.html", "Privacy Policy", "PaidProperly privacy policy for analytics, affiliate links, newsletter forms and contact data.", `
    <p>PaidProperly is a static website. We do not require visitors to create an account to use the directory or calculators.</p>
    <h2>Analytics</h2>
    <p>We may use analytics to understand which pages, tools and platform links are useful. This helps improve the site.</p>
    <h2>Newsletter and forms</h2>
    <p>If you sign up for a newsletter or submit a form, your email is used for that purpose only.</p>
    <h2>Affiliate links</h2>
    <p>Outbound platform links may include tracking so a partner can credit PaidProperly for a referral.</p>`);
  trustPage("disclosure.html", "Affiliate Disclosure", "How affiliate links work on PaidProperly.", `
    <p>PaidProperly may earn a commission when you click certain platform links or sign up through a redirect page.</p>
    <h2>What this changes</h2>
    <p>It helps pay for research and maintenance.</p>
    <h2>What this does not change</h2>
    <p>It does not change the price you pay, and it does not guarantee a platform will accept you. We still include non-affiliate platforms when they are useful for South Africans.</p>`);
  trustPage("disclaimer.html", "Disclaimer", "Tax, financial and remote-work content disclaimer for PaidProperly.", `
    <p>PaidProperly content is general information, not tax, legal or financial advice.</p>
    <h2>Tax and financial content</h2>
    <p>Tax thresholds, SARS rules and retirement rules can change. Check SARS, your retirement fund, or a registered professional before making decisions.</p>
    <h2>Platform content</h2>
    <p>Platforms can change country eligibility, payment providers, rates and application rules without notice. Confirm details before doing paid work.</p>`);
}

function processAllHtml() {
  for (const file of walk(root)) {
    const rel = path.relative(root, file).replace(/\\/g, "/");
    if (rel.startsWith("platforms/") || rel.startsWith("blog/") || rel === "index.html" || ["about.html", "privacy.html", "disclosure.html", "disclaimer.html"].includes(rel)) continue;
    let html = fs.readFileSync(file, "utf8");
    html = html
      .replace(/href=["'](?:\.\/)?index\.html["']/g, 'href="/"')
      .replace(/href=["']\/index\.html["']/g, 'href="/"')
      .replace(/href=["']blog\/index\.html["']/g, 'href="/blog/"')
      .replace(/href=["']#["']/g, 'href="/platforms/"');
    html = ensureCanonical(html, rel);
    html = normalizeSocial(html, rel, titleOf(html) || "PaidProperly", descOf(html) || "PaidProperly tools and guides for South Africans.", "website");
    if (!html.includes("pp-trust-footer") && /<\/body>/i.test(html)) html = html.replace(/<footer[\s\S]*?<\/footer>/i, footer(""));
    write(rel, html);
  }
}

function replaceLegacyPlatformShell() {
  write("platform.html", `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Browse PaidProperly platform guides for South Africans.">
  <link rel="canonical" href="${site}/platforms/">
  <meta name="robots" content="noindex, follow">
  <meta http-equiv="refresh" content="0; url=/platforms/">
  <meta property="og:title" content="Remote Work Platforms for South Africans | PaidProperly">
  <meta property="og:description" content="Browse PaidProperly platform guides for South Africans.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${site}/platforms/">
  <meta property="og:image" content="${site}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${site}/og-image.png">
  <title>Remote Work Platforms for South Africans | PaidProperly</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
${nav("", "platforms")}
<main class="container pp-static-page">
  <article class="pp-page-card">
    <h1>Remote Work Platforms for South Africans</h1>
    <p>The old JavaScript-only platform detail route has moved. Browse the static platform directory at <a href="/platforms/">/platforms/</a>.</p>
  </article>
</main>
${footer("")}
</body>
</html>
`);
}

function sitemap() {
  const urls = [];
  for (const file of walk(root)) {
    const rel = path.relative(root, file).replace(/\\/g, "/");
    if (rel.includes(".bak") || rel.endsWith(".backup") || rel.startsWith("backups/")) continue;
    if (rel.startsWith("blog/") && (canonicalMap[path.basename(rel)] || path.basename(rel) === "best-rental-platforms-south-africa-2026.html")) continue;
    const loc = rel === "index.html" ? `${site}/` : `${site}/${rel.replace(/index\.html$/, "")}`;
    urls.push(loc);
  }
  const unique = [...new Set(urls)].sort();
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map((loc) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${loc === `${site}/` ? "1.0" : loc.includes("/platforms/") ? "0.8" : "0.7"}</priority>\n  </url>`).join("\n")}\n</urlset>\n`);
  write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
}

function report() {
  write("seo-fix-report-2026-07-03.json", JSON.stringify({
    generatedAt: today,
    platformPages: platforms.length,
    canonicalFallbacks: canonicalMap,
    noindexed: ["blog/best-rental-platforms-south-africa-2026.html"],
    searchConsoleNote: `Submit ${site}/sitemap.xml in Google Search Console after deploy.`,
  }, null, 2));
}

ensureCss();
buildPlatforms();
buildTrustPages();
processHomepage();
updateAppLinks();
processBlog();
buildBlogIndex();
processAllHtml();
replaceLegacyPlatformShell();
sitemap();
report();

console.log(`Generated ${platforms.length} platform pages.`);
console.log(`Processed ${blogPosts.length} blog posts.`);
console.log(`Canonical fallbacks: ${Object.keys(canonicalMap).length}`);
