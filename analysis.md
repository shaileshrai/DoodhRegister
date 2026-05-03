# Dairy Admin App — Technical Analysis

## 1. Problem Summary

A solo-operated dairy needs a simple, reliable, budget-friendly web app to:
- Record daily milk delivery per customer (two shifts)
- Generate monthly bills and track payments/dues
- Track operational expenses and produce profit/loss reports
- Stay within ₹1,200/year hosting budget

---

## 2. User Profile

| Attribute | Detail |
|-----------|--------|
| Primary user | Single admin (dairy owner) |
| Device | Likely smartphone + occasional desktop |
| Technical skill | Non-technical — UI must be simple |
| Connectivity | Assumed: always-on internet (web app) |
| Scale now | ~100 customers |
| Scale max | 1,000 customers |

---

## 3. Data Model (Entities)

### Customer
```
id, name, mobile, shift (MORNING/EVENING), rate, default_quantity,
is_active, joined_date, left_date
```

### DailyRecord
```
id, customer_id, date, quantity_taken, is_present,
notes, created_at
-- Retained for 4 months, then archived/deleted
```

### MonthlyBill
```
id, customer_id, year, month, total_quantity, total_amount,
payment_status (PAID/DUE), paid_date, notes
-- Retained for 12 months
```

### Expense
```
id, category (FODDER/MEDICINE/REPAIRING/MANPOWER/POWER/OTHER),
date, amount, description
-- Retained for 12 months
```

### ProfitLossReport (computed + cached)
```
id, year, month, total_revenue, total_expenses, net_profit,
generated_at
-- Retained for 10 years
```

### CustomerTrend (derived)
```
Derived monthly from Customer joins/left_date — no separate table needed
```

---

## 4. Core Feature Analysis

### 4.1 Daily Attendance Entry
- The owner opens the app each shift (morning/evening).
- Sees a list of customers for that shift with default quantity pre-filled.
- Checks a toggle (taken/not taken) and can edit quantity inline.
- Bulk-entry with one tap per customer is critical for usability.

**Key challenge:** Speed of data entry — needs a fast, list-style UI, not a form per customer.

### 4.2 Shift Surplus/Shortage Tracking
- Expected quantity = sum of default_quantity for all present customers in that shift.
- Actual quantity = sum of quantity_taken for marked customers.
- Surplus = Expected − Actual (i.e., milk not taken that was prepared).

### 4.3 Monthly Billing & PDF
- Bill = sum(quantity_taken × rate) for all days in the month per customer.
- PDF generated client-side using a library (e.g., `jsPDF` or `react-pdf`).
- Share via WhatsApp/SMS as a file — owner manually shares.

### 4.4 Payment & Overdue Tracking
- Each MonthlyBill has a payment_status.
- Customer profile shows all unpaid months → cumulative due amount.
- Owner marks each month as paid individually.

### 4.5 Profit/Loss Report
- Revenue = sum of all MonthlyBill amounts for the month.
- Expenses = sum of all Expense records for the month.
- Net = Revenue − Expenses.
- Comparative view: two months or two years shown side by side.

### 4.6 Calendar View per Customer
- Month grid showing each day: quantity taken or "absent".
- Monthly total at the bottom.
- Navigate forward/back across months (up to 4 months of live data).

### 4.7 Data Archival
- DailyRecord rows older than 4 months → can be soft-deleted or moved to a summary table.
- MonthlyBill and ProfitLossReport are compact and long-lived.

---

## 5. Recommended Tech Stack

### Frontend
| Choice | Rationale |
|--------|-----------|
| **React + Vite** | Fast, lightweight, excellent ecosystem |
| **Tailwind CSS** | Rapid responsive UI without a heavy component lib |
| **React Query (TanStack Query)** | Simple server-state management, caching |
| **jsPDF + html2canvas** | Client-side PDF generation — free, no server needed |
| **Recharts** | Lightweight charts for P/L and trend analysis |
| **date-fns** | Date manipulation (calendar, month ranges) |

