# SettleUp - Bill Splitting SPA

## Project Overview
Single-file bill-splitting SPA hosted on GitHub Pages at `settleup.kopernici.cz` with cloud persistence via DigitalOcean Functions + Spaces.

## Architecture
```
[GitHub Pages SPA]  --fetch-->  [DO Function: api/wallet]  --S3-->  [DO Spaces bucket]
```

- **Frontend**: Single `index.html` — all HTML/CSS/JS embedded, no build step, no framework
- **Backend**: Single DO Function (`api/packages/api/wallet/index.js`) — Node.js 18
- **Storage**: DO Spaces bucket `settleup-wallets` (S3-compatible), wallets stored as `wallets/{CODE}.json`
- **Hosting**: GitHub Pages with custom domain via `CNAME` file
- **SPA Routing**: `404.html` stores path in sessionStorage, redirects to `/`; `index.html` reads it back

## Key Files
| File | Purpose |
|------|---------|
| `index.html` | Entire SPA (HTML + CSS + JS) |
| `404.html` | GitHub Pages SPA routing redirect |
| `CNAME` | Custom domain: `settleup.kopernici.cz` |
| `og-image.jpg` | Open Graph image (1200x630) |
| `api/project.yml` | DO Functions project config |
| `api/packages/api/wallet/index.js` | Wallet CRUD function |
| `api/packages/api/wallet/package.json` | Node deps (`@aws-sdk/client-s3`) |
| `api/.env` | DO Spaces credentials (**gitignored**) |

## GitOps / Deployment

### Frontend (GitHub Pages)
- **Repo**: `git@github.com:landovsky/settleup-spa.git` (branch: `main`)
- **Deploy**: `git push origin main` — GitHub Pages auto-deploys from `main`
- **Domain**: `settleup.kopernici.cz` (configured via `CNAME` file + DNS)

### Backend (DO Functions)
- **Tool**: `doctl serverless`
- **Namespace**: `settleup` in `fra1` region (ID: `fn-83820d20-2e7e-46ba-b16f-a55ae2ef584f`)
- **Function URL**: `https://faas-fra1-afec6ce7.doserverless.co/api/v1/web/fn-83820d20-2e7e-46ba-b16f-a55ae2ef584f/api/wallet`
- **Deploy command**:
  ```bash
  cd api/
  source .env && doctl serverless deploy . \
    --env SPACES_ENDPOINT=$SPACES_ENDPOINT \
    --env SPACES_BUCKET=$SPACES_BUCKET \
    --env SPACES_KEY=$SPACES_KEY \
    --env SPACES_SECRET=$SPACES_SECRET
  ```
- **Verify deployment**: `doctl serverless functions get api/wallet --url`
- **Test**:
  ```bash
  # Create wallet
  curl -s -X POST <FUNCTION_URL> -H 'Content-Type: application/json' -d '{"wallet":{"name":"Test","people":["A","B"],"expenses":[],"settlements":[]}}'
  # Get wallet
  curl -s "<FUNCTION_URL>?code=XXX-XXX-XXX"
  ```
- **Credentials** in `api/.env` (gitignored):
  - `SPACES_ENDPOINT=fra1.digitaloceanspaces.com`
  - `SPACES_BUCKET=settleup-wallets`
  - `SPACES_KEY` / `SPACES_SECRET` — DO Spaces access keys

### Important: CORS
DO Functions with `web: true` automatically adds CORS headers (`Access-Control-Allow-Origin: *`). **Do NOT add custom CORS headers in function code** — this causes duplicate headers that break browsers.

## Frontend Internals

### localStorage Schema (multi-wallet)
- `splitApp:registry` → `[{code, name, lastOpened}]` — wallet list
- `splitApp:current` → `{code, people, expenses, settlements}` — active wallet cache
- `wallet:{CODE}` → `{people, expenses, settlements}` — per-wallet cache
- Migration from legacy `splitAppData` key is handled in `init()`

### Wallet Lifecycle
1. Fresh visit → empty local state, no cloud wallet
2. User adds people/expenses → data in localStorage only
3. "Save & Share" button → POST to cloud → receives code → URL updates to `/{CODE}`
4. Subsequent edits → debounced PUT to cloud (800ms) + immediate localStorage save
5. Visit via URL `/{CODE}` → fetch from cloud, cache in localStorage

### Wallet Code Format
`XXX-XXX-XXX` using charset `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (32 chars, excludes ambiguous 0/O/1/I/L). Generated server-side with collision checking.

### Key JS Functions in index.html
- `init()` — URL routing, cloud fetch, localStorage migration
- `saveData()` → `saveToLocalStorage()` + `scheduleSyncToCloud()`
- `createCloudWallet()` — POST to create, updates URL
- `computeTransfers()` — greedy creditor/debtor matching for minimum transfers
- `openShareModal()` — QR code (via `qrcodejs` CDN), Web Share API, copy buttons
- `openSwitcherModal()` — wallet list, join by code, new wallet

## Conventions
- No build tools, no bundler — everything in `index.html`
- Czech locale assumed (currency: Kč, but configurable)
- No authentication — anyone with wallet code can read/write
- Last-write-wins for concurrent edits
