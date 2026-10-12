function runCSPScan() {
  return new Promise(resolve => {
    const issues = [];

    try {
      const metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');

      if (metaTag) {
        issues.push({
          exists: true,
          severity: 'INFO',
          method: 'meta',
          value: metaTag.getAttribute('content'),
          suggestion: 'CSP detected via meta tag.'
        });
        return resolve(issues);
      }

      fetch(window.location.href, { method: 'HEAD' })
        .then(res => {
          const csp = res.headers.get('Content-Security-Policy');
          if (csp) {
            issues.push({
              exists: true,
              severity: 'INFO',
              method: 'header',
              value: csp,
              suggestion: 'CSP detected via response header.'
            });
          } else {
            issues.push({
              exists: false,
              severity: 'MODERATE',
              method: 'header',
              suggestion: 'No Content-Security-Policy found. Add one to limit where scripts can load from and reduce XSS impact.'
            });
          }
          resolve(issues);
        })
        .catch(err => {
          console.error('[CSPScanner] Error fetching headers:', err);
          issues.push({
            exists: false,
            severity: 'INFO',
            method: 'header',
            error: err.message,
            suggestion: 'Failed to check CSP via headers. Possible CORS restriction.'
          });
          resolve(issues);
        });
    } catch (err) {
      console.error('[CSPScanner] General error:', err);
      issues.push({
        exists: false,
        severity: 'INFO',
        method: 'meta/header',
        error: err.message,
        suggestion: 'Unexpected error occurred during CSP check.'
      });
      resolve(issues);
    }
  });
}

window.runCSPScan = runCSPScan;