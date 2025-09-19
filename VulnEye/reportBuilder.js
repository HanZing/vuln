//PDF export

/* Safe escape */
function _escapeHtml(s = '') {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* Grade text from score */
function _gradeOf(score) {
  if (typeof score !== 'number') return '—';
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Weak';
  return 'Critical';
}

/* Severity counts for summary */
function _severityCounts(results) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  if (!results || typeof results !== 'object') return counts;
  for (const key in results) {
    const arr = results[key];
    if (!Array.isArray(arr)) continue;
    arr.forEach(item => {
      let sev = (item?.severity || 'low').toLowerCase();
      if (!item?.severity && key === 'csp' && item?.exists === false) sev = 'low';
      if (counts.hasOwnProperty(sev)) counts[sev]++;
    });
  }
  return counts;
}

/* Copy the live donut chart as an <img> for reliable PDF rendering */
function _summaryDonutHTML() {
  const c = document.getElementById('vulnChart');
  if (c && c.toDataURL) {
    try {
      const url = c.toDataURL('image/png', 1.0);
      return `<img class="summary-chart-img" src="${url}" alt="Vulnerability Breakdown" />`;
    } catch (_) {}
  }
  return `<div class="summary-chart-fallback">Summary chart unavailable</div>`;
}

/* ----------- REPORT HTML (Cover + Sections) ----------- */
function buildReportInnerHtml(scanResult) {
  const date  = new Date().toLocaleString();
  const url   = document.getElementById('current-url')?.textContent || '';
  const score = (typeof calculateScore === 'function') ? calculateScore(scanResult) : 'N/A';
  const grade = typeof score === 'number' ? _gradeOf(score) : '—';
  const { critical, high, medium, low } = _severityCounts(scanResult);

  /* COVER PAGE */
  let html = `
    <section class="cover-page">
      <h1>VulnEye Security Report</h1>
      <div class="cover-meta">
        <div><strong>Date:</strong> ${_escapeHtml(date)}</div>
        <div><strong>URL Scanned:</strong> ${_escapeHtml(url)}</div>
      </div>

      <div class="cover-grid">
        <!-- Score card -->
        <div class="score-card">
          <div class="score-card-title">
            <img class="icon" src="${chrome.runtime?.getURL?.('icons/score.png') || 'icons/score.png'}" alt="score" />
            <span>Score</span>
          </div>
          <div class="score-value">${_escapeHtml(String(score))}</div>
          <div class="score-of">out of 100</div>
          <div class="score-grade">${_escapeHtml(grade)}</div>
        </div>

        <!-- Summary card -->
        <div class="summary-card">
          <div class="summary-card-title">
            <img class="icon" src="${chrome.runtime?.getURL?.('icons/report.png') || 'icons/report.png'}" alt="report" />
            <span>Summary Report</span>
          </div>

          <div class="summary-subtitle">Vulnerability Breakdown</div>
          <div class="summary-chart">${_summaryDonutHTML()}</div>

          <div class="summary-legend">
            <div class="legend-item"><span class="box critical"></span> Critical: <strong>${critical}</strong></div>
            <div class="legend-item"><span class="box high"></span> High: <strong>${high}</strong></div>
            <div class="legend-item"><span class="box medium"></span> Medium: <strong>${medium}</strong></div>
            <div class="legend-item"><span class="box low"></span> Low: <strong>${low}</strong></div>
          </div>
        </div>
      </div>
    </section>
  `;

  /* SECTION PAGES */
  const sections = [
    { key: 'libraries', title: 'JS Library Vulnerabilities' },
    { key: 'xss',       title: 'XSS Vulnerabilities' },
    { key: 'header',    title: 'HTTP Header Issues' },
    { key: 'csrf',      title: 'CSRF Token Issues' },
    { key: 'csp',       title: 'CSP Status' },
    { key: 'trackers',  title: 'Trackers Detected' }
  ];

  sections.forEach(({ key, title }) => {
    const items = Array.isArray(scanResult[key]) ? scanResult[key] : [];
    if (!items.length) return;

    html += `<section class="report-section section-page"><h2>${_escapeHtml(title)}</h2>`;

    items.forEach(i => {
      /* ----- LIBRARIES (styled like modal) ----- */
      if (key === 'libraries') {
        const lib = i.library || 'Unknown library';
        const ver = i.version || 'N/A';
        const sev = (i.severity || 'low').toLowerCase();
        const ids  = Array.isArray(i.identifiers) ? i.identifiers : [];
        const sugg = Array.isArray(i.suggestions) ? i.suggestions : [];

        html += `<div class="xss-vuln-entry">`;

        html += `
          <div class="xss-keep-together">
            <h3>${_escapeHtml(`${lib} v${ver}`)}</h3>
            <div class="xss-meta-box">
              Tag: ${_escapeHtml('<>')}
              <span class="xss-separator">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
              Severity: <span class="sev-pill ${sev}">${sev.charAt(0).toUpperCase() + sev.slice(1)}</span>
            </div>
        `;

        if (ids.length) {
          const firstDetail = ids[0];
          const firstSug    = sugg[0] || '';
          html += `
            <div class="xss-pair">
              <div class="xss-labeled-row">
                <div class="xss-section-label">Detail</div>
                <div>${_escapeHtml(firstDetail)}</div>
              </div>
              ${firstSug ? `
              <div class="xss-labeled-row">
                <div class="xss-section-label">Suggestion</div>
                <div>${_escapeHtml(firstSug)}</div>
              </div>` : ''}
            </div>
          `;
        }
        html += `</div>`; // .xss-keep-together

        // Remaining pairs (each also kept intact but allowed to follow on next page)
        for (let idx = 1; idx < ids.length; idx++) {
          const d = ids[idx];
          const s = sugg[idx] || '';
          html += `
            <div class="xss-pair">
              <div class="xss-labeled-row">
                <div class="xss-section-label">Detail</div>
                <div>${_escapeHtml(d)}</div>
              </div>
              ${s ? `
              <div class="xss-labeled-row">
                <div class="xss-section-label">Suggestion</div>
                <div>${_escapeHtml(s)}</div>
              </div>` : ''}
            </div>
          `;
        }

        html += `</div>`; // .xss-vuln-entry
        return;
      }

      /* ----- XSS / HEADER / CSRF / CSP / TRACKERS (unchanged styling) ----- */
      html += `<div class="entry">`;

      switch (key) {
        case 'xss': {
          const type = i.type || 'XSS';
          const tag  = (i.tag || '').toLowerCase();
          const sev  = (i.severity || 'LOW').toUpperCase();
          html += `
            <h3>${_escapeHtml(type)}</h3>
            <div class="meta-row">
              Tag: &lt;${_escapeHtml(tag)}&gt; |
              Severity: <span class="severity ${sev.toLowerCase()}">${_escapeHtml(sev)}</span>
            </div>
          `;
          if (i.snippet)    html += `<div class="labeled-row"><div class="label">Code Snippet</div><div class="content"><pre>${_escapeHtml(i.snippet)}</pre></div></div>`;
          if (i.suggestion) html += `<div class="labeled-row"><div class="label">Suggestion</div><div class="content">${_escapeHtml(i.suggestion)}</div></div>`;
          (i.references || []).forEach(ref => {
            html += `<div class="labeled-row"><div class="label">Reference</div><div class="content"><a href="${ref}" target="_blank">${_escapeHtml(ref)}</a></div></div>`;
          });
          break;
        }

        case 'header':
        case 'csrf': {
          const type = i.type || (key === 'header' ? 'HTTP Header' : 'CSRF');
          const tag  = i.tag ? String(i.tag).toLowerCase() : '';
          const sev  = (i.severity || 'LOW').toUpperCase();
          html += `
            <h3>${_escapeHtml(type)}</h3>
            <div class="meta-row">
              Tag: &lt;${tag ? _escapeHtml(tag) : '&gt;&lt;'}&gt; |
              Severity: <span class="severity ${sev.toLowerCase()}">${_escapeHtml(sev)}</span>
            </div>
          `;
          if (i.detail)     html += `<div class="labeled-row"><div class="label">Detail</div><div class="content">${_escapeHtml(i.detail)}</div></div>`;
          if (i.suggestion) html += `<div class="labeled-row"><div class="label">Suggestion</div><div class="content">${_escapeHtml(i.suggestion)}</div></div>`;
          if (i.reference)  html += `<div class="labeled-row"><div class="label">Reference</div><div class="content"><a href="${i.reference}" target="_blank">${_escapeHtml(i.reference)}</a></div></div>`;
          break;
        }

        case 'csp': {
          const enforced = i.exists ? 'Yes' : 'No';
          html += `
            <h3>CSP Policy</h3>
            <div class="labeled-row"><div class="label">Enforced</div><div class="content">${enforced}</div></div>
          `;
          if (i.exists && i.method)
            html += `<div class="labeled-row"><div class="label">Method</div><div class="content">${_escapeHtml(i.method)}</div></div>`;
          break;
        }

        case 'trackers': {
          const name = i.tracker || 'Tracker';
          const sev  = (i.severity || 'LOW').toUpperCase();
          html += `<h3>${_escapeHtml(name)}</h3>`;
          html += `
            <div class="labeled-row"><div class="label">Severity</div><div class="content"><span class="severity ${sev.toLowerCase()}">${_escapeHtml(sev)}</span></div></div>
            <div class="labeled-row"><div class="label">URL</div><div class="content">${_escapeHtml(i.url || '')}</div></div>
            <div class="labeled-row"><div class="label">Details</div><div class="content">${_escapeHtml(i.summary || '')}</div></div>
            <div class="labeled-row"><div class="label">Suggestion</div><div class="content">${_escapeHtml(i.suggestion || '')}</div></div>
          `;
          (i.references || []).forEach(ref => {
            html += `<div class="labeled-row"><div class="label">Reference</div><div class="content"><a href="${ref}" target="_blank">${_escapeHtml(ref)}</a></div></div>`;
          });
          break;
        }
      }

      html += `</div>`; // .entry
    });

    html += `</section>`;
  });

  return html;
}

