//rules from json
const trackerDBPromise = fetch(
  chrome.runtime.getURL('content/scanners/trackers.json')
)
  .then(res => res.json())
  .catch(err => {
    console.error('Failed to load trackers.json', err);
    return [];
  });

function getTrackerSuggestion(summary = '') {
  const text = summary.toLowerCase();
  if (text.includes('fingerprint')) return 'Consider disabling fingerprint scripts or require explicit consent.';
  if (text.includes('analytics')) return 'Use a privacy-friendly analytics solution or anonymize data.';
  if (text.includes('ads') || text.includes('marketing')) return 'Review ad domains and offer opt-out options.';
  return 'Block or opt-out of this tracker where possible.';
}

function runTrackerScan() {
  return trackerDBPromise.then(db => {
    const elements = Array.from(document.querySelectorAll('[src], [href]'));
    const findings = new Map();

    elements.forEach(el => {
      const url = el.src || el.href;
      if (!url) return;
      try {
        const { hostname } = new URL(url);
        db.forEach(tracker => {
          const pattern = new RegExp(tracker.pattern, 'i');
          if (pattern.test(hostname) || pattern.test(url)) {
            const key = tracker.name || hostname;
            const summary = tracker.summary || 'Unknown tracker';
            const suggestion = getTrackerSuggestion(summary);
            const severity = tracker.severity || 'unknown';

            if (!findings.has(key)) {
              findings.set(key, {
                tracker: key,
                url,
                severity,
                summary,
                suggestion,
                references: tracker.references || []
              });
            } else {
              // pick highest severity
              const existing = findings.get(key);
              const levels = { low:1, medium:2, high:3, critical:4, unknown:0 };
              if (levels[severity] > levels[existing.severity]) {
                existing.severity = severity;
              }
            }
          }
        });
      } catch (_) {}
    });

    return Array.from(findings.values());
  });
}

window.runTrackerScan = runTrackerScan;