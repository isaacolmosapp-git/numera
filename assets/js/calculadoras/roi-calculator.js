document.addEventListener('DOMContentLoaded', () => {
  const fields = {
    initial: { input: 'initial-investment', slider: 'initial-slider' },
    final: { input: 'final-value', slider: 'final-slider' },
    costs: { input: 'extra-costs', slider: 'costs-slider' },
    duration: { input: 'investment-duration', slider: 'duration-slider' }
  };

  NumeraCore.loadParamsFromURL({
    initial: fields.initial,
    final: fields.final,
    costs: fields.costs,
    duration: fields.duration
  });

  const periodUnitSelect = document.getElementById('duration-unit');
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('unit') && periodUnitSelect) {
    periodUnitSelect.value = urlParams.get('unit') === 'months' ? 'months' : 'years';
  }

  const isEn = NumeraCore.lang === 'en';

  const roiEl = document.getElementById('result-roi');
  const netProfitEl = document.getElementById('result-net-profit');
  const cagrEl = document.getElementById('result-cagr');
  const multiplierEl = document.getElementById('result-multiplier');
  const totalInvestedEl = document.getElementById('result-total-invested');
  const barPrincipal = document.getElementById('bar-principal');
  const barGain = document.getElementById('bar-gain');
  const scheduleBody = document.getElementById('roi-schedule-body');

  let latestSummary = '';
  let latestExportData = null;

  function calculate() {
    const initialInvestment = Math.max(0, parseFloat(document.getElementById(fields.initial.input).value) || 0);
    const finalValue = Math.max(0, parseFloat(document.getElementById(fields.final.input).value) || 0);
    const extraCosts = Math.max(0, parseFloat(document.getElementById(fields.costs.input).value) || 0);
    const durationRaw = Math.max(0.1, parseFloat(document.getElementById(fields.duration.input).value) || 1);
    const unit = periodUnitSelect ? periodUnitSelect.value : 'years';

    const years = unit === 'months' ? durationRaw / 12 : durationRaw;
    const totalInvested = initialInvestment + extraCosts;
    const netProfit = finalValue - totalInvested;

    const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    const multiplier = totalInvested > 0 ? finalValue / totalInvested : 0;

    // CAGR: ((Valor Final / Inversión Total) ^ (1 / años)) - 1
    let cagr = 0;
    if (totalInvested > 0 && finalValue > 0 && years > 0) {
      cagr = (Math.pow(finalValue / totalInvested, 1 / years) - 1) * 100;
    } else if (totalInvested > 0 && finalValue === 0) {
      cagr = -100;
    }

    const roiPrefix = roi > 0 ? '+' : '';
    const profitPrefix = netProfit > 0 ? '+' : '';
    const cagrPrefix = cagr > 0 ? '+' : '';

    roiEl.textContent = `${roiPrefix}${roi.toFixed(2)}%`;
    roiEl.style.color = netProfit >= 0 ? 'var(--accent)' : '#f87171';

    netProfitEl.textContent = `${profitPrefix}${NumeraCore.formatCurrency(netProfit)}`;
    netProfitEl.style.color = netProfit >= 0 ? 'var(--accent)' : '#f87171';

    cagrEl.textContent = `${cagrPrefix}${cagr.toFixed(2)}%`;
    multiplierEl.textContent = `${multiplier.toFixed(2)}x`;
    totalInvestedEl.textContent = NumeraCore.formatCurrency(totalInvested);

    // Barra visual
    if (netProfit > 0 && finalValue > 0) {
      const principalPct = Math.min(100, (totalInvested / finalValue) * 100);
      barPrincipal.style.width = `${principalPct}%`;
      barGain.style.width = `${100 - principalPct}%`;
    } else {
      barPrincipal.style.width = '100%';
      barGain.style.width = '0%';
    }

    // Tabla de evolución equivalente según la unidad elegida (Meses o Años)
    const isMonths = unit === 'months';
    const totalSteps = Math.max(1, Math.min(isMonths ? 120 : 50, Math.ceil(durationRaw)));
    const annualRate = cagr / 100;
    const periodicRate = isMonths
      ? (annualRate <= -1 ? -1 : Math.pow(1 + annualRate, 1 / 12) - 1)
      : annualRate;

    const rows = [];

    for (let step = 1; step <= totalSteps; step++) {
      const effectiveTime = step === totalSteps && durationRaw < step ? durationRaw : step;
      const projectedBalance = totalInvested > 0
        ? totalInvested * Math.pow(1 + periodicRate, effectiveTime)
        : 0;
      const cumulativeGain = projectedBalance - totalInvested;

      const isFractionalFinal = step === totalSteps && durationRaw % 1 !== 0;
      let periodLabel = '';

      if (isMonths) {
        periodLabel = isFractionalFinal
          ? (isEn ? `Month ${durationRaw.toFixed(1)} (Final)` : `Mes ${durationRaw.toFixed(1)} (Final)`)
          : (isEn ? `Month ${step}` : `Mes ${step}`);
      } else {
        periodLabel = isFractionalFinal
          ? (isEn ? `Year ${durationRaw.toFixed(2)} (Final)` : `Año ${durationRaw.toFixed(2)} (Final)`)
          : (isEn ? `Year ${step}` : `Año ${step}`);
      }

      rows.push({
        period: periodLabel,
        invested: totalInvested,
        gain: cumulativeGain,
        balance: projectedBalance
      });
    }

    renderScheduleTable(rows);

    const periodText = isEn
      ? `${durationRaw} ${unit === 'months' ? (durationRaw === 1 ? 'month' : 'months') : (durationRaw === 1 ? 'year' : 'years')}`
      : `${durationRaw} ${unit === 'months' ? (durationRaw === 1 ? 'mes' : 'meses') : (durationRaw === 1 ? 'año' : 'años')}`;

    latestSummary = isEn
      ? `Investment ROI (${NumeraCore.formatCurrency(totalInvested)} invested → ${NumeraCore.formatCurrency(finalValue)} over ${periodText}): ROI ${roiPrefix}${roi.toFixed(2)}% | Net Profit: ${profitPrefix}${NumeraCore.formatCurrency(netProfit)} | CAGR: ${cagrPrefix}${cagr.toFixed(2)}%`
      : `Rentabilidad ROI (${NumeraCore.formatCurrency(totalInvested)} invertidos → ${NumeraCore.formatCurrency(finalValue)} en ${periodText}): ROI ${roiPrefix}${roi.toFixed(2)}% | Ganancia Neta: ${profitPrefix}${NumeraCore.formatCurrency(netProfit)} | CAGR: ${cagrPrefix}${cagr.toFixed(2)}%`;

    latestExportData = {
      filename: isEn ? 'numera-roi-analysis' : 'numera-rentabilidad-roi',
      title: isEn ? 'Investment ROI & CAGR Report' : 'Reporte de Rentabilidad (ROI y CAGR)',
      subtitle: isEn
        ? `Total Invested: ${NumeraCore.formatCurrency(totalInvested)} | Duration: ${periodText}`
        : `Inversión Total: ${NumeraCore.formatCurrency(totalInvested)} | Plazo: ${periodText}`,
      summaryRows: isEn
        ? [
            ['Initial Investment', NumeraCore.formatCurrency(initialInvestment)],
            ['Additional Costs / Fees', NumeraCore.formatCurrency(extraCosts)],
            ['Total Capital Invested', NumeraCore.formatCurrency(totalInvested)],
            ['Final Return Value', NumeraCore.formatCurrency(finalValue)],
            ['Investment Duration', periodText],
            ['Net Profit / Loss', `${profitPrefix}${NumeraCore.formatCurrency(netProfit)}`],
            ['Total ROI', `${roiPrefix}${roi.toFixed(2)}%`],
            ['Annualized Return (CAGR)', `${cagrPrefix}${cagr.toFixed(2)}%`],
            ['Capital Multiplier', `${multiplier.toFixed(2)}x`]
          ]
        : [
            ['Inversión Inicial', NumeraCore.formatCurrency(initialInvestment)],
            ['Costos Adicionales / Comisiones', NumeraCore.formatCurrency(extraCosts)],
            ['Capital Total Invertido', NumeraCore.formatCurrency(totalInvested)],
            ['Valor Final Obtenido', NumeraCore.formatCurrency(finalValue)],
            ['Plazo de la Inversión', periodText],
            ['Ganancia / Pérdida Neta', `${profitPrefix}${NumeraCore.formatCurrency(netProfit)}`],
            ['ROI Total', `${roiPrefix}${roi.toFixed(2)}%`],
            ['Rentabilidad Anualizada (CAGR)', `${cagrPrefix}${cagr.toFixed(2)}%`],
            ['Multiplicador de Capital', `${multiplier.toFixed(2)}x`]
          ],
      tableHeaders: isEn
        ? ['Period', 'Total Invested', 'Cumulative Gain / Loss', 'Projected Value']
        : ['Período', 'Capital Invertido', 'Ganancia / Pérdida Acum.', 'Valor Proyectado'],
      tableRows: rows.map((r) => [
        r.period,
        NumeraCore.formatCurrency(r.invested),
        NumeraCore.formatCurrency(r.gain),
        NumeraCore.formatCurrency(r.balance)
      ])
    };
  }

  function renderScheduleTable(rows) {
    if (!scheduleBody) return;
    scheduleBody.innerHTML = rows
      .map((row) => {
        const gainColor = row.gain >= 0 ? 'var(--accent)' : '#f87171';
        const gainPrefix = row.gain > 0 ? '+' : '';
        return `
          <tr>
            <td>${row.period}</td>
            <td>${NumeraCore.formatCurrency(row.invested)}</td>
            <td style="color: ${gainColor}; font-weight: 600;">${gainPrefix}${NumeraCore.formatCurrency(row.gain)}</td>
            <td style="font-weight: 700;">${NumeraCore.formatCurrency(row.balance)}</td>
          </tr>
        `;
      })
      .join('');
  }

  Object.values(fields).forEach(({ input, slider }) => {
    NumeraCore.bindInput(input, slider, calculate);
  });

  if (periodUnitSelect) {
    periodUnitSelect.addEventListener('change', calculate);
  }

  NumeraCore.setupShareAndCopy({
    copyBtnId: 'copy-btn',
    shareBtnId: 'share-btn',
    getSummaryText: () => latestSummary,
    getQueryParams: () => ({
      initial: document.getElementById(fields.initial.input).value,
      final: document.getElementById(fields.final.input).value,
      costs: document.getElementById(fields.costs.input).value,
      duration: document.getElementById(fields.duration.input).value,
      unit: periodUnitSelect ? periodUnitSelect.value : 'years'
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