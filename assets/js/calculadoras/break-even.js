document.addEventListener('DOMContentLoaded', () => {
  const fields = {
    fixed: { input: 'fixed-costs', slider: 'fixed-slider' },
    price: { input: 'unit-price', slider: 'price-slider' },
    variable: { input: 'variable-cost', slider: 'variable-slider' },
    targetProfit: { input: 'target-profit', slider: 'profit-slider' }
  };

  NumeraCore.loadParamsFromURL({
    fixed: fields.fixed,
    price: fields.price,
    variable: fields.variable,
    profit: fields.targetProfit
  });

  const isEn = NumeraCore.lang === 'en';

  const unitsEl = document.getElementById('result-units');
  const revenueEl = document.getElementById('result-revenue');
  const contribMarginEl = document.getElementById('result-contrib-margin');
  const contribRatioEl = document.getElementById('result-contrib-ratio');
  const barVariable = document.getElementById('bar-variable');
  const barContrib = document.getElementById('bar-contrib');
  const warningBox = document.getElementById('breakeven-warning');
  const scheduleBody = document.getElementById('breakeven-schedule-body');

  let latestSummary = '';
  let latestExportData = null;

  function calculate() {
    const fixedCosts = Math.max(0, parseFloat(document.getElementById(fields.fixed.input).value) || 0);
    const unitPrice = Math.max(0, parseFloat(document.getElementById(fields.price.input).value) || 0);
    const variableCost = Math.max(0, parseFloat(document.getElementById(fields.variable.input).value) || 0);
    const targetProfit = Math.max(0, parseFloat(document.getElementById(fields.targetProfit.input).value) || 0);

    const contributionMargin = unitPrice - variableCost;
    const contributionRatio = unitPrice > 0 ? (contributionMargin / unitPrice) * 100 : 0;

    // Caso crítico: costo variable >= precio de venta
    if (contributionMargin <= 0) {
      if (warningBox) warningBox.style.display = 'block';
      unitsEl.textContent = '—';
      revenueEl.textContent = '—';
      contribMarginEl.textContent = NumeraCore.formatCurrency(contributionMargin);
      contribRatioEl.textContent = `${contributionRatio.toFixed(1)}%`;

      barVariable.style.width = '100%';
      barContrib.style.width = '0%';

      if (scheduleBody) scheduleBody.innerHTML = '';
      latestExportData = null;
      latestSummary = isEn
        ? 'Break-Even Point: Unit price must be higher than unit variable cost.'
        : 'Punto de Equilibrio: El precio de venta debe ser mayor al costo variable unitario.';
      return;
    }

    if (warningBox) warningBox.style.display = 'none';

    const totalCostsToCover = fixedCosts + targetProfit;
    const exactUnits = totalCostsToCover / contributionMargin;
    const breakEvenUnits = Math.ceil(exactUnits);
    const breakEvenRevenue = breakEvenUnits * unitPrice;

    const unitSuffix = isEn
      ? breakEvenUnits === 1 ? 'unit' : 'units'
      : breakEvenUnits === 1 ? 'unidad' : 'unidades';

    unitsEl.textContent = `${breakEvenUnits.toLocaleString(isEn ? 'en-US' : 'es-ES')} ${unitSuffix}`;
    revenueEl.textContent = NumeraCore.formatCurrency(breakEvenRevenue);
    contribMarginEl.textContent = NumeraCore.formatCurrency(contributionMargin);
    contribRatioEl.textContent = `${contributionRatio.toFixed(1)}%`;

    const variablePct = unitPrice > 0 ? Math.min(100, (variableCost / unitPrice) * 100) : 100;
    const contribPct = Math.max(0, 100 - variablePct);

    barVariable.style.width = `${variablePct}%`;
    barContrib.style.width = `${contribPct}%`;

    // Generar tabla de escenarios alrededor del punto de equilibrio
    const baseUnits = Math.max(4, breakEvenUnits);
    const multipliers = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
    const rows = multipliers.map((mult) => {
      const units = mult === 1 ? breakEvenUnits : Math.round(baseUnits * mult);
      const revenue = units * unitPrice;
      const totalCost = fixedCosts + units * variableCost;
      const netProfit = revenue - totalCost;
      const pctLabel = `${Math.round(mult * 100)}%`;

      return {
        scenario: mult === 1
          ? (isEn ? '100% (Break-Even)' : '100% (Equilibrio)')
          : pctLabel,
        isBreakEven: mult === 1,
        units,
        revenue,
        totalCost,
        netProfit
      };
    });

    renderScheduleTable(rows);

    latestSummary = isEn
      ? `Break-Even Point (Fixed: ${NumeraCore.formatCurrency(fixedCosts)}, Price: ${NumeraCore.formatCurrency(unitPrice)}, Var. Cost: ${NumeraCore.formatCurrency(variableCost)}): ${breakEvenUnits.toLocaleString('en-US')} units (${NumeraCore.formatCurrency(breakEvenRevenue)} revenue) | Unit Contribution: ${NumeraCore.formatCurrency(contributionMargin)} (${contributionRatio.toFixed(1)}%)`
      : `Punto de Equilibrio (Fijos: ${NumeraCore.formatCurrency(fixedCosts)}, Precio: ${NumeraCore.formatCurrency(unitPrice)}, Costo Var.: ${NumeraCore.formatCurrency(variableCost)}): ${breakEvenUnits.toLocaleString('es-ES')} unidades (${NumeraCore.formatCurrency(breakEvenRevenue)} en ventas) | Margen Contribución: ${NumeraCore.formatCurrency(contributionMargin)} (${contributionRatio.toFixed(1)}%)`;

    const summaryRows = isEn
      ? [
          ['Monthly Fixed Costs', NumeraCore.formatCurrency(fixedCosts)],
          ['Unit Selling Price', NumeraCore.formatCurrency(unitPrice)],
          ['Unit Variable Cost', NumeraCore.formatCurrency(variableCost)],
          ...(targetProfit > 0 ? [['Target Net Profit', NumeraCore.formatCurrency(targetProfit)]] : []),
          ['Unit Contribution Margin', `${NumeraCore.formatCurrency(contributionMargin)} (${contributionRatio.toFixed(1)}%)`],
          ['Required Sales Volume', `${breakEvenUnits.toLocaleString('en-US')} units`],
          ['Required Revenue', NumeraCore.formatCurrency(breakEvenRevenue)]
        ]
      : [
          ['Costos Fijos Mensuales', NumeraCore.formatCurrency(fixedCosts)],
          ['Precio de Venta Unitario', NumeraCore.formatCurrency(unitPrice)],
          ['Costo Variable Unitario', NumeraCore.formatCurrency(variableCost)],
          ...(targetProfit > 0 ? [['Meta de Ganancia Deseada', NumeraCore.formatCurrency(targetProfit)]] : []),
          ['Margen de Contribución Unitario', `${NumeraCore.formatCurrency(contributionMargin)} (${contributionRatio.toFixed(1)}%)`],
          ['Unidades Mínimas a Vender', `${breakEvenUnits.toLocaleString('es-ES')} unidades`],
          ['Ventas / Ingresos Necesarios', NumeraCore.formatCurrency(breakEvenRevenue)]
        ];

    latestExportData = {
      filename: isEn ? 'numera-break-even-analysis' : 'numera-punto-equilibrio',
      title: isEn ? 'Break-Even Point Analysis' : 'Análisis de Punto de Equilibrio',
      subtitle: isEn
        ? `Fixed Costs: ${NumeraCore.formatCurrency(fixedCosts)} | Unit Margin: ${NumeraCore.formatCurrency(contributionMargin)}`
        : `Costos Fijos: ${NumeraCore.formatCurrency(fixedCosts)} | Margen Unitario: ${NumeraCore.formatCurrency(contributionMargin)}`,
      summaryRows,
      tableHeaders: isEn
        ? ['Volume Level', 'Units Sold', 'Total Revenue', 'Total Costs', 'Net Profit / Loss']
        : ['Nivel de Volumen', 'Unidades', 'Ingresos Totales', 'Costos Totales', 'Utilidad / Pérdida'],
      tableRows: rows.map((r) => [
        r.scenario,
        r.units.toLocaleString(isEn ? 'en-US' : 'es-ES'),
        NumeraCore.formatCurrency(r.revenue),
        NumeraCore.formatCurrency(r.totalCost),
        NumeraCore.formatCurrency(r.netProfit)
      ])
    };
  }

  function renderScheduleTable(rows) {
    if (!scheduleBody) return;
    const locale = isEn ? 'en-US' : 'es-ES';

    scheduleBody.innerHTML = rows
      .map((row) => {
        const profitColor = row.netProfit > 0 ? 'var(--accent)' : row.netProfit < 0 ? '#f87171' : 'var(--text-primary)';
        const profitPrefix = row.netProfit > 0 ? '+' : '';
        const rowStyle = row.isBreakEven ? 'background-color: rgba(16, 185, 129, 0.08);' : '';

        return `
          <tr style="${rowStyle}">
            <td>${row.scenario}</td>
            <td>${row.units.toLocaleString(locale)}</td>
            <td>${NumeraCore.formatCurrency(row.revenue)}</td>
            <td>${NumeraCore.formatCurrency(row.totalCost)}</td>
            <td style="color: ${profitColor}; font-weight: 700;">${profitPrefix}${NumeraCore.formatCurrency(row.netProfit)}</td>
          </tr>
        `;
      })
      .join('');
  }

  Object.values(fields).forEach(({ input, slider }) => {
    NumeraCore.bindInput(input, slider, calculate);
  });

  NumeraCore.setupShareAndCopy({
    copyBtnId: 'copy-btn',
    shareBtnId: 'share-btn',
    getSummaryText: () => latestSummary,
    getQueryParams: () => ({
      fixed: document.getElementById(fields.fixed.input).value,
      price: document.getElementById(fields.price.input).value,
      variable: document.getElementById(fields.variable.input).value,
      profit: document.getElementById(fields.targetProfit.input).value
    })
  });

  const excelBtn = document.getElementById('export-excel-btn');
  const pdfBtn = document.getElementById('export-pdf-btn');

  if (excelBtn) {
    excelBtn.addEventListener('click', () => {
      if (window.NumeraExport && latestExportData) {
        NumeraExport.toExcel({ btn: excelBtn, ...latestExportData });
      }
    });
  }

  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      if (window.NumeraExport && latestExportData) {
        NumeraExport.toPDF({ btn: pdfBtn, ...latestExportData });
      }
    });
  }

  calculate();
});