const form = document.querySelector('#version-form');
const versionSelect = document.querySelector('#version');
const versionIcon = document.querySelector('#version-icon');
const notice = document.querySelector('#notice');
const loadingScreen = document.querySelector('#startup-loading');
const loadingTitle = document.querySelector('#loading-title');
const loadingDetail = document.querySelector('#loading-detail');
const loadingProgress = document.querySelector('#loading-progress');
let loadingVersion = false;

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function showLoading(title, steps, delay = 145) {
  loadingScreen.hidden = false;
  loadingScreen.classList.remove('is-hiding');
  loadingTitle.textContent = title;
  loadingProgress.style.width = '0%';
  for (let index = 0; index < steps.length; index++) {
    loadingDetail.textContent = steps[index];
    loadingProgress.style.width = `${Math.round((index + 1) / steps.length * 100)}%`;
    await pause(delay);
  }
}
async function hideLoading() {
  loadingScreen.classList.add('is-hiding');
  await pause(190);
  loadingScreen.hidden = true;
}
async function loadStartupScreen() {
  await showLoading('Starting Fish Video', ['Loading the interface…', 'Preparing the version library…', 'Checking plug-ins…'], 115);
  await hideLoading();
}
loadStartupScreen();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!versionSelect.value || loadingVersion) return;
  loadingVersion = true;

  const selectedVersion = versionSelect.selectedOptions[0];
  const isAudio = selectedVersion.textContent.trim().toLowerCase().startsWith('audio');
  await showLoading(`Loading ${isAudio ? 'Fish Audio' : 'Fish Video'}`, [
    `Loading ${isAudio ? 'audio engine' : 'video engine'}…`,
    isAudio ? 'Preparing audio FX and monitoring…' : 'Preparing preview and video tools…',
    'Building the timeline workspace…',
    'Finishing version setup…',
  ], 155);
  window.dispatchEvent(new CustomEvent('fish-video:launch', {
    detail: { label: selectedVersion.textContent.trim(), release: selectedVersion.dataset.release },
  }));
  await hideLoading();
  loadingVersion = false;
});

versionSelect.addEventListener('change', () => {
  const release = Number(versionSelect.selectedOptions[0]?.dataset.release);
  versionIcon.hidden = !Number.isFinite(release) || release > 3;
  notice.classList.remove('selected');
  notice.lastElementChild.textContent = 'Thank you for visiting!';
});

const codeTypeSelect = document.querySelector('#code-type');
const vstCompatibilityNote = document.querySelector('#vst-compatibility-note');
const architectureCompatibilityNote = document.querySelector('#architecture-compatibility-note');
const vstPluginArea = document.querySelector('#vst-plugin-area');
const vstPluginName = document.querySelector('#vst-plugin-name');
const vstPluginArchitecture = document.querySelector('#vst-plugin-architecture');
const vstPluginTile = document.querySelector('#vst-plugin-tile');
const pluginMode = document.querySelector('#plugin-mode');
const modeField = document.querySelector('#mode-field');
const pluginFields = document.querySelector('#plugin-fields');
const waxArea = document.querySelector('#wax-plugin-area');
const waxToggle = document.querySelector('#wax-toggle');
const waxPicker = document.querySelector('#wax-picker');
const waxVersionSelect = document.querySelector('#wax-version');
const installedWaxSection = document.querySelector('#installed-wax-section');
const installedWaxList = document.querySelector('#installed-wax-list');
const sapphireArea = document.querySelector('#sapphire-plugin-area');
const sapphireToggle = document.querySelector('#sapphire-toggle');
const sapphireX86Note = document.querySelector('#sapphire-x86-note');

