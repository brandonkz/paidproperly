#!/usr/bin/env node
/*
 * PaidProperly blog publisher.
 * Turns one approved post (JSON) into a blog page that matches the site,
 * adds it to the blog index and sitemap, and optionally commits + pushes.
 *
 * Usage:  node scripts/publish-post.js <post.json> [--push]
 *
 * post.json fields:
 *   slug             required, kebab-case, no .html
 *   title            required, the H1
 *   body_md          required, markdown body (no H1; ## and ### for sections)
 *   meta_title       optional, <title> tag (defaults to title)
 *   meta_description required, 120-160 chars
 *   target_keyword   optional
 *   keywords         optional array of extra keywords
 *   date             optional YYYY-MM-DD (defaults to today, SAST)
 *   related          optional [{href, title}] for the Related Articles box
 *   cta              optional {heading, text, href, button}
 *
 * Prints one JSON line: {"ok":true,"url":...,"file":...,"commit":...}
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://paidproperly.co.za";
const AUTHOR = "Brandon Katz";

function fail(msg) { console.log(JSON.stringify({ ok: false, error: msg })); process.exit(1); }

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith("--"));
const push = args.includes("--push");
if (!file) fail("Usage: node scripts/publish-post.js <post.json> [--push]");

let post;
try { post = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { fail("Cannot read post JSON: " + e.message); }
for (const k of ["slug", "title", "body_md", "meta_description"]) if (!post[k]) fail("Missing field: " + k);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug)) fail("Slug must be lowercase kebab-case: " + post.slug);

const outFile = path.join(ROOT, "blog", post.slug + ".html");
const url = `${SITE}/blog/${post.slug}.html`;
const today = new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10);
const date = post.date || today;
const isUpdate = fs.existsSync(outFile);

// ---------- helpers ----------
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const longDate = d => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

function inline(text) {
  let s = esc(text);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, h) => {
    const ext = /^https?:\/\//.test(h) && !h.startsWith(SITE);
    return `<a href="${h}"${ext ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  return s;
}

function mdToHtml(md) {
  const lines = md.replace(/\r/g, "").split("\n");
  const out = [];
  let para = [], list = null, quote = [], firstPara = true, i = 0;
  const pad = "                ";
  const flushPara = () => {
    if (!para.length) return;
    const cls = firstPara ? ' class="intro"' : "";
    out.push(`${pad}<p${cls}>${inline(para.join(" "))}</p>`);
    firstPara = false; para = [];
  };
  const flushList = () => {
    if (!list) return;
    out.push(`${pad}<${list.tag}>`);
    list.items.forEach(it => out.push(`${pad}    <li>${inline(it)}</li>`));
    out.push(`${pad}</${list.tag}>`);
    list = null;
  };
  const flushQuote = () => {
    if (!quote.length) return;
    out.push(`${pad}<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    let m;
    if (!t) { flushAll(); i++; continue; }
    if ((m = t.match(/^(#{2,4})\s+(.*)$/))) {
      flushAll();
      const lvl = m[1].length;
      out.push("", `${pad}<h${lvl}>${inline(m[2])}</h${lvl}>`, "");
      firstPara = false; i++; continue;
    }
    if (/^#\s+/.test(t)) { i++; continue; } // H1 comes from title
    if (t.startsWith("|") && i + 1 < lines.length && /^\|?\s*:?-{3,}/.test(lines[i + 1].trim())) {
      flushAll();
      const cells = r => r.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      const head = cells(t); i += 2;
      out.push(`${pad}<div class="table-wrap"><table>`, `${pad}    <thead><tr>${head.map(h => `<th>${inline(h)}</th>`).join("")}</tr></thead>`, `${pad}    <tbody>`);
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        out.push(`${pad}        <tr>${cells(lines[i]).map(c => `<td>${inline(c)}</td>`).join("")}</tr>`); i++;
      }
      out.push(`${pad}    </tbody>`, `${pad}</table></div>`);
      firstPara = false; continue;
    }
    if ((m = t.match(/^[-*]\s+(.*)$/)) || (m = t.match(/^\d+[.)]\s+(.*)$/))) {
      flushPara(); flushQuote();
      const tag = /^\d/.test(t) ? "ol" : "ul";
      if (list && list.tag !== tag) flushList();
      if (!list) list = { tag, items: [] };
      list.items.push(m[1]); i++; continue;
    }
    if ((m = t.match(/^>\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); i++; continue; }
    flushList(); flushQuote(); para.push(t); i++;
  }
  flushAll();
  return out.join("\n");
}

// ---------- build page ----------
const bodyHtml = mdToHtml(post.body_md);
const words = post.body_md.split(/\s+/).filter(Boolean).length;
const readMin = Math.max(2, Math.round(words / 200));
const metaTitle = post.meta_title || post.title;
const keywords = [post.target_keyword, ...(post.keywords || []), "remote work South Africa"].filter(Boolean);
const related = (post.related && post.related.length ? post.related : [
  { href: "how-to-get-paid-south-african-freelancer.html", title: "How to Get Paid as a South African Freelancer" },
  { href: "avoiding-remote-work-scams.html", title: "Avoiding Remote Work Scams" },
  { href: "paypal-alternatives-south-africa-2026.html", title: "PayPal Alternatives for South Africans" },
]).filter(r => r.href.replace(/^\/?blog\//, "") !== post.slug + ".html");
const cta = Object.assign({
  heading: "Find Platforms That Actually Pay South Africans",
  text: "Compare 88 vetted remote work platforms by payout method, pay and difficulty.",
  href: "/", button: "Browse the Platforms",
}, post.cta || {});

const articleLd = {
  "@context": "https://schema.org", "@type": "Article",
  headline: post.title, description: post.meta_description,
  datePublished: isUpdate ? undefined : date, dateModified: today,
  author: { "@type": "Person", name: AUTHOR, url: `${SITE}/about.html` },
  publisher: { "@type": "Organization", name: "PaidProperly", url: SITE, logo: { "@type": "ImageObject", url: `${SITE}/og-image.png` } },
  mainEntityOfPage: url, image: `${SITE}/og-image.png`,
};
if (isUpdate) {
  const old = fs.readFileSync(outFile, "utf8").match(/"datePublished":\s*"([\d-]+)"/);
  articleLd.datePublished = old ? old[1] : date;
}
const crumbLd = {
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog/` },
    { "@type": "ListItem", position: 3, name: post.title, item: url },
  ],
};

const page = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(metaTitle)}</title>
    <meta name="description" content="${esc(post.meta_description)}">
    <meta name="keywords" content="${esc(keywords.join(", "))}">
    <link rel="stylesheet" href="../style.css">
    <link rel="stylesheet" href="blog-style.css">
    <link rel="canonical" href="${url}">
    <meta property="og:title" content="${esc(post.title)} | PaidProperly">
    <meta property="og:description" content="${esc(post.meta_description)}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="PaidProperly">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${SITE}/og-image.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${SITE}/og-image.png">
<script type="application/ld+json">
${JSON.stringify(articleLd, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(crumbLd, null, 2)}
</script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1100439985778001"
     crossorigin="anonymous"></script>
</head>
<body>
    <header>
        <div class="container">
            <div class="logo">
                <a href="/">PaidProperly</a>
            </div>
            <nav>
                <a href="/">Platforms</a>
                <a href="/blog/">Blog</a>
            </nav>
        </div>
    <p class="last-updated">Last updated: ${today}</p>
</header>
<section class="pp-author-bio" aria-label="Author bio">
  <p><strong>By ${AUTHOR}.</strong> PaidProperly helps South Africans compare remote work platforms, payment routes, tax basics and practical earning tools. Learn more on the <a href="/about.html">About page</a>.</p>
</section>

    <main class="blog-post">
        <div class="container">
            <article>
                <h1>${esc(post.title)}</h1>

                <div class="post-meta">
                    <span>${longDate(articleLd.datePublished)}</span>
                    <span>${readMin} min read</span>
                </div>

${bodyHtml}

                <div class="cta-box">
                    <h3>${esc(cta.heading)}</h3>
                    <p>${esc(cta.text)}</p>
                    <a href="${esc(cta.href)}" class="cta-button">${esc(cta.button)}</a>
                </div>
            </article>

            <div class="related-posts">
                <h3>Related Articles</h3>
                <ul>
${related.map(r => `                    <li><a href="${esc(r.href)}">${esc(r.title)}</a></li>`).join("\n")}
                </ul>
            </div>
        </div>
    </main>

    <footer>
        <div class="container">
            <p>&copy; ${today.slice(0, 4)} PaidProperly. Remote work platforms that actually pay South Africans.</p>
        </div>
    </footer>
</body>
</html>
`;
fs.writeFileSync(outFile, page);

// ---------- blog index ----------
const indexFile = path.join(ROOT, "blog", "index.html");
let index = fs.readFileSync(indexFile, "utf8");
const href = `./${post.slug}.html`;
const card = `            <article class="blog-card">
                <div class="blog-date">${longDate(articleLd.datePublished)}</div>
                <h2><a href="${href}">${esc(post.title)}</a></h2>
                <p>${esc(post.meta_description)}</p>
                <a href="${href}" class="read-more">Read more →</a>
            </article>
`;
const cardRe = new RegExp(`\\s*<article class="blog-card">\\s*<div class="blog-date">[^<]*</div>\\s*<h2><a href="${href.replace(/[.]/g, "\\.")}">[\\s\\S]*?</article>\\n?`);
if (cardRe.test(index)) {
  index = index.replace(cardRe, "\n" + card);
} else {
  const anchor = '<section class="blog-list">\n';
  if (!index.includes(anchor)) fail("Could not find blog-list section in blog/index.html");
  index = index.replace(anchor, anchor + card + "\n");
}
fs.writeFileSync(indexFile, index);

// ---------- sitemap ----------
const smFile = path.join(ROOT, "sitemap.xml");
let sm = fs.readFileSync(smFile, "utf8");
const locRe = new RegExp(`(<loc>${url.replace(/[.]/g, "\\.")}</loc>\\s*<lastmod>)[\\d-]+(</lastmod>)`);
if (locRe.test(sm)) {
  sm = sm.replace(locRe, `$1${today}$2`);
} else {
  sm = sm.replace("</urlset>", `  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`);
}
fs.writeFileSync(smFile, sm);

// ---------- pipeline log ----------
const pipeFile = path.join(ROOT, "content", "pipeline.md");
if (fs.existsSync(pipeFile)) {
  let pipe = fs.readFileSync(pipeFile, "utf8");
  if (!pipe.includes(`| ${post.slug} |`)) {
    const row = `| ${articleLd.datePublished} | ${post.slug} | ✅ Published (agentic-cmo) | ${keywords.join(", ")} |\n`;
    pipe = pipe.replace(/(\|[-| ]+\|\n\n?)/, `$1${row}`);
    fs.writeFileSync(pipeFile, pipe);
  }
}

// ---------- git ----------
let commit = null;
if (push) {
  const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim();
  try {
    git("pull", "--rebase", "--autostash", "-q");
    git("add", `blog/${post.slug}.html`, "blog/index.html", "sitemap.xml", ...(fs.existsSync(pipeFile) ? ["content/pipeline.md"] : []));
    git("commit", "-q", "-m", `${isUpdate ? "Update" : "Publish"} blog: ${post.title}`);
    git("push", "-q");
    commit = git("rev-parse", "HEAD");
  } catch (e) { fail("Git failed: " + (e.stderr || e.message)); }
}

console.log(JSON.stringify({ ok: true, url, file: path.relative(ROOT, outFile), updated: isUpdate, words, read_min: readMin, commit }));
