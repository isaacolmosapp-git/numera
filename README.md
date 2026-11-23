# Numera — Financial & Business Calculators

Fast, zero-dependency bilingual web application (**Spanish / English**) for financial and business calculations, featuring detailed amortization schedules, local catalog persistence (`localStorage`), URL parameter sharing, and client-side **Excel (`.xlsx`)** and **PDF (`.pdf`)** report generation.

## Features

- **Compound Interest Calculator:** Projects capital growth with monthly contributions, interactive sliders, and year-by-year breakdown.
- **Loan & Amortization Calculator:** Supports both **French (reducing balance)** and **Simple (flat-rate)** interest methods, annual/monthly rates, and flexible terms.
- **Profit Margin & Selling Price Calculator:** Computes net price, gross margin, markup, and tax, plus a local product catalog (`localStorage`) for multi-item price list exports.
- **Savings Goal Calculator:** Determines required monthly savings to reach a target amount within a set timeframe.
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