### Backend
| Choice | Rationale |
|--------|-----------|
| **Node.js + Express** (or **Hono** for edge) | Minimal, fast REST API |
| **SQLite via Turso** | Serverless SQLite — free tier covers this scale, no DB hosting cost |
| **Drizzle ORM** | Type-safe, SQLite-native, lightweight |

### Alternative: Full-stack with Next.js
- Next.js App Router with API routes — single deployment, simpler ops.
- Recommended if the owner wants one codebase and one deployment.

### Recommended Final Stack: **Next.js + Turso (SQLite) + Tailwind**
- One deployment target
- Free database (Turso free tier: 500 DB files, 1GB storage, 1B row reads/month)
- Excellent for a single-admin app

---

## 6. Hosting Options (≤ ₹1,200/year = ~$14.40/year)

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **Vercel (Free tier)** | ₹0 | Excellent Next.js support, auto-deploy, HTTPS | 100GB bandwidth limit; functions timeout at 10s on free |
| **Cloudflare Pages + Workers** | ₹0 | Global edge, generous free tier, fast | Slightly more complex setup |
| **Railway (Hobby)** | ~₹420/year (~$5/yr) | Simple deployment, persistent server | Costs money |
| **Render (Free)** | ₹0 | Free web service | Spins down after 15min inactivity (slow cold start) |
| **Fly.io (Free tier)** | ₹0 | 3 free VMs, persistent storage possible | More DevOps knowledge needed |

### Recommendation: **Vercel (Free) + Turso (Free)**
- Total cost: **₹0/year**
- Well within budget
- Zero ops — just push code to GitHub, Vercel auto-deploys
- Turso provides a free hosted SQLite database

---

## 7. Architecture Diagram (Simplified)

```
Browser (Admin's Phone/PC)
        │
        ▼
   Next.js App (Vercel)
   ┌─────────────────────────────────┐
   │  Pages / App Router (React UI)  │
   │  API Routes (REST endpoints)    │
   └────────────────┬────────────────┘
                    │ SQL over HTTP
                    ▼
             Turso (SQLite)
             (Free hosted DB)
```

---

## 8. Key Screens / Pages

| Screen | Description |
|--------|-------------|
| Dashboard | Today's attendance summary, shift status, surplus/shortage |
| Attendance Entry | Shift-wise customer list with toggle + quantity edit |
| Customers | List, filter by shift, add/edit customer |
| Customer Detail | Calendar view, monthly total, payment history, dues |
| Billing | Generate & download PDF bill per customer per month |
| Expenses | Add/view expenses by category and date |
| Reports | Monthly P/L, Yearly P/L, Comparative analysis |
| Trends | Customer count chart over time |

---

## 9. Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| Owner enters wrong quantity | Allow edit of past records up to end of month |
| Data loss | Turso has built-in replication; periodic export to JSON as backup |
| PDF sharing on mobile | Use browser's native share sheet after PDF download |
| App unavailable offline | Not a hard requirement — web app assumed online |
| Vercel free tier limits | Current scale (100 customers) is well within limits |

---

## 10. Development Phases

### Phase 1 — Core (Must Have)
- Customer CRUD
- Daily attendance entry (both shifts)
- Shift surplus/shortage view
- Customer calendar view

### Phase 2 — Billing
- Monthly bill generation
- PDF export
- Payment / due marking
- Overdue tracking

### Phase 3 — Financials
- Expense tracking
- Monthly P/L report
- Yearly P/L report
- Comparative analysis

### Phase 4 — Analytics
- Customer trend charts
- Yearly summary dashboard

---

## 11. Open Questions for Owner (resolved by requirements)

| Question | Answer from Requirements |
|----------|--------------------------|
| Single user or multi-user? | Single admin |
| Mobile-first? | Yes — responsive required |
| WhatsApp sharing automated? | No — manual file share |
| Offline support? | Not required |
| Authentication needed? | Yes — simple login to protect data |

---

## 12. Estimated Effort

| Phase | Estimated Days |
|-------|----------------|
| Phase 1 | 4–5 days |
| Phase 2 | 3–4 days |
| Phase 3 | 3–4 days |
| Phase 4 | 2–3 days |
| **Total** | **12–16 days** |

---

*Please review this analysis and confirm or suggest changes before implementation begins.*