const waxByDirectX = [
  { id: 'wax-2-0e', name: 'Wax 2.0e', compatibility: 'Fish Video 6.0 and older', minRelease: 1, maxRelease: 6, bits: 'x86 (32-bit)' },
  { id: 'wax-2-5', name: 'Wax 2.5', compatibility: 'Fish Video 7.0 to 9.0e', minRelease: 7, maxRelease: 9, bits: 'x86 (32-bit)' },
  { id: 'wax-3-0-dx', name: 'Wax 3.0', compatibility: 'Fish Video 10.0 to 11.0', minRelease: 10, maxRelease: 11, bits: 'x86 (32-bit)' },
];

const waxByOfx = {
  'modern-x64': [
    { id: 'wax-3-0-x64', name: 'Wax 3.0 x64', compatibility: 'Fish Video 10.0 to 11.0', bits: 'Modern (x64)' },
    { id: 'wax-3-1-ofx', name: 'Wax 3.1', compatibility: 'Fish Video 12.0 to 13.0', bits: 'Modern (x64)' },
    { id: 'wax-4-0', name: 'Wax 4.0', compatibility: 'Fish Video 14.0 to 16.0', bits: 'Modern (x64)' },
    { id: 'wax-5-0', name: 'Wax 5.0', compatibility: 'Fish Video 17.0 and newer', bits: 'Modern (x64)' },
  ],
};

const sapphireByDirectX = [
  { id: 'sapphire-dx-5x', name: 'Sapphire 5.x', compatibility: 'Fish Video 4.0 to 6.0', minRelease: 4, maxRelease: 6, bits: 'x86 (32-bit)' },
  { id: 'sapphire-dx-6-0', name: 'Sapphire 6.0', compatibility: 'Fish Video 7.0 to 8.0', minRelease: 7, maxRelease: 8, bits: 'x86 (32-bit)' },
  { id: 'sapphire-dx-6-1', name: 'Sapphire 6.1', compatibility: 'Fish Video 9.0', minRelease: 9, maxRelease: 9, bits: 'x86 (32-bit)' },
];
const sapphireByOfx = {
  'classic-x86': [
    { id: 'sapphire-ofx-x86-6-1', name: 'Sapphire 6.1', compatibility: 'Fish Video 10.0 to 11.0', bits: 'x86 (32-bit)' },
    { id: 'sapphire-ofx-x86-7-0-8', name: 'Sapphire 7.0.8', compatibility: 'Fish Video 10.0 to 11.0', bits: 'x86 (32-bit)' },
    { id: 'sapphire-ofx-x86-8-1-4', name: 'Sapphire 8.1.4', compatibility: 'Fish Video 10.0 to 11.0', bits: 'x86 (32-bit)' },
  ],
  'modern-x64': [
    { id: 'sapphire-ofx-x64-7-0-8', name: 'Sapphire 7.0.8', compatibility: 'Fish Video 12.0 to 16.0', bits: 'x64' },
    { id: 'sapphire-ofx-x64-8-1-4', name: 'Sapphire 8.1.4', compatibility: 'Fish Video 12.0 to 16.0', bits: 'x64' },
    { id: 'sapphire-ofx-x64-9x', name: 'Sapphire 9.x', compatibility: 'Fish Video 17.0 to 19.0', bits: 'x64', patchable: true },
    { id: 'sapphire-ofx-x64-11-04', name: 'Sapphire 11.04', compatibility: 'Fish Video 17.0 to 19.0', bits: 'x64', patchable: true },
    { id: 'sapphire-ofx-x64-2019-52', name: 'Sapphire 2019.52', compatibility: 'Fish Video 17.0 to 19.0', bits: 'x64', patchable: true },
    { id: 'sapphire-ofx-x64-2021-51', name: 'Sapphire 2021.51', compatibility: 'Fish Video 20.0 to 23.0', bits: 'x64', patchable: true },
    { id: 'sapphire-ofx-x64-2023x', name: 'Sapphire 2023.x', compatibility: 'Fish Video 20.0 to 23.0', bits: 'x64', patchable: true },
    { id: 'sapphire-ofx-x64-2025-52', name: 'Sapphire 2025.52', compatibility: 'Fish Video 20.0 to 23.0', bits: 'x64', patchable: true },
    { id: 'sapphire-ofx-x64-2027', name: 'Sapphire 2027', compatibility: 'Fish Video 2026 and newer', bits: 'x64', patchable: true },
  ],
};

