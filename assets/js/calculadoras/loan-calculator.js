document.addEventListener('DOMContentLoaded', () => {
  const fields = {
    amount: { input: 'loan-amount', slider: 'amount-slider' },
    rate: { input: 'interest-rate', slider: 'rate-slider' },
    term: { input: 'loan-term', slider: 'term-slider' }
  };

  let loanType = 'french';
  let ratePeriod = 'annual';
  let termUnit = 'years';

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('type') === 'simple') loanType = 'simple';
  if (urlParams.get('rateUnit') === 'monthly') ratePeriod = 'monthly';
  if (urlParams.get('termUnit') === 'months') termUnit = 'months';

  NumeraCore.loadParamsFromURL({
    amount: fields.amount,
    rate: fields.rate,
    term: fields.term
  });

  const monthlyEl = document.getElementById('result-monthly');
  const principalDisplayEl = document.getElementById('result-principal-display');
  const totalInterestEl = document.getElementById('result-interest');
  const totalPaymentEl = document.getElementById('result-total');
  const barPrincipal = document.getElementById('bar-principal');
  const barInterest = document.getElementById('bar-interest');
  const scheduleBody = document.getElementById('amortization-body');
  const scheduleSummaryEl = document.getElementById('schedule-summary-text');
  const termSuffixEl = document.getElementById('term-suffix');

  const typeBtns = document.querySelectorAll('[data-loan-type]');
  const rateBtns = document.querySelectorAll('[data-rate-unit]');
  const termBtns = document.querySelectorAll('[data-term-unit]');

  let latestSummary = '';
  let latestExportData = null;

  function syncUnitButtonsUI() {
    typeBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.loanType === loanType);
    });
    rateBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.rateUnit === ratePeriod);
    });
    termBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.termUnit === termUnit);
    });

    const termInput = document.getElementById(fields.term.input);
    const termSlider = document.getElementById(fields.term.slider);

    if (termUnit === 'months') {
      termSuffixEl.textContent = NumeraCore.lang === 'en' ? 'mos' : 'meses';
      termInput.max = 480;
      termSlider.max = 120;
      if (scheduleSummaryEl) {
        scheduleSummaryEl.textContent =
          NumeraCore.lang === 'en'
            ? 'View monthly amortization schedule'
            : 'Ver tabla de amortización mensual';
      }
    } else {
      termSuffixEl.textContent = NumeraCore.lang === 'en' ? 'yrs' : 'años';
      termInput.max = 40;
      termSlider.max = 30;
      if (scheduleSummaryEl) {
        scheduleSummaryEl.textContent =
          NumeraCore.lang === 'en'
            ? 'View annual amortization schedule'
            : 'Ver tabla de amortización anual';
      }
    }
  }

  typeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextType = btn.dataset.loanType;
      if (nextType === loanType) return;
      loanType = nextType;
      syncUnitButtonsUI();
      calculate();
    });
  });

  rateBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextUnit = btn.dataset.rateUnit;
      if (nextUnit === ratePeriod) return;

      const rateInput = document.getElementById(fields.rate.input);
      const rateSlider = document.getElementById(fields.rate.slider);
      const currentVal = parseFloat(rateInput.value) || 0;

      const converted =
        nextUnit === 'monthly'
          ? +(currentVal / 12).toFixed(2)
          : +(currentVal * 12).toFixed(2);

      ratePeriod = nextUnit;
      rateInput.value = converted;
      rateSlider.value = Math.min(parseFloat(rateSlider.max), converted);
      syncUnitButtonsUI();
      calculate();
    });
  });

  termBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextUnit = btn.dataset.termUnit;
      if (nextUnit === termUnit) return;

      const termInput = document.getElementById(fields.term.input);
      const termSlider = document.getElementById(fields.term.slider);
      const currentVal = parseInt(termInput.value, 10) || 1;

      const converted =
        nextUnit === 'months'
          ? currentVal * 12
          : Math.max(1, Math.round(currentVal / 12));

      termUnit = nextUnit;
      syncUnitButtonsUI();
      termInput.value = converted;
      termSlider.value = Math.min(parseInt(termSlider.max, 10), converted);
      calculate();
    });
  });

  function calculate() {
    const P = Math.max(0, parseFloat(document.getElementById(fields.amount.input).value) || 0);
    const rawRate = Math.max(0, parseFloat(document.getElementById(fields.rate.input).value) || 0);
    const rawTerm = Math.max(1, parseInt(document.getElementById(fields.term.input).value, 10) || 1);

    const totalMonths = termUnit === 'years' ? rawTerm * 12 : rawTerm;
    const r = ratePeriod === 'annual' ? rawRate / 100 / 12 : rawRate / 100;

    let monthlyPayment = 0;
    let totalPayment = 0;
    let totalInterest = 0;

    if (loanType === 'simple') {
      totalInterest = P * r * totalMonths;
      totalPayment = P + totalInterest;
      monthlyPayment = totalPayment / totalMonths;
    } else {
      if (r > 0) {
        const factor = Math.pow(1 + r, totalMonths);
        monthlyPayment = (P * (r * factor)) / (factor - 1);
      } else {
        monthlyPayment = P / totalMonths;
      }
      totalPayment = monthlyPayment * totalMonths;
      totalInterest = Math.max(0, totalPayment - P);
    }

    monthlyEl.textContent = NumeraCore.formatCurrency(monthlyPayment);
    if (principalDisplayEl) {
      principalDisplayEl.textContent = NumeraCore.formatCurrency(P);
    }
    totalInterestEl.textContent = NumeraCore.formatCurrency(totalInterest);
    totalPaymentEl.textContent = NumeraCore.formatCurrency(totalPayment);

    const principalPct = totalPayment > 0 ? (P / totalPayment) * 100 : 100;
    const interestPct = Math.max(0, 100 - principalPct);

    barPrincipal.style.width = `${principalPct}%`;
    barInterest.style.width = `${interestPct}%`;

    let balance = P;
    const rows = [];

    if (loanType === 'simple') {
      const monthlyPrincipal = P / totalMonths;
      const monthlyInterest = totalInterest / totalMonths;

      if (termUnit === 'years') {
        for (let y = 1; y <= rawTerm; y++) {
          const yearPrincipalPaid = Math.min(balance, monthlyPrincipal * 12);
          const yearInterestPaid = monthlyInterest * 12;
          balance = Math.max(0, balance - yearPrincipalPaid);

          rows.push({
            label: NumeraCore.lang === 'en' ? `Year ${y}` : `Año ${y}`,
            principalPaid: yearPrincipalPaid,
            interestPaid: yearInterestPaid,
            remainingBalance: balance
          });
        }
      } else {
        for (let m = 1; m <= totalMonths; m++) {
          const paidP = Math.min(balance, monthlyPrincipal);
          balance = Math.max(0, balance - paidP);

          rows.push({
            label: NumeraCore.lang === 'en' ? `Month ${m}` : `Mes ${m}`,
            principalPaid: paidP,
            interestPaid: monthlyInterest,
            remainingBalance: balance
          });
        }
      }
    } else {
      if (termUnit === 'years') {
        for (let y = 1; y <= rawTerm; y++) {
          let yearPrincipalPaid = 0;
          let yearInterestPaid = 0;

          for (let m = 0; m < 12; m++) {
            if (balance <= 0) break;
            const interestForMonth = balance * r;
            let principalForMonth = monthlyPayment - interestForMonth;
            if (principalForMonth > balance) principalForMonth = balance;
            yearInterestPaid += interestForMonth;
            yearPrincipalPaid += principalForMonth;
            balance = Math.max(0, balance - principalForMonth);
          }

          rows.push({
            label: NumeraCore.lang === 'en' ? `Year ${y}` : `Año ${y}`,
            principalPaid: yearPrincipalPaid,
            interestPaid: yearInterestPaid,
            remainingBalance: balance
          });
        }
      } else {
        for (let m = 1; m <= totalMonths; m++) {
          const interestForMonth = balance * r;
          let principalForMonth = monthlyPayment - interestForMonth;
          if (principalForMonth > balance) principalForMonth = balance;
          balance = Math.max(0, balance - principalForMonth);

          rows.push({
            label: NumeraCore.lang === 'en' ? `Month ${m}` : `Mes ${m}`,
            principalPaid: principalForMonth,
            interestPaid: interestForMonth,
            remainingBalance: balance
          });
        }
      }
    }

    renderSchedule(rows);

    const isEn = NumeraCore.lang === 'en';
    const typeLabel = isEn
      ? loanType === 'simple'
        ? 'Simple Interest'
        : 'Amortized (French)'
      : loanType === 'simple'
        ? 'Interés Simple'
        : 'Sistema Francés';

    const rateLabel = isEn
      ? `${rawRate}% ${ratePeriod === 'annual' ? 'APR' : 'monthly'}`
      : `${rawRate}% ${ratePeriod === 'annual' ? 'anual' : 'mensual'}`;
    const termLabel = isEn
      ? `${rawTerm} ${termUnit === 'years' ? 'yrs' : 'mos'}`
      : `${rawTerm} ${termUnit === 'years' ? 'años' : 'meses'}`;

    latestSummary = isEn
      ? `Loan Calculator [${typeLabel}] (${NumeraCore.formatCurrency(P)} for ${termLabel} @ ${rateLabel}): Monthly Payment ${NumeraCore.formatCurrency(monthlyPayment)} | Total Interest: ${NumeraCore.formatCurrency(totalInterest)} | Total Cost: ${NumeraCore.formatCurrency(totalPayment)}`
      : `Calculadora de Préstamos [${typeLabel}] (${NumeraCore.formatCurrency(P)} a ${termLabel} al ${rateLabel}): Cuota Mensual ${NumeraCore.formatCurrency(monthlyPayment)} | Intereses Totales: ${NumeraCore.formatCurrency(totalInterest)} | Total a Pagar: ${NumeraCore.formatCurrency(totalPayment)}`;

    latestExportData = {
      filename: isEn ? 'numera-loan-amortization' : 'numera-amortizacion-prestamo',
      title: isEn ? 'Loan & Amortization Schedule' : 'Cálculo y Amortización de Préstamo',
      subtitle: `${typeLabel} — ${termLabel} @ ${rateLabel}`,
      summaryRows: isEn
        ? [
            ['Calculation Method', typeLabel],
            ['Loan Principal', NumeraCore.formatCurrency(P)],
            ['Interest Rate', rateLabel],
            ['Term', termLabel],
            ['Estimated Monthly Payment', NumeraCore.formatCurrency(monthlyPayment)],
            ['Total Interest Paid', NumeraCore.formatCurrency(totalInterest)],
            ['Total Cost of Loan', NumeraCore.formatCurrency(totalPayment)]
          ]
        : [
            ['Sistema de Cálculo', typeLabel],
            ['Capital Solicitado', NumeraCore.formatCurrency(P)],
            ['Tasa de Interés', rateLabel],
            ['Plazo', termLabel],
            ['Cuota Mensual Estimada', NumeraCore.formatCurrency(monthlyPayment)],
            ['Total de Intereses', NumeraCore.formatCurrency(totalInterest)],
            ['Monto Total a Pagar', NumeraCore.formatCurrency(totalPayment)]
          ],
      tableHeaders: isEn
        ? ['Period', 'Principal Paid', 'Interest Paid', 'Remaining Balance']
        : ['Período', 'Capital Amortizado', 'Intereses Pagados', 'Saldo Restante'],
      tableRows: rows.map((r) => [
        r.label,
        NumeraCore.formatCurrency(r.principalPaid),
        NumeraCore.formatCurrency(r.interestPaid),
        NumeraCore.formatCurrency(r.remainingBalance)
      ])
    };
  }

  function renderSchedule(rows) {
    if (!scheduleBody) return;
    scheduleBody.innerHTML = rows
      .map(
        (row) => `
        <tr>
          <td>${row.label}</td>
          <td>${NumeraCore.formatCurrency(row.principalPaid)}</td>
          <td style="color: var(--accent);">${NumeraCore.formatCurrency(row.interestPaid)}</td>
          <td>${NumeraCore.formatCurrency(row.remainingBalance)}</td>
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
      type: loanType,
      amount: document.getElementById(fields.amount.input).value,
      rate: document.getElementById(fields.rate.input).value,
      rateUnit: ratePeriod,
      term: document.getElementById(fields.term.input).value,
      termUnit: termUnit
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

  syncUnitButtonsUI();
  calculate();
});