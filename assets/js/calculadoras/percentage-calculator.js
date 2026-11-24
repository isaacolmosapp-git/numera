document.addEventListener('DOMContentLoaded', () => {
  const isEn = NumeraCore.lang === 'en';
  const STORAGE_KEY = 'numera_percentage_history';

  const modeSelect = document.getElementById('calc-mode');
  const fields = {
    valA: { input: 'input-a', slider: 'slider-a' },
    valB: { input: 'input-b', slider: 'slider-b' },
    tax: { input: 'input-tax', slider: 'slider-tax' }
  };

  NumeraCore.loadParamsFromURL({
    a: fields.valA,
    b: fields.valB,
    tax: fields.tax
  });

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('mode') && modeSelect) {
    const allowedModes = ['discount', 'percent-of', 'variation'];
    if (allowedModes.includes(urlParams.get('mode'))) {
      modeSelect.value = urlParams.get('mode');
    }
  }

  const labelA = document.getElementById('label-a');
  const prefixA = document.getElementById('prefix-a');
  const labelB = document.getElementById('label-b');
  const suffixB = document.getElementById('suffix-b');
  const prefixB = document.getElementById('prefix-b');
  const taxGroup = document.getElementById('tax-group');

  const mainLabelEl = document.getElementById('result-main-label');
  const mainValueEl = document.getElementById('result-main-value');
  const row1LabelEl = document.getElementById('row1-label');
  const row1ValueEl = document.getElementById('row1-value');
  const row2LabelEl = document.getElementById('row2-label');
  const row2ValueEl = document.getElementById('row2-value');
  const row3LabelEl = document.getElementById('row3-label');
  const row3ValueEl = document.getElementById('row3-value');

  const barPrimary = document.getElementById('bar-primary');
  const barAccent = document.getElementById('bar-accent');

  const addHistoryBtn = document.getElementById('add-history-btn');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const historyBody = document.getElementById('history-table-body');

  let latestSummary = '';
  let currentRecord = null;
  let historyList = loadHistory();

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historyList));
    } catch {
      // Ignorar si localStorage no está disponible
    }
  }

  function updateUIForMode() {
    const mode = modeSelect ? modeSelect.value : 'discount';
    const inputA = document.getElementById(fields.valA.input);
    const sliderA = document.getElementById(fields.valA.slider);
    const inputB = document.getElementById(fields.valB.input);
    const sliderB = document.getElementById(fields.valB.slider);

    if (mode === 'discount') {
      labelA.textContent = isEn ? 'Original price' : 'Precio original';
      prefixA.style.display = 'inline';
      inputA.classList.add('has-prefix');
      sliderA.max = '10000';

      labelB.textContent = isEn ? 'Discount percentage (%)' : 'Porcentaje de descuento (%)';
      prefixB.style.display = 'none';
      suffixB.style.display = 'inline';
      inputB.classList.remove('has-prefix');
      inputB.classList.add('has-suffix');
      sliderB.max = '100';

      if (taxGroup) taxGroup.style.display = 'block';
    } else if (mode === 'percent-of') {
      labelA.textContent = isEn ? 'Base amount' : 'Cantidad base';
      prefixA.style.display = 'none';
      inputA.classList.remove('has-prefix');
      sliderA.max = '50000';

      labelB.textContent = isEn ? 'Percentage to calculate (%)' : 'Porcentaje a calcular (%)';
      prefixB.style.display = 'none';
      suffixB.style.display = 'inline';
      inputB.classList.remove('has-prefix');
      inputB.classList.add('has-suffix');
      sliderB.max = '200';

      if (taxGroup) taxGroup.style.display = 'none';
    } else {
      labelA.textContent = isEn ? 'Initial value' : 'Valor inicial';
      prefixA.style.display = 'none';
      inputA.classList.remove('has-prefix');
      sliderA.max = '50000';

      labelB.textContent = isEn ? 'Final value' : 'Valor final';
      prefixB.style.display = 'none';
      suffixB.style.display = 'none';
      inputB.classList.remove('has-prefix', 'has-suffix');
      sliderB.max = '50000';

      if (taxGroup) taxGroup.style.display = 'none';
    }

    calculate();
  }

  function calculate() {
    const mode = modeSelect ? modeSelect.value : 'discount';
    const valA = parseFloat(document.getElementById(fields.valA.input).value) || 0;
    const valB = parseFloat(document.getElementById(fields.valB.input).value) || 0;
    const taxRate = Math.max(0, parseFloat(document.getElementById(fields.tax.input).value) || 0);

    if (mode === 'discount') {
      const price = Math.max(0, valA);
      const discountPct = Math.max(0, Math.min(100, valB));
      const discountAmount = price * (discountPct / 100);
      const discountedPrice = price - discountAmount;
      const taxAmount = discountedPrice * (taxRate / 100);
      const finalPrice = discountedPrice + taxAmount;

      mainLabelEl.textContent = isEn ? 'Final price to pay' : 'Precio final a pagar';
      mainValueEl.textContent = NumeraCore.formatCurrency(finalPrice);
      mainValueEl.style.color = 'var(--text-primary)';

      row1LabelEl.textContent = isEn ? `Discount saved (${discountPct}%)` : `Ahorro por descuento (${discountPct}%)`;
      row1ValueEl.textContent = `-${NumeraCore.formatCurrency(discountAmount)}`;
      row1ValueEl.style.color = 'var(--accent)';

      row2LabelEl.textContent = isEn ? 'Subtotal after discount' : 'Subtotal con descuento';
      row2ValueEl.textContent = NumeraCore.formatCurrency(discountedPrice);
      row2ValueEl.style.color = 'var(--text-primary)';

      row3LabelEl.textContent = isEn ? `Tax / VAT (${taxRate}%)` : `Impuesto / IVA (${taxRate}%)`;
      row3ValueEl.textContent = `+${NumeraCore.formatCurrency(taxAmount)}`;
      row3ValueEl.style.color = 'var(--text-primary)';

      const payRatio = price > 0 ? Math.min(100, (discountedPrice / price) * 100) : 100;
      barPrimary.style.width = `${payRatio}%`;
      barAccent.style.width = `${100 - payRatio}%`;

      latestSummary = isEn
        ? `Discount Calculation (${NumeraCore.formatCurrency(price)} - ${discountPct}% + ${taxRate}% tax): Final Price ${NumeraCore.formatCurrency(finalPrice)} | Saved ${NumeraCore.formatCurrency(discountAmount)}`
        : `Cálculo de Descuento (${NumeraCore.formatCurrency(price)} - ${discountPct}% + ${taxRate}% IVA): Precio Final ${NumeraCore.formatCurrency(finalPrice)} | Ahorro ${NumeraCore.formatCurrency(discountAmount)}`;

      currentRecord = {
        modeLabel: isEn ? 'Discount & Tax' : 'Descuento e IVA',
        detail: isEn
          ? `${NumeraCore.formatCurrency(price)} (-${discountPct}%, +${taxRate}% tax)`
          : `${NumeraCore.formatCurrency(price)} (-${discountPct}%, +${taxRate}% IVA)`,
        result: NumeraCore.formatCurrency(finalPrice),
        extra: isEn ? `Saved ${NumeraCore.formatCurrency(discountAmount)}` : `Ahorro ${NumeraCore.formatCurrency(discountAmount)}`
      };
    } else if (mode === 'percent-of') {
      const base = valA;
      const pct = valB;
      const part = base * (pct / 100);
      const added = base + part;
      const subtracted = base - part;

      mainLabelEl.textContent = isEn ? `${pct}% of ${base.toLocaleString('en-US')}` : `${pct}% de ${base.toLocaleString('es-ES')}`;
      mainValueEl.textContent = part.toLocaleString(isEn ? 'en-US' : 'es-ES', { maximumFractionDigits: 4 });
      mainValueEl.style.color = 'var(--accent)';

      row1LabelEl.textContent = isEn ? `Base + ${pct}%` : `Cantidad + ${pct}%`;
      row1ValueEl.textContent = added.toLocaleString(isEn ? 'en-US' : 'es-ES', { maximumFractionDigits: 4 });
      row1ValueEl.style.color = 'var(--text-primary)';

      row2LabelEl.textContent = isEn ? `Base - ${pct}%` : `Cantidad - ${pct}%`;
      row2ValueEl.textContent = subtracted.toLocaleString(isEn ? 'en-US' : 'es-ES', { maximumFractionDigits: 4 });
      row2ValueEl.style.color = 'var(--text-primary)';

      row3LabelEl.textContent = isEn ? 'Decimal factor' : 'Factor decimal';
      row3ValueEl.textContent = (pct / 100).toFixed(4);
      row3ValueEl.style.color = 'var(--text-secondary)';

      const barPct = Math.max(0, Math.min(100, pct));
      barPrimary.style.width = `${100 - barPct}%`;
      barAccent.style.width = `${barPct}%`;

      latestSummary = isEn
        ? `${pct}% of ${base} = ${part.toFixed(2)} | +${pct}%: ${added.toFixed(2)} | -${pct}%: ${subtracted.toFixed(2)}`
        : `${pct}% de ${base} = ${part.toFixed(2)} | +${pct}%: ${added.toFixed(2)} | -${pct}%: ${subtracted.toFixed(2)}`;

      currentRecord = {
        modeLabel: isEn ? 'Percentage of Value' : 'Porcentaje de Cantidad',
        detail: `${pct}% de ${base.toLocaleString(isEn ? 'en-US' : 'es-ES')}`,
        result: part.toLocaleString(isEn ? 'en-US' : 'es-ES', { maximumFractionDigits: 4 }),
        extra: `+${pct}%: ${added.toFixed(2)} / -${pct}%: ${subtracted.toFixed(2)}`
      };
    } else {
      const initial = valA;
      const final = valB;
      const diff = final - initial;
      const pctChange = initial !== 0 ? (diff / Math.abs(initial)) * 100 : 0;
      const prefix = pctChange > 0 ? '+' : '';
      const diffPrefix = diff > 0 ? '+' : '';

      mainLabelEl.textContent = isEn ? 'Percentage change' : 'Variación porcentual';
      mainValueEl.textContent = `${prefix}${pctChange.toFixed(2)}%`;
      mainValueEl.style.color = pctChange >= 0 ? 'var(--accent)' : '#f87171';

      row1LabelEl.textContent = isEn ? 'Absolute difference' : 'Diferencia absoluta';
      row1ValueEl.textContent = `${diffPrefix}${diff.toLocaleString(isEn ? 'en-US' : 'es-ES', { maximumFractionDigits: 4 })}`;
      row1ValueEl.style.color = diff >= 0 ? 'var(--accent)' : '#f87171';

      row2LabelEl.textContent = isEn ? 'Initial value' : 'Valor inicial';
      row2ValueEl.textContent = initial.toLocaleString(isEn ? 'en-US' : 'es-ES', { maximumFractionDigits: 4 });
      row2ValueEl.style.color = 'var(--text-primary)';

      row3LabelEl.textContent = isEn ? 'Final value' : 'Valor final';
      row3ValueEl.textContent = final.toLocaleString(isEn ? 'en-US' : 'es-ES', { maximumFractionDigits: 4 });
      row3ValueEl.style.color = 'var(--text-primary)';

      const maxVal = Math.max(Math.abs(initial), Math.abs(final), 1);
      barPrimary.style.width = `${(Math.abs(initial) / maxVal) * 50}%`;
      barAccent.style.width = `${(Math.abs(final) / maxVal) * 50}%`;

      latestSummary = isEn
        ? `Percentage Change (${initial} to ${final}): ${prefix}${pctChange.toFixed(2)}% (${diffPrefix}${diff.toFixed(2)})`
        : `Variación Porcentual (${initial} a ${final}): ${prefix}${pctChange.toFixed(2)}% (${diffPrefix}${diff.toFixed(2)})`;

      currentRecord = {
        modeLabel: isEn ? 'Percentage Change' : 'Variación Porcentual',
        detail: isEn ? `${initial} to ${final}` : `${initial} a ${final}`,
        result: `${prefix}${pctChange.toFixed(2)}%`,
        extra: `${diffPrefix}${diff.toFixed(2)}`
      };
    }
  }

  function renderHistory() {
    if (!historyBody) return;
    if (historyList.length === 0) {
      const emptyMsg = isEn
        ? 'No saved calculations yet. Click "Save to list" above to record results.'
        : 'Aún no hay cálculos guardados. Pulsa "Guardar en lista" arriba para registrar resultados.';
      historyBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">${emptyMsg}</td></tr>`;
      return;
    }

    const delLabel = isEn ? 'Remove' : 'Eliminar';
    historyBody.innerHTML = historyList
      .map(
        (item, idx) => `
        <tr>
          <td>${item.modeLabel}</td>
          <td>${item.detail}</td>
          <td style="font-weight: 700; color: var(--accent);">${item.result}</td>
          <td>${item.extra}</td>
          <td><button type="button" class="btn-export" data-remove-idx="${idx}" style="padding: 0.3rem 0.7rem; font-size: 1.2rem;">${delLabel}</button></td>
        </tr>
      `
      )
      .join('');
  }

  if (historyBody) {
    historyBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-idx]');
      if (!btn) return;
      const idx = parseInt(btn.getAttribute('data-remove-idx'), 10);
      if (!Number.isNaN(idx)) {
        historyList.splice(idx, 1);
        saveHistory();
        renderHistory();
      }
    });
  }

  if (addHistoryBtn) {
    addHistoryBtn.addEventListener('click', () => {
      if (!currentRecord) return;
      historyList.unshift({ ...currentRecord });
      if (historyList.length > 50) historyList.pop();
      saveHistory();
      renderHistory();

      const origText = addHistoryBtn.textContent;
      addHistoryBtn.textContent = isEn ? 'Saved!' : '¡Guardado!';
      setTimeout(() => {
        addHistoryBtn.textContent = origText;
      }, 1200);
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      historyList = [];
      saveHistory();
      renderHistory();
    });
  }

  Object.values(fields).forEach(({ input, slider }) => {
    NumeraCore.bindInput(input, slider, calculate);
  });

  if (modeSelect) {
    modeSelect.addEventListener('change', updateUIForMode);
  }

  NumeraCore.setupShareAndCopy({
    copyBtnId: 'copy-btn',
    shareBtnId: 'share-btn',
    getSummaryText: () => latestSummary,
    getQueryParams: () => ({
      mode: modeSelect ? modeSelect.value : 'discount',
      a: document.getElementById(fields.valA.input).value,
      b: document.getElementById(fields.valB.input).value,
      tax: document.getElementById(fields.tax.input).value
    })
  });

  function getExportPayload() {
    const rowsToExport = historyList.length > 0 ? historyList : currentRecord ? [currentRecord] : [];
    return {
      filename: isEn ? 'numera-percentages-discounts' : 'numera-porcentajes-descuentos',
      title: isEn ? 'Percentages & Discounts Report' : 'Reporte de Porcentajes y Descuentos',
      subtitle: isEn
        ? `Total Recorded Calculations: ${rowsToExport.length}`
        : `Total de Cálculos Registrados: ${rowsToExport.length}`,
      summaryRows: [
        [isEn ? 'Latest Calculation' : 'Último Cálculo', latestSummary],
        [isEn ? 'Saved Items' : 'Operaciones en Lista', String(rowsToExport.length)]
      ],
      tableHeaders: isEn
        ? ['Mode', 'Parameters', 'Main Result', 'Additional Detail']
        : ['Modo', 'Parámetros', 'Resultado Principal', 'Detalle Adicional'],
      tableRows: rowsToExport.map((r) => [r.modeLabel, r.detail, r.result, r.extra])
    };
  }

  const excelBtn = document.getElementById('export-excel-btn');
  const pdfBtn = document.getElementById('export-pdf-btn');

  if (excelBtn) {
    excelBtn.addEventListener('click', () => {
      if (window.NumeraExport) {
        NumeraExport.toExcel({ btn: excelBtn, ...getExportPayload() });
      }
    });
  }

  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      if (window.NumeraExport) {
        NumeraExport.toPDF({ btn: pdfBtn, ...getExportPayload() });
      }
    });
  }

  updateUIForMode();
  renderHistory();
});