document.addEventListener('DOMContentLoaded', () => {
  const fields = {
    initial: { input: 'initial-capital', slider: 'initial-slider' },
    monthly: { input: 'monthly-contribution', slider: 'monthly-slider' },
    rate: { input: 'annual-rate', slider: 'rate-slider' },
    years: { input: 'years', slider: 'years-slider' }
  };

  NumeraCore.loadParamsFromURL({
    c: fields.initial,
    m: fields.monthly,
    r: fields.rate,
    t: fields.years
  });

  const totalEl = document.getElementById('result-total');
  const contributionsEl = document.getElementById('result-contributions');
  const interestEl = document.getElementById('result-interest');
  const barPrincipal = document.getElementById('bar-principal');
  const barInterest = document.getElementById('bar-interest');
  const scheduleBody = document.getElementById('yearly-schedule-body');

  let latestSummary = '';
  let latestExportData = null;

  function calculate() {
    const P = Math.max(0, parseFloat(document.getElementById(fields.initial.input).value) || 0);
    const PMT = Math.max(0, parseFloat(document.getElementById(fields.monthly.input).value) || 0);
    const annualRate = Math.max(0, parseFloat(document.getElementById(fields.rate.input).value) || 0);
    const years = Math.max(1, parseInt(document.getElementById(fields.years.input).value, 10) || 1);

    const monthlyRate = annualRate / 100 / 12;
    let futureValue = P;
    let runningContributed = P;

    const yearlyRows = [];

    for (let y = 1; y <= years; y++) {
      const startBalance = futureValue;
      const startContributed = runningContributed;

      for (let m = 0; m < 12; m++) {
        futureValue = (futureValue + PMT) * (1 + monthlyRate);
        runningContributed += PMT;
      }

      const yearContribution = runningContributed - startContributed;
      const yearInterest = Math.max(0, futureValue - startBalance - yearContribution);
      const totalInterestSoFar = Math.max(0, futureValue - runningContributed);

      yearlyRows.push({
        year: y,
        contributed: runningContributed,
        yearInterest,
        totalInterest: totalInterestSoFar,
        balance: futureValue
      });
    }

    const totalContributed = runningContributed;
    const totalInterest = Math.max(0, futureValue - totalContributed);

    totalEl.textContent = NumeraCore.formatCurrency(futureValue);
    contributionsEl.textContent = NumeraCore.formatCurrency(totalContributed);
    interestEl.textContent = NumeraCore.formatCurrency(totalInterest);

    const principalPct = futureValue > 0 ? (totalContributed / futureValue) * 100 : 100;
    const interestPct = Math.max(0, 100 - principalPct);

    barPrincipal.style.width = `${principalPct}%`;
    barInterest.style.width = `${interestPct}%`;

    renderScheduleTable(yearlyRows);

    const isEn = NumeraCore.lang === 'en';
    const yearPrefix = isEn ? 'Year' : 'Año';

    latestSummary = isEn
      ? `Compound Interest (${years} yrs @ ${annualRate}%): Final Balance ${NumeraCore.formatCurrency(futureValue)} | Contributed: ${NumeraCore.formatCurrency(totalContributed)} | Interest: ${NumeraCore.formatCurrency(totalInterest)}`
      : `Interés Compuesto (${years} años al ${annualRate}%): Saldo Final ${NumeraCore.formatCurrency(futureValue)} | Aportado: ${NumeraCore.formatCurrency(totalContributed)} | Intereses: ${NumeraCore.formatCurrency(totalInterest)}`;

    latestExportData = {
      filename: isEn ? 'numera-compound-interest' : 'numera-interes-compuesto',
      title: isEn ? 'Compound Interest Projection' : 'Proyección de Interés Compuesto',
      subtitle: isEn
        ? `${years} years at ${annualRate}% annual rate`
        : `${years} años a una tasa anual del ${annualRate}%`,
      summaryRows: isEn
        ? [
            ['Initial Deposit', NumeraCore.formatCurrency(P)],
            ['Monthly Contribution', NumeraCore.formatCurrency(PMT)],
            ['Annual Interest Rate', `${annualRate}%`],
            ['Time Period', `${years} years`],
            ['Total Contributed', NumeraCore.formatCurrency(totalContributed)],
            ['Total Interest Earned', NumeraCore.formatCurrency(totalInterest)],
            ['Estimated Final Balance', NumeraCore.formatCurrency(futureValue)]
          ]
        : [
            ['Capital Inicial', NumeraCore.formatCurrency(P)],
            ['Aporte Mensual', NumeraCore.formatCurrency(PMT)],
            ['Tasa de Interés Anual', `${annualRate}%`],
            ['Plazo', `${years} años`],
            ['Total Aportado', NumeraCore.formatCurrency(totalContributed)],
            ['Intereses Generados', NumeraCore.formatCurrency(totalInterest)],
            ['Saldo Final Estimado', NumeraCore.formatCurrency(futureValue)]
          ],
      tableHeaders: isEn
        ? ['Period', 'Total Contributed', 'Annual Interest', 'Total Interest', 'Ending Balance']
        : ['Período', 'Aporte Acumulado', 'Interés del Año', 'Interés Acumulado', 'Saldo Final'],
      tableRows: yearlyRows.map((r) => [
        `${yearPrefix} ${r.year}`,
        NumeraCore.formatCurrency(r.contributed),
        NumeraCore.formatCurrency(r.yearInterest),
        NumeraCore.formatCurrency(r.totalInterest),
        NumeraCore.formatCurrency(r.balance)
      ])
    };
  }

  function renderScheduleTable(rows) {
    if (!scheduleBody) return;
    const yearPrefix = NumeraCore.lang === 'en' ? 'Year' : 'Año';

    scheduleBody.innerHTML = rows
      .map(
        (row) => `
        <tr>
          <td>${yearPrefix} ${row.year}</td>
          <td>${NumeraCore.formatCurrency(row.contributed)}</td>
          <td>+${NumeraCore.formatCurrency(row.yearInterest)}</td>
          <td style="color: var(--accent);">${NumeraCore.formatCurrency(row.totalInterest)}</td>
          <td>${NumeraCore.formatCurrency(row.balance)}</td>
        </tr>
      `
      )
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
      c: document.getElementById(fields.initial.input).value,
      m: document.getElementById(fields.monthly.input).value,
      r: document.getElementById(fields.rate.input).value,
      t: document.getElementById(fields.years.input).value
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