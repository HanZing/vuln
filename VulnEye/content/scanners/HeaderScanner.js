(function () {

  // Load header rules from JSON
  const rulesPromise = fetch(chrome.runtime.getURL('content/scanners/headerRules.json'))
    .then(res => res.json())
    .catch(err => {
      console.error('[HeaderScanner] Failed to load rules:', err);
      return {};
    });

  // Some servers reject HEAD (405/501); fall back to GET in that case.
  function fetchHeaders() {
    return fetch(location.href, { method: 'HEAD', mode: 'same-origin', credentials: 'same-origin' })
      .then(res => {
        if (res.status === 405 || res.status === 501) {
          return fetch(location.href, { method: 'GET', mode: 'same-origin', credentials: 'same-origin' });
        }
        return res;
      });
  }

  function runHeaderScan() {

    const issues = [];

    return rulesPromise.then(HEADER_RULES => {
      return fetchHeaders()
        .then(res => {
          const csp = (res.headers.get('content-security-policy') || '').toLowerCase();
          const hasFrameAncestors = /(^|;)\s*frame-ancestors\s/.test(csp);
          const isHttps = location.protocol === 'https:';

          const checks = [
            {
              header: "strict-transport-security",
              type: "Missing Strict-Transport-Security",
              check: value => {
                // Browsers ignore HSTS on plain-HTTP responses.
                if (!isHttps) return { valid: true };
                if (!value) return { valid: false, detail: "Missing header: Strict-Transport-Security" };
                if (!/max-age=\d+/.test(value)) return { valid: false, detail: `Weak HSTS config: ${value}` };
                return { valid: true };
              }
            },
            {
              header: "x-frame-options",
              type: "Missing X-Frame-Options",
              check: value => {
                // CSP frame-ancestors supersedes X-Frame-Options in modern browsers.
                if (!value && hasFrameAncestors) return { valid: true };
                if (!value) return { valid: false, detail: "Missing header: X-Frame-Options (and no CSP frame-ancestors)" };
                if (!/^(DENY|SAMEORIGIN)$/i.test(value)) return { valid: false, detail: `Insecure value: ${value}` };
                return { valid: true };
              }
            },
            {
              header: "x-content-type-options",
              type: "Missing X-Content-Type-Options",
              check: value => {
                return value?.toLowerCase() === 'nosniff'
                  ? { valid: true }
                  : { valid: false, detail: value ? `Unexpected value: ${value}` : "Missing header: X-Content-Type-Options" };
              }
            },
            {
              header: "referrer-policy",
              type: "Missing Referrer-Policy",
              check: value => {
                return value
                  ? { valid: true }
                  : { valid: false, detail: "Missing header: Referrer-Policy" };
              }
            },
            {
              header: "permissions-policy",
              type: "Missing Permissions-Policy",
              check: value => {
                return value
                  ? { valid: true }
                  : { valid: false, detail: "Missing header: Permissions-Policy" };
              }
            },
            {
              header: "x-xss-protection",
              type: "Legacy XSS-Protection enabled",
              check: value => {
                // The XSS Auditor is gone from modern browsers and could itself
                // be abused. OWASP now recommends "0" or omitting the header.
                const v = (value || '').trim();
                return (!v || v.startsWith('0'))
                  ? { valid: true }
                  : { valid: false, detail: `X-XSS-Protection: ${v} (recommended: 0, or remove the header)` };
              }
            }
          ];

          for (const { header, type, check } of checks) {
            const value = res.headers.get(header);
            const result = check(value);

            if (!result.valid) {
              const rule = HEADER_RULES[type] || {};

              issues.push({
                type,
                tag: 'HEADER',
                detail: result.detail,
                suggestion: rule.suggestion || '',
                severity: rule.severity || 'UNSPECIFIED',
                reference: rule.reference || 'No reference available'
              });
            }
          }

          return issues;
        })
        .catch(err => {
          const fallback = HEADER_RULES["Scanner Error"] || {};
          return [{
            type: 'scanner-error',
            tag: 'HEADER',
            detail: err.message,
            suggestion: fallback.suggestion || 'Scanner encountered an error.',
            // Couldn't check is not the same as vulnerable: don't affect the score.
            severity: fallback.severity || 'INFO',
            reference: fallback.reference || 'No reference available'
          }];
        });
    });
  }

  window.runHeaderScan = runHeaderScan;
})();
