document.addEventListener('DOMContentLoaded', () => {
  const fields = {
    goal: { input: 'target-goal', slider: 'goal-slider' },
    initial: { input: 'current-savings', slider: 'initial-slider' },
    months: { input: 'months-period', slider: 'months-slider' },
    rate: { input: 'annual-yield', slider: 'rate-slider' }
  };

  NumeraCore.loadParamsFromURL({
    goal: fields.goal,
    initial: fields.initial,
    months: fields.months,
    rate: fields.rate
  });

  const monthlyRequiredEl = document.getElementById('result-monthly');
  const weeklyRequiredEl = document.getElementById('result-weekly');
  const totalDepositedEl = document.getElementById('result-deposited');
  const interestEarnedEl = document.getElementById('result-yield');
  const barDeposited = document.getElementById('bar-deposited');
  const barYield = document.getElementById('bar-yield');

  let latestSummary = '';

  function calculate() {
    const target = Math.max(0, parseFloat(document.getElementById(fields.goal.input).value) || 0);
    const initial = Math.max(0, parseFloat(document.getElementById(fields.initial.input).value) || 0);
    const months = Math.max(1, parseInt(document.getElementById(fields.months.input).value, 10) || 1);
    const annualRate = Math.max(0, parseFloat(document.getElementById(fields.rate.input).value) || 0);

    const r = annualRate / 100 / 12;
    let monthlyDeposit = 0;
    let futureValueOfInitial = initial;

    if (r > 0) {
      const growthFactor = Math.pow(1 + r, months);
      futureValueOfInitial = initial * growthFactor;
      const remainingTarget = Math.max(0, target - futureValueOfInitial);
      monthlyDeposit = remainingTarget > 0
        ? (remainingTarget * r) / (growthFactor - 1)
        : 0;
    } else {
      const remainingTarget = Math.max(0, target - initial);
      monthlyDeposit = remainingTarget / months;
    }

    const totalDeposited = initial + monthlyDeposit * months;
    const finalBalance = Math.max(target, futureValueOfInitial);
    const yieldEarned = Math.max(0, finalBalance - totalDeposited);
    const weeklyEquivalent = (monthlyDeposit * 12) / 52;

    monthlyRequiredEl.textContent = NumeraCore.formatCurrency(monthlyDeposit);
    weeklyRequiredEl.textContent = NumeraCore.formatCurrency(weeklyEquivalent);
    totalDepositedEl.textContent = NumeraCore.formatCurrency(totalDeposited);
    interestEarnedEl.textContent = NumeraCore.formatCurrency(yieldEarned);

    const depositedPct = finalBalance > 0 ? Math.min(100, (totalDeposited / finalBalance) * 100) : 100;
    const yieldPct = Math.max(0, 100 - depositedPct);

    barDeposited.style.width = `${depositedPct}%`;
    barYield.style.width = `${yieldPct}%`;

    if (NumeraCore.lang === 'en') {
      latestSummary = `Savings Goal (${NumeraCore.formatCurrency(target)} in ${months} mo): Save ${NumeraCore.formatCurrency(monthlyDeposit)}/month | Total Deposited: ${NumeraCore.formatCurrency(totalDeposited)} | Interest Earned: ${NumeraCore.formatCurrency(yieldEarned)}`;
    } else {
      latestSummary = `Meta de Ahorro (${NumeraCore.formatCurrency(target)} en ${months} meses): Ahorrar ${NumeraCore.formatCurrency(monthlyDeposit)}/mes | Total Aportado: ${NumeraCore.formatCurrency(totalDeposited)} | Rendimiento: ${NumeraCore.formatCurrency(yieldEarned)}`;
    }
  }

  Object.values(fields).forEach(({ input, slider }) => {
    NumeraCore.bindInput(input, slider, calculate);
  });

  NumeraCore.setupShareAndCopy({
    copyBtnId: 'copy-btn',
    shareBtnId: 'share-btn',
    getSummaryText: () => latestSummary,
    getQueryParams: () => ({
      goal: document.getElementById(fields.goal.input).value,
      initial: document.getElementById(fields.initial.input).value,
      months: document.getElementById(fields.months.input).value,
      rate: document.getElementById(fields.rate.input).value
    })
  });

  calculate();
});
