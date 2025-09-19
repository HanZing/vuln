function injectModalStyles() {
  if (document.getElementById('vuln-modal-style')) return;

  const style = document.createElement('style');
  style.id = 'vuln-modal-style';
  style.textContent = `
    #vuln-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.6);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .vuln-modal-box {
      background: #cee6f2;
      color: #222;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      padding: 20px;
      border-radius: 8px;
      font-family: sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      position: relative;
    }

    .vuln-modal-box, 
    .vuln-modal-box * {
      font-family: 'Inter', sans-serif;
    }
       
    .vuln-modal-box h2 {
      background: #1995AD;
      color: white;
      margin: -20px -20px 16px;
      padding: 8px;
      font-size: 22px;
      font-weight: 600;
      border-radius: 8px 8px 0 0;
      text-indent: 10px;
    }

    #close-vuln-modal {
      color: #CEE6F2;
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
    }

    .vuln-entry,
    .tracker-entry {
      background: #ffffff;
      border: 1px solid #ddd;
      border-radius: 6px;
      margin-bottom: 16px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }

    .vuln-entry h3,
    .tracker-entry h3 {
      background: #f1f1f2;
      color: #222;
      margin: 0;
      padding: 10px 12px;
      font-size: 16px;
      font-weight: 600;
      border-bottom: 1px solid #ddd;      
      font-family: 'Inter', sans-serif; 
    }

    .vuln-entry .meta,
    .tracker-entry .meta {
      display: flex;
      align-items: center;
      gap: 16px; 
      padding: 8px 12px;
      font-size: 14px;
      border-bottom: 1px solid #f0f0f0;
    }

    .vuln-entry > div:first-of-type {
      margin-left: 12px;
    }
      
    .vuln-entry > div:last-child,
    .tracker-entry > div:last-child {
      border-bottom: none;
    }

    .vuln-entry code {
      display: block;
      background: #f7f7f7;
      border-radius: 4px;
      padding: 10px;
      margin: 8px 12px;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 13px;
    }

    .vuln-entry .suggestion,
    .tracker-entry .suggestion {
      background: #f0f9f0;
      border-left: 4px solid #85BAC6;
      padding: 10px 12px;
      margin: 10px 12px;
      border-radius: 4px;
      font-size: 13px;
    }

    .vuln-entry ul,
    .tracker-entry ul {
      margin: 8px 16px;
      font-size: 13px;
      padding-left: 16px;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f1f1f2;
      border-bottom: 1px solid #ddd;
      font-size: 14px;
    }

    .meta-row .separator {
      color: #666;
    }

    .section-label {
      background: #f1f1f2;
      color: #333;
      font-weight: 600;
      padding: 6px 10px;
      width: 140px;
      flex-shrink: 0;
      border-right: 1px solid #ccc;
    }

    .labeled-row {
      display: flex;
      border-bottom: 1px solid #ddd;
    }

    .labeled-row pre,
    .labeled-row div {
      padding: 6px 10px;
      background: #f1f1f2;
      flex: 1;
    }

    .vuln-scroll-container {
      max-height: 60vh;       
      overflow-y: auto;       
      margin-top: 10px;        
      padding-right: 15px;        
      margin-right: -5px;
      margin-left: 8px;
    }

    .vuln-scroll-container::-webkit-scrollbar {
      width: 8px;
    }

    .vuln-scroll-container::-webkit-scrollbar-thumb {
      background-color: #bbb;
      border-radius: 4px;
    }

    .vuln-scroll-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .suggestion {
      background: #f1f1f2;
      border-left: 4px solid #85BAC6;
      padding: 10px 12px;
      margin: 10px 0;
      border-radius: 4px;
      font-size: 13px;
    }

    .xss-vuln-entry h3 {
      background: #f1f1f2;
      color: #384247;
      margin: 0;
      padding: 10px 12px;
      font-size: 18px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      border-bottom: 1px solid #ddd;
      letter-spacing: 1.35px
    }

    .xss-vuln-entry .xss-meta-box {
      display: flex;
      align-items: center;
      color: #384247;
      gap: 8px;
      padding: 8px 12px;
      background: #f1f1f2;
      border-bottom: 1px solid #ddd;
      font-weight: 600;
      font-size: 16px;
      margin-top: 5px;
      letter-spacing: 1.25px;
    }

    .xss-labeled-row {
      display: flex;
      width: 100%;                
      margin-top: 5px;
      overflow: hidden;
      align-items: stretch;
    }

    .xss-section-label {
      flex: 0 0 28%;            
      max-width: 28%;
      background: #c3c1c1;
      font-size: 16px;
      color: #384247;
      font-weight: 600;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 1.25px;
    }

    .xss-labeled-row pre,
    .xss-labeled-row div:not(.xss-section-label) {
      flex: 0 0 72%;
      max-width: 72%;
      background: #f1f1f2;
      padding: 10px 30px 10px 10px;
      font-size: 13px;
      font-weight: 600;
      box-sizing: border-box;   
      white-space: normal;     
      word-break: keep-all;    
      overflow-wrap: normal;
      margin: 0;
      line-height: 1.4;
      display: block;    
      letter-spacing: 1.05px;  
      hyphens: auto;         
    }

    .xss-labeled-row div:not(.xss-section-label) {
      font-weight: 500;
      font-size: 15px;
      letter-spacing: 1.20px;
    }

    .xss-labeled-row pre {
      font-family: 'Anonymous Pro', monospace;
      border: none !important;
      border-radius: 0px !important;
    }

    .xss-labeled-row ul {
      flex: 0 0 72%;
      max-width: 72%;
      background: #f1f1f2;
      padding: 10px 30px 10px 10px;
      margin: 0;
      list-style: none;        
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 1.2px;
    }

    .xss-labeled-row ul li {
      position: relative;
      padding-left: 0;
    }

    .xss-labeled-row ul li::before {
      content: none;
    }

    .xss-vuln-entry + .xss-vuln-entry {
      margin-top: 30px; 
    }

    .xss-labeled-row .xss-url-box {
      display: block;
      max-width: 100%;
      border: 1px solid #cfd8dc;
      border-radius: 4px;
      padding: 10px 12px;
      background: #f1f1f2;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: break-all !important;
      box-sizing: border-box;
    }

    .xss-labeled-row ul a {
      word-break: break-word;
      overflow-wrap: anywhere;
      text-decoration: underline;
    }

    .severity-high {
      text-transform: capitalize;
      display: inline-flex;
      align-items: center;
      color: #822622;
      font-weight: bold;
      line-height: 1;
      gap: 8px;
    }

    .severity-medium,
    .severity-moderate {
      text-transform: capitalize;
      display: inline-flex;
      align-items: center;
      color: #e3867d;
      font-weight: bold;
      line-height: 1;
      gap: 8px;
    }

    .severity-low {
      text-transform: capitalize;
      display: inline-flex;
      align-items: center;
      color: #a1d6e2;
      font-weight: bold;
      line-height: 1;
      gap: 8px;
    }

    .severity-high::before {
      content: url('../icons/high.png');
    }

    .severity-medium::before,
    .severity-moderate::before {
      content: url('../icons/moderate.png');
    }

    .severity-low::before {
      content: url('../icons/low.png');
    }

    .severity-high img,
    .severity-low img {
      width: 15px;
      height: 15px;
      display: inline-block;
      margin-right: 8px !important;
    }

    .severity-medium img,
    .severity-moderate img {
      width: 20px !important;
      height: 20px !important;
      display: inline-block;
      margin-right: 8px !important;
    }

    .xss-pair {
      margin: 8px 0 8px;        
      padding-bottom: 4px;   
    }
    .xss-pair:last-of-type {
      border-bottom: none;        
      margin-bottom: 3px;
    }
    .xss-pair .xss-labeled-row {
      margin: 0;                 
    }
    .xss-pair .xss-labeled-row + .xss-labeled-row {
      border-top: 2px solid #c3c1c1; /* divider line */
    }
  `;
  document.head.appendChild(style);
}

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showSiteModal(type, items) {
  injectModalStyles(); 

  const existing = document.getElementById('vuln-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'vuln-modal';

  const box = document.createElement('div');
  box.className = 'vuln-modal-box';

  const closeBtn = document.createElement('button');
  closeBtn.id = 'close-vuln-modal';
  closeBtn.textContent = '✖';
  closeBtn.onclick = () => modal.remove();
  box.appendChild(closeBtn);

  const header = document.createElement('h2');
  let titleText;
  switch (type) {
    case 'libraries': titleText = 'JS Library Vulnerabilities';     break;
    case 'xss':       titleText = 'XSS Vulnerabilities';            break;
    case 'csrf':      titleText = 'Missing CSRF Tokens';            break;
    case 'header':    titleText = 'Header Vulnerabilities';         break;
    case 'trackers':  titleText = 'Trackers Detected';              break;
    default:          titleText = 'Scan Results';
  }
  header.textContent = titleText;
  box.appendChild(header);

  const scrollWrapper = document.createElement('div');
  scrollWrapper.className = 'vuln-scroll-container';

  if (!items || items.length === 0) {
    const none = document.createElement('p');
    none.textContent = 'No issues detected on this page.';
    scrollWrapper.appendChild(none);

  // JS Library
  } else if (type === 'libraries') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.className = 'xss-vuln-entry';

      // Issue name (title)
      const h3 = document.createElement('h3');
      h3.textContent = escapeHtml(`${i.library} v${i.version}`);
      entry.appendChild(h3);

      // Meta: Tag <> | Severity (with icon)
      const metaBox = document.createElement('div');
      metaBox.className = 'xss-meta-box';
      metaBox.innerHTML = `
        Tag: ${escapeHtml('<>')}
        <span class="xss-separator">&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;</span>
        Severity: <span class="severity-${i.severity.toLowerCase()}">
          <img src="${chrome.runtime.getURL('icons/' + i.severity.toLowerCase() + '.png')}">
          ${escapeHtml(i.severity.charAt(0).toUpperCase() + i.severity.slice(1).toLowerCase())}
        </span>
      `;
      entry.appendChild(metaBox);

      // Detail / Suggestion rows
      const details = Array.isArray(i.identifiers) ? i.identifiers : [];
      details.forEach((detailText, idx) => {
        // NEW: wrapper for each pair
        const pair = document.createElement('div');
        pair.className = 'xss-pair';

        // Detail
        const detailRow = document.createElement('div');
        detailRow.className = 'xss-labeled-row';
        detailRow.innerHTML = `
          <div class="xss-section-label">Detail</div>
          <div>${escapeHtml(detailText)}</div>
        `;
        pair.appendChild(detailRow);

        // Suggestion (only if present)
        const suggestionText =
          (i.suggestions && i.suggestions[idx]) ? i.suggestions[idx] : '';
        if (suggestionText) {
          const suggestionRow = document.createElement('div');
          suggestionRow.className = 'xss-labeled-row';
          suggestionRow.innerHTML = `
            <div class="xss-section-label">Suggestion</div>
            <div>${escapeHtml(suggestionText)}</div>
          `;
          pair.appendChild(suggestionRow);
        }

        // Append the pair to the entry
        entry.appendChild(pair);
      });


      scrollWrapper.appendChild(entry);
    });


  // XSS
  } else if (type === 'xss') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.className = 'xss-vuln-entry';

      // Title
      const h3 = document.createElement('h3');
      h3.textContent = escapeHtml(i.type); // name/title
      entry.appendChild(h3);

      // Meta (Tag | Severity)
      const metaBox = document.createElement('div');
      metaBox.className = 'xss-meta-box';
      metaBox.innerHTML = `
        Tag: ${escapeHtml('<' + i.tag.toLowerCase() + '>')}
        <span class="xss-separator">&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;</span>
        Severity: <span class="severity-${i.severity.toLowerCase()}">
                    <img src="${chrome.runtime.getURL('icons/' + i.severity.toLowerCase() + '.png')}">
                    ${escapeHtml(i.severity.charAt(0).toUpperCase() + i.severity.slice(1).toLowerCase())}
                  </span>
      `;
      entry.appendChild(metaBox);

      // Code Snippet
      if (i.snippet) {
        const codeRow = document.createElement('div');
        codeRow.className = 'xss-labeled-row';
        codeRow.innerHTML = `
          <div class="xss-section-label">Code Snippet</div>
          <pre>${escapeHtml(i.snippet)}</pre>
        `;
        entry.appendChild(codeRow);
      }

      // Suggestions
      if (i.suggestion) {
        const suggestionRow = document.createElement('div');
        suggestionRow.className = 'xss-labeled-row';
        suggestionRow.innerHTML = `
          <div class="xss-section-label">Suggestions</div>
          <div>${escapeHtml(i.suggestion)}</div>
        `;
        entry.appendChild(suggestionRow);
      }

      scrollWrapper.appendChild(entry);
    });

  // HTTP Header
  } else if (type === 'header') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.className = 'xss-vuln-entry';

      // Title (Header vulnerability name)
      const h3 = document.createElement('h3');
      h3.textContent = escapeHtml(i.type); 
      entry.appendChild(h3);

      // Meta (Tag + Severity)
      const metaBox = document.createElement('div');
      metaBox.className = 'xss-meta-box';
      metaBox.innerHTML = `
        Tag: ${escapeHtml('<>')}
        <span class="xss-separator">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
        Severity: <span class="severity-${i.severity.toLowerCase()}">
                    <img src="${chrome.runtime.getURL('icons/' + i.severity.toLowerCase() + '.png')}">
                    ${escapeHtml(i.severity.charAt(0).toUpperCase() + i.severity.slice(1).toLowerCase())}
                  </span>
      `;
      entry.appendChild(metaBox);

      if (i.detail) {
        const detailRow = document.createElement('div');
        detailRow.className = 'xss-labeled-row';
        detailRow.innerHTML = `
          <div class="xss-section-label">Detail</div>
          <div>${escapeHtml(i.detail)}</div>
        `;
        entry.appendChild(detailRow);
      }

      // Suggestions
      if (i.suggestion) {
        const suggestionRow = document.createElement('div');
        suggestionRow.className = 'xss-labeled-row';
        suggestionRow.innerHTML = `
          <div class="xss-section-label">Suggestion</div>
          <div>${escapeHtml(i.suggestion)}</div>
        `;
        entry.appendChild(suggestionRow);
      }

      // Reference
      if (i.reference) {
        const referenceRow = document.createElement('div');
        referenceRow.className = 'xss-labeled-row';
        referenceRow.innerHTML = `
          <div class="xss-section-label">Reference</div>
          <div>${/^https?:\/\//i.test(i.reference)
            ? `<a href="${i.reference}" target="_blank">${escapeHtml(i.reference)}</a>`
            : escapeHtml(i.reference)}</div>
        `;
        entry.appendChild(referenceRow);
      }

      scrollWrapper.appendChild(entry);
    });

  // CSRF
  } else if (type === 'csrf') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.className = 'xss-vuln-entry';

      // Title (CSRF vulnerability name)
      const h3 = document.createElement('h3');
      h3.textContent = escapeHtml(i.type); 
      entry.appendChild(h3);

      // Meta (Tag + Severity)
      const metaBox = document.createElement('div');
      metaBox.className = 'xss-meta-box';
      metaBox.innerHTML = `
        Tag: ${escapeHtml('<' + i.tag.toLowerCase() + '>')}
        <span class="xss-separator">&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;</span>
        Severity: <span class="severity-${i.severity.toLowerCase()}">
                    <img src="${chrome.runtime.getURL('icons/' + i.severity.toLowerCase() + '.png')}">
                    ${escapeHtml(i.severity.charAt(0).toUpperCase() + i.severity.slice(1).toLowerCase())}
                  </span>
      `;
      entry.appendChild(metaBox);

      // Detail
      if (i.detail) {
        const detailRow = document.createElement('div');
        detailRow.className = 'xss-labeled-row';
        detailRow.innerHTML = `
          <div class="xss-section-label">Detail</div>
          <div>${escapeHtml(i.detail)}</div>
        `;
        entry.appendChild(detailRow);
      }

      // Suggestions
      if (i.suggestion) {
        const suggestionRow = document.createElement('div');
        suggestionRow.className = 'xss-labeled-row';
        suggestionRow.innerHTML = `
          <div class="xss-section-label">Suggestion</div>
          <div>${escapeHtml(i.suggestion)}</div>
        `;
        entry.appendChild(suggestionRow);
      }

      // Reference
      if (i.reference) {
        const referenceRow = document.createElement('div');
        referenceRow.className = 'xss-labeled-row';
        referenceRow.innerHTML = `
          <div class="xss-section-label">Reference</div>
          <div>${/^https?:\/\//i.test(i.reference)
            ? `<a href="${i.reference}" target="_blank">${escapeHtml(i.reference)}</a>`
            : escapeHtml(i.reference)}</div>
        `;
        entry.appendChild(referenceRow);
      }

      scrollWrapper.appendChild(entry);
    });


  // Trackers
  } else if (type === 'trackers') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.className = 'xss-vuln-entry';

      // Title 
      const h3 = document.createElement('h3');
      h3.textContent = escapeHtml(i.tracker);
      entry.appendChild(h3);

      // Severity
      const metaBox = document.createElement('div');
      metaBox.className = 'xss-meta-box';
      metaBox.innerHTML = `
        Severity: <span class="severity-${i.severity.toLowerCase()}">
                    <img src="${chrome.runtime.getURL('icons/' + i.severity.toLowerCase() + '.png')}">
                    ${escapeHtml(i.severity.charAt(0).toUpperCase() + i.severity.slice(1).toLowerCase())}
                  </span>
      `;
      entry.appendChild(metaBox);

      // URL
      if (i.url) {
        const urlRow = document.createElement('div');
        urlRow.className = 'xss-labeled-row';
        urlRow.innerHTML = `
          <div class="xss-section-label">URL</div>
          <pre class="xss-url-box">${escapeHtml(i.url)}</pre>
        `;
        entry.appendChild(urlRow);
      }


      // Details (Summary)
      if (i.summary) {
        const detailsRow = document.createElement('div');
        detailsRow.className = 'xss-labeled-row';
        detailsRow.innerHTML = `
          <div class="xss-section-label">Details</div>
          <div>${escapeHtml(i.summary)}</div>
        `;
        entry.appendChild(detailsRow);
      }

      // Suggestions
      if (i.suggestion) {
        const suggestionRow = document.createElement('div');
        suggestionRow.className = 'xss-labeled-row';
        suggestionRow.innerHTML = `
          <div class="xss-section-label">Suggestion</div>
          <div>${escapeHtml(i.suggestion)}</div>
        `;
        entry.appendChild(suggestionRow);
      }

      // References
      if (i.references && i.references.length > 0) {
        const referencesRow = document.createElement('div');
        referencesRow.className = 'xss-labeled-row';
        const refsList = i.references.map(r =>
          `<li><a href="${r}" target="_blank">${escapeHtml(r)}</a></li>`
        ).join('');
        referencesRow.innerHTML = `
          <div class="xss-section-label">References</div>
          <ul>${refsList}</ul>
        `;
        entry.appendChild(referencesRow);
      }

      scrollWrapper.appendChild(entry);
    });
  } else {
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(items, null, 2);
    scrollWrapper.appendChild(pre);
  }

  box.appendChild(scrollWrapper);
  modal.appendChild(box);
  document.body.appendChild(modal);
}


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'showDetails') {
    showSiteModal(msg.dataType, msg.data);
    sendResponse({ status: 'shown' });
  }
});


