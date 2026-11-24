window.NumeraExport = (function () {
  const loadedScripts = {};

  const CDN = {
    xlsx: 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
    jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    autotable: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
  };

  function loadScript(url) {
    if (loadedScripts[url]) return loadedScripts[url];

    loadedScripts[url] = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        delete loadedScripts[url];
        reject(new Error(`Error loading ${url}`));
      };
      document.head.appendChild(script);
    });

    return loadedScripts[url];
  }

  function setButtonLoading(btn, isLoading, loadingText) {
    if (!btn) return;
    if (isLoading) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = loadingText;
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.originalText || btn.textContent;
      btn.disabled = false;
    }
  }

  function sanitizeForPDF(text) {
    return String(text ?? '')
      .replace(/→/g, '->')
      .replace(/←/g, '<-')
      .replace(/—/g, '-')
      .replace(/–/g, '-')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
  }

  /**
   * Exporta un reporte completo a Excel (.xlsx) con pestañas de Resumen y Tabla
   */
  async function toExcel({ btn, filename, title, summaryRows, tableHeaders, tableRows }) {
    const lang = (window.NumeraCore && NumeraCore.lang) || 'es';
    setButtonLoading(btn, true, lang === 'en' ? 'Generating Excel...' : 'Generando Excel...');

    try {
      await loadScript(CDN.xlsx);

      const wb = XLSX.utils.book_new();
      const dateStr = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES');

      // Pestaña 1: Resumen
      const summarySheetData = [
        [`Numera — ${title}`],
        [lang === 'en' ? `Generated on: ${dateStr}` : `Generado el: ${dateStr}`],
        [],
        [lang === 'en' ? 'Metric / Parameter' : 'Concepto / Parámetro', lang === 'en' ? 'Value' : 'Valor'],
        ...summaryRows
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
      wsSummary['!cols'] = [{ wch: 34 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, lang === 'en' ? 'Summary' : 'Resumen');

      // Pestaña 2: Tabla de desglose (si existe)
      if (tableHeaders && tableHeaders.length && tableRows && tableRows.length) {
        const tableSheetData = [tableHeaders, ...tableRows];
        const wsTable = XLSX.utils.aoa_to_sheet(tableSheetData);

        // Autoajustar ancho de columnas según contenido
        wsTable['!cols'] = tableHeaders.map((header, colIdx) => {
          let maxLen = String(header).length;
          tableRows.forEach((row) => {
            const cellLen = String(row[colIdx] ?? '').length;
            if (cellLen > maxLen) maxLen = cellLen;
          });
          return { wch: Math.max(14, maxLen + 4) };
        });

        XLSX.utils.book_append_sheet(wb, wsTable, lang === 'en' ? 'Breakdown' : 'Desglose');
      }

      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (err) {
      alert(
        lang === 'en'
          ? 'Could not load Excel generator. Please check your internet connection.'
          : 'No se pudo cargar el generador de Excel. Verifica tu conexión a internet.'
      );
    } finally {
      setButtonLoading(btn, false);
    }
  }

  /**
   * Exporta un reporte estilizado a PDF (.pdf)
   */
  async function toPDF({ btn, filename, title, subtitle, summaryRows, tableHeaders, tableRows }) {
    const lang = (window.NumeraCore && NumeraCore.lang) || 'es';
    setButtonLoading(btn, true, lang === 'en' ? 'Generating PDF...' : 'Generando PDF...');

    try {
      await loadScript(CDN.jspdf);
      await loadScript(CDN.autotable);

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const dateStr = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES');

      // Limpiar caracteres Unicode incompatibles con fuentes estándar de jsPDF
      const cleanTitle = sanitizeForPDF(title);
      const cleanSubtitle = sanitizeForPDF(subtitle);
      const cleanSummary = (summaryRows || []).map((row) => row.map(sanitizeForPDF));
      const cleanHeaders = (tableHeaders || []).map(sanitizeForPDF);
      const cleanRows = (tableRows || []).map((row) => row.map(sanitizeForPDF));

      // Encabezado oscuro estilo Numera
      doc.setFillColor(17, 24, 39); // #111827
      doc.rect(0, 0, 210, 32, 'F');

      // Punto verde esmeralda y marca
      doc.setFillColor(16, 185, 129); // #10b981
      doc.circle(16, 12, 2.2, 'F');

      doc.setTextColor(248, 250, 252);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Numera', 21, 13.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(dateStr, 196, 13.5, { align: 'right' });

      // Título del reporte
      doc.setTextColor(248, 250, 252);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(cleanTitle, 14, 24);

      let currentY = 40;

      if (cleanSubtitle) {
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(cleanSubtitle, 14, currentY);
        currentY += 6;
      }

      // Tabla de Resumen de Parámetros y Resultados
      doc.autoTable({
        startY: currentY,
        head: [[lang === 'en' ? 'Concept' : 'Concepto', lang === 'en' ? 'Value' : 'Valor']],
        body: cleanSummary,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [248, 250, 252],
          fontStyle: 'bold',
          fontSize: 9.5
        },
        bodyStyles: {
          textColor: [15, 23, 42],
          fontSize: 9.5
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 110 },
          1: { halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      currentY = doc.lastAutoTable.finalY + 10;

      // Tabla de Desglose (si existe)
      if (cleanHeaders.length && cleanRows.length) {
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(lang === 'en' ? 'Detailed Schedule' : 'Tabla de Desglose', 14, currentY);

        doc.autoTable({
          startY: currentY + 4,
          head: [cleanHeaders],
          body: cleanRows,
          theme: 'striped',
          headStyles: {
            fillColor: [16, 185, 129],
            textColor: [9, 13, 22],
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            textColor: [30, 41, 59],
            fontSize: 8.5
          },
          columnStyles: {
            0: { fontStyle: 'bold', halign: 'left' }
          },
          styles: {
            halign: 'right'
          },
          margin: { left: 14, right: 14 }
        });
      }

      // Pie de página con numeración
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `numera.app - ${lang === 'en' ? 'Page' : 'Página'} ${i} / ${pageCount}`,
          105,
          290,
          { align: 'center' }
        );
      }

      doc.save(`${filename}.pdf`);
    } catch (err) {
      alert(
        lang === 'en'
          ? 'Could not load PDF generator. Please check your internet connection.'
          : 'No se pudo cargar el generador de PDF. Verifica tu conexión a internet.'
      );
    } finally {
      setButtonLoading(btn, false);
    }
  }

  return { toExcel, toPDF };
})();