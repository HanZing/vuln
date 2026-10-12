const repoPromise = fetch(chrome.runtime.getURL('content/scanners/jsrepository.json'))
  .then(res => res.json())
  .catch(err => {
    console.error('Failed to load jsrepository.json', err);
    return {};
  });

//version range comparison
// "1.12" -> [1, 12, 0]; "3.4.1-rc.1" -> [3, 4, 1]. Missing parts count as 0,
// so short versions no longer turn into NaN (NaN made every range "match").
function parseVersion(v) {
  const core = String(v || '').replace(/^v/i, '').split(/[-+]/)[0];
  const parts = core.split('.').filter(p => p !== '').map(p => parseInt(p, 10));
  if (!parts.length || parts.some(Number.isNaN)) return null;
  while (parts.length < 3) parts.push(0);
  return parts;
}

function compareVersions(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const d = (a[i] || 0) - (b[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

function satisfiesRange(version, { below, atOrAbove }) {
  const v = parseVersion(version);
  if (!v) return false; // can't tell -> don't report
  if (atOrAbove) {
    const lo = parseVersion(atOrAbove);
    if (lo && compareVersions(v, lo) < 0) return false;
  }
  if (below) {
    const hi = parseVersion(below);
    if (hi && compareVersions(v, hi) >= 0) return false;
  }
  return true;
}

//prioritize highest severity
function getHigherSeverity(a, b) {
  const levels = { low: 1, medium: 2, moderate: 2, high: 3, critical: 4, unknown: 0 };
  const la = levels[String(a).toLowerCase()] ?? 0;
  const lb = levels[String(b).toLowerCase()] ?? 0;
  return la >= lb ? a : b;
}

//suggestions map
function getSuggestion(summary = '') {
  const text = summary.toLowerCase();
  if (text.includes('xss')) return "Sanitize user input and escape output.";
  if (text.includes('denial') || text.includes('dos') || text.includes('regex'))
    return "Avoid complex regex or large input parsing.";
  if (text.includes('cors')) return "Check CORS settings for proper restrictions.";
  if (text.includes('pollution')) return "Use object cloning to avoid prototype pollution.";
  return "Update to a non-vulnerable version.";
}

// retire.js placeholder for the version inside an extractor pattern.
const VERSION_RE = '(\\d+(?:\\.\\d+)*(?:-[0-9a-z]+(?:\\.\\d+)*)?)';

// Compile every extractor regex once, instead of once per <script> per page.
// Both "uri" (version in the path, e.g. /1.12.4/jquery.min.js) and "filename"
// (version in the file name, e.g. jquery-1.12.4.min.js) extractors are used.
const matchersPromise = repoPromise.then(repo => {
  const matchers = [];
  Object.entries(repo).forEach(([pkgName, pkgMeta]) => {
    if (pkgName === 'retire-example') return;
    const { extractors = {}, vulnerabilities = [] } = pkgMeta;
    if (!vulnerabilities.length) return;
    [['uri', extractors.uri], ['filename', extractors.filename]].forEach(([target, patterns]) => {
      (patterns || []).forEach(pattern => {
        try {
          matchers.push({
            pkgName,
            vulnerabilities,
            target,
            regex: new RegExp(pattern.replace(/§§version§§/g, VERSION_RE), 'i')
          });
        } catch (_) {}
      });
    });
  });
  return matchers;
});

function runLibraryScan() {
  return matchersPromise.then(matchers => {
    const scripts = Array.from(document.querySelectorAll('script[src]')).map(el => el.src);
    const findingsMap = new Map();

    scripts.forEach(src => {
      let filename = '';
      try { filename = new URL(src, location.href).pathname.split('/').pop(); } catch (_) {}
      const seenPkg = new Set();

      matchers.forEach(({ pkgName, vulnerabilities, target, regex }) => {
        if (seenPkg.has(pkgName)) return;
        const match = (target === 'filename' ? filename : src).match(regex);
        if (!match) return;

        const version = String(match[1] || '').replace(/[.\-_]+$/, '');
        if (!parseVersion(version)) return;
        seenPkg.add(pkgName);

        vulnerabilities.forEach(vuln => {
          if (!satisfiesRange(version, vuln)) return;
          const key = `${pkgName}@${version}`;
          const summary = vuln.identifiers?.summary || 'Unspecified issue';
          const suggestion = getSuggestion(summary);
          const severity = vuln.severity || 'unknown';

          if (!findingsMap.has(key)) {
            findingsMap.set(key, {
              library: pkgName,
              version,
              severity,
              suggestionsBySummary: new Map([[summary, suggestion]])
            });
          } else {
            const existing = findingsMap.get(key);
            existing.severity = getHigherSeverity(existing.severity, severity);
            existing.suggestionsBySummary.set(summary, suggestion);
          }
        });
      });
    });

    return Array.from(findingsMap.values()).map(item => ({
      library: item.library,
      version: item.version,
      severity: item.severity,
      identifiers: Array.from(item.suggestionsBySummary.keys()),
      suggestions: Array.from(item.suggestionsBySummary.values())
    }));
  });
}

window.runLibraryScan = runLibraryScan;
