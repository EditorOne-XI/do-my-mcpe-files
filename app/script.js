// Cannot approximate 100% of browser zoom-in bere.
// Feel free to edit the float number higher
// if the app appears blank as default.
const MIN_WINDOWS_ZOOM = 2.50;

function browserZoomCheck() {
  const windowZoom = window.devicePixelRatio || 1;
  if (windowZoom > MIN_WINDOWS_ZOOM) {
    document.body.classList.add("zoom-hidden");
  }
  else {
    document.body.classList.remove("zoom-hidden");
  }
}
window.addEventListener('DOMContentLoaded', browserZoomCheck);
window.addEventListener('resize', browserZoomCheck);

const menuBtn = document.getElementById("menu-btn");
const menuOverlay = document.getElementById("menu-overlay");

menuBtn.addEventListener('click', () => {
  const toggle = menuBtn.classList.toggle('active');
  menuBtn.setAttribute('aria-expanded', toggle);
  menuOverlay.classList.toggle('open');
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

/**
 * @param {HTMLElement} element
 * @param {number} speed
 */
function typingText(element, speed = 100) {
  const messages = [
    "Be careful using this app.",
    "Can you bring back people with this?",
    "Explore. Dream. Discover.",
    "FLAWLESS!!!",
    "If it works, it works.",
    "Importing Minecraft files made easier!",
    "Jarvis, build my Minecraft Files!",
    "Know when to use this.",
    "Let's assemble your items.",
    "Quilantia is an identity, not a character.",
    "What's up Player?"
  ];
  let strLen = 0, index = -1;
  let text = "", backwards = true;

  setInterval(() => {
    if (backwards && index < 0) {
      backwards = false;
      text = messages[Math.floor(Math.random() * messages.length)];
      strLen = text.length;
    }
    else if (!backwards && index >= strLen + 10) {
      backwards = true;
    }
    if (backwards) {
      element.textContent = text.slice(0, index);
      index--;
    }
    else {
      element.textContent += text.charAt(index);
      index++;
    }
  }, speed);
}

// --------------------------------------------------

const importBtn = document.getElementById('import-btn');
const importBtnText = "Build Import";

const dropZoneTextPanel = document.getElementById('drop-zone-text');
const dropZoneText = "Drag & drop files here or click to browse.";

const targetAppSelect = document.getElementById('target-app');
const customPathContainer = document.getElementById('custom-path-container');
const customPathInput = document.getElementById('custom-path');

targetAppSelect.addEventListener('change', () => {
  if (targetAppSelect.value === 'CUSTOM') {
    customPathContainer.style.display = 'block';
  } else {
    customPathContainer.style.display = 'none';
    customPathInput.value = '';
  }
});

let filesArray = [];
const clearDataCheckbox = document.getElementById('clear-app-data-cb');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const filesList = document.getElementById('files-list');

dropZone.addEventListener('click', () => fileInput.click());

['dragenter', 'dragover'].forEach(eventName => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  }, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  }, false);
});

/**
 * @param {number} size
 * @returns {string}
 */
function convertByteUnit(size) {
  const byteUnits = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let unit = byteUnits[0];
  let estSize = size;
  let lastEstSize = size;
  for (let i = 1; i < byteUnits.length; i++) {
    estSize = (estSize / 1024);
    if (estSize < 1) break;
    lastEstSize = estSize;
    unit = byteUnits[i];
  }
  return `${lastEstSize.toFixed(1)} ${unit}`;
}

function emptyFileList() {
  const emptyItem = document.createElement('li');
  emptyItem.className = 'files-item';
  emptyItem.style.color = 'var(--text-muted)';
  emptyItem.style.justifyContent = 'center';
  emptyItem.textContent = 'No files added yet.';
  filesList.appendChild(emptyItem);
}

