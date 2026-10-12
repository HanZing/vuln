(function () {
  //rules from json
  const rulesPromise = fetch(chrome.runtime.getURL('content/scanners/csrfRules.json'))
    .then(res => res.json())
    .catch(err => {
      console.error('[CSRFScanner] Failed to load rules, using defaults.', err);
      return {};
    });

  // Field / meta / cookie names used by common frameworks for CSRF tokens:
  // generic csrf/xsrf, Rails authenticity_token, Laravel _token,
  // ASP.NET __RequestVerificationToken, Django csrfmiddlewaretoken,
  // WordPress _wpnonce.
  const CSRF_NAME = /csrf|xsrf|authenticity_token|^_token$|__requestverificationtoken|_wpnonce/i;

  // Cookie names that usually hold a login session or bearer token. If JS can
  // read them, an XSS bug can steal the session.
  const AUTH_COOKIE_NAME = /(^|[_.-])(access|auth|id|refresh|session)[_.-]?token$|^jwt$|(^|[_.-])jwt([_.-]|$)|^token$/i;

  // Methods that change state. HTML forms only submit GET/POST, but some
  // frameworks put PUT/PATCH/DELETE in the attribute and rewrite it.
  const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  function makeIssue(rules, type, tag, detail) {
    const rule = rules[type] || {};
    return {
      type,
      tag,
      detail,
      suggestion: rule.suggestion || '',
      severity: rule.severity || 'UNSPECIFIED',
      reference: rule.reference || 'No reference available'
    };
  }

  function formHasToken(form) {
    return Array.from(form.querySelectorAll('input[name]'))
      .some(input => CSRF_NAME.test(input.getAttribute('name') || ''));
  }

  function describeForm(form, index) {
    const method = (form.getAttribute('method') || 'GET').toUpperCase();
    const action = form.getAttribute('action') || '(current page)';
    const id = form.id ? ` id="${form.id}"` : '';
    return { method, label: `Form #${index + 1}${id} method="${method}" action="${action}"` };
  }

  function runCSRFScan() {

    return rulesPromise.then(CSRF_RULES => {
      const issues = [];

      try {
        // A page-level token (meta tag) is how most SPAs send CSRF tokens in a
        // header, so forms without their own input are still protected.
        const metaTokens = Array.from(document.querySelectorAll('meta[name]'))
          .filter(meta => CSRF_NAME.test(meta.getAttribute('name') || ''));

        metaTokens.forEach(meta => {
          issues.push(makeIssue(CSRF_RULES, 'csrf-token-meta', 'META',
            `Meta tag holds a CSRF token: name="${meta.getAttribute('name')}"`));
        });

        // Forms: one result per form, not one per hidden input.
        document.querySelectorAll('form').forEach((form, index) => {
          const { method, label } = describeForm(form, index);
          if (!UNSAFE_METHODS.has(method)) return; // GET forms don't need a token

          if (formHasToken(form)) {
            issues.push(makeIssue(CSRF_RULES, 'csrf-token-form', 'FORM',
              `${label} includes a CSRF token field.`));
          } else if (metaTokens.length) {
            issues.push(makeIssue(CSRF_RULES, 'csrf-token-page-level', 'FORM',
              `${label} has no token field, but the page provides a CSRF token in a meta tag.`));
          } else {
            issues.push(makeIssue(CSRF_RULES, 'sensitive-form-no-csrf', 'FORM',
              `${label} has no CSRF token field.`));
          }
        });

        // Cookies. Only names are recorded, never values: scan results end up
        // in storage, in exported PDFs and (optionally) in the AI prompt.
        document.cookie.split(';').forEach(cookie => {
          const name = cookie.trim().split('=')[0];
          if (!name) return;

          if (CSRF_NAME.test(name)) {
            issues.push(makeIssue(CSRF_RULES, 'csrf-token-cookie', 'COOKIE',
              `Cookie "${name}" looks like a CSRF token (double-submit pattern).`));
          } else if (AUTH_COOKIE_NAME.test(name)) {
            issues.push(makeIssue(CSRF_RULES, 'readable-auth-cookie', 'COOKIE',
              `Cookie "${name}" looks like a session/auth token and is readable by JavaScript (not HttpOnly).`));
          }
        });

      } catch (err) {
        console.error('[VulnEye] Error in runCSRFScan:', err);
        issues.push(makeIssue(CSRF_RULES, 'scanner-error', 'SCRIPT', err.message));
      }

      return issues;
    });
  }

  // Expose function
  window.runCSRFScan = runCSRFScan;
})();
