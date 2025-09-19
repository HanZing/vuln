const repoPromise = fetch(chrome.runtime.getURL('content/scanners/jsrepository.json'))
  .then(res => res.json())
  .catch(err => {
    console.error('Failed to load jsrepository.json', err);
    return {};
  });

//version range comparison
function satisfiesRange(version, { below, atOrAbove }) {
  const [majA, minA, patA] = (atOrAbove || "0.0.0").split('.').map(Number);
  const [majB, minB, patB] = (below || "999.999.999").split('.').map(Number);
  const [maj, min, pat] = version.split('.').map(Number);
  if (maj < majA || (maj === majA && min < minA) || (maj === majA && min === minA && pat < patA)) return false;
  if (maj > majB || (maj === majB && min > minB) || (maj === majB && min === minB && pat >= patB)) return false;
  return true;
}

//prioritize highest severity
function getHigherSeverity(a, b) {
  const levels = { low: 1, medium: 2, high: 3, critical: 4, unknown: 0 };
  return levels[a.toLowerCase()] >= levels[b.toLowerCase()] ? a : b;
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

function runLibraryScan() {
  return repoPromise.then(repo => {
    const scripts = Array.from(document.querySelectorAll('script[src]')).map(el => el.src);
    const findingsMap = new Map();

    scripts.forEach(src => {
      Object.entries(repo).forEach(([pkgName, pkgMeta]) => {
        const { extractors, vulnerabilities = [] } = pkgMeta;
        if (!extractors?.uri) return;

        extractors.uri.forEach(uriPattern => {
          const regex = new RegExp(uriPattern.replace(/§§version§§/g, '([0-9\\.]+)'));
          const match = src.match(regex);
          if (!match) return;

          const version = match[1];
          vulnerabilities.forEach(vuln => {
            //Zero Day
            if (satisfiesRange(version, vuln)) {
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
            }
          });
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
