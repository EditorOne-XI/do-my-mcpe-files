const targetAppExportSelect = document.getElementById('target-app-export');
const customPathExportContainer = document.getElementById('custom-path-container-export');
const customPathExportInput = document.getElementById('custom-path-export');
const exportBtn = document.getElementById('export-btn');
const exportBtnText = "Export";

targetAppExportSelect.addEventListener('change', () => {
  if (targetAppExportSelect.value === 'CUSTOM') {
    customPathExportContainer.style.display = 'block';
  } else {
    customPathExportContainer.style.display = 'none';
    customPathExportInput.value = '';
  }
});

/**
  * Main Function
  * @param {HTMLElement} element 
  * @param {string} text
  */
function loadingText(element, text) {
  element.textContent = text;
  let dotCount = 1;
  return setInterval(() => {
    dotCount++;
    if (dotCount > 3) dotCount = 0;
    element.textContent = `${text}${'.'.repeat(dotCount)}`;
  }, (1 / 3) * 1000);
}

exportBtn.addEventListener('click', async () => {
  // Check Custom Path if selected.
  // Cannot be default since MINECRAFT_NATIVE is an option.
  let targetApp = targetAppExportSelect.value;
  if (targetAppExportSelect.value == 'CUSTOM') {
    targetApp = customPathExportInput.value.trim();
    if (targetApp.length < 1) {
      alert("Custom Path is empty. Cancelled.");
      return;
    }
    const androidManifest = /^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)+(?:\/.*)?$/;
    if (!androidManifest.test(targetApp)) {
      alert(`Invalid Android Package Name directory format. Cancelled.`);
      return;
    }
  }

  const exportBtnIntervalId = loadingText(exportBtn, "Exporting");
  targetAppExportSelect.disabled = true;
  customPathExportInput.disabled = true;
  exportBtn.disabled = true;
  exportBtn.className = 'process-wait-btn';

  console.log("Entering Try Block");
  try {
    console.log("Entered Try Block");
    const exportResponse = await fetch('/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetPackage: targetApp })
    });

    const exportResult = await exportResponse.json();
    if (!exportResponse.ok) {
      throw new Error(`Export Failed: ${exportResult.error.replace(/(\[[0-9]+m)/g, '')}`);
    }

    alert(`Successfully exported Minecraft data!`);
  } catch (error) {
    console.error("[ERROR] ", error);
    alert(error.message ?? "Unknown Error. Check Terminal.");
  } finally {
    clearInterval(exportBtnIntervalId);
    exportBtn.disabled = false;
    exportBtn.className = 'export-btn';
    exportBtn.textContent = exportBtnText;
    targetAppExportSelect.disabled = false;
    customPathExportInput.disabled = false;
  }
});

exportBtn.textContent = exportBtnText;
