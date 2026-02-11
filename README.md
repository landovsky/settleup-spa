# SettleUp

Bill-splitting app with cloud sync and sharing. Live at [settleup.kopernici.cz](https://settleup.kopernici.cz).

## Features

- **Multi-person splitting** — add any number of people
- **Fair share calculation** — automatically divides total expenses equally among all participants
- **Minimum transfers** — greedy algorithm computes the fewest payments needed to settle all debts
- **Settle up** — record settlements directly from the balance card and track them in history
- **Cloud wallets** — save your wallet to the cloud and access it from any device
- **Sharing** — share via unique wallet code, link, or QR code
- **Multi-wallet support** — switch between wallets or join someone else's by code
- **Offline-first** — localStorage cache with debounced cloud sync
- **Expense tracking** with description, amount, who paid, and date
- **Quick deletion** of any expense or settlement
- **Responsive design** for mobile and desktop
- **Keyboard shortcuts** — Enter to jump between fields

## How It Works

Each person should pay an equal share of total expenses. With 3 people and $150 in total, each person's fair share is $50. If Alice paid $100, Bob paid $30, and Charlie paid $20, the app computes the minimum transfers: Bob owes Alice $20, Charlie owes Alice $30.

## Architecture

Single-file SPA (`index.html`) hosted on GitHub Pages with a serverless backend:

- **Frontend** — HTML/CSS/JS in one file, no build step
- **Backend** — DigitalOcean Function (Node.js 18) for wallet CRUD
- **Storage** — DigitalOcean Spaces (S3-compatible) for wallet JSON files
- **Routing** — GitHub Pages `404.html` trick for clean `/WALLET-CODE` URLs

## Design

- **Typography:** Archivo Black headers + DM Sans body
- **Colors:** Terracotta orange (`#FF6B35`), deep navy (`#004E89`), golden yellow accents
- **Animations:** Subtle fade-ins, slide-ins, and hover micro-interactions
