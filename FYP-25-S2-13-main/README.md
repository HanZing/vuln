**VulnEye** – Client-Side Script Security Inspector

VulnEye is a browser extension that scans webpages for common client-side security vulnerabilities and provides detailed, actionable reports. It is designed for developers, testers, and security professionals to quickly assess and improve the security posture of web applications.

**Features**:

1. JavaScript Library Vulnerability Detection- Scans for known vulnerable versions of JavaScript libraries using jsrepository.json.

2. XSS Detection- Identifies inline event handlers, javascript: URIs, inline scripts, style-based JavaScript injections, and unsafe iframe srcdoc usage based on OWASP XSS prevention guidelines.

3. HTTP Security Header Analysis- Checks for missing or misconfigured headers such as HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and X-XSS-Protection.

4. CSRF Token Checks- Detects missing CSRF tokens in forms, cookies, and meta tags.

5. CSP Detection- Checks for the presence of Content Security Policy via meta tags or response headers.

6. Tracker Identification- Detects known tracking scripts and resources and suggests privacy-friendly alternatives.

7. Exportable Reports- Generates PDF scan reports styled for readability, with categorized vulnerabilities, severity ratings, and suggested fixes.

8. Scan History & Sharing- Stores scan results locally, allows quick sharing of summarized reports.

**How It Works**

1. Manual or Auto Scanning – Trigger scans manually or enable real-time scanning via the popup menu.

2. In-Page Content Scripts – The extension injects scanners for each category (JS libraries, XSS, headers, CSRF, CSP, trackers).

3. Data Processing – Results are aggregated, categorized, and displayed in the popup UI.

4. Reporting – Generate and export detailed HTML/PDF reports using the built-in reportBuilder.js.

**Installation**

1. Clone or download this repository.

2. Open your browser’s extensions page (chrome://extensions/ for Chrome).

3. Enable Developer Mode.

4. Click Load unpacked and select the project folder.

**Usage**

1. Click the extension icon to open the popup.

2. Use SCAN LATEST LINK for a manual scan.

3. View detailed vulnerability breakdowns or export the results to PDF.

4. Manage settings, whitelist URLs, and view scan history via the settings menu.

**Tech Stack**

1. JavaScript (Vanilla JS)

2. HTML/CSS (Custom popup and modal styling)

3. Data Sources: JSON vulnerability definitions for libraries, headers, CSRF, XSS, and trackers.

**Disclaimer**

VulnEye is intended for educational and testing purposes only. Do not use it to scan websites without permission. The authors are not responsible for misuse.
