# Changelog — Numera

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Planned
- **v2.2.0:** Multi-Product Break-Even mode (weighted contribution margin by sales mix + `localStorage` catalog sync)

---

## [2.1.0] - 2026-11-25

### Added
- Expanded editorial guides, step-by-step worked examples, and contextual internal linking across all 16 bilingual calculator views (ES/EN).
- Added extended FAQ sections and synchronized `FAQPage` Schema.org JSON-LD structured data across all calculators to enhance organic search visibility and AdSense readiness.

---

## [2.0.0] - 2026-11-24
### Added
- Bilingual **Contact & Feedback** pages (`legal/contacto.html` and `legal/contact.html`) integrated with Web3Forms and direct email support (`contact@numeratools.com`).
- Added Privacy Policy and Contact pages to `sitemap.xml` and global site footers.

### Changed
- Migrated all canonical URLs, `hreflang` tags, Schema.org metadata, `sitemap.xml`, `robots.txt`, and PDF export footers to `https://numeratools.com`.
- Bumped `NumeraCore.version` to `v2.0.0`.

---

## [1.4.0] - 2026-11-24
### Added
- **Percentage & Discount Calculator** (`finanzas/calculadora-porcentajes.html` and `en/finance/percentage-calculator.html` + `percentage-calculator.js`) supporting three calculation modes: Discount & Sales Tax/VAT, Percentage of a Value (`X% of Y`), and Percentage Change (`From X to Y`).
- Persistent `localStorage` calculation history list with **Excel (`.xlsx`)** and **PDF (`.pdf`)** batch export.
- Bilingual `sitemap.xml` entries, Schema.org metadata, and homepage navigation cards.

### Changed
- Updated `NumeraCore.version` in `core.js` to `v1.4.0`.

--

## [1.3.0] - 2026-11-24
### Added
- **50/30/20 Monthly Budget Calculator** (`finanzas/presupuesto-mensual.html` and `en/finance/monthly-budget.html` + `monthly-budget.js`) featuring preset distribution rules (`50/30/20`, `60/20/20`, `70/20/10`), custom percentage sliders with `100%` sum validation, and 1-year / 5-year cumulative savings projections.
- Monthly vs. annual budget allocation breakdown table with **Excel (`.xlsx`)** and **PDF (`.pdf`)** export.
- Bilingual `sitemap.xml` entries, Schema.org metadata, and homepage navigation cards.

### Changed
- Updated `NumeraCore.version` in `core.js` to `v1.3.0`.

---

## [1.2.0] - 2026-11-24
### Added
- **Investment ROI & CAGR Calculator** (`finanzas/calculadora-roi.html` and `en/finance/roi-calculator.html` + `roi-calculator.js`) calculating total ROI percentage, net profit/loss, capital multiplier, and annualized return (CAGR) across flexible year/month timeframes, including optional additional costs and fees.
- Annualized growth projection schedule based on the calculated CAGR with direct **Excel (`.xlsx`)** and **PDF (`.pdf`)** report export.
- Bilingual `sitemap.xml` entries, Schema.org metadata, and homepage navigation cards for the ROI & CAGR calculator.

### Changed
- Updated `NumeraCore.version` in `core.js` to `v1.2.0`.

---

## [1.1.0] - 2026-11-24
### Added
- **Break-Even Point Calculator** (`finanzas/punto-equilibrio.html` and `en/finance/break-even.html` + `break-even.js`) with unit contribution margin, contribution ratio, optional target profit calculation, and negative-margin validation alert.
- Dynamic 7-tier sales volume & net profit sensitivity schedule (`25%` to `200%` of break-even volume) with direct **Excel (`.xlsx`)** and **PDF (`.pdf`)** report export.
- Bilingual `sitemap.xml` entries and homepage navigation cards for the Break-Even calculator.

### Changed
- Centralized dynamic version rendering (`NumeraCore.version`) in `core.js` so footer version badges update automatically across all pages.

---

## [1.0.0-beta] - 2026-11-24
### Added
- Bilingual architecture (**Spanish / English**) with bidirectional `hreflang` metadata and Schema.org JSON-LD (`WebApplication` + `FAQPage`).
- **Compound Interest Calculator** with year-by-year projection schedule.
- **Loan & Monthly Payment Calculator** supporting French (reducing balance) and Simple (flat-rate) interest methods, annual/monthly rates, and flexible terms.
- **Profit Margin & Selling Price Calculator** with `localStorage` product catalog persistence for multi-item price lists.
- **Savings Goal Calculator** for target capital planning.
- Centralized client-side export module (`export.js`) with lazy-loaded **SheetJS (`.xlsx`)** and **jsPDF + AutoTable (`.pdf`)** generators.
- PWA manifest (`manifest.json`), vector favicon (`favicon.svg`), `sitemap.xml`, and `robots.txt`.