let waxOptions = [];
let pickerKind = 'wax';
let pickerOptions = [];
const vstVersions = {
  'classic-x86': [
    { id: 'vst-x86-1-0', name: 'Version 1.0', compatibility: 'Fish Video 6.0 and older', bits: 'x86' },
    { id: 'vst-x86-1-5', name: 'Version 1.5', compatibility: 'Fish Video 7.0 to 9.0e', bits: 'x86' },
    { id: 'vst-x86-1-6', name: 'Version 1.6', compatibility: 'Fish Video 10.0 to 11.0', bits: 'x86' },
  ],
  'modern-x64': [
    { id: 'vst-x64-1-6', name: 'Version 1.6', compatibility: 'Fish Video 8.1 to 11', bits: 'x64' },
    { id: 'vst-x64-2-0', name: 'Version 2.0', compatibility: 'Fish Video 12 and newer', bits: 'x64' },
  ],
};
let installedWax = [];
try {
  installedWax = JSON.parse(localStorage.getItem('fish-video-wax-installs') || '[]');
  if (!Array.isArray(installedWax)) installedWax = [];
} catch {
  installedWax = [];
}

const savedWaxState = JSON.stringify(installedWax);
installedWax = installedWax
  .map((entry) => {
    if (String(entry.name || '').trim().toLowerCase() === 'wax 2.5') {
      return { ...entry, key: 'directx-legacy||wax-2-5', category: 'DirectX (Legacy)', compatibility: 'Fish Video 7.0 to 9.0e', minRelease: 7, maxRelease: 9, bits: 'x86 (32-bit)' };
    }
    if (entry.category === 'DirectX (Legacy)' && entry.name === 'Wax 3.1' && entry.compatibility === 'Fish Video 10.0 to 11.0') {
      return { ...entry, key: 'directx-legacy||wax-3-0-dx', name: 'Wax 3.0' };
    }
    return entry;
  });
if (JSON.stringify(installedWax) !== savedWaxState) {
  try {
    localStorage.setItem('fish-video-wax-installs', JSON.stringify(installedWax));
  } catch {
    // Keep this page's corrected catalog if storage is unavailable.
  }
}

function getWaxOptions() {
  if (codeTypeSelect.value === 'directx-legacy') return waxByDirectX;
  if (codeTypeSelect.value === 'ofx') return waxByOfx[pluginMode.value] || [];
  return [];
}

function getSapphireOptions() {
  if (codeTypeSelect.value === 'directx-legacy') return sapphireByDirectX;
  if (codeTypeSelect.value === 'ofx') return sapphireByOfx[pluginMode.value] || [];
  return [];
}

