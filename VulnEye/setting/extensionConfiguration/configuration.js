document.addEventListener("DOMContentLoaded", () => {
  console.log("[Config] DOM fully loaded");

  const defaultSettings = {
    js: true,
    xss: true,
    header: true,
    csrf: true,
    csp: true,
    trackers: true
  };

  const toggleIds = {
    js: "toggle-js",
    xss: "toggle-xss",
    header: "toggle-header",
    csrf: "toggle-csrf",
    csp: "toggle-csp",
    trackers: "toggle-trackers"
  };

  chrome.storage.local.get({ scannersEnabled: defaultSettings }, ({ scannersEnabled }) => {
    console.log("[Config] Loaded settings from storage:", scannersEnabled);

    for (const [key, id] of Object.entries(toggleIds)) {
      const el = document.getElementById(id);
      if (!el) {
        console.warn(`[Config] Missing toggle for: ${key} (${id})`);
        continue;
      }

      const isEnabled = scannersEnabled[key];
      el.classList.toggle("off", !isEnabled);

      el.addEventListener("click", () => {
        el.classList.toggle("off");
        console.log(`[Config] Toggled ${key} →`, el.classList.contains("off") ? "OFF" : "ON");
      });
    }
  });

  const saveBtn = document.getElementById("save-btn");
  if (!saveBtn) {
    console.error("[Config] Save button NOT found");
    return;
  }

  saveBtn.addEventListener("click", () => {
    console.log("[Config] Save button clicked");

    const updatedSettings = {};
    for (const [key, id] of Object.entries(toggleIds)) {
      const el = document.getElementById(id);
      const isOn = el && !el.classList.contains("off");
      updatedSettings[key] = isOn;
    }

    console.log("[Config] Saving settings:", updatedSettings);

    chrome.storage.local.set({ scannersEnabled: updatedSettings }, () => {
      console.log("[Config] Settings saved successfully!");
      alert("Settings saved!");
    });
  });
});
