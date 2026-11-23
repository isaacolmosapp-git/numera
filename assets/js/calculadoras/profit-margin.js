document.addEventListener('DOMContentLoaded', () => {
  const fields = {
    cost: { input: 'unit-cost', slider: 'cost-slider' },
    margin: { input: 'target-margin', slider: 'margin-slider' },
    tax: { input: 'tax-rate', slider: 'tax-slider' }
  };

  NumeraCore.loadParamsFromURL({
    cost: fields.cost,
    margin: fields.margin,
    tax: fields.tax
  });

  const isEn = NumeraCore.lang === 'en';
  const STORAGE_KEY = isEn ? 'numera_margin_catalog_en' : 'numera_margin_catalog_es';

  const finalPriceEl = document.getElementById('result-final-price');
  const netPriceEl = document.getElementById('result-net-price');
  const profitEl = document.getElementById('result-profit');
  const markupEl = document.getElementById('result-markup');
  const barCost = document.getElementById('bar-cost');
  const barProfit = document.getElementById('bar-profit');

  // Elementos del catálogo en localStorage
  const productNameInput = document.getElementById('product-name');
  const saveItemBtn = document.getElementById('save-item-btn');
  const savedSection = document.getElementById('saved-catalog-section');
  const savedCountEl = document.getElementById('saved-count');
  const savedTableBody = document.getElementById('saved-items-body');
  const clearCatalogBtn = document.getElementById('clear-catalog-btn');
  const exportExcelBtn = document.getElementById('export-excel-btn');
  const exportPdfBtn = document.getElementById('export-pdf-btn');

  let latestSummary = '';
  let currentCalculation = null;

  function getSavedItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function setSavedItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('localStorage unavailable', e);
    }
  }

  function calculate() {
    const cost = Math.max(0, parseFloat(document.getElementById(fields.cost.input).value) || 0);
    const rawMargin = Math.max(0, Math.min(99.9, parseFloat(document.getElementById(fields.margin.input).value) || 0));
    const taxRate = Math.max(0, parseFloat(document.getElementById(fields.tax.input).value) || 0);

    const marginDecimal = rawMargin / 100;
    const netPrice = marginDecimal < 1 ? cost / (1 - marginDecimal) : cost;
    const profit = Math.max(0, netPrice - cost);
    const markupPct = cost > 0 ? (profit / cost) * 100 : 0;
    const taxAmount = netPrice * (taxRate / 100);
    const finalPrice = netPrice + taxAmount;

    finalPriceEl.textContent = NumeraCore.formatCurrency(finalPrice);
    netPriceEl.textContent = NumeraCore.formatCurrency(netPrice);
    profitEl.textContent = NumeraCore.formatCurrency(profit);
    markupEl.textContent = `${markupPct.toFixed(1)}%`;

    const costPct = netPrice > 0 ? (cost / netPrice) * 100 : 100;
    const profitPct = Math.max(0, 100 - costPct);

    barCost.style.width = `${costPct}%`;
    barProfit.style.width = `${profitPct}%`;

    currentCalculation = {
      cost,
      margin: rawMargin,
      markup: markupPct,
      netPrice,
      taxRate,
      finalPrice,
      profit
    };

    latestSummary = isEn
      ? `Profit Margin (${rawMargin}% margin on ${NumeraCore.formatCurrency(cost)} cost): Net Price ${NumeraCore.formatCurrency(netPrice)} | Final Price (+${taxRate}% tax): ${NumeraCore.formatCurrency(finalPrice)} | Net Profit: ${NumeraCore.formatCurrency(profit)} (Markup ${markupPct.toFixed(1)}%)`
      : `Margen de Ganancia (${rawMargin}% margen sobre costo ${NumeraCore.formatCurrency(cost)}): Precio Neto ${NumeraCore.formatCurrency(netPrice)} | Precio Final (+${taxRate}% imp.): ${NumeraCore.formatCurrency(finalPrice)} | Ganancia Neta: ${NumeraCore.formatCurrency(profit)} (Markup ${markupPct.toFixed(1)}%)`;
  }

  function renderSavedCatalog() {
    if (!savedSection || !savedTableBody) return;
    const items = getSavedItems();

    if (savedCountEl) {
      savedCountEl.textContent = items.length;
    }

    if (items.length === 0) {
      savedSection.style.display = 'none';
      return;
    }

    savedSection.style.display = 'block';

    savedTableBody.innerHTML = items
      .map(
        (item, idx) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${NumeraCore.formatCurrency(item.cost)}</td>
          <td>${item.margin.toFixed(1)}%</td>
          <td>${NumeraCore.formatCurrency(item.netPrice)}</td>
          <td>${item.taxRate.toFixed(1)}%</td>
          <td><strong>${NumeraCore.formatCurrency(item.finalPrice)}</strong></td>
          <td style="color: var(--accent);">+${NumeraCore.formatCurrency(item.profit)}</td>
          <td style="text-align: center;">
            <button type="button" class="btn-delete-row" data-delete-idx="${idx}" aria-label="Eliminar">×</button>
          </td>
        </tr>
      `
      )
      .join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (saveItemBtn) {
    saveItemBtn.addEventListener('click', () => {
      if (!currentCalculation) return;
      const items = getSavedItems();
      const customName = productNameInput ? productNameInput.value.trim() : '';
      const defaultName = isEn ? `Product #${items.length + 1}` : `Producto #${items.length + 1}`;

      items.push({
        id: Date.now(),
        name: customName || defaultName,
        ...currentCalculation
      });

      setSavedItems(items);
      if (productNameInput) productNameInput.value = '';
      renderSavedCatalog();

      const originalText = saveItemBtn.textContent;
      saveItemBtn.textContent = isEn ? 'Saved!' : '¡Guardado!';
      setTimeout(() => {
        saveItemBtn.textContent = originalText;
      }, 1200);
    });
  }

  if (savedTableBody) {
    savedTableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-delete-idx]');
      if (!btn) return;
      const idx = parseInt(btn.dataset.deleteIdx, 10);
      const items = getSavedItems();
      items.splice(idx, 1);
      setSavedItems(items);
      renderSavedCatalog();
    });
  }

  if (clearCatalogBtn) {
    clearCatalogBtn.addEventListener('click', () => {
      setSavedItems([]);
      renderSavedCatalog();
    });
  }

  function buildCatalogExportPayload() {
    const items = getSavedItems();
    if (!items.length) return null;

    const totalCost = items.reduce((acc, i) => acc + i.cost, 0);
    const totalNet = items.reduce((acc, i) => acc + i.netPrice, 0);
    const totalFinal = items.reduce((acc, i) => acc + i.finalPrice, 0);
    const totalProfit = items.reduce((acc, i) => acc + i.profit, 0);
    const avgMargin = items.reduce((acc, i) => acc + i.margin, 0) / items.length;

    return {
      filename: isEn ? 'numera-price-list' : 'numera-lista-precios',
      title: isEn ? 'Product Pricing & Profit Margin List' : 'Lista de Precios y Márgenes de Ganancia',
      subtitle: isEn
        ? `${items.length} products saved`
        : `${items.length} productos registrados`,
      summaryRows: isEn
        ? [
            ['Total Products', String(items.length)],
            ['Average Profit Margin', `${avgMargin.toFixed(1)}%`],
            ['Combined Unit Cost', NumeraCore.formatCurrency(totalCost)],
            ['Combined Net Price', NumeraCore.formatCurrency(totalNet)],
            ['Combined Final Price (with Tax)', NumeraCore.formatCurrency(totalFinal)],
            ['Combined Net Profit', NumeraCore.formatCurrency(totalProfit)]
          ]
        : [
            ['Total de Productos', String(items.length)],
            ['Margen de Ganancia Promedio', `${avgMargin.toFixed(1)}%`],
            ['Suma de Costos Unitarios', NumeraCore.formatCurrency(totalCost)],
            ['Suma de Precios Netos', NumeraCore.formatCurrency(totalNet)],
            ['Suma de Precios Finales (con Imp.)', NumeraCore.formatCurrency(totalFinal)],
            ['Utilidad Neta Total Estimada', NumeraCore.formatCurrency(totalProfit)]
          ],
      tableHeaders: isEn
        ? ['Product', 'Unit Cost', 'Margin %', 'Markup %', 'Net Price', 'Tax %', 'Final Price', 'Net Profit']
        : ['Producto', 'Costo', 'Margen %', 'Markup %', 'Precio Neto', 'Imp. %', 'Precio Final', 'Ganancia'],
      tableRows: items.map((i) => [
        i.name,
        NumeraCore.formatCurrency(i.cost),
        `${i.margin.toFixed(1)}%`,
        `${i.markup.toFixed(1)}%`,
        NumeraCore.formatCurrency(i.netPrice),
        `${i.taxRate.toFixed(1)}%`,
        NumeraCore.formatCurrency(i.finalPrice),
        NumeraCore.formatCurrency(i.profit)
      ])
    };
  }

  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
      const payload = buildCatalogExportPayload();
      if (window.NumeraExport && payload) {
        NumeraExport.toExcel({ btn: exportExcelBtn, ...payload });
      }
    });
  }

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
      const payload = buildCatalogExportPayload();
      if (window.NumeraExport && payload) {
        NumeraExport.toPDF({ btn: exportPdfBtn, ...payload });
      }
    });
  }

  Object.values(fields).forEach(({ input, slider }) => {
    NumeraCore.bindInput(input, slider, calculate);
  });

  NumeraCore.setupShareAndCopy({
    copyBtnId: 'copy-btn',
    shareBtnId: 'share-btn',
    getSummaryText: () => latestSummary,
    getQueryParams: () => ({
      cost: document.getElementById(fields.cost.input).value,
      margin: document.getElementById(fields.margin.input).value,
      tax: document.getElementById(fields.tax.input).value
    })
  });

  calculate();
  renderSavedCatalog();
});