function updateWaxAvailability() {
  const isDirectX = codeTypeSelect.value === 'directx-legacy';
  const isOfxX64 = codeTypeSelect.value === 'ofx' && pluginMode.value === 'modern-x64';
  waxArea.hidden = !(isDirectX || isOfxX64);
  const codex = codeTypeSelect.value === 'codex-fish-plugins';
  document.querySelector('#codex-plugin-area').hidden = !codex;
  const installed = installedWax.some((entry) => entry.category === 'CodeX (Fish Plug-ins)' && entry.id === 'codex-distortion');
  document.querySelector('#codex-distortion-state').textContent = installed ? 'Installed · Video FX' : 'Install video event effects';
}
function updateSapphireAvailability() {
  const isDirectX = codeTypeSelect.value === 'directx-legacy';
  const isOfx = codeTypeSelect.value === 'ofx' && ['classic-x86', 'modern-x64'].includes(pluginMode.value);
  sapphireArea.hidden = !(isDirectX || isOfx);
  sapphireX86Note.hidden = !isOfx || pluginMode.value !== 'classic-x86';
}
function updateVstPlugin() {
  const isVst = codeTypeSelect.value === 'vst-audio';
  const hasMode = pluginMode.value === 'classic-x86' || pluginMode.value === 'modern-x64';
  vstPluginArea.hidden = !isVst || !hasMode;
  if (!isVst || !hasMode) return;
  const isX86 = pluginMode.value === 'classic-x86';
  vstPluginName.textContent = isX86 ? 'Image-Line Legacy' : 'Image-Line';
  vstPluginArchitecture.textContent = `VST · ${isX86 ? 'Classic (x86)' : 'Modern (x64)'}`;
  vstPluginArea.setAttribute('aria-label', `${vstPluginName.textContent} VST plug-in for ${isX86 ? 'x86' : 'x64'}`);
  vstPluginTile.title = `Install ${vstPluginName.textContent} VST`;
}
function updateArchitectureCompatibility() {
  const type = codeTypeSelect.value;
  const mode = pluginMode.value;
  if (type === 'directx-legacy') {
    architectureCompatibilityNote.hidden = false;
    architectureCompatibilityNote.textContent = 'Legacy DirectX plug-ins are x86 and are listed through Fish Video 11.0. Fish Video 12.0 and newer requires x64 plug-ins.';
    return;
  }
  const hasMode = ['vst-audio', 'ofx'].includes(type) && ['classic-x86', 'modern-x64'].includes(mode);
  architectureCompatibilityNote.hidden = !hasMode;
  if (!hasMode) return;
  architectureCompatibilityNote.textContent = mode === 'modern-x64'
    ? 'x64 Fish Video starts with 8.1. Fish Video 12.0 and newer is x64 only.'
    : 'x86 plug-ins work through Fish Video 11.0; Fish Video 12.0 and newer requires x64.';
}

function updateWaxOptions() {
  pickerKind = 'wax';
  const previous = waxVersionSelect.value;
  waxOptions = getWaxOptions();
  populatePluginPicker(waxOptions, 'Wax Plug-in');
  if (waxOptions.some((item) => item.id === previous)) waxVersionSelect.value = previous;
}

function pluginInstallKey(item) {
  if (pickerKind === 'vst') return `vst-audio|${pluginMode.value}|${item.id}`;
  if (pickerKind === 'sapphire') return `sapphire|${codeTypeSelect.value}|${pluginMode.value || 'none'}|${item.id}`;
  return `${codeTypeSelect.value}|${pluginMode.value}|${item.id}`;
}
function isSapphireX86Install(entry) {
  return entry.key?.startsWith('sapphire|ofx|classic-x86|') ||
    (entry.name?.startsWith('GenArts Sapphire ') && entry.category === 'OFX' && entry.bits?.startsWith('x86'));
}

function populatePluginPicker(options, label) {
  const previous = waxVersionSelect.value;
  pickerOptions = options;
  waxVersionSelect.replaceChildren(new Option('Select a version', '', true, true));
  waxVersionSelect.options[0].disabled = true;
  const sapphireX86Occupied = pickerKind === 'sapphire' &&
    codeTypeSelect.value === 'ofx' &&
    pluginMode.value === 'classic-x86' &&
    installedWax.some(isSapphireX86Install);
  options.forEach((item) => {
    const key = pluginInstallKey(item);
    const option = new Option(`${item.name} — ${item.compatibility}`, item.id);
    option.disabled = installedWax.some((entry) => entry.key === key);
    if (sapphireX86Occupied) option.disabled = true;
    waxVersionSelect.add(option);
  });
  const dialog = waxPicker.querySelector('[role="dialog"]');
  dialog.setAttribute('aria-label', `Choose ${label} version`);
  waxVersionSelect.setAttribute('aria-label', `${label} version`);
  if (options.some((item) => item.id === previous)) waxVersionSelect.value = previous;
}

