# JP Expense Tracker (家計簿トラッカー)

A web app to track your monthly expenses in Japan by scanning store receipts. Supports Japanese OCR, auto-categorization, and spending analytics.

## Features

- **Receipt Scanning** — Upload photos of Japanese store receipts for automatic text extraction (via Google Cloud Vision API)
- **Auto-Categorization** — Recognizes ~40 Japanese store names (イオン, セブンイレブン, ユニクロ, etc.) across 11 expense categories
- **Dashboard** — Monthly bar chart, category pie chart, spending stats with month-over-month comparison
- **Bill Management** — Create, view, edit, delete receipts with image attachments
- **History** — Browse and filter expenses by year, month, and category
- **Authentication** — Email/password login with secure sessions

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** PostgreSQL via Supabase + Prisma ORM
- **Storage:** Supabase Storage (receipt images)
- **Auth:** NextAuth.js (credentials)
- **Styling:** Tailwind CSS
- **Charts:** Recharts

## Deployment (Zero Cost)

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project — note your **project password**
3. Go to **Settings → Database** and copy:
   - **Connection string (Transaction/Session pooler)** → `DATABASE_URL`
   - **Connection string (Direct)** → `DIRECT_URL`
4. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Create a Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click **New bucket**, name it `receipts`, and set it to **Public**
3. Under the bucket's **Policies**, add a policy to allow authenticated uploads:
   - Operation: INSERT
   - Target roles: authenticated
   - Policy: `true`

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (free) with your GitHub account
2. Click **Import Project** and select the `jp-expense-tracker` repo
3. Add the following **Environment Variables** in Vercel:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase pooled connection string |
| `DIRECT_URL` | Your Supabase direct connection string |
| `NEXTAUTH_SECRET` | Any random string (use `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your Vercel deployment URL (e.g. `https://jp-expense-tracker.vercel.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `GOOGLE_CLOUD_VISION_API_KEY` | *(optional)* For receipt OCR |

4. Click **Deploy** — Vercel will build and deploy automatically
5. After deployment, run the database migration:
   ```bash
   npx prisma db push
   ```
   Or trigger a redeploy — the `postinstall` script generates the Prisma client automatically.

### 4. Use on iPhone

Open the Vercel URL in Safari on your iPhone. For an app-like experience:
1. Tap the **Share** button
2. Tap **Add to Home Screen**
3. The app will appear as an icon on your home screen

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Push database schema
npx prisma db push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Categories

| Category | Japanese | Examples |
|----------|----------|----------|
| Groceries | 食料品 | イオン, 西友, セブンイレブン |
| Dining | 外食 | マクドナルド, すき家, スターバックス |
| Transportation | 交通 | JR, 東京メトロ, PASMO |
| Daily Necessities | 日用品 | マツモトキヨシ, ウエルシア |
| Clothing | 衣類 | ユニクロ, GU, ZARA |
| Medical | 医療 | スギ薬局 |
| Utilities | 光熱費 | — |
| Communication | 通信費 | — |
| Entertainment | 娯楽 | ヨドバシ, ビックカメラ |
| Education | 教育 | — |
| Other | その他 | — |
