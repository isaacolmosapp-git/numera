# Numera — Financial & Business Calculators

Fast, zero-dependency bilingual web application (**Spanish / English**) for financial and business calculations, featuring detailed amortization schedules, local catalog persistence (`localStorage`), URL parameter sharing, and client-side **Excel (`.xlsx`)** and **PDF (`.pdf`)** report generation.

## Features

- **Compound Interest** (`finanzas/interes-compuesto.html` | `en/finance/compound-interest.html`) — Future value projections with recurring deposits and compounding frequency options.
- **Loan & Monthly Payment** (`finanzas/calculadora-prestamos.html` | `en/finance/loan-calculator.html`) — Supports French (reducing balance) and Simple (flat-rate) amortization methods with flexible terms.
- **Profit Margin & Selling Price** (`finanzas/margen-ganancia.html` | `en/finance/profit-margin.html`) — Pricing calculator with persistent `localStorage` product catalog for multi-item price lists.
- **Savings Goal** (`finanzas/plan-ahorro.html` | `en/finance/savings-goal.html`) — Target capital timeline and monthly contribution planner.
- **Break-Even Point** (`finanzas/punto-equilibrio.html` | `en/finance/break-even.html`) — Unit contribution margin, target profit volume, and 7-tier sales sensitivity schedule.
- **Investment ROI & CAGR** (`finanzas/calculadora-roi.html` | `en/finance/roi-calculator.html`) — Total ROI, net profit/loss, capital multiplier, and periodic equivalent growth schedule.
- **50/30/20 Monthly Budget** (`finanzas/presupuesto-mensual.html` | `en/finance/monthly-budget.html`) — Income allocation presets (`50/30/20`, `60/20/20`, `70/20/10`), custom rules, and 1-year / 5-year savings projections.
- **Percentage & Discount** (`finanzas/calculadora-porcentajes.html` | `en/finance/percentage-calculator.html`) — Retail discounts with tax/VAT, percentage of a value, percentage change, and persistent `localStorage` calculation history.
- **Zero-Overhead Export Engine (`export.js`):** Lazy-loads **SheetJS** and **jsPDF + AutoTable** on demand, keeping initial page load lightweight (99–100 Lighthouse score).
- **Technical SEO & PWA Ready:** Bidirectional `hreflang` tags, Schema.org JSON-LD (`WebApplication` + `FAQPage`), `sitemap.xml`, `robots.txt`, and `manifest.json`.

## Project Structure

```text
numera/
├── index.html                  # Spanish landing page
├── manifest.json               # PWA manifest
├── robots.txt                  # Crawler directives
├── sitemap.xml                 # Bilingual XML sitemap
├── favicon.svg                 # Brand vector icon
├── assets/
│   ├── css/main.css            # Global dark-mode design system
│   └── js/
│       ├── core.js             # Input bindings, currency formatting & URL state
│       ├── export.js           # Lazy-loaded Excel (.xlsx) & PDF generator
│       └── calculadoras/       # Calculator modules
├── finanzas/                   # Spanish calculator views
└── en/                         # English landing & calculator views