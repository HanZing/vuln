// Tracker scanner.
//
// trackers.json has ~44k entries. The old version compiled a new RegExp for
// every entry, for every element on the page, on every page load. This
// version builds a lookup index once and then checks each hostname with a
// few Set lookups (a.b.example.com -> b.example.com -> example.com).
(function () {
  const SEVERITY_LEVELS = { low: 1, medium: 2, moderate: 2, high: 3, critical: 4, unknown: 0 };

  // Patterns written as (^|\.)example\.com$  → plain domain "example.com"
  const SIMPLE_DOMAIN_PATTERN = /^\(\^\|\\\.\)((?:[a-z0-9-]+\\\.)+[a-z0-9-]+)\$$/i;

  const indexPromise = fetch(chrome.runtime.getURL('content/scanners/trackers.json'))
    .then(res => res.json())
    .then(buildIndex)
    .catch(err => {
      console.error('[TrackerScanner] Failed to load trackers.json', err);
      return { byDomain: new Map(), regexEntries: [] };
    });

  function buildIndex(db) {
    const byDomain = new Map();   // "example.com" -> tracker entry
    const regexEntries = [];      // the few entries that aren't plain domains

    (Array.isArray(db) ? db : []).forEach(tracker => {
      const m = SIMPLE_DOMAIN_PATTERN.exec(tracker.pattern || '');
      if (m) {
        const domain = m[1].replace(/\\\./g, '.').toLowerCase();
        const existing = byDomain.get(domain);
        if (!existing || level(tracker.severity) > level(existing.severity)) {
          byDomain.set(domain, tracker);
        }
        return;
      }
      try {
        regexEntries.push({ tracker, regex: new RegExp(tracker.pattern, 'i') });
      } catch (_) {
        // Skip patterns that aren't valid regular expressions.
      }
    });

    return { byDomain, regexEntries };
  }

  function level(sev) {
    return SEVERITY_LEVELS[String(sev || 'unknown').toLowerCase()] || 0;
  }

  function lookupHost(index, hostname) {
    const parts = hostname.toLowerCase().split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      const hit = index.byDomain.get(parts.slice(i).join('.'));
      if (hit) return hit;
    }
    for (const { tracker, regex } of index.regexEntries) {
      if (regex.test(hostname)) return tracker;
    }
    return null;
  }

  function getTrackerSuggestion(summary = '') {
    const text = summary.toLowerCase();
    if (text.includes('fingerprint')) return 'Consider disabling fingerprint scripts or require explicit consent.';
    if (text.includes('analytics')) return 'Use a privacy-friendly analytics solution or anonymize data.';
    if (text.includes('ads') || text.includes('advertising') || text.includes('marketing'))
      return 'Review ad domains and offer opt-out options.';
    return 'Block or opt-out of this tracker where possible.';
  }

  // URLs the page actually loads. Plain <a href> links are skipped: a "Share
  // on Facebook" link is not a tracker until someone clicks it.
  function collectResourceUrls() {
    const urls = new Set();
    document
      .querySelectorAll('script[src], img[src], iframe[src], embed[src], source[src], link[href]')
      .forEach(el => {
        if (el.tagName === 'LINK') {
          const rel = (el.getAttribute('rel') || '').toLowerCase();
          // Only links that cause a request, not canonical/alternate/etc.
          if (!/(stylesheet|preload|prefetch|preconnect|dns-prefetch|icon|modulepreload)/.test(rel)) return;
        }
        const url = el.src || el.href;
        if (url) urls.add(url);
      });

    // Also catch requests made from JS (pixels, fetch/XHR beacons, injected scripts).
    try {
      performance.getEntriesByType('resource').forEach(e => urls.add(e.name));
    } catch (_) {}

    return urls;
  }

  function runTrackerScan() {
    return indexPromise.then(index => {
      const findings = new Map();
      const hostCache = new Map();
      const pageHost = location.hostname.toLowerCase();

      collectResourceUrls().forEach(url => {
        let hostname;
        try {
          const u = new URL(url, location.href);
          if (!/^https?:$/.test(u.protocol)) return;
          hostname = u.hostname.toLowerCase();
        } catch (_) {
          return;
        }
        if (!hostname || hostname === pageHost) return;

        if (!hostCache.has(hostname)) hostCache.set(hostname, lookupHost(index, hostname));
        const tracker = hostCache.get(hostname);
        if (!tracker) return;

        const key = tracker.name || hostname;
        if (findings.has(key)) return;

        const summary = tracker.summary || 'Unknown tracker';
        findings.set(key, {
          tracker: key,
          url,
          severity: tracker.severity || 'unknown',
          summary,
          suggestion: getTrackerSuggestion(summary),
          references: tracker.references || []
        });
      });

      return Array.from(findings.values());
    });
  }

  window.runTrackerScan = runTrackerScan;
})();