/* ----------- STYLES ----------- */
const REPORT_CSS = `
  * { font-family: Arial, sans-serif !important; }
  body { background: #cee6f2; color: #222; padding: 30px; font-size: 14px; }

  h1 { background: #1995AD; color: white; padding: 12px; font-size: 22px; border-radius: 8px; margin-bottom: 16px; }
  h2 { font-size: 18px; font-weight: 600; border-left: 4px solid #1995AD; background: #f1f1f2; padding: 10px 16px; margin: 20px 0 10px; border-radius: 4px; letter-spacing: 0.5px; }
  h3 { font-size: 16px; font-weight: 600; }

  /* Cover */
  .cover-meta { margin-bottom: 12px; }
  .cover-meta > div { margin: 4px 0; }

  .cover-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px;
  }
  .score-card, .summary-card { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 14px; }
  .score-card-title, .summary-card-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; margin-bottom: 10px; }
  .icon { width: 18px; height: 18px; }

  .score-value { font-size: 44px; font-weight: 800; line-height: 1; margin-top: 6px; text-align: center; }
  .score-of, .score-grade { text-align: center; margin-top: 4px; }

  .summary-subtitle { font-weight: 700; margin: 6px 0 8px; }
  .summary-chart { display: flex; justify-content: center; align-items: center; min-height: 120px; }
  .summary-chart-img { width: 220px; max-width: 70%; height: auto; display: block; }
  .summary-chart-fallback { background: #f7f7f7; border: 1px dashed #bbb; border-radius: 4px; padding: 16px; text-align: center; color: #555; }

  .summary-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; margin-top: 8px; }
  .legend-item { display: flex; align-items: center; gap: 8px; }
  .box { width: 12px; height: 12px; display: inline-block; border-radius: 2px; }
  .box.critical{ background:#611C19; } .box.high{ background:#962E2A; } .box.medium{ background:#e3867d; } .box.low{ background:#a1d6e2; }

  /* Sections */
  .report-section { margin-top: 10px; }
  .section-page { break-before: page; page-break-before: always; }

  .entry, .xss-vuln-entry { background: #ffffff; border: 1px solid #ddd; border-radius: 6px; margin-top: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); overflow: hidden;
    break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid; -webkit-region-break-inside: avoid; }
  .entry h3 { background: #f1f1f2; margin: 0; padding: 10px 14px; border-bottom: 1px solid #ddd; }
  .meta-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #f1f1f2; font-weight: 600; border-bottom: 1px solid #ddd;
    break-after: avoid; page-break-after: avoid; }

  .labeled-row { display: flex; width: 100%; min-height: 40px; align-items: stretch; border-top: 1px solid #ddd;
    break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid; -webkit-region-break-inside: avoid; }
  .label, .content { word-break: break-word; overflow-wrap: break-word; white-space: normal; }
  .label { flex: 0 0 28%; min-width: 120px; background: #c3c1c1; font-size: 14px; font-weight: 600; color: #384247; padding: 10px; display: flex; align-items: center; justify-content: center; text-align: center; letter-spacing: 1.2px; }
  .content { flex: 0 0 72%; background: #f1f1f2; padding: 10px 20px 10px 10px; font-size: 14px; font-weight: 500; letter-spacing: 1.05px; line-height: 1.4; }
  pre { font-family: Arial, sans-serif !important; background: #f7f7f7; padding: 10px; margin: 0; font-size: 13px; white-space: pre-wrap; border: none; }

  /* Modal-like styling for libraries */
  .xss-vuln-entry h3 { background:#f1f1f2; color:#384247; margin:0; padding:10px 12px; font-size:18px; font-weight:600; border-bottom:1px solid #ddd; letter-spacing:1.1px;
    break-after: avoid; page-break-after: avoid; }
  .xss-meta-box { display:flex; align-items:center; color:#384247; gap:8px; padding:8px 12px; background:#f1f1f2; border-bottom:1px solid #ddd; font-weight:600; font-size:16px; letter-spacing:1.05px;
    break-after: avoid; page-break-after: avoid; }
  .xss-separator { color:#666; }
  .sev-pill { padding:2px 8px; border-radius:999px; font-weight:700; }
  .sev-pill.low{background:#e7f3f7;color:#3b6b78;} .sev-pill.medium{background:#fde7e2;color:#91443b;} .sev-pill.high{background:#f3d0cc;color:#6f2d28;} .sev-pill.critical{background:#f1c7c4;color:#5b1e1b;}

  /* Keep this block (title+meta+first pair) together */
  .xss-keep-together { break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid; -webkit-region-break-inside: avoid; }

  .xss-pair { margin:8px 0; padding-bottom:4px; break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid; -webkit-region-break-inside: avoid; }
  .xss-labeled-row { display:flex; width:100%; align-items:stretch; margin-top:5px; overflow:hidden; border-top:2px solid #c3c1c1;
    break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid; -webkit-region-break-inside: avoid; }
  .xss-section-label { flex:0 0 28%; max-width:28%; background:#c3c1c1; font-size:16px; color:#384247; font-weight:600; padding:10px; display:flex; align-items:center; justify-content:center; letter-spacing:1.1px; }
  .xss-labeled-row div:not(.xss-section-label) { flex:0 0 72%; max-width:72%; background:#f1f1f2; padding:10px 30px 10px 10px; font-size:15px; font-weight:500; letter-spacing:1.1px; line-height:1.4; }

  .severity { font-weight:800; }
  .severity.critical{ color:#611C19; } .severity.high{ color:#962E2A; } .severity.medium{ color:#e3867d; } .severity.low{ color:#689D76; }

  @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  @media (max-width: 900px) { .cover-grid { grid-template-columns: 1fr; } }
`;

