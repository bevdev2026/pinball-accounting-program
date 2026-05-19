# Pinball Accounting App — Figma Make UI Brief

## App Overview

A desktop accounting application for pinball machine operators. The app tracks machines, revenue, expenses, rent & commission, loans, and maintenance. It is data-dense and professional in tone — designed for a single operator who needs quick access to financial snapshots and operational status at a glance.

**Visual direction:** Dark industrial steampunk — worn metal, aged copper, and verdigris patina. The brand logo establishes the tone: deep charcoal backgrounds, copper/bronze as the primary accent color, oxidized teal-green as a secondary accent, and aged cream for secondary text. Chrome silver for small highlights. Surfaces should feel textured and weighty — not flat or modern-minimal. Think operator control panel, not SaaS dashboard. Data tables, KPI cards, and charts are the primary UI building blocks. The interface should feel confident and capable.

> **Note:** A full brand kit will be provided separately and should take precedence over these color suggestions. Use this section only to establish overall tone and aesthetic direction.

**Layout:** Fixed left sidebar navigation. Main content area fills the remainder of the screen. No top navigation bar.

---

## Navigation (Left Sidebar)

Eight items, in this order. All are top-level — no nested menus.

1. Dashboard
2. Machines
3. Revenue
4. Expenses
5. Rent & Commission
6. Liabilities
7. Reports
8. Dropbox

Active state should be clearly indicated. Include a small icon alongside each label.

---

## Screen Layouts

---

### 1. Dashboard

The home screen. Everything is read-only — no data entry here.

**Top row — 4 KPI cards, equal width:**
- Total Gross Revenue
- Net Revenue
- Total Expenses
- Net Profit

Each card shows two values: **Current Month** and **Year to Date**, labeled clearly. Use a subtle accent or divider between the two figures within each card.

**Middle row — 3 charts, side by side:**
- Gross Revenue over time (line or bar chart)
- Expenses over time (line or bar chart)
- Net Profit over time (line or bar chart)

Each chart has a time range filter above or below it (e.g., Last 30 Days / Last 3 Months / YTD / Custom). Charts should feel like a real data visualization — not placeholder boxes.

**Bottom row — 2 panels side by side:**

*Left panel — Maintenance Alerts:*
A list of machines with overdue or upcoming maintenance. Each row shows: Machine Name, Maintenance Item, Due Date, and a status indicator (e.g., Overdue in red, Due Soon in amber). If no alerts, display a friendly empty state.

*Right panel — Loans Summary:*
A compact list of active loans. Each row shows: Loan Name, Remaining Balance, and Total Paid to Date. Simple, no charts needed here.

---

### 2. Machines

**Default view — Machine List:**
A full-width table with the following columns:
- Machine Name
- Status (badge: Active / Out of Service / Retired — color-coded)
- Purchase Price
- Date Acquired

Include a search/filter bar above the table. Allow filtering by Status. Include an **Add Machine** button (top right).

Clicking any row navigates to the Machine Detail view.

---

**Machine Detail View (drill-in, not a new nav item):**

Header area: Machine Name (large), Status badge, Purchase Price, Date Acquired. Include an **Upload Documentation** button (placeholder — no functionality needed, just the UI element) and an **Archive Machine** button.

Below the header, two tabs:

**Tab 1 — Maintenance Log:**
- A table of past maintenance entries: Date, Item, Cost (optional), Notes
- An **Add Entry** button to log a new maintenance event
- A secondary section or collapsible panel titled "Maintenance Schedule" showing upcoming/suggested maintenance dates per item, with the interval and last completed date

**Tab 2 — Expenses:**
- A filtered view of all expenses linked to this machine
- Same table layout as the main Expenses screen (Date, Category, Amount, Notes)

---

### 3. Revenue

Two sub-sections accessible via tabs or toggle at the top of the page:

**Tab 1 — Machine Revenue:**
A table of collection entries with columns: Date, Machine Name, Coin, Bill, Card, Phone Tap, Total. Include an **Add Collection** button. Above the table, show a summary bar: total revenue for the filtered period, broken down by payment type. Filter by date range and by machine.

**Tab 2 — Other Revenue:**
A table with columns: Date, Category, Amount, Notes. Include an **Add Entry** button and a button to **Manage Categories** (opens a simple modal to add/edit user-defined categories).

---

### 4. Expenses

A table with columns: Date, Category, Amount, Machine (optional), Notes. Include an **Add Expense** button (top right) and a **Manage Categories** button. Filter controls above the table: date range, category, machine.

The Add Expense form (modal or slide-in panel) includes:
- Date (date picker)
- Category (dropdown)
- Amount
- Description / Notes
- Machine Association (optional dropdown)
- File Attachment (optional — placeholder UI only, no upload functionality needed)

---

### 5. Rent & Commission

A single-page configuration and history view.

**Top section — Current Agreement:**
A display of the active agreement structure. Should clearly show the arrangement type (flat fee, percentage, or combination) and the current values. Include an **Edit Agreement** button that opens a form to update the terms.

**Bottom section — Payment History:**
A table of past rent & commission deductions: Date, Period, Gross Revenue, Amount Deducted, Calculation Method. This is auto-calculated, not manually entered.

---

### 6. Liabilities

**Default view — Loan List:**
A table or set of cards showing all active loans: Loan Name, Principal, Interest Rate, Remaining Balance, Total Paid. Include an **Add Loan** button.

Clicking a loan opens a Loan Detail view.

---

**Loan Detail View (drill-in):**

Header: Loan Name, Principal Amount, Interest Rate, Compounding Interval, Term, Payment Frequency.

Below the header, three prominent figures:
- Current Amount Owed
- Total Paid to Date
- Remaining Balance

A **Payment History** table below that: Payment Date, Amount, Remaining Balance After Payment.

---

### 7. Reports

A clean export hub. No charts needed here — this is purely functional.

A list of available export types, each as a labeled row or card:
- Machine Revenue
- Other Revenue
- Expenses
- Maintenance Log
- Loan Summary
- Full P&L Summary

Each row has a date range filter (From / To) and an **Export CSV** button. The layout should be simple and form-like — the user picks a report type, sets a date range, and clicks export.

---

### 8. Dropbox

A file storage view.

**Top controls:** Upload File button, search bar.

**Main area:** A grid or list of uploaded files. Each file shows: File Name, File Type icon, Date Uploaded, and optionally which record it's linked to (e.g., "Linked to: Black Knight 3000"). Include a delete option per file.

Toggle between grid view (icon + filename) and list view (table with metadata).

---

## Component Patterns to Use Consistently

- **Tables:** Striped rows or clear row separators. Sortable columns where it makes sense. Pagination or infinite scroll for long lists.
- **Modals / Slide-in Panels:** Used for Add and Edit forms. Should not navigate away from the current screen.
- **Status Badges:** Pill-shaped, color-coded. Active = green, Out of Service = amber, Retired = gray, Overdue = red, Due Soon = amber.
- **Buttons:** Primary action (Add, Save, Export) clearly distinguished from secondary (Cancel, Edit, Manage).
- **Empty States:** Every table and list should have a designed empty state — a short message and a prompt to add the first item.
- **Date Pickers & Range Filters:** Appear on Revenue, Expenses, Reports, and Dashboard charts.

---

## What This App Is NOT

- Not a consumer app — no onboarding flows, marketing copy, or illustrations
- Not mobile — desktop only, can assume wide screen
- Not minimal to the point of being sparse — it needs to hold a lot of data comfortably
