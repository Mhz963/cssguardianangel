# CSS Guardian Angel

Free CSS (Central Superior Services, Pakistan) preparation platform: syllabus and rules, FPSC past papers,
425 lecture slide decks, key documents, Pakistan and global affairs, a study planner with reminders,
blogs and a portfolio builder.

- Website: https://cssguardianangel.com
- Android app: [CSS Guardian Angel on Google Play](https://play.google.com/store/apps/details?id=com.cssguardianangel.app)
  (a React Native WebView shell around the website; its source lives in a separate repository)

## Stack

React 19 + Vite 7 single-page app, React Router 7, Supabase (auth, Postgres, storage), deployed on Vercel.
Route pages are lazy-loaded from `src/pages/`; the shell (header, footer, home page, SEO) is `src/App.jsx`.

```
src/
  App.jsx                 shell, home page, routing, SEO meta
  pages/                  one lazily loaded module per route
  components/             lazily loaded widgets (sticky notes)
  data/                   syllabus lists, outlines (subjectPagesData.js loads the large JSON), past papers, slides index
  utils/                  Supabase client, PDF helpers, portfolio, account deletion
  siteConfig.js           SITE_URL, SUPPORT_EMAIL and other shared constants
api/                      Vercel serverless functions (admin dashboard, admin actions, delete account)
server/                   handlers shared by api/ and the local dev server
supabase/                 schema.sql and migrations (run in the Supabase SQL editor)
data/                     lecture slides (.pptx) and key-document PDFs bundled into the build
```

## Local development

```bash
npm ci
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:5173
```

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | client | Supabase project |
| `VITE_PUBLIC_SITE_URL` | client + build | Canonical origin (defaults to `https://cssguardianangel.com`) |
| `VITE_SUPPORT_EMAIL` | client | Contact address on the privacy, terms and delete-account pages |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Admin dashboard and account deletion |
| `SUPER_ADMIN_EMAIL` | server only | Account allowed to use the admin APIs |
| `WORLDNEWSAPI_KEY` | dev server only | News feeds in local development |
| `STRIPE_*`, `PREMIUM_VOUCHER_CODE` | server only | Payments (currently disabled; see `api-disabled/`) |

Never commit real keys. `.env.local` is git-ignored.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (also serves the admin/account APIs locally) |
| `npm run build` | Generates `public/sitemap.xml` + `robots.txt`, then builds to `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build locally |

CI (`.github/workflows/ci.yml`) runs lint, build and `npm audit` on every push and pull request.

## Supabase

Run `supabase/schema.sql`, then the files in `supabase/migrations/` in date order, in the Supabase SQL editor.
`20261125_ga_pdf_downloads_private.sql` makes the app's PDF hand-off bucket private and per-user.

## Deployment

Vercel builds with `npm run build` (see `vercel.json`, which also sets security and caching headers).
`scripts/vercel-prepare.mjs` keeps only the serverless functions listed in it, to stay within the Hobby plan.