function renderInstalledWax() {
  installedWaxList.replaceChildren();
  installedWax.forEach((entry) => {
    const row = document.createElement('li');
    const icon = document.createElement('img');
    icon.src = entry.isSapphire || entry.key?.startsWith('sapphire|')
      ? 'assets/genarts-sapphire.png'
      : entry.category === 'VST (Audio)' ? 'assets/fish-video-icon.png' : 'assets/wax-plugin.png';
    icon.alt = '';
    const copy = document.createElement('div');
    copy.className = 'installed-copy';
    const name = document.createElement('span');
    name.className = 'installed-name';
    name.textContent = entry.name;
    const detail = document.createElement('span');
    detail.className = 'installed-detail';
    detail.textContent = `${entry.category} · ${entry.compatibility} · ${entry.bits}`;
    copy.append(name, detail);
    if (entry.patchable) {
      const patch = document.createElement('button');
      patch.type = 'button';
      patch.className = 'uninstall-button patch-button';
      patch.textContent = entry.patched ? 'Unpatch' : 'Patch';
      patch.title = entry.patched ? 'Restore the Sapphire watermark' : 'Remove the Sapphire watermark';
      patch.setAttribute('aria-label', `${entry.patched ? 'Unpatch' : 'Patch'} ${entry.name}`);
      patch.addEventListener('click', () => {
        installedWax = installedWax.map((installed) =>
          installed.key === entry.key ? { ...installed, patched: !installed.patched } : installed
        );
        try {
          localStorage.setItem('fish-video-wax-installs', JSON.stringify(installedWax));
        } catch {
          // Keep the current page in sync if storage is unavailable.
        }
        renderInstalledWax();
      });
      row.append(icon, copy, patch);
    } else {
      row.append(icon, copy);
    }
    const uninstall = document.createElement('button');
    uninstall.type = 'button';
    uninstall.className = 'uninstall-button';
    uninstall.textContent = 'Uninstall';
    uninstall.setAttribute('aria-label', `Uninstall ${entry.name}`);
    uninstall.addEventListener('click', () => {
      installedWax = installedWax.filter((installed) => installed.key !== entry.key);
      try {
        localStorage.setItem('fish-video-wax-installs', JSON.stringify(installedWax));
      } catch {
        // Keep the current page in sync if storage is unavailable.
      }
      renderInstalledWax();
      updateWaxOptions();
    });
    row.append(uninstall);
    installedWaxList.append(row);
  });
  installedWaxSection.hidden = installedWax.length === 0;
  window.dispatchEvent(new CustomEvent('fish-video:sapphire-state'));
}

renderInstalledWax();
updateWaxOptions();

codeTypeSelect.addEventListener('change', () => {
  const showMode = ['ofx', 'vst-audio', 'codex-fish-plugins'].includes(codeTypeSelect.value);
  vstCompatibilityNote.hidden = codeTypeSelect.value !== 'vst-audio';
  modeField.hidden = !showMode;
  pluginFields.classList.toggle('has-mode', showMode);
  pluginMode.value = '';
  if (codeTypeSelect.value === 'ofx' || codeTypeSelect.value === 'codex-fish-plugins') pluginMode.value = 'modern-x64';
  updateArchitectureCompatibility();
  updateWaxAvailability();
  updateSapphireAvailability();
  updateVstPlugin();
  waxPicker.hidden = true;
  waxToggle.setAttribute('aria-expanded', 'false');
  updateWaxOptions();
  updateWaxAvailability();
});

document.querySelector('#codex-distortion-toggle').addEventListener('click', () => {
  const index = installedWax.findIndex((entry) => entry.category === 'CodeX (Fish Plug-ins)' && entry.id === 'codex-distortion');
  if (index >= 0) installedWax.splice(index, 1);
  else installedWax.push({ id: 'codex-distortion', key: 'codex|distortion-x86-x64', name: 'Distortion for x86 and x64', category: 'CodeX (Fish Plug-ins)', bits: 'x86 + x64', compatibility: 'Fish Video 2.0 and newer', minRelease: 2 });
  try { localStorage.setItem('fish-video-wax-installs', JSON.stringify(installedWax)); } catch { /* Keep the current page state. */ }
  renderInstalledWax(); updateWaxAvailability();
});

