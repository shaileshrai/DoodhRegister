# Dairy Admin App — Requirements

## Overview
A web-based admin application for a small dairy owner to manage daily milk delivery tracking, customer billing, expense management, and profit/loss reporting.

---

## Functional Requirements

### FR-1: Customer Management
- **FR-1.1** Add a new customer with the following details:
  - Name
  - Mobile Number
  - Shift (Morning / Evening)
  - Rate (price per litre or unit)
  - Default daily quantity (contracted amount)
- **FR-1.2** Edit or deactivate existing customers.
- **FR-1.3** View customer list filtered by shift.
- **FR-1.4** Track customer addition and removal trends over time.

### FR-2: Shift Management
- **FR-2.1** Categorise customers into Morning and Evening shifts.
- **FR-2.2** View a shift-wise summary showing which customers have and have not taken milk on a given day.
- **FR-2.3** Calculate surplus/shortage per shift based on attendance vs. expected quantity.

### FR-3: Daily Milk Attendance
- **FR-3.1** Mark daily milk attendance per customer (taken / not taken).
- **FR-3.2** Allow modification of quantity for individual customers on a given day (override the contracted quantity).
- **FR-3.3** Default quantity pre-filled from the customer's contracted amount.
- **FR-3.4** Support both Morning and Evening shift attendance entry.

### FR-4: Customer Milk History (Calendar View)
- **FR-4.1** Open a customer detail section showing a monthly calendar view of milk taken each day.
- **FR-4.2** Display the monthly total milk quantity per customer.
- **FR-4.3** Navigate across months for a given customer.

### FR-5: Billing
- **FR-5.1** Generate a monthly bill for each customer based on daily milk records and rate.
- **FR-5.2** Export/share the bill as a PDF receipt.
- **FR-5.3** Mark monthly payment status per customer as **Paid** or **Due**.
- **FR-5.4** Support overdue tracking for customers who pay every 2+ months.
- **FR-5.5** Show outstanding dues clearly on the customer profile.

### FR-6: Expense Tracking
- **FR-6.1** Capture expenses with the following fields:
  - Category (Fodder, Medicine, Repairing, Manpower, Power, Other)
  - Date
  - Amount
  - Optional description/note
- **FR-6.2** View expenses filtered by category and/or date range.
- **FR-6.3** Monthly expense summary.

### FR-7: Profit/Loss Reports
- **FR-7.1** Generate a monthly detailed profit/loss report (revenue from milk sales minus expenses).
- **FR-7.2** Generate a yearly profit/loss report.
- **FR-7.3** Comparative analysis between any two selected months.
- **FR-7.4** Comparative analysis across yearly periods.

### FR-8: Customer Trend Analysis
- **FR-8.1** Visualise customer count (additions/removals) over time.
- **FR-8.2** View current active customer count per shift.

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Support up to **1,000 customers** (current ~100) |
| NFR-2 | Retain customer monthly milk details for a **maximum of 4 months** |
| NFR-3 | Retain expense records for a **minimum of 12 months** |
| NFR-4 | Retain profit/loss reports for a **minimum of 10 years** |
| NFR-5 | The application must be **web-based** |
| NFR-6 | Accessible from a single admin account (no multi-user needed at this time) |
| NFR-7 | Budget for hosting: **≤ ₹1,200/year** |
| NFR-8 | PDF generation must work without a third-party paid service |
| NFR-9 | App should be usable on mobile browser (responsive) |

---

## Data Retention Policy

| Data Type | Retention Period |
|-----------|-----------------|
| Daily milk attendance per customer | 4 months rolling |
| Expense records | 12 months minimum |
| Monthly billing records | 12 months minimum |
| Profit/loss reports | 10 years |
| Customer master data | Indefinite (soft delete on removal) |

---

## Out of Scope (v1)
- Multi-user / role-based access
- Automated WhatsApp/SMS sharing (manual share of PDF is sufficient)
- Inventory/stock management beyond milk surplus tracking
- Online payment integration
