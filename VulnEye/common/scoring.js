/*
 * Shared scoring + history helpers.
 * Loaded by the content scripts (manifest.json) and by popup.html, so the
 * score shown in the popup, the PDF report and scan history always agree.
 */

// Points per finding, by severity.
const SEVERITY_POINTS = { critical: 15, high: 10, moderate: 5, low: 2 };

// Weight per category.
const TYPE_WEIGHTS = { xss: 1.0, libraries: 1.2, header: 1.0, csrf: 1.0, csp: 1.0, trackers: 1.0 };

// Maximum points a single category can remove. Without a cap, a page with
// 40 inline onclick handlers drops to 0 no matter how good everything else is.
const CATEGORY_CAPS = { xss: 25, libraries: 30, header: 25, csrf: 20, csp: 10, trackers: 15 };

// Repeats of the same finding type beyond this don't lower the score further.
const MAX_INSTANCES_PER_KIND = 3;

// Keep at most this many entries in scan history.
const MAX_SCAN_HISTORY = 200;

/**
 * Map the different spellings used across rule files to one set:
 * critical | high | moderate | low | info | unknown
 */
function normalizeSeverity(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'medium' || s === 'moderate') return 'moderate';
  if (s === 'critical' || s === 'high' || s === 'low') return s;
  if (s === 'info' || s === 'informational' || s === 'none') return 'info';
  return 'unknown';
}

/** True if this result item is an actual problem (not a "found it, all good" note). */
function isFinding(type, issue) {
  if (!issue || typeof issue !== 'object') return false;
  if (type === 'csp' && issue.exists === true) return false;
  const sev = normalizeSeverity(issue.severity);
  return sev !== 'info';
}

/** Severity used for scoring and counts; unknown severities count as low. */
function effectiveSeverity(issue) {
  const sev = normalizeSeverity(issue && issue.severity);
  return sev === 'unknown' ? 'low' : sev;
}

function calculateScore(results) {
  let score = 100;
  if (!results || typeof results !== 'object') return score;

  for (const type in results) {
    const issues = results[type];
    if (!Array.isArray(issues)) continue;

    const weight = TYPE_WEIGHTS[type] || 1.0;
    let categoryDeduction = 0;
    const seenPerKind = new Map();

    issues.forEach(issue => {
      if (!isFinding(type, issue)) return;
      // The same pattern repeated 40 times is one problem, not 40: only the
      // first few instances of each kind of finding count toward the score.
      const kind = issue.type || issue.library || issue.tracker || 'issue';
      const seen = seenPerKind.get(kind) || 0;
      seenPerKind.set(kind, seen + 1);
      if (seen >= MAX_INSTANCES_PER_KIND) return;
      categoryDeduction += (SEVERITY_POINTS[effectiveSeverity(issue)] || 0) * weight;
    });

    const cap = CATEGORY_CAPS[type] ?? 25;
    score -= Math.min(categoryDeduction, cap);
  }

  return Math.max(0, Math.round(score));
}

/** { critical, high, moderate, low } counts of real findings. */
function countSeverities(results) {
  const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
  if (!results || typeof results !== 'object') return counts;
  for (const type in results) {
    const issues = results[type];
    if (!Array.isArray(issues)) continue;
    issues.forEach(issue => {
      if (!isFinding(type, issue)) return;
      const sev = effectiveSeverity(issue);
      if (sev in counts) counts[sev]++;
    });
  }
  return counts;
}

/** True if a category has at least one real (non-informational) finding. */
function hasFindings(results, type) {
  const issues = results && results[type];
  return Array.isArray(issues) && issues.some(issue => isFinding(type, issue));
}

/** Number of real findings (excludes informational items). */
function countFindings(results) {
  const c = countSeverities(results);
  return c.critical + c.high + c.moderate + c.low;
}

/**
 * Append an entry to scan history, keeping only the newest MAX_SCAN_HISTORY.
 * Only the origin + path is stored (no query string or fragment), since
 * those often carry tokens, emails or search terms.
 */
function addScanHistory(entry, callback) {
  const safeEntry = { ...entry, url: stripUrlForHistory(entry.url) };
  chrome.storage.local.get({ scanHistory: [] }, ({ scanHistory }) => {
    scanHistory.push(safeEntry);
    if (scanHistory.length > MAX_SCAN_HISTORY) {
      scanHistory = scanHistory.slice(-MAX_SCAN_HISTORY);
    }
    chrome.storage.local.set({ scanHistory }, () => callback && callback());
  });
}

function stripUrlForHistory(url) {
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch (_) {
    return String(url || '');
  }
}
