# Friend Overlap Dashboard — Vana Mainnet

A production-ready Vana Data Portability app that analyzes overlapping connections between your Instagram and LinkedIn networks. Built for the Vana Cup.

## What it does

1. **Requests access** to your Instagram following list and LinkedIn connections via Vana's user-owned data protocol
2. **Reads approved data** from your Personal Server (encrypted, user-controlled, mainnet-settled)
3. **Finds overlaps** — people who appear in both networks by normalized name matching
4. **Visualizes results** with stats cards, animated Venn diagram, overlap table, and platform-specific contact lists

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Vana SDK** (`@opendatalabs/vana-sdk`)
- **Pure CSS** — no external UI dependencies

## Prerequisites

- Node.js 22+ (required by Vana SDK)
- npm or pnpm
- USDC on Base or Ethereum (for mainnet escrow funding)
- A little ETH on the same chain (for bridge gas)

## Quick Start (Sample Mode — No Wallet Needed)

Test the UI with synthetic data before going live:

```bash
cd friend-overlap-dashboard-mainnet
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 and click **Connect Instagram + LinkedIn**. The app loads sample fixtures instantly.

## Going Live on Mainnet

### Step 1: Create App Identity

1. Go to [account.vana.org/developers](https://account.vana.org/developers)
2. Sign in (Google, wallet, or email)
3. Set **Protocol network** to **Mainnet**
4. Click **Create new app identity**
5. Enter your app URL:
   - Local dev: `http://localhost:3000`
   - Production: your deployed URL (e.g., `https://your-app.vercel.app`)
6. **Save the private key** — shown only once!
7. Copy the **app address**

### Step 2: Configure Environment

Create `.env.local`:

```env
VANA_APP_URL=https://your-app.vercel.app
VANA_MODE=live
VANA_NETWORK=mainnet
VANA_ENV=production
VANA_APP_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
VANA_SCOPES=instagram.following,linkedin.connections
```

**⚠️ Security:** Never commit `VANA_APP_PRIVATE_KEY`. It stays server-side only.

### Step 3: Fund Escrow with USDC.e

Mainnet escrow requires **USDC.e** (bridged USDC on Vana).

1. **Bridge USDC → USDC.e**
   - Go to [Stargate](https://stargate.finance)
   - Route: **Base** (or Ethereum) USDC → **Vana** USDC.e
   - You need a little ETH on Base/Ethereum for bridge gas
   - Stargate may warn "0 VANA on Vana" — this is expected and safe to ignore

2. **Add Vana to your wallet** (to see USDC.e):
   - Network name: Vana
   - RPC: `https://rpc.vana.org`
   - Chain ID: `1480`
   - USDC.e token: `0xF1815bd50389c46847f0Bda824eC8da914045D14`

3. **Deposit into escrow**
   - Back at [account.vana.org/developers](https://account.vana.org/developers) (Mainnet)
   - Enter your **app identity address**
   - Click **Fund escrow** and deposit USDC.e
   - This transaction is gas-sponsored — no VANA needed
   - Wait for the balance to update

### Step 4: Test Locally

```bash
npm run dev
```

1. Open http://localhost:3000
2. Click **Connect Instagram + LinkedIn**
3. A popup opens to Vana Account — approve the data grant
4. The app polls status, reads your real data from Personal Server, and shows overlaps
5. Each read deducts a small fee from your escrow balance automatically

### Step 5: Deploy to Vercel

```bash
npm run build
```

Or connect your GitHub repo to [Vercel](https://vercel.com):

1. Import project from GitHub
2. Framework preset: Next.js
3. **Critical:** Add all environment variables from `.env.local` in Vercel Project Settings → Environment Variables
4. Deploy
5. Update `VANA_APP_URL` in Vercel env vars to your production URL
6. Re-deploy after changing env vars

**Note:** `.env.local` is NOT uploaded to Vercel. You must set variables in the dashboard.

## Project Structure

```
app/
  api/vana/
    request/route.ts    # POST — creates access request
    status/route.ts     # GET — polls approval status
    data/route.ts       # GET — reads approved data (cached)
  components/
    ConnectSocialButton.tsx   # Vana approval flow UI
    OverlapDashboard.tsx      # Analysis + visualization
  page.tsx              # Main page
  layout.tsx            # Root layout
  globals.css           # All styles
lib/
  vana.ts               # Vana controller (sample + live)
fixtures/
  instagram.following.json
  linkedin.connections.json
```

## How the Overlap Algorithm Works

1. **Extract contacts** from each platform's schema:
   - Instagram: `following[].fullName` or `username`
   - LinkedIn: `connections[].fullName`
2. **Normalize names**: lowercase, trim, remove special characters, collapse spaces
3. **Match**: exact normalized string match across platforms
4. **Categorize**:
   - **Both platforms** — mutual contacts
   - **Instagram only** — unique to Instagram
   - **LinkedIn only** — unique to LinkedIn

## Adding More Platforms

To add YouTube, Steam, or other sources:

1. Add scope to `VANA_SCOPES` (e.g., `youtube.subscriptions`)
2. Add fixture file in `fixtures/`
3. Update `extractContacts()` in `OverlapDashboard.tsx`
4. Update Venn diagram colors

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Missing required environment variable: VANA_APP_PRIVATE_KEY` | You set `VANA_MODE=live` but forgot the private key |
| `Insufficient finalized balance` | Fund escrow with USDC.e on mainnet at account.vana.org/developers |
| `Unknown sample data route` | Check fixture JSON matches the scope schema |
| Popup blocked | Click "click here to approve" or allow popups |
| Approval times out | Ensure `VANA_APP_URL` matches your actual origin |
| Stargate warns "0 VANA for gas" | Safe to ignore — bridge gas is paid on source chain |

## Resources

- [Vana Build Guide](https://docs.vana.org/build-a-vana-app)
- [Vana SDK](https://github.com/vana-com/vana-sdk)
- [Data Connectors](https://github.com/PDP-Connect/data-connectors)
- [Vana Account Developers](https://account.vana.org/developers)

## License

MIT — Built for Vana Cup 2026.