let processedFileCount = 0;
function renderListQueue() {
  filesList.innerHTML = '';
  dropZoneTextPanel.textContent = dropZoneText;

  if (filesArray.length === 0 && processedFileCount > 0) {
    emptyFileList();
    importBtn.textContent = "Continue Import";
    importBtn.disabled = false;
    return;
  }

  if (filesArray.length === 0) {
    emptyFileList();
    importBtn.textContent = importBtnText;
    importBtn.disabled = true;
    return;
  }
  importBtn.disabled = false;

  filesArray.forEach((file, index) => {
    const li = document.createElement('li');
    li.className = 'files-item';

    const details = document.createElement('div');
    const fileName = document.createElement('p');
    const fileSize = document.createElement('p');
    details.className = 'file-details';
    fileName.className = 'file-name';
    fileName.textContent = `${file.name}`;
    fileSize.className = 'file-size';
    fileSize.textContent = `Size: ${convertByteUnit(parseInt(file.size))}`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      filesArray.splice(index, 1);
      renderListQueue();
    });

    details.appendChild(fileName);
    details.appendChild(fileSize);
    li.appendChild(details);
    li.appendChild(removeBtn);
    filesList.appendChild(li);
  });
}

function handleFiles(files) {
  const selectedFiles = Array.from(files);
  selectedFiles.forEach(file => {
    const isDuplicate = filesArray.some(f => f.name === file.name && f.size === file.size);
    if (!isDuplicate) {
      filesArray.push(file);
    }
  });
  renderListQueue();
}

fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
  fileInput.value = '';
});

dropZone.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  handleFiles(dt.files);
});

// Restore UI when failure.
function importProcessFailSafe(importBtnIntervalId) {
  Array.from(document.getElementsByClassName('remove-btn-run')).forEach(element => element.className = 'remove-btn');
  dropZone.classList.remove('drop-zone-wait');
  clearDataCheckbox.disabled = false;
  clearInterval(importBtnIntervalId);
  importBtn.className = 'import-btn'
  renderListQueue();
  targetAppSelect.disabled = false;
  customPathInput.disabled = false;
  fileInput.disabled = false;
}

importBtn.addEventListener('click', async () => {
  // Check Custom Path if selected.
  // Cannot be default since MINECRAFT_NATIVE is an option.
  let targetApp = targetAppSelect.value;
  if (targetAppSelect.value == 'CUSTOM') {
    targetApp = customPathInput.value.trim();
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

  // Backup if Import Button bugged to be enabled.
  if (filesArray.length === 0 && processedFileCount === 0) {
    alert("No uploaded files yet.");
    return;
  }

  let importBtnIntervalId = loadingText(importBtn, "Processing");
  dropZoneTextPanel.textContent = "Import Ongoing";
  clearDataCheckbox.disabled = true;
  targetAppSelect.disabled = true;
  customPathInput.disabled = true;
  
  importBtn.disabled = true;
  importBtn.className = 'process-wait-btn';
  fileInput.disabled = true;
  Array.from(document.getElementsByClassName('remove-btn')).forEach(element => element.className = 'remove-btn-run');
  dropZone.classList.add('drop-zone-wait');

  try {
    while (filesArray.length > 0) {
      const file = filesArray[0];
      const response = await fetch('/upload', {
        method: 'POST',
        headers: {
          'x-file-name': encodeURIComponent(file.name),
          'Content-Type': 'application/octet-stream'
        },
        body: file
      });

      const result = await response.json();
      if (!response.ok) {
        importProcessFailSafe(importBtnIntervalId);
        renderListQueue();
        throw new Error(`${response.statusText}: ${result.error}`);
      }
      processedFileCount++;
      filesArray.shift();
    }
    clearInterval(importBtnIntervalId);
    importBtnIntervalId = loadingText(importBtn, "Importing");

    const finalResponse = await fetch('/batch-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetPackage: targetApp,
        clearData: clearDataCheckbox.checked
      })
    });

    const finalResult = await finalResponse.json();
    if (!finalResponse.ok) {
      importProcessFailSafe(importBtnIntervalId);
      renderListQueue();
      throw new Error(`Import Failed: ${finalResult.error.replace(/(\[[0-9]+m)/g, '')}`);
    }

    alert(`All ${processedFileCount} files has been imported!`);
    processedFileCount = 0;
    filesArray.length = 0;
    renderListQueue();
  } catch (error) {
    console.error("[ERROR] ", error);
    alert(error.message ?? "Unknown Error. Check Terminal.");
  } finally {
    importProcessFailSafe(importBtnIntervalId);
  }
});

// Queues
renderListQueue();
typingText(document.getElementById('quote-text'));
