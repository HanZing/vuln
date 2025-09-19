(function () {
  //rules from json
  const rulesPromise = fetch(chrome.runtime.getURL('content/scanners/csrfRules.json'))
    .then(res => res.json())
    .catch(err => {
      console.error('[CSRFScanner] Failed to load rules, using defaults.', err);
      return {};
    });

  function runCSRFScan() {

    return rulesPromise.then(CSRF_RULES => {
      const issues = [];

      try {
        // Hidden inputs
        document.querySelectorAll('form input[type="hidden"]').forEach(input => {
          const name = input.getAttribute('name')?.toLowerCase();
          const form = input.closest('form');
          if (name && (name.includes('csrf') || name.includes('token'))) {
            const rule = CSRF_RULES['csrf-token-form'] || {};
            issues.push({
              type: 'csrf-token-form',
              tag: 'INPUT',
              detail: `Found hidden CSRF token in form: name="${input.getAttribute('name')}"`,
              suggestion: rule.suggestion || '',
              severity: rule.severity || 'UNSPECIFIED',
              reference: rule.reference || 'No reference available'
            });
          } else if (form && !form.innerHTML.toLowerCase().includes('csrf')) {
            const rule = CSRF_RULES['missing-csrf-token-form'] || {};
            issues.push({
              type: 'missing-csrf-token-form',
              tag: 'FORM',
              detail: 'Form lacks CSRF token input.',
              suggestion: rule.suggestion || '',
              severity: rule.severity || 'UNSPECIFIED',
              reference: rule.reference || 'No reference available'
            });
          }
        });

        // Meta tags
        document.querySelectorAll('meta').forEach(meta => {
          const name = meta.getAttribute('name')?.toLowerCase();
          if (name && (name.includes('csrf') || name.includes('token'))) {
            const rule = CSRF_RULES['csrf-token-meta'] || {};
            issues.push({
              type: 'csrf-token-meta',
              tag: 'META',
              detail: `Meta tag contains CSRF token: name="${meta.getAttribute('name')}"`,
              suggestion: rule.suggestion || '',
              severity: rule.severity || 'UNSPECIFIED',
              reference: rule.reference || 'No reference available'
            });
          }
        });

        // Cookies
        document.cookie.split(';').forEach(cookie => {
          const [key, value] = cookie.trim().split('=');
          if (key && (key.toLowerCase().includes('csrf') || key.toLowerCase().includes('token'))) {
            const rule = CSRF_RULES['csrf-token-cookie'] || {};
            issues.push({
              type: 'csrf-token-cookie',
              tag: 'COOKIE',
              detail: `Cookie contains CSRF token: ${key}=${value}`,
              suggestion: rule.suggestion || '',
              severity: rule.severity || 'UNSPECIFIED',
              reference: rule.reference || 'No reference available'
            });
          }
        });

        // Forms with sensitive methods
        document.querySelectorAll('form').forEach(form => {
          const method = form.getAttribute('method')?.toUpperCase() || 'GET';
          const action = form.getAttribute('action') || '';
          const hasToken = form.innerHTML.toLowerCase().includes('csrf');

          if ((method === 'POST' || method === 'PUT' || method === 'DELETE') && !hasToken) {
            const rule = CSRF_RULES['sensitive-form-no-csrf'] || {};
            issues.push({
              type: 'sensitive-form-no-csrf',
              tag: 'FORM',
              detail: `Form with method="${method}" and action="${action}" has no CSRF token.`,
              suggestion: rule.suggestion || '',
              severity: rule.severity || 'UNSPECIFIED',
              reference: rule.reference || 'No reference available'
            });
          }
        });

      } catch (err) {
        console.error('[VulnEye] Error in runCSRFScan:', err);
        const rule = CSRF_RULES['scanner-error'] || {};
        issues.push({
          type: 'scanner-error',
                    tag: 'SCRIPT',
                    detail: err.message,
                    suggestion: rule.suggestion || '',
                    severity: rule.severity || 'UNSPECIFIED',
                    reference: rule.reference || 'No reference available'
        });
      }

      return issues;
    });
  }

  // Expose function
  window.runCSRFScan = runCSRFScan;
})();