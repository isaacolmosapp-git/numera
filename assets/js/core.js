const NumeraCore = (() => {
  const version = 'v1.4.0';
  const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  const locale = lang === 'en' ? 'en-US' : 'es-ES';

  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const numberFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  function formatCurrency(value) {
    if (!Number.isFinite(value)) return '$0.00';
    return currencyFormatter.format(value);
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return '0';
    return numberFormatter.format(value);
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) return '0%';
    return `${numberFormatter.format(value)}%`;
  }

  /**
   * Sincroniza un input numérico con un slider opcional y dispara onUpdate()
   */
  function bindInput(inputId, sliderId, onUpdate) {
    const input = document.getElementById(inputId);
    const slider = sliderId ? document.getElementById(sliderId) : null;
    if (!input) return;

    input.addEventListener('input', () => {
      if (slider && input.value !== '') {
        slider.value = input.value;
      }
      onUpdate();
    });

    if (slider) {
      slider.addEventListener('input', () => {
        input.value = slider.value;
        onUpdate();
      });
    }
  }

  /**
   * Carga valores iniciales desde query params (?capital=5000&rate=8) si existen
   */
  function loadParamsFromURL(paramMap) {
    const params = new URLSearchParams(window.location.search);
    Object.entries(paramMap).forEach(([paramKey, elementIds]) => {
      if (params.has(paramKey)) {
        const val = parseFloat(params.get(paramKey));
        if (!Number.isNaN(val)) {
          const input = document.getElementById(elementIds.input);
          const slider = elementIds.slider ? document.getElementById(elementIds.slider) : null;
          if (input) input.value = val;
          if (slider) slider.value = val;
        }
      }
    });
  }

  /**
   * Configura botones de Copiar Resultado y Compartir Enlace con parámetros
   */
  function setupShareAndCopy({ copyBtnId, shareBtnId, getSummaryText, getQueryParams }) {
    const copyBtn = document.getElementById(copyBtnId);
    const shareBtn = document.getElementById(shareBtnId);

    const labels = {
      es: { copied: '¡Copiado!', shared: '¡Enlace copiado!' },
      en: { copied: 'Copied!', shared: 'Link copied!' }
    };

    if (copyBtn) {
      const originalText = copyBtn.textContent;
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(getSummaryText());
          copyBtn.textContent = labels[lang].copied;
          setTimeout(() => (copyBtn.textContent = originalText), 1800);
        } catch (err) {
          console.error('Error al copiar:', err);
        }
      });
    }

    if (shareBtn) {
      const originalText = shareBtn.textContent;
      shareBtn.addEventListener('click', async () => {
        const url = new URL(window.location.origin + window.location.pathname);
        const params = getQueryParams();
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

        try {
          await navigator.clipboard.writeText(url.toString());
          shareBtn.textContent = labels[lang].shared;
          setTimeout(() => (shareBtn.textContent = originalText), 1800);
        } catch (err) {
          console.error('Error al compartir enlace:', err);
        }
      });
    }
  }

  return {
    version,
    lang,
    formatCurrency,
    formatNumber,
    formatPercent,
    bindInput,
    loadParamsFromURL,
    setupShareAndCopy
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.version-badge').forEach((el) => {
    el.textContent = NumeraCore.version;
  });
});
