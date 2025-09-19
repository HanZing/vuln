function runCSPScan() {
  return new Promise(resolve => {
    const issues = [];

    try {
      const metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');

      if (metaTag) {
        issues.push({
          exists: true,
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
              method: 'header',
              value: csp,
              suggestion: 'CSP detected via response header.'
            });
          } else {
            issues.push({
              exists: false,
              method: 'header',
              suggestion: 'No CSP found in headers.'
            });
          }
          resolve(issues);
        })
        .catch(err => {
          console.error('[CSPScanner] Error fetching headers:', err);
          issues.push({
            exists: false,
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
        method: 'meta/header',
        error: err.message,
        suggestion: 'Unexpected error occurred during CSP check.'
      });
      resolve(issues);
    }
  });
}

window.runCSPScan = runCSPScan;