/* ----------- EXPORT ----------- */
async function exportReportAsPdf() {
  try {
    if (!lastScanResult) return alert("No scan results available.");
    if (typeof html2pdf === 'undefined') {
      console.error('[PDF Export] html2pdf not loaded');
      return alert('Export dependency missing. Check libs/html2pdf.bundle.min.js path.');
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'vulneye-report-wrapper';
    wrapper.style.padding = '24px';

    const styleEl = document.createElement('style');
    styleEl.textContent = REPORT_CSS;
    wrapper.appendChild(styleEl);

    const inner = document.createElement('div');
    inner.innerHTML = buildReportInnerHtml(lastScanResult);
    wrapper.appendChild(inner);

    document.body.appendChild(wrapper);
    await new Promise(r => setTimeout(r, 60));

    const opt = {
      margin: 0.5,
      filename: 'vulneye-report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      pagebreak: {
        mode: ['css', 'legacy'],
        // prevent orphans; move whole block when it would split
        avoid: [
          '.xss-keep-together',
          '.xss-pair',
          '.xss-labeled-row',
          '.xss-vuln-entry',
          '.entry',
          '.meta-row',
          '.xss-meta-box',
          '.xss-vuln-entry > h3',
          '.entry > h3'
        ]
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().from(wrapper).set(opt).save();
    wrapper.remove();
  } catch (e) {
    console.error('[PDF Export] Failed:', e);
    alert('Failed to export PDF: ' + e.message);
  }
}

/* Bind on ready */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('export-pdf')?.addEventListener('click', exportReportAsPdf);
});
