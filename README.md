# 🎓 Student Finance Tracker

A professional web app designed to help students **track expenses, budgets, and spending patterns** with style and accessibility in mind.

---

## 🌿 Theme: Emerald Green & Cream White
The interface uses a **calm, success-driven Emerald Green and Cream White palette**, symbolizing financial growth and clarity. Subtle animations and a minimalist layout create a professional, banking-inspired experience.

---

## ✨ Features

- 💰 **Expense Tracking** — Add, view, and delete transactions by description, category, amount, and date.  
- 📊 **Dashboard Analytics** — Displays *Total Spent*, *Top Category*, and *Last 7 Days* chart.  
- 🧠 **Smart Search (Regex Supported)** — Search by keywords or regular expressions (e.g., `food|transport|rent`).  
- 📅 **Budget Management** — Set a monthly budget and view remaining balance.  
- 🌍 **Currency Settings** — Configure base currency and custom exchange rates.  
- 🧩 **Responsive Design** — Fully optimized for mobile (360px), tablet (768px), and desktop (1024px+).  
- ♿ **Accessibility-Friendly** — Skip links, ARIA roles, and screen reader support.

---

## 🧩 Regex Catalog

| Pattern | Matches Example | Description |
|----------|-----------------|--------------|
| `coffee|book|fee` | *coffee* → finds “coffee” or “book” | Multiple keyword search |
| `^\d+(\.\d{2})?$` | `45.00` | Valid currency amounts |
| `^(Food|Transport|Rent)$` | `Food` | Category exact match |
| `2025-10-\d{2}` | `2025-10-12` | Specific date format |
| `^.{0,20}$` | Any short description | Limit description length |

---

## ⌨️ Keyboard Map

| Shortcut | Action |
|-----------|--------|
| `Tab` | Navigate through focusable elements |
| `Enter` | Activate selected button or link |
| `/` | Focus on search input instantly |
| `Esc` | Clear search field |
| `Alt + ↑ / ↓` | Scroll between cards on dashboard |

---

## ♿ Accessibility Notes

- Semantic HTML5 elements used (`<header>`, `<main>`, `<section>`).  
- Screen reader support with `aria-label`, `aria-live`, and skip links.  
- Sufficient color contrast (WCAG AA compliant).  
- Focus indicators and keyboard navigation tested.

---

## 🧪 How to Run & Test

1. **Clone the repository**
   ```bash
   git clone https://github.com/erin-leyian/student-finance-tracker.git
   cd student-finance-tracker
