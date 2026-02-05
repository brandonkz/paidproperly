# PaidProperly

A clean, trustworthy shortlist directory of legit, non-obvious platforms that pay South Africans.

**Live site:** [paidproperly.co.za](https://paidproperly.co.za)

## Features

- 📋 **Curated Directory** - 30+ vetted platforms, no scams or obvious job boards
- 🔍 **Smart Filtering** - Search by category, difficulty, role, and SA-friendliness
- ❤️ **Save Preferences** - Like or dismiss platforms (saved locally)
- 📱 **Mobile Responsive** - Works great on all devices
- 🔗 **Referral Links** - All outbound links go through `/go/` pages for tracking

## Project Structure

```
/
├── index.html          # Homepage directory
├── platform.html       # Single platform detail page
├── style.css           # All styles
├── app.js              # Homepage JavaScript
├── platform.js         # Platform page JavaScript
├── data/
│   └── platforms.json  # Platform data
├── go/
│   └── *.html          # Redirect pages (one per platform)
├── scripts/
│   └── generate-go-pages.js  # Node script to regenerate /go/ pages
└── README.md
```

## Running Locally

1. Clone the repository
2. Start a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (npx)
npx serve
```

3. Open http://localhost:8000 in your browser

## Deploying to GitHub Pages

1. Create a new repository on GitHub
2. Push this code to the repository
3. Go to **Settings** → **Pages**
4. Under "Source", select **Deploy from a branch**
5. Select `main` branch and `/ (root)` folder
6. Click **Save**
7. Your site will be live at `https://yourusername.github.io/repo-name/`

### Custom Domain (paidproperly.co.za)

1. In your repo, create a file called `CNAME` with the content:
   ```
   paidproperly.co.za
   ```
2. In your domain registrar, add DNS records:
   - **A Record** pointing to:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Or **CNAME** record pointing to `yourusername.github.io`

## Updating Platforms

### Edit platforms.json

Open `data/platforms.json` and add/edit entries:

```json
{
  "id": 31,
  "name": "New Platform",
  "slug": "new-platform",
  "url": "https://newplatform.com",
  "ref_url": "https://newplatform.com?ref=paidproperly",
  "category": "Remote hiring platforms",
  "description": "One sentence description.",
  "best_for": ["Dev", "Design"],
  "payout_notes": "Monthly payments via PayPal.",
  "difficulty": "Medium",
  "tags": ["freelance", "remote"],
  "sa_friendly": true,
  "recommended_rank": 31,
  "featured": false
}
```

### Regenerate Redirect Pages

After editing `platforms.json`, run:

```bash
node scripts/generate-go-pages.js
```

This creates/updates all `/go/*.html` redirect pages.

## Adding Referral Links

1. Open `data/platforms.json`
2. Find the platform entry
3. Update the `ref_url` field with your referral link
4. Run `node scripts/generate-go-pages.js`
5. Commit and push changes

### Placeholder Links

The Somewhere platform has a placeholder:
```
"ref_url": "PASTE_SOMEWHERE_REFERRAL_LINK_HERE"
```

Replace this with your actual referral link before deploying.

## How Referral Links Work

- Users never see external URLs directly in the UI
- All "Apply / Visit" buttons link to `/go/<slug>.html`
- Each redirect page uses both meta refresh and JavaScript redirect
- This allows tracking and ensures referral attribution

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox
- **Vanilla JavaScript** - No frameworks
- **Google Fonts** - Fraunces + Source Sans 3
- **LocalStorage** - User preferences

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome for Android)

## Contributing

1. Fork the repository
2. Add new platforms to `data/platforms.json`
3. Run `node scripts/generate-go-pages.js`
4. Submit a pull request

### Platform Criteria

We include platforms that:
- ✅ Actually pay South Africans
- ✅ Have a track record of legitimate payouts
- ✅ Offer non-obvious opportunities (no LinkedIn, Indeed, etc.)
- ✅ Are accessible without special requirements

We exclude:
- ❌ Crypto/web3 payment-only platforms
- ❌ Obvious job boards (LinkedIn, Indeed, Glassdoor)
- ❌ Platforms with poor payout history
- ❌ MLM or pyramid schemes

## License

MIT License - feel free to fork and adapt for your country!
