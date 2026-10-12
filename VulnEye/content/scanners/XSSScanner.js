// XSS scanner + rules from the json referencing OWASP XSS cheatsheet and DOMPurify
(function() {

  const rulesPromise = fetch(chrome.runtime.getURL('content/scanners/xssRules.json'))
    .then(res => res.json())
    .catch(err => {
      console.error('[XSSScanner] Failed to load rules, using defaults', err);
      return {};
    });

  function truncate(str, max = 120) {
    str = String(str || '');
    return str.length > max ? str.slice(0, max) + '…' : str;
  }

  function runXSSScan() {

    return rulesPromise.then(rules => {
      
      const issues = [];

      document.querySelectorAll('*').forEach(el => {
        const tag = el.tagName;

        // inline-event-handler
        for (const attr of el.attributes) {
          if (/^on\w+/i.test(attr.name)) {
            const rule = rules['inline-event-handler'] || {};
            issues.push({
              type: 'inline-event-handler',
              tag,
              detail: `${attr.name}="${truncate(attr.value)}"`,
              severity: rule.severity || 'unknown',
              suggestion: rule.suggestion || '',
              references: rule.references || []
            });
          }
        }

        // javascript-uri
        if (el.matches('a[href^="javascript:"], area[href^="javascript:"]')) {
          const rule = rules['javascript-uri'] || {};
          issues.push({
            type: 'javascript-uri',
            tag,
            detail: `href="${el.getAttribute('href')}"`,
            severity: rule.severity || 'unknown',
            suggestion: rule.suggestion || '',
            references: rule.references || []
          });
        }

        // inline-script
        if (tag === 'SCRIPT' && el.textContent.trim()) {
          // Executable types: no type, any *javascript* / ecmascript type, or module.
          // JSON-LD, importmap and template types are data, not code.
          const t = (el.getAttribute('type') || '').trim().toLowerCase();
          if (!t || t === 'module' || t.includes('javascript') || t.includes('ecmascript')) {
            const rule = rules['inline-script'] || {};
            issues.push({
              type: 'inline-script',
              tag,
              snippet: el.textContent.trim().slice(0, 100),
              severity: rule.severity || 'unknown',
              suggestion: rule.suggestion || '',
              references: rule.references || []
            });
          }
        }

        // css-javascript
        if (el.hasAttribute('style') &&
            el.getAttribute('style').toLowerCase().includes('javascript:')) {
          const rule = rules['css-javascript'] || {};
          issues.push({
            type: 'css-javascript',
            tag,
            detail: `style="${truncate(el.getAttribute('style'))}"`,
            severity: rule.severity || 'unknown',
            suggestion: rule.suggestion || '',
            references: rule.references || []
          });
        }

        // iframe-srcdoc
        if (tag === 'IFRAME' && el.hasAttribute('srcdoc')) {
          const rule = rules['iframe-srcdoc'] || {};
          issues.push({
            type: 'iframe-srcdoc',
            tag,
            severity: rule.severity || 'unknown',
            suggestion: rule.suggestion || '',
            references: rule.references || []
          });
        }
      });

      return issues;
    });
  }

  window.runXSSScan = runXSSScan;
})();