pluginMode.addEventListener('change', () => {
  updateWaxOptions();
  updateWaxAvailability();
  updateSapphireAvailability();
  updateVstPlugin();
  updateArchitectureCompatibility();
});
waxToggle.addEventListener('click', () => {
  pickerKind = 'wax';
  updateWaxOptions();
  waxVersionSelect.value = '';
  waxPicker.hidden = false;
  waxToggle.setAttribute('aria-expanded', 'true');
  waxVersionSelect.focus();
});

function closeWaxPicker() {
  const focusTarget = pickerKind === 'vst' ? vstPluginTile : pickerKind === 'sapphire' ? sapphireToggle : waxToggle;
  waxPicker.hidden = true;
  waxToggle.setAttribute('aria-expanded', 'false');
  vstPluginTile.setAttribute('aria-expanded', 'false');
  waxVersionSelect.value = '';
  focusTarget.focus();
}

waxVersionSelect.addEventListener('change', () => {
  const item = pickerOptions.find((option) => option.id === waxVersionSelect.value);
  if (!item) return;
  const key = pluginInstallKey(item);
  if (installedWax.some((entry) => entry.key === key)) {
    closeWaxPicker();
    return;
  }
  const category = pickerKind === 'vst' ? 'VST (Audio)' : codeTypeSelect.selectedOptions[0].textContent;
  const name = pickerKind === 'vst'
    ? `${vstPluginName.textContent} ${item.name}`
    : pickerKind === 'sapphire' ? `GenArts Sapphire ${item.name.replace(/^Sapphire /, '')}` : item.name;
  installedWax.push({
    key,
    name,
    compatibility: item.compatibility,
    ...(Number.isFinite(item.minRelease) ? { minRelease: item.minRelease } : {}),
    ...(Number.isFinite(item.maxRelease) ? { maxRelease: item.maxRelease } : {}),
    bits: item.bits,
    category,
    ...(pickerKind === 'sapphire' ? { isSapphire: true, patchable: Boolean(item.patchable), patched: false } : {}),
  });
  try {
    localStorage.setItem('fish-video-wax-installs', JSON.stringify(installedWax));
  } catch {
    // Keep this page's installed list working if storage is unavailable.
  }
  renderInstalledWax();
  closeWaxPicker();
});

vstPluginTile.addEventListener('click', () => {
  if (!['classic-x86', 'modern-x64'].includes(pluginMode.value)) return;
  pickerKind = 'vst';
  populatePluginPicker(vstVersions[pluginMode.value] || [], vstPluginName.textContent);
  waxVersionSelect.value = '';
  waxPicker.hidden = false;
  vstPluginTile.setAttribute('aria-expanded', 'true');
  waxVersionSelect.focus();
});

sapphireToggle.addEventListener('click', () => {
  pickerKind = 'sapphire';
  populatePluginPicker(getSapphireOptions(), 'GenArts Sapphire');
  waxVersionSelect.value = '';
  waxPicker.hidden = false;
  sapphireToggle.setAttribute('aria-expanded', 'true');
  waxVersionSelect.focus();
});

waxPicker.addEventListener('click', (event) => {
  if (event.target === waxPicker) closeWaxPicker();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !waxPicker.hidden) closeWaxPicker();
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function activateTab(tab) {
  tabs.forEach((item) => {
    const isActive = item === tab;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-selected', String(isActive));
    item.tabIndex = isActive ? 0 : -1;
  });
  panels.forEach((panel) => {
    panel.hidden = panel.id !== tab.getAttribute('aria-controls');
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    activateTab(tabs[next]);
    tabs[next].focus();
  });
});

