# PaidProperly Newsletter

Beehiiv publication: `Paid Properly`

Publication ID: `pub_ca5f2aba-b34f-4702-945d-21539c96460a`

API key storage:

- Local Keychain service: `Beehiiv - Paid Properly API`
- Account label: `alphaxasset@gmail.com`
- Do not commit the API key or place it in browser JavaScript.

## Current Setup

- The live site uses Beehiiv's hosted subscribe form.
- The homepage modal tracks Beehiiv clicks as `newsletter_click`, not `affiliate_click`.
- Subscriber exports and health checks should use aggregate reporting by default.

## Custom Fields

These fields exist in Beehiiv for future tracked signups:

- `Source Page`
- `Signup Context`
- `Interest`
- `Clicked Platform`
- `Traffic Source`
- `Campaign Label`

Beehiiv reserves UTM field names internally, so use `Traffic Source` and `Campaign Label` for custom metadata when needed.

## Useful Commands

Run a non-PII newsletter health check:

```bash
node scripts/beehiiv-summary.js
```

Or with an explicit env var:

```bash
BEEHIIV_API_KEY=... node scripts/beehiiv-summary.js
```

## Next Build Step

PaidProperly is hosted on GitHub Pages, so custom signup forms cannot call Beehiiv directly without exposing the API key. Use a tiny private backend first:

1. Static PaidProperly form submits to a Supabase Edge Function or Cloudflare Worker.
2. The backend validates the email and records a backup lead.
3. The backend pushes the subscriber to Beehiiv with the custom fields above.
4. GA tracks `newsletter_signup` separately from affiliate clicks.
