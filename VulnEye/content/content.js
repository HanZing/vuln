const DEFAULT_SCANNERS = {
  js: true,
  xss: true,
  header: true,
  csrf: true,
  csp: true,
  trackers: true
};

function shouldSkipScan(host) {
  return new Promise(resolve => {
    chrome.storage.local.get({ whitelist: [] }, ({ whitelist }) => {
      const skip = whitelist.includes(host);
      console.log(`[VulnEye] shouldSkipScan("${host}") → ${skip}`);
      resolve(skip);
    });
  });
}


function runAllScans(scannersEnabled) {
  const f = window;
  const scans = [
    scannersEnabled.js       ? f.runLibraryScan() : Promise.resolve([]),
    scannersEnabled.xss      ? f.runXSSScan()     : Promise.resolve([]),
    scannersEnabled.header   ? f.runHeaderScan()  : Promise.resolve([]),
    scannersEnabled.csrf     ? f.runCSRFScan()    : Promise.resolve([]),
    scannersEnabled.csp      ? f.runCSPScan()     : Promise.resolve([]),
    scannersEnabled.trackers ? f.runTrackerScan(): Promise.resolve([])
  ];
  console.log('[VulnEye] runAllScans with settings:', scannersEnabled);
  return Promise.all(scans);
}

chrome.storage.local.get(
  { realtimeEnabled: true, scannersEnabled: DEFAULT_SCANNERS },
  async ({ realtimeEnabled, scannersEnabled }) => {
    const host = window.location.hostname;
    console.log(`[VulnEye] Auto-scan check for "${host}", realtimeEnabled=${realtimeEnabled}`);
    
    if (!realtimeEnabled) {
      console.log(`[VulnEye] Auto-scan skipped: realtimeEnabled=false`);
      return;
    }
    
    if (await shouldSkipScan(host)) {
      console.log(`[VulnEye] Auto-scan skipped: "${host}" is whitelisted`);
      return;
    }

    console.log(`[VulnEye] Starting auto-scan on "${host}"`);
    runAllScans(scannersEnabled)
      .then(([ lib, xss, hdr, csrf, csp, trk ]) => {
        console.log('[VulnEye] Auto-scan results:', { lib, xss, hdr, csrf, csp, trk });
        chrome.storage.local.set({
          lastScanResult: { libraries: lib, xss, header: hdr, csrf, csp, trackers: trk }
        }, () => {
                
          const result = { libraries: lib, xss, header: hdr, csrf, csp, trackers: trk };
          const score  = calculateScore(result);
          const issues = Object.values(result)
            .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
          const url    = window.location.href;
          const date   = new Date().toISOString();

          chrome.storage.local.set({ lastScanResult: result }, () => {
            chrome.storage.local.get({ scanHistory: [] }, ({ scanHistory }) => {
              scanHistory.push({ date, url, score, issues, mode: "auto" });
              chrome.storage.local.set({ scanHistory });
            });
          });
      })
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== 'runScan') return;
  const host = window.location.hostname;
  console.log(`[VulnEye] Manual scan requested for "${host}"`);

  shouldSkipScan(host).then(skip => {
    if (skip) {
      console.log(`[VulnEye] Manual scan skipped: "${host}" is whitelisted`);
      return sendResponse({
        libraries: [],
        xss: [],
        header: [],
        csrf: [],
        csp: [],
        trackers: []
      });
    }

    chrome.storage.local.get(
      { scannersEnabled: DEFAULT_SCANNERS },
      ({ scannersEnabled }) => {
        console.log('[VulnEye] Running manual scan with settings:', scannersEnabled);
        runAllScans(scannersEnabled)
          .then(([ lib, xss, hdr, csrf, csp, trk ]) => {
            console.log('[VulnEye] Manual-scan results:', { lib, xss, hdr, csrf, csp, trk });
            sendResponse({
              libraries: lib,
              xss,
              header: hdr,
              csrf,
              csp,
              trackers: trk
            });
          })
          .catch(error => {
            console.error('[VulnEye] Manual-scan error:', error);
            sendResponse({ error: error.message });
          });
      }
    );
  });


  return true;
});

function calculateScore(results) {
  let score = 100;
  const severityPoints = { critical: 15, high: 10, moderate: 5, low: 2 };
  const typeWeights     = { xss:1.0, libraries:1.2, header:1.0, csrf:1.0, csp:1.0, trackers:1.0 };

  for (const type in results) {
    const issues = results[type];
    if (!Array.isArray(issues)) continue;
    issues.forEach(issue => {
      let severity = (issue.severity || 'low').toLowerCase();
      if (!issue.severity && type==='csp' && issue.exists===false) severity = 'low';

      const points    = severityPoints[severity] || 0;
      const weight    = typeWeights[type]    || 1.0;
      const deduction = points * weight;
      score -= deduction;
    });
  }
  
  const finalScore = Math.max(0, Math.round(score));
  return finalScore;
}