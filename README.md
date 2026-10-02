# Counter365 — Production Admin Console

Production-grade Admin Console for Counter365 built with **Next.js 14**, **React 18**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## Brand Identity & Color Theme
Directly matching the official Counter365 brand:
- **Obsidian Black**: `#101318` (Sidebar, key text, primary badges, high-priority status)
- **Signature Counter365 Orange**: `#FD5E03` (Brand accent, active navigations, chart highlights, KPIs, direct action buttons)
- **Warm Orange Light**: `#FFF7ED` (Hover states, soft pill tags)
- **Orange Border Accent**: `#FED7AA`
- **Surface**: `#FAFAFB`
- **Neutral Card Surface**: `#FFFFFF`

## Architecture & Zero Mock Data Guarantee
- **Live Supabase Connection**: Real-time integration querying Supabase PostgreSQL tables:
  - `shops`: Real shop accounts and tenant metadata
  - `profiles`: Application users and owners
  - `shop_members`: Staff assignments and RBAC roles (Owner, Supervisor, Biller)
  - `bills`: Actual counter bills, totals, customer references, and payment statuses
  - `bill_items`: Line items, item names, quantities, unit prices, line totals
  - `payments`: Real payment transactions, UPI/Cash modes, settlement timestamps
  - `menu_items` & `menu_categories`: Real live catalogs
  - `expenses`: Real shop expense tracking
  - `subscriptions`: Active Pro/Trial plans, billing intervals, renewal dates
  - `customers`: Registered patrons and contact numbers
  - `account_deletions`: Offboarded accounts, exit surveys, and compliance audit trail

## Public Compliance Pages (No Login Required)
- **Privacy Policy**: `/privacy-policy` (Legal disclosure and regulatory data governance documentation)
- **Account Deletion**: `/delete-account` (Self-service user account deletion and compliance form)

## Navigation & Sections
1. **Overview**:
   - 6 Live KPIs (GMV Processed, Orders, Registered Shops, Active Shops, Subscription Revenue, Churn Risk)
   - Real-time monthly GMV distribution bar chart
   - Shops breakdown by type (Tea Shop, Restaurant, Cafe, Fast Food, Tiffin Shop)
   - Subscription tier mix (Pro yearly, 30-day Trial, Expired queue)
   - Top platform-wide items ranked by sold units
   - Dynamic "Needs Attention" alert queue (Pending balances, trial endings, printer configurations)
2. **Shops**:
   - Dynamic type and status filters (All, Pro, Trial, Expired, Tea Shop, Restaurant, etc.)
   - Sortable table columns (Shop, Type, Phone, Orders, GMV, Last Seen, Plan)
   - Interactive slide-out **Shop Drawer** on click with detailed breakdown, user roster, live activity log, and direct WhatsApp / Phone call triggers
3. **Account Deletions**:
   - Live audit table of all account deletion requests from `/delete-account` and mobile apps
   - Churn reason distribution, exit surveys, former owner WhatsApp follow-up
4. **Usage & Engagement**:
   - Daily Active Shops, Bills per shop, Users on platform, and Catalog density
   - Feature adoption progression (Billing, Menu customizer, Pending balance tracker, Expense logger, GST invoicing, Multi-user, Bluetooth thermal printer)
   - Billing hours histogram (6am - 10pm IST)
   - Engagement by shop table with team size and days active
5. **Payments**:
   - Collected in period, Annual Recurring Revenue (ARR), Failed charges, and Pending trials
   - Status filters (Paid, Pending, Failed, Refunded)
   - Subscription and POS transactions table
6. **Orders & Items**:
   - Orders volume, Average bill value, Catalog size, GMV
   - Payment mode distribution (Cash vs UPI/GPay vs Pending)
   - Platform catalog breakdown by business type
   - Real-time recent orders live feed
7. **Activity Logs**:
   - Synthesized live database activity stream (Signups, Orders, Payments, Menu edits, Expenses, Member role updates) with status dots and timestamps
8. **Privacy Policy**:
   - In-app preview and copyable public URL

## Setup & Running
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