const appearanceSetting = document.querySelector('#appearance-setting');
const brightnessSetting = document.querySelector('#brightness-setting');
const brightnessField = document.querySelector('#brightness-field');
const modernModeSetting = document.querySelector('#modern-mode-setting');
const customColorField = document.querySelector('#custom-color-field');
const appearanceColor = document.querySelector('#appearance-color');

function applyAppearance(theme, brightness) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.brightness = brightness;
  document.documentElement.style.setProperty('--custom-accent', appearanceColor?.value || '#a3ff47');
  brightnessField.hidden = theme !== 'green';
  customColorField.hidden = theme !== 'custom';
  document.documentElement.dataset.modern = modernModeSetting?.checked ? 'true' : 'false';
}

try {
  const savedTheme = localStorage.getItem('fish-video-theme');
  const savedBrightness = localStorage.getItem('fish-video-green-brightness');
  const savedAccent = localStorage.getItem('fish-video-custom-accent');
  if (savedAccent && /^#[0-9a-f]{6}$/i.test(savedAccent)) appearanceColor.value = savedAccent;
  modernModeSetting.checked = localStorage.getItem('fish-video-modern-mode') === 'true';
  if (['light', 'dark', 'green', 'custom'].includes(savedTheme)) appearanceSetting.value = savedTheme;
  if (['light', 'medium', 'dark'].includes(savedBrightness)) brightnessSetting.value = savedBrightness;
} catch {
  // Settings still work for this page view when storage is unavailable.
}
applyAppearance(appearanceSetting.value, brightnessSetting.value);

appearanceSetting.addEventListener('change', () => {
  applyAppearance(appearanceSetting.value, brightnessSetting.value);
  try { localStorage.setItem('fish-video-theme', appearanceSetting.value); } catch { /* Keep the current view updated. */ }
});
appearanceColor.addEventListener('input', () => { applyAppearance(appearanceSetting.value, brightnessSetting.value); try { localStorage.setItem('fish-video-custom-accent', appearanceColor.value); } catch {} });
brightnessSetting.addEventListener('change', () => {
  applyAppearance(appearanceSetting.value, brightnessSetting.value);
  try { localStorage.setItem('fish-video-green-brightness', brightnessSetting.value); } catch { /* Keep the current view updated. */ }
});
modernModeSetting.addEventListener('change',()=>{applyAppearance(appearanceSetting.value,brightnessSetting.value);try{localStorage.setItem('fish-video-modern-mode',String(modernModeSetting.checked));}catch{}});

const aboutOpen = document.querySelector('#about-open');
const aboutClose = document.querySelector('#about-close');
const backdrop = document.querySelector('#about-backdrop');
const visitorAvatar = document.querySelector('#visitor-avatar');
const visitorCredit = document.querySelector('#visitor-credit');

function closeAbout() {
  backdrop.hidden = true;
  aboutOpen.setAttribute('aria-expanded', 'false');
  aboutOpen.focus();
}

aboutOpen.addEventListener('click', () => {
  backdrop.hidden = false;
  aboutOpen.setAttribute('aria-expanded', 'true');
  aboutClose.focus();
});
aboutClose.addEventListener('click', closeAbout);
backdrop.addEventListener('click', (event) => {
  if (event.target === backdrop) closeAbout();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !backdrop.hidden) closeAbout();
});

if (window.websim?.getUser) {
  window.websim.getUser().then((user) => {
    if (!user) return;
    if (user.username?.replace(/^@/, '').toLowerCase() === 'dga') {
      visitorCredit.hidden = true;
    }
    const avatarUrl = user.avatar_url || `https://images.websim.com/avatar/${encodeURIComponent(user.username)}`;
    const image = document.createElement('img');
    image.src = avatarUrl;
    image.alt = '';
    image.onerror = () => image.remove();
    visitorAvatar.replaceChildren(image);
  }).catch(() => {});
}
