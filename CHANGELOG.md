# Changelog — Numera

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Planned
- **v1.2.0:** Investment ROI & CAGR Calculator (`calculadora-roi.html` / `roi-calculator.html`)
- **v1.3.0:** Monthly Budget 50/30/20 Calculator (`presupuesto-mensual.html` / `monthly-budget.html`)
- **v1.4.0:** Discounts & Percentages Calculator (`calculadora-porcentajes.html` / `percentage-calculator.html`)
- **v2.0.0:** Official public launch on custom domain (`numeratools.com`) + AdSense readiness
- **v2.1.0:** Multi-Product Break-Even mode (weighted contribution margin by sales mix + `localStorage` catalog sync)

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