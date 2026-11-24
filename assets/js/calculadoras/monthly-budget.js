document.addEventListener('DOMContentLoaded', () => {
  const fields = {
    income: { input: 'monthly-income', slider: 'income-slider' },
    needsPct: { input: 'needs-pct', slider: 'needs-slider' },
    wantsPct: { input: 'wants-pct', slider: 'wants-slider' },
    savingsPct: { input: 'savings-pct', slider: 'savings-slider' }
  };

  NumeraCore.loadParamsFromURL({
    income: fields.income,
    needs: fields.needsPct,
    wants: fields.wantsPct,
    savings: fields.savingsPct
  });

  const presetSelect = document.getElementById('budget-preset');
  const isEn = NumeraCore.lang === 'en';

  const needsAmountEl = document.getElementById('result-needs');
  const wantsAmountEl = document.getElementById('result-wants');
  const savingsAmountEl = document.getElementById('result-savings');
  const annualSavingsEl = document.getElementById('result-annual-savings');
  const fiveYearSavingsEl = document.getElementById('result-five-year-savings');
  const pctWarningEl = document.getElementById('pct-warning');

  const barNeeds = document.getElementById('bar-needs');
  const barWants = document.getElementById('bar-wants');
  const barSavings = document.getElementById('bar-savings');
  const scheduleBody = document.getElementById('budget-schedule-body');

  let latestSummary = '';
  let latestExportData = null;

  function applyPreset() {
    if (!presetSelect) return;
    const val = presetSelect.value;
    if (val === 'custom') return;

    const [n, w, s] = val.split('-').map(Number);
    document.getElementById(fields.needsPct.input).value = n;
    document.getElementById(fields.needsPct.slider).value = n;
    document.getElementById(fields.wantsPct.input).value = w;
    document.getElementById(fields.wantsPct.slider).value = w;
    document.getElementById(fields.savingsPct.input).value = s;
    document.getElementById(fields.savingsPct.slider).value = s;

    calculate();
  }

  function onCustomPctChange() {
    if (presetSelect) {
      const n = parseFloat(document.getElementById(fields.needsPct.input).value) || 0;
      const w = parseFloat(document.getElementById(fields.wantsPct.input).value) || 0;
      const s = parseFloat(document.getElementById(fields.savingsPct.input).value) || 0;
      const key = `${n}-${w}-${s}`;
      const validPresets = ['50-30-20', '60-20-20', '70-20-10'];
      presetSelect.value = validPresets.includes(key) ? key : 'custom';
    }
    calculate();
  }

  function calculate() {
    const income = Math.max(0, parseFloat(document.getElementById(fields.income.input).value) || 0);
    const needsPct = Math.max(0, parseFloat(document.getElementById(fields.needsPct.input).value) || 0);
    const wantsPct = Math.max(0, parseFloat(document.getElementById(fields.wantsPct.input).value) || 0);
    const savingsPct = Math.max(0, parseFloat(document.getElementById(fields.savingsPct.input).value) || 0);

    const totalPct = needsPct + wantsPct + savingsPct;

    if (pctWarningEl) {
      if (Math.abs(totalPct - 100) > 0.01) {
        pctWarningEl.style.display = 'block';
        pctWarningEl.textContent = isEn
          ? `Current allocation sums to ${totalPct.toFixed(0)}%. Adjust sliders so the total equals 100%.`
          : `La distribución actual suma ${totalPct.toFixed(0)}%. Ajusta los porcentajes para que sumen 100%.`;
      } else {
        pctWarningEl.style.display = 'none';
      }
    }

    const needsAmount = income * (needsPct / 100);
    const wantsAmount = income * (wantsPct / 100);
    const savingsAmount = income * (savingsPct / 100);

    const annualSavings = savingsAmount * 12;
    const fiveYearSavings = savingsAmount * 60;

    needsAmountEl.textContent = NumeraCore.formatCurrency(needsAmount);
    wantsAmountEl.textContent = NumeraCore.formatCurrency(wantsAmount);
    savingsAmountEl.textContent = NumeraCore.formatCurrency(savingsAmount);
    annualSavingsEl.textContent = NumeraCore.formatCurrency(annualSavings);
    fiveYearSavingsEl.textContent = NumeraCore.formatCurrency(fiveYearSavings);

    const safeTotal = totalPct > 0 ? totalPct : 100;
    barNeeds.style.width = `${(needsPct / safeTotal) * 100}%`;
    barWants.style.width = `${(wantsPct / safeTotal) * 100}%`;
    barSavings.style.width = `${(savingsPct / safeTotal) * 100}%`;

    const rows = isEn
      ? [
          {
            category: 'Needs (Essentials)',
            examples: 'Housing, utilities, groceries, transport, insurance',
            pct: `${needsPct}%`,
            monthly: needsAmount,
            annual: needsAmount * 12
          },
          {
            category: 'Wants (Lifestyle)',
            examples: 'Dining out, entertainment, travel, subscriptions',
            pct: `${wantsPct}%`,
            monthly: wantsAmount,
            annual: wantsAmount * 12
          },
          {
            category: 'Savings & Investments',
            examples: 'Emergency fund, index funds, extra debt payoff',
            pct: `${savingsPct}%`,
            monthly: savingsAmount,
            annual: savingsAmount * 12
          }
        ]
      : [
          {
            category: 'Necesidades (Esenciales)',
            examples: 'Vivienda, servicios, alimentación, transporte, salud',
            pct: `${needsPct}%`,
            monthly: needsAmount,
            annual: needsAmount * 12
          },
          {
            category: 'Deseos (Estilo de vida)',
            examples: 'Restaurantes, ocio, viajes, suscripciones, compras',
            pct: `${wantsPct}%`,
            monthly: wantsAmount,
            annual: wantsAmount * 12
          },
          {
            category: 'Ahorro e Inversión',
            examples: 'Fondo de emergencia, inversiones, abono extra a deudas',
            pct: `${savingsPct}%`,
            monthly: savingsAmount,
            annual: savingsAmount * 12
          }
        ];

    renderScheduleTable(rows, income, totalPct);

    latestSummary = isEn
      ? `Monthly Budget (${NumeraCore.formatCurrency(income)}/mo — ${needsPct}/${wantsPct}/${savingsPct}): Needs ${NumeraCore.formatCurrency(needsAmount)} | Wants ${NumeraCore.formatCurrency(wantsAmount)} | Savings ${NumeraCore.formatCurrency(savingsAmount)} (${NumeraCore.formatCurrency(annualSavings)}/yr)`
      : `Presupuesto Mensual (${NumeraCore.formatCurrency(income)}/mes — ${needsPct}/${wantsPct}/${savingsPct}): Necesidades ${NumeraCore.formatCurrency(needsAmount)} | Deseos ${NumeraCore.formatCurrency(wantsAmount)} | Ahorro ${NumeraCore.formatCurrency(savingsAmount)} (${NumeraCore.formatCurrency(annualSavings)}/año)`;

    latestExportData = {
      filename: isEn ? 'numera-monthly-budget-plan' : 'numera-presupuesto-mensual',
      title: isEn ? 'Monthly Budget Plan (50/30/20)' : 'Plan de Presupuesto Mensual (50/30/20)',
      subtitle: isEn
        ? `Net Monthly Income: ${NumeraCore.formatCurrency(income)} | Rule: ${needsPct}% / ${wantsPct}% / ${savingsPct}%`
        : `Ingreso Mensual Neto: ${NumeraCore.formatCurrency(income)} | Regla: ${needsPct}% / ${wantsPct}% / ${savingsPct}%`,
      summaryRows: isEn
        ? [
            ['Net Monthly Income', NumeraCore.formatCurrency(income)],
            ['Distribution Rule', `${needsPct}% Needs / ${wantsPct}% Wants / ${savingsPct}% Savings`],
            ['Monthly Needs Budget', NumeraCore.formatCurrency(needsAmount)],
            ['Monthly Wants Budget', NumeraCore.formatCurrency(wantsAmount)],
            ['Monthly Savings Target', NumeraCore.formatCurrency(savingsAmount)],
            ['Projected 1-Year Savings', NumeraCore.formatCurrency(annualSavings)],
            ['Projected 5-Year Savings', NumeraCore.formatCurrency(fiveYearSavings)]
          ]
        : [
            ['Ingreso Mensual Neto', NumeraCore.formatCurrency(income)],
            ['Regla de Distribución', `${needsPct}% Necesidades / ${wantsPct}% Deseos / ${savingsPct}% Ahorro`],
            ['Presupuesto Mensual Necesidades', NumeraCore.formatCurrency(needsAmount)],
            ['Presupuesto Mensual Deseos', NumeraCore.formatCurrency(wantsAmount)],
            ['Meta Mensual de Ahorro', NumeraCore.formatCurrency(savingsAmount)],
            ['Ahorro Proyectado a 1 Año', NumeraCore.formatCurrency(annualSavings)],
            ['Ahorro Proyectado a 5 Años', NumeraCore.formatCurrency(fiveYearSavings)]
          ],
      tableHeaders: isEn
        ? ['Category', 'Allocation %', 'Monthly Budget', 'Annual Budget', 'Typical Expenses']
        : ['Categoría', 'Porcentaje', 'Presupuesto Mensual', 'Presupuesto Anual', 'Gastos Incluidos'],
      tableRows: rows.map((r) => [
        r.category,
        r.pct,
        NumeraCore.formatCurrency(r.monthly),
        NumeraCore.formatCurrency(r.annual),
        r.examples
      ])
    };
  }

  function renderScheduleTable(rows, income, totalPct) {
    if (!scheduleBody) return;
    const totalLabel = isEn ? 'Total Allocated' : 'Total Asignado';
    const totalMonthly = rows.reduce((acc, r) => acc + r.monthly, 0);
    const totalAnnual = rows.reduce((acc, r) => acc + r.annual, 0);

    scheduleBody.innerHTML =
      rows
        .map(
          (r) => `
          <tr>
            <td><strong>${r.category}</strong><br><span style="font-size: 1.2rem; color: var(--text-secondary);">${r.examples}</span></td>
            <td>${r.pct}</td>
            <td style="font-weight: 600;">${NumeraCore.formatCurrency(r.monthly)}</td>
            <td>${NumeraCore.formatCurrency(r.annual)}</td>
          </tr>
        `
        )
        .join('') +
      `<tr style="background-color: rgba(16, 185, 129, 0.08); font-weight: 700;">
        <td>${totalLabel}</td>
        <td>${totalPct.toFixed(0)}%</td>
        <td style="color: var(--accent);">${NumeraCore.formatCurrency(totalMonthly)}</td>
        <td>${NumeraCore.formatCurrency(totalAnnual)}</td>
      </tr>`;
  }

  NumeraCore.bindInput(fields.income.input, fields.income.slider, calculate);
  NumeraCore.bindInput(fields.needsPct.input, fields.needsPct.slider, onCustomPctChange);
  NumeraCore.bindInput(fields.wantsPct.input, fields.wantsPct.slider, onCustomPctChange);
  NumeraCore.bindInput(fields.savingsPct.input, fields.savingsPct.slider, onCustomPctChange);

  if (presetSelect) {
    presetSelect.addEventListener('change', applyPreset);
  }

  NumeraCore.setupShareAndCopy({
    copyBtnId: 'copy-btn',
    shareBtnId: 'share-btn',
    getSummaryText: () => latestSummary,
    getQueryParams: () => ({
      income: document.getElementById(fields.income.input).value,
      needs: document.getElementById(fields.needsPct.input).value,
      wants: document.getElementById(fields.wantsPct.input).value,
      savings: document.getElementById(fields.savingsPct.input).value
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