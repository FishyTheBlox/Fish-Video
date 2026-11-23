import { runRenderClock } from './render.js';

const editor = document.querySelector('#editor-workspace');
const manager = document.querySelector('.shell');
const versionLabel = document.querySelector('#editor-version');
const editorVersionIcon = document.querySelector('#editor-version-icon');
const backButton = document.querySelector('#editor-back');
const exitConfirm = document.querySelector('#exit-confirm');
const exitSaveYes = document.querySelector('#exit-save-yes');
const exitSaveNo = document.querySelector('#exit-save-no');
const exitSaveCancel = document.querySelector('#exit-save-cancel');
const fileInput = document.querySelector('#media-files');
const projectFileInput = document.querySelector('#project-file');
const mediaGrid = document.querySelector('#media-grid');
const previewEmpty = document.querySelector('#preview-empty');
const previewVideo = document.querySelector('#preview-video');
const previewImage = document.querySelector('#preview-image');
const sapphireWatermarkOverlay = document.querySelector('#sapphire-watermark-overlay');
const previewStage = document.querySelector('.preview-stage');
const videoFxCanvas = document.createElement('canvas');
const videoFxLastGoodCanvas = document.createElement('canvas');
let videoFxHasLastGoodFrame = false;
videoFxCanvas.className = 'video-fx-canvas';
videoFxCanvas.hidden = true;
previewStage.append(videoFxCanvas);
let activePreviewVideoFx = null;
function refreshSapphireWatermark(settings = activePreviewVideoFx) {
  activePreviewVideoFx = settings;
  const effects = new Set(settings?.effects || []);
  const unpatchedSapphire = effects.size
    ? installedSapphirePlugins().reverse().find((entry) =>
      (entry.isSapphire || /sapphire/i.test(entry.name || '')) &&
      !entry.patched &&
      (effects.has(`directx:${entry.key}`) || effects.has(`sapphire:${entry.key}`))
    )
    : null;
  if (!unpatchedSapphire) {
    sapphireWatermarkOverlay.hidden = true;
    return;
  }
  const version = Number(unpatchedSapphire.name?.match(/Sapphire\s+(\d+)/i)?.[1]) || 0;
  const asset = version >= 9
    ? 'assets/genarts-sapphire-watermark-modern.png'
    : 'assets/genarts-sapphire-watermark-legacy.png';
  if (sapphireWatermarkOverlay.dataset.watermarkAsset !== asset) {
    sapphireWatermarkOverlay.src = asset;
    sapphireWatermarkOverlay.dataset.watermarkAsset = asset;
  }
  sapphireWatermarkOverlay.hidden = previewVideo.hidden && previewImage.hidden;
}
window.addEventListener('fish-video:sapphire-state', () => refreshSapphireWatermark());
new MutationObserver(() => refreshSapphireWatermark()).observe(previewVideo, { attributes: true, attributeFilter: ['hidden'] });
new MutationObserver(() => refreshSapphireWatermark()).observe(previewImage, { attributes: true, attributeFilter: ['hidden'] });
refreshSapphireWatermark();
const audioPreview = document.querySelector('#audio-preview');
const audioName = document.querySelector('#audio-preview-name');
const previewAudio = document.querySelector('#preview-audio');
const trackLabels = document.querySelector('#track-labels');
const trackCanvas = document.querySelector('#track-canvas');
const timelineBody = document.querySelector('.timeline-body');
const rulerScale = document.querySelector('#ruler-scale');
const timelineZoomControl = document.querySelector('#timeline-zoom-control');
const playhead = document.querySelector('#playhead');
const playButton = document.querySelector('#play-button');
const timeReadout = document.querySelector('#time-readout');
const previewFrame = document.querySelector('#preview-frame');
const transportStatus = document.querySelector('#transport-status');
const projectFormat = document.querySelector('#project-format');
const previewTitle = document.querySelector('#preview-title');
const previewEmptyLabel = document.querySelector('#preview-empty-label');
const previewMark = document.querySelector('.preview-mark');
const projectLibraryTab = document.querySelector('#project-library-tab');
const projectLibraryHeading = document.querySelector('#project-library-heading');
const audioFxBrowser = document.querySelector('#audio-fx-browser');
const audioFxHint = document.querySelector('#audio-fx-browser-hint');
const audioFxButtons = document.querySelector('#audio-fx-buttons');
const audioFxChain = document.querySelector('#audio-fx-chain');
const videoFxBrowser = document.querySelector('#video-fx-browser');
const transitionsBrowser = document.querySelector('#transitions-browser');
const videoFxHint = document.querySelector('#video-fx-browser-hint');
const videoFxButtons = document.querySelector('#video-fx-buttons');
const videoFxChain = document.querySelector('#video-fx-chain');
const videoEventFxPanel = document.querySelector('#video-event-fx-panel');
const videoEventFxTarget = document.querySelector('#video-event-fx-target');
const panCropPanel = document.querySelector('#pan-crop-panel');
const panCropTargetLabel = document.querySelector('#pan-crop-target');
const panCropZoom = document.querySelector('#pan-crop-zoom');
const panCropX = document.querySelector('#pan-crop-x');
const panCropY = document.querySelector('#pan-crop-y');
const panCropZoomValue = document.querySelector('#pan-crop-zoom-value');
const panCropXValue = document.querySelector('#pan-crop-x-value');
const panCropYValue = document.querySelector('#pan-crop-y-value');
let panCropFxTarget = null;
const directxFxBrowser = document.querySelector('#directx-fx-browser');
const directxFxButtons = document.querySelector('#directx-fx-buttons');
const directxFxEmpty = document.querySelector('#directx-fx-empty');
const codexFxBrowser = document.querySelector('#codex-fx-browser');
const codexFxButtons = document.querySelector('#codex-fx-buttons');
const sapphirePluginBrowser = document.querySelector('#sapphire-plugin-browser');
const sapphirePluginButtons = document.querySelector('#sapphire-plugin-buttons');
const sapphireEffectButtons = document.querySelector('#sapphire-effect-buttons');
const sapphireEventUi = document.querySelector('#sapphire-event-ui');
const sapphireEffectControls = document.querySelector('#sapphire-effect-controls');
const sapphireVersionLabel = document.querySelector('#sapphire-version-label');
const codexDistortionUi = document.querySelector('#codex-distortion-ui');
const codexDistortionControls = document.querySelector('#codex-distortion-controls');
let selectedBrowserFx = null;
let videoFxCanvasFrame = 0;
let videoFxCanvasLastFrameAt = 0;
let videoFxCanvasSource = null;
let videoFxCanvasSettings = null;
const projectNameLabel = document.querySelector('#project-name-label');
const contextMenu = document.querySelector('#editor-context-menu');
const gridSpacingBackdrop = document.querySelector('#grid-spacing-backdrop');
const gridTempoInput = document.querySelector('#grid-tempo');
const fxPanel = document.querySelector('#audio-fx-panel');
const videoEventFxDragHandle = document.querySelector('#video-event-fx-drag-handle');
const propertiesPanel = document.querySelector('#event-properties-panel');
const fxPanelTitle = document.querySelector('#audio-fx-panel-title');
const fxChainList = document.querySelector('#fx-chain-list');
const waveHammerSettingsPanel = document.querySelector('#wave-hammer-settings');
const waveHammerLimit = document.querySelector('#wave-hammer-limit');
const waveHammerStrength = document.querySelector('#wave-hammer-strength');
const waveHammerApply = document.querySelector('#wave-hammer-apply');
const waveHammerLeft = document.querySelector('#wave-hammer-left');
const waveHammerRight = document.querySelector('#wave-hammer-right');
const media = [];
const mediaArchive = new Map();
let selectedMediaId = null;
let selectedClipId = null;
let selectedClipIds = new Set();
let selectedTrackId = 'audio-1';
let activeVersion = 'Audio 1.0a (Build 177)';
let activeRelease = 1;
let isAudioEdition = true;
let trackCounter = 2;
let tracks = [
  { id: 'video-1', type: 'video', name: 'Video Track 1', height: 112, clips: [], muted: false, solo: false, fx: defaultFx() },
  { id: 'audio-1', type: 'audio', name: 'Audio Track 1', height: 112, clips: [], muted: false, solo: false, fx: defaultFx() },
];
let masterFx = defaultFx();
let undoStack = [];
let redoStack = [];
let audioContext = null;
let audioGraph = null;
let pitchShifterReady = false;
let pitchShifterModulePromise = null;
let meterFrame = 0;
let meterLevels = [0, 0];
let timelineClockPlaying = false;
let timelineClockTime = 0;
let timelineClockStartedAt = 0;
let timelineClockFrame = 0;
let eventClockMode = false;
let timelineAudioPlayback = false;
let timelineVideoClipId = null;
const timelineAudioPlayers = new Map();
let fxTarget = null;
let copiedClip = null;
let timelineZoom = 1;
let timelineZoomIndex = 0;
let timeDisplayMode = 'time';
let scrubbingTimeline = false;
let playheadGrabOffset = 0;
let gridSpacing = 'seconds';
let projectBpm = 120;
const defaultProjectProperties = () => ({ width: 1280, height: 720, frameRate: 60, pixelAspect: 1, videoBitrate: 8, hdr: 'off', audioSampleRate: 48000, audioBitDepth: '16', audioBitrate: 192, fieldOrder: 'progressive', renderQuality: 'good' });
let projectProperties = defaultProjectProperties();
const projectPropertiesBackdrop = document.querySelector('#project-properties-backdrop');
const projectWidthInput = document.querySelector('#project-width');
const projectHeightInput = document.querySelector('#project-height');
const projectFrameRateInput = document.querySelector('#project-frame-rate');
const projectPixelAspectInput = document.querySelector('#project-pixel-aspect');
const projectFieldOrderInput = document.querySelector('#project-field-order');
const projectRenderQualityInput = document.querySelector('#project-render-quality');
const projectAudioRateInput = document.querySelector('#project-audio-rate');
const projectAudioBitsInput = document.querySelector('#project-audio-bits');
const projectTempoInput = document.querySelector('#project-tempo');
const projectTimeFormatInput = document.querySelector('#project-time-format');
let projectName = 'Untitled Project';
let savedProjectHandle = null;
let savedProjectHandleProjectName = '';
let afterEditorExit = null;
const BASE_PIXELS_PER_SECOND = 10;

function defaultFx() { return { volume: 100, bass: 0, treble: 0, reverb: 0, delay: 0, vibrato: 0, distortion: 0, chorus: 0, flange: 0, pan: 0, smooth: 0, waveHammer: 0, effects: [], waveHammerSettings: { dbLimit: -12, strength: 0.5, apply: true, left: true, right: true }, speed: 100, pitch: 0, pitchCents: 0, method: 'classic', attributes: 'Pro' }; }
function defaultVideoFx() {
  return {
    effects: [], codexEffects: [], sapphireEffects: [], s_GlowIntensity: 50, s_BlurAmount: 10, s_ShakeAmplitude: 20, s_ShakeFrequency: 8, s_ShakeRGB: 0, s_LensFlareIntensity: 50, s_WarpBubbleAmount: 25, bendAmount: 0, cornerTopLeft: 0, cornerTopRight: 0, cornerBottomRight: 0, cornerBottomLeft: 0, flipMode: 'none', panRotation: 0, panFlipX: 1, panFlipY: 1, tileRotate: 0, tileShift: 0, kaleidoscopeSegments: 6, kaleidoscopeRotation: 0, kaleidoscopeSpeed: 0, squeezeAmount: 0, warpWaveAmount: 0, warpWaveAngle: 0, warpWaveSpeed: 0, warpWaveAxis: 'horizontal', panX: 0, panY: 0, panZoom: 100, brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, glow: 0, glowColor: '#ffffff', sharpen: 0,
    borderAmount: 3, channelBlend: 0, deform: 0, deformSqueeze: 0, deformShear: 0, deformCurve: 0, deformCenter: true, deformBackground: '#000000',
    deformLeft: true, deformRight: true, deformTop: true, deformBottom: true,
    deformShearHorizontal: true, deformShearVertical: true,
    deformCurveLeft: true, deformCurveRight: true, deformCurveTop: true, deformCurveBottom: true,
    gradientMap: 0, lightRays: 0, minMax: 0, minThreshold: 0, maxThreshold: 100, pinchPunch: 0,
    radialBlur: 0, rays: 0, softContrast: 0, spherize: 0, starburst: 0, tvSimulator: 0,
    invertRed: false, invertGreen: false, invertBlue: false,
    blackWhiteAmount: 1, sepiaAmount: 1, sepiaColor: '#704214',
    cookieShape: 'circle', cookieSize: 80, cookieAmountX: 1, cookieAmountY: 1, cookieBorderColor: '#ffffff', cookieBorderSize: 0, cookieMode: 'in', cookieFeather: 0,
    mirrorAxis: 'vertical', mirrorPosition: 50, mirrorRotation: 0, pixelSize: 0,
    swirlAmount: 0, swirlX: 50, swirlY: 50, swirlSize: 50,
    waveAmountH: 0, waveAmountV: 0, waveSizeH: .25, waveSizeV: .25, wavePhase: 0,
  };
}
function interpolateVideoFx(clip, localTime) {
  const base = ensureVideoFx(clip);
  const keys = [...(clip.keyframes || [])].sort((a, b) => a.time - b.time);
  if (!keys.length) return base;
  let left = keys[0], right = keys.at(-1);
  for (let i = 0; i < keys.length - 1; i++) {
    if (localTime >= keys[i].time && localTime <= keys[i + 1].time) { left = keys[i]; right = keys[i + 1]; break; }
  }
  const staticLists = { effects: base.effects, codexEffects: base.codexEffects, sapphireEffects: base.sapphireEffects };
  if (localTime <= left.time) return { ...base, ...left.values, ...staticLists };
  if (localTime >= right.time || left === right) return { ...base, ...right.values, ...staticLists };
  let t = Math.max(0, Math.min(1, (localTime - left.time) / Math.max(.0001, right.time - left.time)));
  const mode = left.easing || 'Linear';
  if (mode === 'Fast') t *= t;
  else if (mode === 'Slow') t = 1 - (1 - t) * (1 - t);
  else if (mode === 'Smooth') t = t * t * (3 - 2 * t);
  else if (mode === 'Sharp') t = t < .5 ? 0 : 1;
  else if (mode === 'Hold') t = 0;
  const out = { ...base, ...left.values };
  for (const [key, end] of Object.entries(right.values || {})) {
    if (key === 'effects' || key === 'codexEffects') continue;
    const start = left.values?.[key] ?? base[key];
    if (typeof start === 'number' && typeof end === 'number') out[key] = start + (end - start) * t;
    else if (typeof start === 'string' && /^#[0-9a-f]{6}$/i.test(start) && /^#[0-9a-f]{6}$/i.test(end)) {
      const ca = [1, 3, 5].map(i => parseInt(start.slice(i, i + 2), 16));
      const cb = [1, 3, 5].map(i => parseInt(end.slice(i, i + 2), 16));
      out[key] = '#' + ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, '0')).join('');
    } else out[key] = t < .5 ? start : end;
  }
  return { ...out, ...staticLists };
}
function addVideoKeyframe(kind) {
  const found = selectedVideoClip();
  if (!found) { transportStatus.textContent = 'Select a video event first'; return; }
  const clip = found.clip;
  const local = Math.max(0, Math.min(Number(clip.duration) || 0, timelineClockTime - (Number(clip.startTime) || 0)));
  const values = { ...interpolateVideoFx(clip, local) };
  delete values.effects; delete values.codexEffects; delete values.keyframes;
  recordUndo();
  const frame = Math.round(local * projectProperties.frameRate) / projectProperties.frameRate;
  const existing = (clip.keyframes || []).find(k => Math.abs(k.time - frame) < .5 / projectProperties.frameRate);
  if (existing) existing.values = { ...existing.values, ...values };
  else (clip.keyframes ||= []).push({ time: frame, values, easing: 'Linear' });
  clip.keyframes.sort((a, b) => a.time - b.time);
  renderTracks(); transportStatus.textContent = 'Keyframe set at ' + formatRulerTime(frame);
}
function addVideoFxFieldKeyframe(field) {
  const found = selectedVideoClip();
  if (!found) { transportStatus.textContent = 'Select a video event first'; return; }
  if (field === 'effects' || field === 'codexEffects' || field === 'sapphireEffects') return;
  const clip = found.clip;
  const local = Math.max(0, Math.min(Number(clip.duration) || 0, timelineClockTime - (Number(clip.startTime) || 0)));
  const frame = Math.round(local * projectProperties.frameRate) / projectProperties.frameRate;
  const value = interpolateVideoFx(clip, local)[field];
  recordUndo();
  let key = (clip.keyframes ||= []).find(item => Math.abs(Number(item.time) - frame) < .5 / projectProperties.frameRate);
  if (!key) { key = { time: frame, values: {}, easing: 'Linear' }; clip.keyframes.push(key); }
  key.values ||= {}; key.values[field] = value;
  clip.keyframes.sort((a, b) => a.time - b.time);
  renderTracks(); renderVideoFxBrowser();
  transportStatus.textContent = field + ' keyframe set at ' + formatRulerTime(frame);
}
function ensureVideoFx(clip) {
  clip.videoFx = { ...defaultVideoFx(), ...(clip.videoFx || {}) };
  const keys = Array.isArray(clip.keyframes) ? clip.keyframes : [];
  clip.videoFx.effects = [...new Set([...(Array.isArray(clip.videoFx.effects) ? clip.videoFx.effects : []), ...keys.flatMap(key => Array.isArray(key.values?.effects) ? key.values.effects : [])])];
  clip.videoFx.codexEffects = [...new Set([...(Array.isArray(clip.videoFx.codexEffects) ? clip.videoFx.codexEffects : []), ...keys.flatMap(key => Array.isArray(key.values?.codexEffects) ? key.values.codexEffects : [])])];
  clip.videoFx.sapphireEffects = [...new Set([...(Array.isArray(clip.videoFx.sapphireEffects) ? clip.videoFx.sapphireEffects : []), ...keys.flatMap(key => Array.isArray(key.values?.sapphireEffects) ? key.values.sapphireEffects : [])])];
  for (const key of keys) if (key.values) { delete key.values.effects; delete key.values.codexEffects; delete key.values.sapphireEffects; }
  return clip.videoFx;
}
function normalizeFx(value) {
  const base = defaultFx();
  const fx = { ...base, ...(value || {}) };
  fx.effects = Array.isArray(value?.effects) ? [...new Set(value.effects)] : [];
  for (const key of Object.keys(base)) {
    if (['effects', 'waveHammerSettings', 'speed', 'pitch', 'pitchCents', 'method', 'attributes'].includes(key)) continue;
    if (Number(fx[key]) !== Number(base[key]) && !fx.effects.includes(key)) fx.effects.push(key);
  }
  fx.waveHammerSettings = { ...base.waveHammerSettings, ...(value?.waveHammerSettings || {}) };
  return fx;
}
function clipPlaybackRate(fx) {
  // Speed controls duration; pitch is processed independently by the pitch shifter.
  return Math.max(0.25, Math.min(4, Number(fx?.speed ?? 100) / 100));
}
function speedPitchSemitones(speedPercent) { return 12 * Math.log2(Math.max(0.01, Number(speedPercent || 100) / 100)); }
function pitchShiftSemitones(fx) { return Number(fx?.pitch || 0) + Number(fx?.pitchCents || 0) / 100; }
function setPitchPreservation(player, enabled) {
  if ('preservesPitch' in player) player.preservesPitch = enabled;
  if ('webkitPreservesPitch' in player) player.webkitPreservesPitch = enabled;
  if ('mozPreservesPitch' in player) player.mozPreservesPitch = enabled;
}
function syncSelectedClipDuration(fx) {
  const selection = selectedClip();
  if (!selection || selection.clip.fx !== fx || selection.clip.durationPending) return;
  const sourceDuration = Number(selection.clip.sourceDuration) || Number(findMedia(selection.clip.mediaId)?.duration) || Number(selection.clip.duration);
  if (!Number.isFinite(sourceDuration) || sourceDuration <= 0) return;
  selection.clip.sourceDuration = sourceDuration;
  const duration = sourceDuration / clipPlaybackRate(combineTrackEventFx(selection.track, selection.clip));
  if (Math.abs(duration - selection.clip.duration) < 0.001) return;
  selection.clip.duration = duration;
  renderTracks(); updateProjectLength();
}
function syncTrackClipDurations(track) {
  if (!track || track.type !== 'audio') return;
  let changed = false;
  for (const clip of track.clips) {
    if (clip.durationPending) continue;
    const sourceDuration = Number(clip.sourceDuration) || Number(findMedia(clip.mediaId)?.duration) || Number(clip.duration);
    if (!Number.isFinite(sourceDuration) || sourceDuration <= 0) continue;
    clip.sourceDuration = sourceDuration;
    const duration = sourceDuration / clipPlaybackRate(combineTrackEventFx(track, clip));
    if (Math.abs(duration - Number(clip.duration)) > 0.001) { clip.duration = duration; changed = true; }
  }
  if (changed) { renderTracks(); updateProjectLength(); }
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function updateProjectFormatLabels() {
  const p = projectProperties;
  const frameLabel = Number(p.frameRate).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  const bitsLabel = p.audioBitDepth === '32f' ? '32-bit float' : `${p.audioBitDepth}-bit`;
  projectFormat.textContent = isAudioEdition ? 'Audio-only workspace' : `${p.width} × ${p.height} · ${frameLabel} fps`;
  document.querySelector('#project-description').textContent = isAudioEdition
    ? 'Audio project'
    : `Project: ${p.width}×${p.height} · ${frameLabel}p · ${Number(p.audioSampleRate) / 1000} kHz/${bitsLabel}`;
  document.querySelector('#preview-display').textContent = isAudioEdition ? 'Audio Monitor' : `Display: ${p.width}×${p.height}`;
}

function launchEditor(details) {
  videoEventFxPanel.hidden = true;
  panCropPanel.hidden = true;
  activeVersion = details.label;
  activeRelease = Number(details.release) || 1;
  isAudioEdition = activeVersion.toLowerCase().startsWith('audio');
  resetProjectContents();
  gridSpacing = 'seconds'; projectBpm = 120; projectProperties = defaultProjectProperties(); timeDisplayMode = 'time';
  const usesEarlyVersionIcon = activeRelease <= 3;
  editorVersionIcon.src = usesEarlyVersionIcon ? 'assets/version-icon-1-to-3.png' : 'fish-video-icon.png';
  editorVersionIcon.alt = usesEarlyVersionIcon ? 'Fish Video version 1.0 to 3.0' : 'Fish Video';
  projectLibraryTab.textContent = projectLibraryName();
  projectLibraryHeading.textContent = projectLibraryName();
  setMediaTab(projectLibraryName());
  document.querySelector('#render-video-button').hidden = isAudioEdition;
  document.querySelector('#video-fx-tab').hidden = isAudioEdition || activeRelease < 2;
  document.querySelector('#transitions-tab').hidden = isAudioEdition || activeRelease < 2;
  const emptyLibraryLabel = document.querySelector('#project-library-empty-label');
  if (emptyLibraryLabel) emptyLibraryLabel.textContent = `Your ${isAudioEdition ? 'project audio' : 'project media'} will appear here`;
  const importLabel = isAudioEdition ? '＋ Import Audio' : '＋ Import Media';
  document.querySelector('#import-media').textContent = importLabel;
  const emptyImport = document.querySelector('#empty-import');
  if (emptyImport) emptyImport.textContent = importLabel.replace('＋ ', '');
  versionLabel.textContent = activeVersion;
  editor.classList.toggle('audio-only', isAudioEdition);
  editor.classList.toggle('retro-audio', /^Audio (1\.0a|2\.0a|3\.0)/i.test(activeVersion));
  editor.classList.toggle('classic-video-nav', !isAudioEdition && /^Video (2\.0g|3\.0c)/i.test(activeVersion));
  editor.classList.toggle('classic-video-50', !isAudioEdition && activeRelease === 5);
  editor.classList.toggle('classic-video-60', !isAudioEdition && activeRelease === 6);
  editor.classList.toggle('classic-video-70', !isAudioEdition && activeRelease === 7);
  exitConfirm.classList.toggle('classic-exit', activeRelease <= 3 || editor.classList.contains('retro-audio'));
  fileInput.accept = isAudioEdition ? 'audio/*' : 'video/*,audio/*,image/*';
  previewTitle.textContent = isAudioEdition ? 'Audio Monitor' : 'Video Preview';
  previewEmptyLabel.textContent = isAudioEdition ? 'Audio Monitor' : 'Video Preview';
  previewMark.textContent = isAudioEdition ? '♫' : 'F';
  updateProjectFormatLabels();
  renderTracks();
  setStoppedState();
  document.title = `Fish Video — ${activeVersion}`;
  manager.hidden = true;
  editor.hidden = false;
  gridSpacingBackdrop.hidden = true;
  projectPropertiesBackdrop.hidden = true;
  updateProjectLength();
}
window.addEventListener('fish-video:launch', (event) => launchEditor(event.detail));

function exitEditorNow() {
  stopPlayback(false);
  hideContextMenu();
  gridSpacingBackdrop.hidden = true;
  projectPropertiesBackdrop.hidden = true;
  fxPanel.hidden = true;
  videoEventFxPanel.hidden = true;
  panCropPanel.hidden = true;
  propertiesPanel.hidden = true;
  resetProjectContents();
  editor.hidden = true;
  manager.hidden = false;
  document.title = 'Fish Video';
  const callback = afterEditorExit;
  afterEditorExit = null;
  callback?.();
}
function requestEditorExit(afterExit = null) {
  afterEditorExit = afterExit;
  exitConfirm.hidden = false;
  exitSaveCancel.focus();
}
backButton.addEventListener('click', () => requestEditorExit());
exitSaveYes.addEventListener('click', async () => {
  exitSaveYes.disabled = true;
  const saved = await actionSave();
  exitSaveYes.disabled = false;
  if (!saved) return;
  exitConfirm.hidden = true;
  exitEditorNow();
});
exitSaveNo.addEventListener('click', () => { exitConfirm.hidden = true; exitEditorNow(); });
exitSaveCancel.addEventListener('click', () => { exitConfirm.hidden = true; afterEditorExit = null; backButton.focus(); });
exitConfirm.addEventListener('click', (event) => {
  if (event.target === exitConfirm) { exitConfirm.hidden = true; afterEditorExit = null; backButton.focus(); }
});

document.querySelector('#import-media').addEventListener('click', () => fileInput.click());
document.querySelector('#empty-import').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });

function detectType(file) {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('image/')) return 'image';
  const extension = file.name.split('.').pop().toLowerCase();
  if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(extension)) return 'video';
  if (['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'].includes(extension)) return 'audio';
  return 'image';
}
function addFiles(files) {
  [...files].forEach((file) => {
    const type = detectType(file);
    if (isAudioEdition && type !== 'audio') return;
    recordUndo();
    const entry = { id: crypto.randomUUID(), file, type, url: URL.createObjectURL(file), fx: defaultFx(), duration: type === 'image' ? 5 : null };
    media.push(entry);
    renderMediaItem(entry);
    if (type === 'audio' || type === 'video') readMediaDuration(entry);
  });
  if (media.length) mediaGrid.classList.remove('is-empty');
}
function renderMediaItem(entry) {
  const card = document.createElement('article');
  card.className = 'media-card';
  card.draggable = true;
  card.dataset.mediaId = entry.id;
  entry.card = card;
  const thumb = document.createElement('button');
  thumb.type = 'button'; thumb.className = 'media-thumb';
  thumb.setAttribute('aria-label', `Preview ${entry.file.name}`);
  thumb.innerHTML = `<span>${entry.type === 'video' ? '▶' : entry.type === 'audio' ? '♫' : '▧'}</span>`;
  thumb.addEventListener('click', () => previewMedia(entry));
  let touchPressTimer = 0, touchDragging = false, touchGhost = null, touchOrigin = null;
  thumb.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' || event.button !== 0) return;
    event.preventDefault();
    touchDragging = false; touchOrigin = { x: event.clientX, y: event.clientY };
    thumb.setPointerCapture(event.pointerId);
    touchPressTimer = setTimeout(() => {
      touchDragging = true;
      touchGhost = document.createElement('div'); touchGhost.className = 'media-touch-ghost';
      touchGhost.textContent = entry.file.name; document.body.append(touchGhost);
      touchGhost.style.left = event.clientX + 'px'; touchGhost.style.top = event.clientY + 'px';
      card.classList.add('touch-dragging');
    }, 280);
  });
  thumb.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'touch' || !touchOrigin) return;
    if (!touchDragging && Math.hypot(event.clientX - touchOrigin.x, event.clientY - touchOrigin.y) > 12) {
      clearTimeout(touchPressTimer); touchPressTimer = 0;
    }
    if (!touchDragging || !touchGhost) return;
    event.preventDefault(); touchGhost.style.left = event.clientX + 'px'; touchGhost.style.top = event.clientY + 'px';
    const bounds = timelineBody.getBoundingClientRect();
    if (event.clientY > bounds.bottom - 36) timelineBody.scrollTop += 14;
    else if (event.clientY < bounds.top + 36) timelineBody.scrollTop -= 14;
    if (event.clientX > bounds.right - 36) timelineBody.scrollLeft += 14;
    else if (event.clientX < bounds.left + 36) timelineBody.scrollLeft -= 14;
  });
  const finishTouchDrag = (event) => {
    if (event.pointerType !== 'touch' || !touchOrigin) return;
    clearTimeout(touchPressTimer); touchPressTimer = 0;
    if (touchDragging) {
      const lane = document.elementFromPoint(event.clientX, event.clientY)?.closest('.track-lane');
      const track = lane && tracks.find(item => item.id === lane.dataset.trackId);
      const compatible = track && (track.type === 'audio' ? entry.type === 'audio' : entry.type === 'video' || entry.type === 'image');
      if (compatible) {
        addToTimeline(entry, track.id);
        const added = track.clips.at(-1);
        if (added) {
          added.startTime = timelineTimeAtClientX(event.clientX);
          if (track.type === 'video') { const linked = tracks.find(item => item.type === 'audio')?.clips.at(-1); if (linked?.linkedAudio && linked.mediaId === entry.id) linked.startTime = added.startTime; }
          renderTracks(); updateProjectLength();
        }
      }
      touchGhost?.remove(); touchGhost = null; card.classList.remove('touch-dragging');
    } else {
      previewMedia(entry);
    }
    touchOrigin = null; touchDragging = false;
  };
  thumb.addEventListener('pointerup', finishTouchDrag);
  thumb.addEventListener('pointercancel', finishTouchDrag);
  const name = document.createElement('span'); name.className = 'media-name'; name.textContent = entry.file.name;
  const detail = document.createElement('span'); detail.className = 'media-kind'; detail.textContent = mediaDetails(entry);
  const add = document.createElement('button'); add.type = 'button'; add.className = 'media-add'; add.textContent = '+ Timeline';
  add.addEventListener('click', () => addToTimeline(entry));
  card.append(thumb, name, detail, add);
  card.addEventListener('dragstart', (event) => { event.dataTransfer.setData('application/x-fish-media', entry.id); event.dataTransfer.effectAllowed = 'copy'; });
  card.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    showContextMenu(event.clientX, event.clientY, [
      ['Preview', () => previewMedia(entry)],
      ['Add to timeline', () => addToTimeline(entry)],
      ['Remove from project', () => removeMedia(entry)],
    ]);
  });
  mediaGrid.append(card);
  document.querySelector('.media-empty')?.remove();
}
function mediaDetails(entry) {
  const base = `${entry.type.toUpperCase()} · ${formatSize(entry.file.size)}`;
  return Number.isFinite(entry.duration) ? `${base} · ${entry.duration.toFixed(2)} s` : `${base} · Reading duration…`;
}
function readMediaDuration(entry) {
  const probe = document.createElement(entry.type === 'video' ? 'video' : 'audio');
  probe.preload = 'metadata';
  probe.onloadedmetadata = () => {
    const duration = probe.duration;
    probe.removeAttribute('src'); probe.load();
    if (!Number.isFinite(duration) || !media.includes(entry)) return;
    entry.duration = duration;
    entry.card?.querySelector('.media-kind')?.replaceChildren(document.createTextNode(mediaDetails(entry)));
    let changed = false;
    tracks.forEach((track) => track.clips.forEach((clip) => {
      if (clip.mediaId === entry.id && clip.durationPending) {
        clip.sourceDuration = duration;
        clip.duration = duration / clipPlaybackRate(combineTrackEventFx(track, clip));
        clip.durationPending = false; changed = true;
      }
    }));
    if (changed) { renderTracks(); updateProjectLength(); }
  };
  probe.onerror = () => { probe.removeAttribute('src'); probe.load(); };
  probe.src = entry.url;
}
function formatSize(bytes) {
  if (!bytes) return '0 KB';
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function removeMedia(entry) {
  recordUndo();
  stopPlayback(false);
  media.splice(media.indexOf(entry), 1);
  mediaArchive.set(entry.id, entry);
  entry.card?.remove();
  document.querySelector(`[data-media-id="${CSS.escape(entry.id)}"]`)?.remove();
  tracks.forEach((track) => { track.clips = track.clips.filter((clip) => clip.mediaId !== entry.id); });
  if (selectedMediaId === entry.id) { selectedMediaId = null; showEmptyPreview(); }
  renderTracks(); renderMediaEmpty(); updateProjectLength();
}
function renderMediaEmpty() {
  if (media.length || mediaGrid.querySelector('.media-empty')) return;
  const empty = document.createElement('div'); empty.className = 'media-empty';
  empty.innerHTML = `<div class="empty-icon">＋</div><span>${isAudioEdition ? 'Your project audio' : 'Your project media'} will appear here</span><button type="button" id="empty-import">Import ${isAudioEdition ? 'Audio' : 'Media'}</button>`;
  empty.querySelector('button').addEventListener('click', () => fileInput.click());
  mediaGrid.append(empty);
}
function showEmptyPreview() {
  stopVideoFxCanvas();
  refreshSapphireWatermark(null);
  stopTimelineClock(true);
  previewEmpty.hidden = false; previewVideo.hidden = true; previewImage.hidden = true; audioPreview.hidden = true;
  previewVideo.pause(); previewAudio.pause();
  previewVideo.style.opacity='1'; previewImage.style.opacity='1'; previewVideo.style.clipPath=''; previewImage.style.clipPath='';
  previewVideo.removeAttribute('src'); previewAudio.removeAttribute('src');
  for (const element of [previewVideo, previewImage]) {
    element.style.filter = ''; element.style.transform = ''; element.style.boxShadow = ''; element.style.clipPath = '';
  }
  playButton.textContent = '▶';
}
function previewMedia(entry) {
  selectedMediaId = entry.id;
  selectedClipId = null;
  stopVideoFxCanvas();
  refreshSapphireWatermark(null);
  document.querySelectorAll('.media-card').forEach((card) => card.classList.toggle('selected', card.dataset.mediaId === entry.id));
  previewEmpty.hidden = true; previewVideo.hidden = true; previewImage.hidden = true; audioPreview.hidden = true;
  stopTimelineClock(true);
  stopPlayback(false);
  previewVideo.removeAttribute('src'); previewAudio.removeAttribute('src');
  for (const element of [previewVideo, previewImage]) {
    element.style.filter = ''; element.style.transform = ''; element.style.boxShadow = ''; element.style.clipPath = '';
  }
  if (entry.type === 'video') { previewVideo.src = entry.url; previewVideo.hidden = false; previewVideo.autoplay = true; previewVideo.muted = false; previewVideo.load(); previewVideo.play().catch(() => { transportStatus.textContent = `Ready · ${entry.file.name}`; }); }
  else if (entry.type === 'image') { previewImage.src = entry.url; previewImage.hidden = false; }
  else {
    audioPreview.hidden = false; audioName.textContent = entry.file.name;
    previewAudio.src = entry.url; previewAudio.hidden = true; previewAudio.pause(); previewAudio.load();
    applyFx(entry.fx);
  }
  transportStatus.textContent = `Stopped · ${entry.file.name}`;
  updateTimeReadout(entry.type === 'video' ? previewVideo : entry.type === 'audio' ? previewAudio : null);
}
function findMedia(id) { return media.find((entry) => entry.id === id); }
function addToTimeline(entry, laneHint = '') {
  const targetTrack = tracks.find((item) => item.id === laneHint);
  const type = targetTrack?.type || laneHint || (entry.type === 'video' ? 'video' : 'audio');
  if (type === 'video' && entry.type === 'audio') return;
  if (type === 'audio' && entry.type !== 'audio') return;
  if (type === 'video' && entry.type !== 'video' && entry.type !== 'image') return;
  const track = targetTrack || tracks.find((item) => item.type === type) || addTrack(type, true);
  recordUndo();
  const durationPending = !Number.isFinite(entry.duration) && ['audio', 'video'].includes(entry.type);
  const sourceDuration = entry.duration || 5;
  const startTime = track.clips.reduce((end, clip) => Math.max(end, (Number(clip.startTime) || 0) + (Number(clip.duration) || 0)), 0);
  const clip = { id: crypto.randomUUID(), mediaId: entry.id, startTime, sourceDuration: durationPending ? null : sourceDuration, duration: sourceDuration, durationPending, fx: defaultFx() };
  if (!durationPending && track.type === 'audio') clip.duration = sourceDuration / clipPlaybackRate(combineTrackEventFx(track, clip));
  track.clips.push(clip);
  if (entry.type === 'video' && track.type === 'video') {
    const audioTrack = tracks.find((item) => item.type === 'audio') || addTrack('audio', true);
    audioTrack.clips.push({ id: crypto.randomUUID(), mediaId: entry.id, startTime, sourceDuration: clip.sourceDuration, duration: clip.duration, durationPending, linkedAudio: true, fx: defaultFx() });
  }
  renderTracks(); updateProjectLength(); transportStatus.textContent = `${entry.file.name} added to ${track.name}`;
}
function addTrack(type, skipHistory = false) {
  if (type === 'video' && isAudioEdition) return null;
  if (!skipHistory) recordUndo();
  const number = tracks.filter((track) => track.type === type).length + 1;
  const track = { id: `${type}-${trackCounter++}`, type, name: `${type === 'audio' ? 'Audio' : 'Video'} Track ${number}`, height: 112, clips: [], muted: false, solo: false, fx: defaultFx() };
  tracks.push(track);
  renderTracks();
  return track;
}
function updateClipHeight(lane) {
  lane.querySelectorAll('.timeline-clip').forEach((clip) => { clip.style.height = 'calc(100% - 14px)'; });
}
function pixelsPerSecond() { return BASE_PIXELS_PER_SECOND * timelineZoom; }
function projectDuration() {
  return Math.max(0, ...tracks.flatMap((track) => track.clips.map((clip) => (Number(clip.startTime) || 0) + (Number(clip.duration) || 0))));
}
function formatRulerTime(seconds) {
  const totalMillis = Math.max(0, Math.round(seconds * 1000));
  const whole = Math.floor(totalMillis / 1000);
  const millis = totalMillis % 1000;
  const clock = `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
  return millis ? `${clock}.${String(millis).padStart(3, '0')}` : clock;
}
function rulerInterval(pps, duration) {
  if (gridSpacing) {
    const step = gridSpacingStep();
    const visualStep = step * Math.max(1, Math.ceil(80 / (step * pps)));
    const count = duration / visualStep;
    return count > 2000 ? visualStep * Math.ceil(count / 2000) : visualStep;
  }
  return [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 20, 30, 60, 120, 300].find((step) => step * pps >= 80 && duration / step <= 2000) || 600;
}
function gridSpacingStep() {
  const quarter = 60 / projectBpm;
  const intervals = {
    minutes: 60, seconds: 1, milliseconds: 0.001, frames: 1 / projectProperties.frameRate,
    measures: quarter * 4, quarter, 'quarter-triplet': quarter * 2 / 3,
    eighth: quarter / 2, 'eighth-triplet': quarter / 3,
    sixteenth: quarter / 4, 'sixteenth-triplet': quarter / 6,
    'thirty-second': quarter / 8, 'thirty-second-triplet': quarter / 12,
  };
  return intervals[gridSpacing] || 1;
}
function formatGridLabel(tick, seconds) {
  if (gridSpacing === 'minutes') return `${String(tick).padStart(2, '0')}m`;
  if (gridSpacing === 'frames') return `F${tick}`;
  if (['measures', 'quarter', 'quarter-triplet', 'eighth', 'eighth-triplet', 'sixteenth', 'sixteenth-triplet', 'thirty-second', 'thirty-second-triplet'].includes(gridSpacing)) {
    const ticksPerMeasure = Math.round((60 / projectBpm * 4) / gridSpacingStep());
    const measure = Math.floor(tick / ticksPerMeasure) + 1;
    const subdivision = tick % ticksPerMeasure;
    return gridSpacing === 'measures' ? `M${measure}` : `M${measure}.${subdivision + 1}`;
  }
  return formatRulerTime(seconds);
}
function updateTimelineScale() {
  const pps = pixelsPerSecond();
  const availableWidth = Math.max(650, timelineBody.clientWidth - trackLabels.offsetWidth);
  const duration = projectDuration();
  const visibleSeconds = availableWidth / pps;
  const timelineSeconds = Math.max(duration, visibleSeconds);
  const tickEvery = rulerInterval(pps, timelineSeconds);
  const contentWidth = Math.max(650, availableWidth, timelineSeconds * pps);
  const tickCount = Math.floor(timelineSeconds / tickEvery + 1e-8);
  const rulerEnd = tickCount * tickEvery;
  const scaleWidth = Math.max(contentWidth, rulerEnd * pps);
  trackCanvas.style.width = `${scaleWidth}px`;
  trackCanvas.style.minWidth = `${scaleWidth}px`;
  rulerScale.style.width = `${scaleWidth}px`;
  rulerScale.style.minWidth = `${scaleWidth}px`;
  rulerScale.style.transform = `translateX(-${timelineBody.scrollLeft}px)`;
  rulerScale.replaceChildren();
  for (let tick = 0; tick <= tickCount; tick++) {
    const second = Number((tick * tickEvery).toFixed(3));
    const mark = document.createElement('span');
    mark.textContent = formatGridLabel(Math.round(tick * tickEvery / gridSpacingStep()), second);
    mark.style.left = `${second * pps}px`;
    rulerScale.append(mark);
  }
  const majorPixels = tickEvery * pps;
  trackCanvas.style.backgroundImage = `repeating-linear-gradient(90deg, transparent 0 ${majorPixels - 1}px, rgba(109,111,115,.42) ${majorPixels - 1}px ${majorPixels}px)`;
  trackCanvas.querySelectorAll('.track-lane').forEach((lane) => {
    const gridStep = gridSpacingStep();
    const gridPixels = gridStep * Math.max(1, Math.ceil(8 / (gridStep * pps))) * pps;
    lane.style.backgroundImage = `repeating-linear-gradient(90deg, transparent 0 ${Math.max(1, gridPixels - 1)}px, rgba(90,92,96,.18) ${Math.max(1, gridPixels - 1)}px ${gridPixels}px)`;
    lane.querySelectorAll('.timeline-clip').forEach((clip) => {
      const clipWidth = Number(clip.dataset.durationSeconds) * pps;
      clip.style.left = `${(Number(clip.dataset.startTime) || 0) * pps}px`;
      clip.style.width = `${clipWidth}px`;
      clip.classList.toggle('compact', clipWidth < 95);
    });
  });
  updateTimeReadout(currentPlayer());
}
function renderTracks() {
  trackLabels.replaceChildren();
  [...trackCanvas.querySelectorAll('.track-lane')].forEach((lane) => lane.remove());
  tracks.forEach((track) => {
    const label = document.createElement('div');
    label.className = `track-label ${track.type}-track-label`;
    label.dataset.trackId = track.id;
    label.style.height = `${track.height}px`;
    const title = document.createElement('b');
    title.className = 'track-name';
    title.textContent = `${track.type === 'audio' ? '♫' : '▣'}　${track.name}`;
    title.title = 'Double-click to rename track';
    title.addEventListener('dblclick', (event) => {
      event.stopPropagation();
      const input = document.createElement('input');
      input.className = 'track-name-input';
      input.type = 'text';
      input.maxLength = 48;
      input.value = track.name;
      let finished = false;
      const finish = (save) => {
        if (finished) return;
        finished = true;
        const name = input.value.trim();
        if (save && name && name !== track.name) {
          recordUndo();
          track.name = name;
        }
        renderTracks();
      };
      input.addEventListener('keydown', (keyEvent) => {
        keyEvent.stopPropagation();
        if (keyEvent.key === 'Enter') { keyEvent.preventDefault(); finish(true); }
        if (keyEvent.key === 'Escape') { keyEvent.preventDefault(); finish(false); }
      });
      input.addEventListener('blur', () => finish(true));
      input.addEventListener('click', (clickEvent) => clickEvent.stopPropagation());
      input.addEventListener('contextmenu', (menuEvent) => menuEvent.stopPropagation());
      title.replaceWith(input);
      input.focus();
      input.select();
    });
    const controls = document.createElement('span');
    const mute = document.createElement('button'); mute.type = 'button'; mute.className = 'track-mute'; mute.title = 'Mute track'; mute.textContent = track.muted ? 'M̸' : 'M'; mute.classList.toggle('is-on', track.muted);
    const solo = document.createElement('button'); solo.type = 'button'; solo.className = 'track-solo'; solo.title = 'Solo track'; solo.textContent = track.solo ? 'S●' : 'S'; solo.classList.toggle('is-on', track.solo);
    controls.append(mute, solo);
    const resize = document.createElement('i'); resize.className = 'track-resize'; resize.title = 'Drag to resize track';
    label.append(title, controls, resize); trackLabels.append(label);
    const lane = document.createElement('div'); lane.className = `track-lane ${track.type}-lane`; lane.dataset.trackId = track.id; lane.style.height = `${track.height}px`;
    const emptyHint = document.createElement('span'); emptyHint.className = 'lane-hint'; emptyHint.textContent = track.type === 'audio' ? 'Drag audio media here' : 'Drag video or image media here';
    if (!track.clips.length) lane.append(emptyHint);
    track.clips.forEach((clipData) => {
      const entry = findMedia(clipData.mediaId);
      const clip = document.createElement('div'); clip.setAttribute('role', 'button'); clip.tabIndex = 0;
      clip.className = `timeline-clip ${track.type}-clip${selectedClipId === clipData.id || selectedClipIds.has(clipData.id) ? ' selected' : ''}`;
      clip.dataset.clipId = clipData.id; clip.dataset.trackId = track.id; clip.dataset.mediaId = clipData.mediaId;
      const duration = Number(clipData.duration) || 5;
      clip.dataset.durationSeconds = String(duration);
      clip.dataset.startTime = String(Number(clipData.startTime) || 0);
      clip.style.left = `${(Number(clipData.startTime) || 0) * pixelsPerSecond()}px`;
      clip.style.width = `${duration * pixelsPerSecond()}px`; clip.style.height = 'calc(100% - 14px)';
      clip.classList.toggle('compact', duration * pixelsPerSecond() < 95);
      if (clipData.showTakeInfo !== false) {
        const clipName = document.createElement('span'); clipName.className = 'clip-name'; clipName.textContent = entry?.file.name || 'Missing media';
        clip.append(clipName);
      }
      if (clipData.showEventLength !== false) {
        const clipDuration = document.createElement('small'); clipDuration.className = 'clip-duration'; clipDuration.textContent = `${duration.toFixed(2)} s`;
        clip.append(clipDuration);
      }
      if (track.type === 'audio') {
        const eventFx = document.createElement('button'); eventFx.type = 'button'; eventFx.className = 'event-fx-button'; eventFx.textContent = 'FX'; eventFx.title = 'Audio event FX'; eventFx.setAttribute('aria-label', 'Audio event FX');
        eventFx.addEventListener('click', (clickEvent) => {
          clickEvent.stopPropagation(); focusClipSelection(clipData.id); selectedTrackId = track.id;
          setMediaTab('Audio FX');
          const target = clipData.fx || (clipData.fx = defaultFx());
          if (activeRelease >= 3) {
            fxPanel.hidden = true;
            renderAudioFxBrowser();
          } else {
            openAudioFx(target, entry?.file.name || track.name);
          }
        });
        const eventOptions = document.createElement('button'); eventOptions.type = 'button'; eventOptions.className = 'event-options-button'; eventOptions.textContent = '☰'; eventOptions.title = 'Event display options'; eventOptions.setAttribute('aria-label', 'Event display options');
        eventOptions.addEventListener('click', (clickEvent) => {
          clickEvent.stopPropagation();
          focusClipSelection(clipData.id); selectedTrackId = track.id;
          showEventDisplayMenu(eventOptions.getBoundingClientRect(), clipData);
        });
        clip.append(eventFx, eventOptions);
      } else if (track.type === 'video') {
        if (!isAudioEdition && activeRelease >= 3 && (!entry || ['video', 'image'].includes(entry.type))) {
          const eventPanCrop = document.createElement('button');
          eventPanCrop.type = 'button';
          eventPanCrop.className = 'event-pancrop-button';
          eventPanCrop.textContent = 'P/C';
          eventPanCrop.title = 'Video Event Pan/Crop';
          eventPanCrop.setAttribute('aria-label', 'Video Event Pan/Crop');
          eventPanCrop.addEventListener('click', (clickEvent) => {
            clickEvent.stopPropagation();
            focusClipSelection(clipData.id); selectedTrackId = track.id;
            if (entry) {
              previewMedia(entry);
              focusClipSelection(clipData.id); selectedTrackId = track.id;
            }
            openPanCropPanel(track, clipData, entry);
            renderTracks();
          });
          clip.append(eventPanCrop);
        }
        const eventFx = document.createElement('button'); eventFx.type = 'button'; eventFx.className = 'event-fx-button video-event-fx-button'; eventFx.textContent = 'FX'; eventFx.title = 'Video Event FX'; eventFx.setAttribute('aria-label', 'Video Event FX');
        eventFx.addEventListener('click', (clickEvent) => {
          clickEvent.stopPropagation();
          focusClipSelection(clipData.id); selectedTrackId = track.id;
          setMediaTab('Video FX');
          openVideoEventFxPanel({ track, clip: clipData });
          renderTracks();
        });
        clip.append(eventFx);
      }
      clip.title = `${entry?.file.name || 'Missing media'} · ${duration.toFixed(2)} seconds`;
      clip.addEventListener('pointerdown', (event) => startClipDrag(event, track, clipData, clip));
      clip.addEventListener('click', (clickEvent) => {
        if (clickEvent.ctrlKey || clickEvent.metaKey) {
          if (selectedClipIds.has(clipData.id)) selectedClipIds.delete(clipData.id); else selectedClipIds.add(clipData.id);
          selectedClipId = selectedClipIds.has(clipData.id) ? clipData.id : [...selectedClipIds].at(-1) || null;
          selectedTrackId = track.id; renderTracks(); return;
        }
        selectedClipId = clipData.id; selectedClipIds = new Set([clipData.id]); selectedTrackId = track.id;
        if (entry) {
          timelineClockTime = clipStartTime({ track, clip: clipData });
          if (track.type === 'audio') { previewMedia(entry); applyFx(clipData.fx || track.fx); }
          else {
            syncTimelineVideoAt(timelineClockTime + Math.min(.001, (Number(clipData.duration)||1)/100));
            applyVideoFx(clipData.videoFx);
            if (!videoFxBrowser.hidden || !videoEventFxPanel.hidden) {
              openVideoEventFxPanel({ track, clip: clipData });
            }
          }
        }
        updateTimeReadout(null);
        renderTracks();
      });
      clip.addEventListener('contextmenu', (event) => {
        event.preventDefault(); focusClipSelection(clipData.id); selectedTrackId = track.id;
        if (!selectedClipIds.has(clipData.id)) selectedClipIds = new Set([clipData.id]);
        showContextMenu(event.clientX, event.clientY, [
          ...(selectedClipIds.size > 1 ? [['Group selected events', () => groupSelectedClips()]] : []),
          ...(clipData.groupId ? [['Ungroup events', () => ungroupClip(clipData)]] : []),
          ['Open / preview event', () => entry && previewMedia(entry)],
          ...(track.type === 'audio' ? [['Properties…', () => openEventProperties(clipData.fx || defaultFx(), entry?.file.name || track.name)]] : []),
          ['Duplicate event', () => duplicateClip(track, clipData)],
          ['Split event', () => splitClip(track, clipData)],
          ['Remove event', () => selectedClipIds.size > 1 && selectedClipIds.has(clipData.id) ? deleteSelectedClip() : removeClip(track, clipData)],
        ]);
      });
      if (track.type === 'video' && Array.isArray(clipData.keyframes)) {
        clipData.keyframes.forEach((keyframe, index) => {
          const marker = document.createElement('button'); marker.type = 'button'; marker.className = 'clip-keyframe'; marker.title = `Keyframe ${formatRulerTime(keyframe.time)} · ${keyframe.easing || 'Linear'}`; marker.setAttribute('aria-label', marker.title);
          marker.style.left = `${Math.max(1, Math.min(99, (Number(keyframe.time) / Math.max(.01, duration)) * 100))}%`;
          marker.addEventListener('pointerdown', e => e.stopPropagation()); marker.addEventListener('click', e => { e.stopPropagation(); focusClipSelection(clipData.id); selectedTrackId = track.id; selectedClipIds = new Set([clipData.id]); timelineClockTime = (Number(clipData.startTime) || 0) + Number(keyframe.time || 0); syncTimelineVideoAt(timelineClockTime); updateTimeReadout(null); renderTracks(); if (!videoFxBrowser.hidden || !videoEventFxPanel.hidden) renderVideoFxBrowser(); });
          marker.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); showContextMenu(e.clientX, e.clientY, ['Linear','Fast','Slow','Smooth','Sharp','Hold'].map(mode => [mode + (mode === (keyframe.easing || 'Linear') ? ' ✓' : ''), () => { recordUndo(); keyframe.easing = mode; renderTracks(); }] ).concat([['Delete keyframe', () => { recordUndo(); clipData.keyframes.splice(index,1); renderTracks(); }]])); });
          clip.append(marker);
        });
      }
      lane.append(clip);
    });
    if(track.type==='video'){
      const ordered=[...track.clips].sort((a,b)=>(Number(a.startTime)||0)-(Number(b.startTime)||0));
      for(let index=1;index<ordered.length;index++){
        const incoming=ordered[index],incomingStart=Number(incoming.startTime)||0,incomingEnd=incomingStart+(Number(incoming.duration)||0);
        const outgoing=ordered.slice(0,index).filter(item=>(Number(item.startTime)||0)+(Number(item.duration)||0)>incomingStart).sort((a,b)=>((Number(b.startTime)||0)+(Number(b.duration)||0))-((Number(a.startTime)||0)+(Number(a.duration)||0)))[0];
        if(!outgoing)continue;
        const overlapEnd=Math.min(incomingEnd,(Number(outgoing.startTime)||0)+(Number(outgoing.duration)||0)),overlap=overlapEnd-incomingStart;if(overlap<=.01)continue;
        const fade=document.createElement('button');fade.type='button';fade.className='timeline-fade-curve';fade.dataset.incomingClip=incoming.id;fade.title='Crossfade · click to select this fade and add a transition';fade.setAttribute('aria-label','Select crossfade overlap and add a transition');fade.textContent='↗ Fade';
        fade.style.left=(incomingStart*pixelsPerSecond())+'px';fade.style.width=Math.max(14,overlap*pixelsPerSecond())+'px';
        fade.addEventListener('pointerdown',event=>event.stopPropagation());
        fade.addEventListener('click',event=>{event.stopPropagation();const amount=overlap;const hadTransition=Boolean(incoming.transition);if(!hadTransition){recordUndo();incoming.transition={type:'crossfade',duration:amount};}selectedClipId=incoming.id;selectedClipIds=new Set([incoming.id]);selectedTrackId=track.id;setMediaTab('Transitions');timelineClockTime=incomingStart;syncTimelineVideoAt(timelineClockTime);renderTracks();updateTimeReadout(null);transportStatus.textContent='Crossfade selected · choose a transition';});
        lane.append(fade);
      }
    }
    trackCanvas.insertBefore(lane, playhead);
    if (track.muted) label.classList.add('muted');
    mute.addEventListener('click', () => { recordUndo(); selectedTrackId = track.id; track.muted = !track.muted; renderTracks(); applyFx(fxTarget || track.fx); });
    solo.addEventListener('click', () => { recordUndo(); selectedTrackId = track.id; track.solo = !track.solo; renderTracks(); applyFx(fxTarget || track.fx); });
    resize.addEventListener('pointerdown', (event) => startTrackResize(event, track));
  });
  trackCanvas.querySelectorAll('.track-lane').forEach((lane) => {
    lane.addEventListener('dragover', (event) => { event.preventDefault(); lane.classList.add('drop-target'); });
    lane.addEventListener('dragleave', () => lane.classList.remove('drop-target'));
    lane.addEventListener('drop', (event) => {
      event.preventDefault(); lane.classList.remove('drop-target');
      const entry = findMedia(event.dataTransfer.getData('application/x-fish-media'));
      if (entry) {
        const trackId = lane.dataset.trackId;
        addToTimeline(entry, trackId);
        const addedTrack = tracks.find((item) => item.id === trackId);
        const added = addedTrack?.clips.at(-1);
        if (added) {
          added.startTime = timelineTimeAtClientX(event.clientX);
          if (addedTrack.type === 'video') {
            const audioTrack = tracks.find((item) => item.type === 'audio');
            const linked = audioTrack?.clips.at(-1);
            if (linked?.linkedAudio && linked.mediaId === entry.id) linked.startTime = added.startTime;
          }
        }
        renderTracks(); updateProjectLength();
      }
    });
    lane.addEventListener('contextmenu', (event) => {
      if (event.target.closest('.timeline-clip')) return;
      event.preventDefault(); selectedTrackId = lane.dataset.trackId;
      const track = tracks.find((item) => item.id === selectedTrackId);
      showContextMenu(event.clientX, event.clientY, [
        ['Add audio track', () => addTrack('audio')],
        ...(!isAudioEdition ? [['Add video track', () => addTrack('video')]] : []),
        ...(track.type === 'audio' ? [['Audio track FX…', () => openAudioFx(track.fx, track.name)]] : []),
        ...(tracks.filter((item) => item.type === track.type).length > 1 ? [['Remove track', () => removeTrack(track)]] : []),
      ]);
    });
  });
  updateTimelineScale();
  renderAudioFxBrowser();
}
function startTrackResize(event, track) {
  event.preventDefault();
  recordUndo();
  const startY = event.clientY;
  const startHeight = track.height;
  const onMove = (moveEvent) => {
    const height = Math.max(52, Math.min(420, startHeight + moveEvent.clientY - startY));
    track.height = height;
    const label = trackLabels.querySelector(`[data-track-id="${CSS.escape(track.id)}"]`);
    const lane = trackCanvas.querySelector(`[data-track-id="${CSS.escape(track.id)}"]`);
    if (label) label.style.height = `${height}px`;
    if (lane) lane.style.height = `${height}px`;
  };
  const onUp = () => {
    document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp);
  };
  document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp, { once: true });
}
function startClipDrag(event, sourceTrack, clipData, element) {
  if (event.button !== 0 || event.target.closest('button')) return;
  const originX = event.clientX;
  const originalStart = Number(clipData.startTime) || 0;
  const selectedMembers = selectedClipIds.size > 1 && selectedClipIds.has(clipData.id)
    ? selectedClipEntries().map(({ track, clip }) => ({ track, clip, start: Number(clip.startTime) || 0 })) : null;
  const linkedAudio = sourceTrack.type === 'video' && !selectedMembers && !clipData.groupId
    ? tracks.flatMap((track) => track.type === 'audio' ? track.clips.filter((clip) => clip.linkedAudio && clip.mediaId === clipData.mediaId && Math.abs((Number(clip.startTime) || 0) - originalStart) < .002).map((clip) => ({ track, clip, start: Number(clip.startTime) || 0 })) : [])
    : [];
  const groupMembers = selectedMembers || (clipData.groupId ? tracks.flatMap((track) => track.clips.filter((clip) => clip.groupId === clipData.groupId).map((clip) => ({ track, clip, start: Number(clip.startTime) || 0 }))) : [{ track: sourceTrack, clip: clipData, start: originalStart }, ...linkedAudio]);
  let dragging = false;
  const onMove = (moveEvent) => {
    const dx = moveEvent.clientX - originX;
    if (!dragging && Math.abs(dx) < 4) return;
    if (!dragging) { dragging = true; recordUndo(); element.classList.add('is-dragging'); }
    moveEvent.preventDefault();
    const nextStart = Math.max(0, Math.round((originalStart + dx / pixelsPerSecond()) * 1000) / 1000);
    element.style.left = `${nextStart * pixelsPerSecond()}px`;
    element.dataset.dragStartTime = String(nextStart);
  };
  const onUp = (upEvent) => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    if (!dragging) return;
    const nextStart = Number(element.dataset.dragStartTime) || 0;
    const targetLane = document.elementFromPoint(upEvent.clientX, upEvent.clientY)?.closest('.track-lane');
    const targetTrack = targetLane && tracks.find((track) => track.id === targetLane.dataset.trackId);
    if (!selectedMembers && !clipData.groupId && targetTrack && targetTrack.type === sourceTrack.type && targetTrack !== sourceTrack) {
      sourceTrack.clips = sourceTrack.clips.filter((clip) => clip.id !== clipData.id);
      targetTrack.clips.push(clipData);
      selectedTrackId = targetTrack.id;
    }
    const delta = nextStart - originalStart;
    for (const member of groupMembers) member.clip.startTime = Math.max(0, member.start + delta);
    selectedClipId = clipData.id;
    element.classList.remove('is-dragging');
    delete element.dataset.dragStartTime;
    renderTracks(); updateProjectLength();
  };
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}
function groupSelectedClips() {
  const ids = selectedClipIds.size > 1 ? selectedClipIds : new Set([selectedClipId]);
  const members = tracks.flatMap((track) => track.clips.filter((clip) => ids.has(clip.id)));
  if (members.length < 2) { transportStatus.textContent = 'Select at least two events with Ctrl/⌘-click'; return; }
  recordUndo();
  const groupId = crypto.randomUUID();
  members.forEach((clip) => { clip.groupId = groupId; });
  transportStatus.textContent = members.length + ' events grouped';
  renderTracks();
}
function ungroupClip(target) {
  if (!target?.groupId) return;
  recordUndo();
  for (const track of tracks) for (const clip of track.clips) if (clip.groupId === target.groupId) delete clip.groupId;
  transportStatus.textContent = 'Events ungrouped';
  renderTracks();
}
function removeTrack(track) {
  if (!track || tracks.filter((item) => item.type === track.type).length <= 1) return;
  recordUndo(); tracks = tracks.filter((item) => item.id !== track.id); renderTracks(); updateProjectLength();
}
function removeClip(track, clip) {
  recordUndo(); track.clips = track.clips.filter((item) => item.id !== clip.id);
  selectedClipIds.delete(clip.id);
  if (selectedClipId === clip.id) selectedClipId = [...selectedClipIds].at(-1) || null;
  renderTracks(); updateProjectLength();
}
function duplicateClip(track, clip) {
  recordUndo(); track.clips.push({ ...clip, id: crypto.randomUUID(), startTime: (Number(clip.startTime) || 0) + (Number(clip.duration) || 0) }); renderTracks(); updateProjectLength();
}
function splitClip(track, clip) {
  if ((clip.duration || 0) < 0.2) { transportStatus.textContent = 'Event is too short to split'; return; }
  recordUndo();
  const index = track.clips.findIndex((item) => item.id === clip.id);
  const firstDuration = clip.duration / 2;
  track.clips.splice(index, 1, { ...clip, duration: firstDuration }, { ...clip, id: crypto.randomUUID(), startTime: (Number(clip.startTime) || 0) + firstDuration, duration: clip.duration - firstDuration });
  renderTracks(); updateProjectLength();
}
function updateProjectLength() {
  const seconds = projectDuration();
  document.querySelector('.project-length').textContent = `Project length: ${formatTime(seconds)}`;
  updateTimelineScale();
}
function snapshot() { return { tracks: clone(tracks), masterFx: clone(masterFx), trackCounter, mediaIds: media.map((entry) => entry.id), projectProperties: clone(projectProperties), projectBpm, gridSpacing, timeDisplayMode }; }
function recordUndo() { undoStack.push(snapshot()); if (undoStack.length > 50) undoStack.shift(); redoStack = []; updateUndoButtons(); }
function restore(state) {
  const wantedIds = new Set(state.mediaIds || []);
  for (const entry of [...media]) {
    if (wantedIds.has(entry.id)) continue;
    media.splice(media.indexOf(entry), 1);
    mediaArchive.set(entry.id, entry);
  }
  for (const id of wantedIds) {
    if (findMedia(id)) continue;
    const entry = mediaArchive.get(id);
    if (entry) { media.push(entry); mediaArchive.delete(id); }
  }
  mediaGrid.replaceChildren();
  media.forEach(renderMediaItem);
  renderMediaEmpty();
  fxTarget = null; selectedClipId = null; selectedClipIds = new Set();
  masterFx = normalizeFx(state.masterFx);
  tracks = clone(state.tracks); trackCounter = state.trackCounter;
  projectProperties = { ...defaultProjectProperties(), ...(state.projectProperties || {}) };
  projectBpm = Number(state.projectBpm) || projectBpm;
  gridSpacing = state.gridSpacing || gridSpacing;
  timeDisplayMode = state.timeDisplayMode || timeDisplayMode;
  gridTempoInput.value = String(projectBpm);
  updateProjectFormatLabels(); renderTracks(); updateProjectLength(); applyMasterFxSettings(masterFx);
}
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); updateUndoButtons(); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); updateUndoButtons(); }
function updateUndoButtons() {
  document.querySelector('[data-action="undo"]').disabled = !undoStack.length;
  document.querySelector('[data-action="redo"]').disabled = !redoStack.length;
}

function formatTime(seconds) {
  const wholeSeconds = Math.max(0, Math.floor(seconds || 0));
  const frames = Math.floor(((seconds || 0) % 1) * projectProperties.frameRate);
  return `${String(Math.floor(wholeSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((wholeSeconds % 3600) / 60)).padStart(2, '0')}:${String(wholeSeconds % 60).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}
function formatTimeMilliseconds(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  const whole = Math.floor(value);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  const millis = Math.floor((value - whole) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}
function formatFrameTime(seconds) {
  const frameRate = Math.round(projectProperties.frameRate);
  const totalFrames = Math.floor(Math.max(0, Number(seconds) || 0) * projectProperties.frameRate);
  const totalSeconds = Math.floor(totalFrames / frameRate);
  const frames = totalFrames % frameRate;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')};${String(frames).padStart(2, '0')}`;
}
function formatTimeDisplay(seconds) {
  if (timeDisplayMode === 'seconds') return Math.max(0, Number(seconds) || 0).toFixed(3);
  if (isAudioEdition) return formatTimeMilliseconds(seconds);
  if (timeDisplayMode === 'frames') return String(Math.floor(Math.max(0, Number(seconds) || 0) * projectProperties.frameRate));
  if (timeDisplayMode === 'time-and-frames' && !isAudioEdition) return formatFrameTime(seconds);
  return formatTimeMilliseconds(seconds);
}
function updateTimeReadout(player) {
  const current = eventClockMode || !player ? timelineClockTime : (player.currentTime || 0);
  timeReadout.textContent = formatTimeDisplay(current); previewFrame.textContent = String(Math.floor(current * projectProperties.frameRate));
  const active = selectedClip();
  const start = active ? clipStartTime(active) : 0;
  playhead.style.left = `${(eventClockMode || !player ? current : start + current) * pixelsPerSecond()}px`;
}
function timelineTimeAtClientX(clientX) {
  const bounds = timelineBody.getBoundingClientRect();
  const x = timelineBody.scrollLeft + clientX - bounds.left - trackLabels.offsetWidth;
  return Math.max(0, x / pixelsPerSecond());
}
function scrubTimeline(clientX) {
  if (timelineClockPlaying || currentPlayer() && !currentPlayer().paused) pausePlayback();
  timelineClockTime = timelineTimeAtClientX(clientX);
  const player = currentPlayer();
  const selection = selectedClip();
  eventClockMode = Boolean(player && selection);
  if (player) {
    let localTime = timelineClockTime;
    if (selection) {
      const start = clipStartTime(selection);
      localTime = Math.max(0, timelineClockTime - start);
      if (selection.track.type === 'audio') localTime *= clipPlaybackRate(selection.clip.fx || defaultFx());
    }
    const maxTime = Number.isFinite(player.duration) ? Math.max(0, player.duration - 0.001) : localTime;
    try { player.currentTime = Math.min(localTime, maxTime); } catch { /* Metadata may still be loading. */ }
  }
  syncTimelineVideoAt(timelineClockTime);
  updateTimeReadout(null);
}
function beginTimelineScrub(event) {
  if (event.button !== 0 || event.target.closest('button, input, select')) return;
  event.preventDefault();
  scrubbingTimeline = true;
  playheadGrabOffset = event.target.closest('#playhead') ? 6 : 0;
  scrubTimeline(event.clientX - playheadGrabOffset);
}
const previewQualityControl=document.querySelector('#preview-quality');
const previewZoomControl=document.querySelector('#preview-zoom');
previewQualityControl.addEventListener('change',()=>{previewStage.dataset.quality=previewQualityControl.value.toLowerCase();});
previewZoomControl.addEventListener('change',()=>{const percent=Number(previewZoomControl.value.replace('%',''));previewStage.dataset.zoom=String(percent);for(const mediaElement of [previewVideo,previewImage]){mediaElement.style.width=percent+'%';mediaElement.style.height=percent+'%';mediaElement.style.maxWidth='none';mediaElement.style.maxHeight='none';}});
previewStage.dataset.zoom='100';
document.querySelector('.timeline-ruler').addEventListener('pointerdown', beginTimelineScrub);
playhead.addEventListener('pointerdown', beginTimelineScrub);
document.addEventListener('pointermove', (event) => { if (scrubbingTimeline) scrubTimeline(event.clientX - playheadGrabOffset); });
document.addEventListener('pointerup', () => { scrubbingTimeline = false; });
function currentPlayer() { return !previewVideo.hidden ? previewVideo : previewAudio.src ? previewAudio : null; }
function createWaveHammerStage(context, input, output) {
  const splitter = context.createChannelSplitter(2);
  const merger = context.createChannelMerger(2);
  const noiseGates = [context.createDynamicsCompressor(), context.createDynamicsCompressor()];
  const compressors = [context.createDynamicsCompressor(), context.createDynamicsCompressor()];
  const limiters = [context.createWaveShaper(), context.createWaveShaper()];
  const processed = [context.createGain(), context.createGain()];
  const bypasses = [context.createGain(), context.createGain()];
  input.connect(splitter);
  for (let channel = 0; channel < 2; channel++) {
    splitter.connect(noiseGates[channel], channel);
    noiseGates[channel].connect(compressors[channel]);
    compressors[channel].connect(limiters[channel]);
    limiters[channel].connect(processed[channel]);
    processed[channel].connect(merger, 0, channel);
    splitter.connect(bypasses[channel], channel);
    bypasses[channel].connect(merger, 0, channel);
  }
  merger.connect(output);
  return { noiseGates, compressors, limiters, processed, bypasses };
}
function applyWaveHammerStage(stage, fx) {
  if (!stage) return;
  const settings = fx.waveHammerSettings || defaultFx().waveHammerSettings;
  const active = (fx.effects?.includes('waveHammer') || Number(fx.waveHammer) > 0) && settings.apply !== false;
  const limit = Math.max(-24, Math.min(12, Number(settings.dbLimit ?? -12)));
  const strength = Math.max(0, Math.min(1, Number(settings.strength ?? 0.5)));
  for (const [index, side] of ['left', 'right'].entries()) {
    const compress = active && settings[side] !== false;
    const node = stage.compressors[index];
    const gate = stage.noiseGates[index];
    gate.threshold.value = -80 + strength * 50;
    gate.ratio.value = 1 + strength * 39;
    gate.knee.value = 0;
    gate.attack.value = 0.003;
    gate.release.value = 0.04 + strength * 0.16;
    node.threshold.value = limit;
    node.ratio.value = 20;
    node.knee.value = 0;
    node.attack.value = 0.001;
    node.release.value = 0.12;
    const ceiling = 10 ** (limit / 20);
    const curve = new Float32Array(Math.round(2048 + strength * 8192));
    const kneeStart = ceiling * 0.82;
    const kneeWidth = ceiling - kneeStart;
    for (let i = 0; i < curve.length; i++) {
      const sample = i * 2 / (curve.length - 1) - 1;
      const magnitude = Math.abs(sample);
      let limited = magnitude;
      if (magnitude > kneeStart) {
        const kneePosition = Math.min(1, (magnitude - kneeStart) / kneeWidth);
        const smoothKnee = kneePosition + kneePosition ** 2 - kneePosition ** 3;
        limited = kneeStart + kneeWidth * smoothKnee;
      }
      curve[i] = Math.sign(sample) * Math.min(ceiling, limited);
    }
    stage.limiters[index].curve = curve;
    stage.limiters[index].oversample = strength > 0.7 ? '4x' : strength > 0.3 ? '2x' : 'none';
    stage.processed[index].gain.value = compress ? 1 : 0;
    stage.bypasses[index].gain.value = compress ? 0 : 1;
  }
}
function isEffectActive(fx, key) {
  if (fx.effects?.includes(key)) return true;
  const baseline = defaultFx()[key];
  return key !== 'waveHammer' && baseline !== undefined && Number(fx[key]) !== Number(baseline);
}
function applyMasterFxSettings(fx = masterFx) {
  if (!audioGraph) return;
  const graph = audioGraph.masterFx;
  const active = (key) => isEffectActive(fx, key);
  audioGraph.master.gain.value = active('volume') ? Math.max(0, Number(fx.volume ?? 100) / 100) : 1;
  graph.bass.gain.value = active('bass') ? Number(fx.bass || 0) : 0;
  graph.treble.gain.value = active('treble') ? Number(fx.treble || 0) : 0;
  graph.dry.gain.value = 1;
  graph.panner.pan.value = active('pan') ? Math.max(-1, Math.min(1, Number(fx.pan || 0) / 100)) : 0;
  graph.reverb.gain.value = active('reverb') ? Number(fx.reverb || 0) / 100 * 0.55 : 0;
  graph.delayWet.gain.value = active('delay') ? Number(fx.delay || 0) / 100 * 0.45 : 0;
  graph.feedback.gain.value = active('delay') ? Math.min(0.6, Number(fx.delay || 0) / 100 * 0.55) : 0;
  const vibrato = active('vibrato') ? Number(fx.vibrato || 0) : 0;
  const chorus = active('chorus') ? Number(fx.chorus || 0) : 0;
  const flange = active('flange') ? Number(fx.flange || 0) : 0;
  const modulation = Math.max(vibrato, chorus, flange) / 100;
  graph.modulationWet.gain.value = modulation * 0.65;
  graph.modulationDelay.delayTime.value = flange >= chorus && flange >= vibrato ? 0.004 : vibrato >= chorus ? 0.006 : 0.018;
  graph.modulationDepth.gain.value = modulation * (flange >= chorus && flange >= vibrato ? 0.002 : vibrato >= chorus ? 0.004 : 0.007);
  graph.modulationLfo.frequency.value = flange >= chorus && flange >= vibrato ? 0.35 : vibrato >= chorus ? 6 : 0.8;
  const smooth = active('smooth') ? Number(fx.smooth || 0) : 0;
  graph.compressor.ratio.value = Math.max(1, smooth / 100 * 3);
  graph.compressor.threshold.value = -24;
  graph.compressor.knee.value = smooth ? 18 : 24;
  const amount = active('distortion') ? Number(fx.distortion || 0) : 0;
  if (!amount) graph.distortion.curve = null;
  else {
    const curve = new Float32Array(44100), scale = 1 + amount * 0.08;
    for (let i = 0; i < curve.length; i++) { const x = i * 2 / (curve.length - 1) - 1; curve[i] = Math.tanh(x * scale) / Math.tanh(scale); }
    graph.distortion.curve = curve;
  }
  applyWaveHammerStage(audioGraph.masterWaveHammer, fx);
}
function ensureTimelineFxGraph(state) {
  if (state.fxGraph || !audioGraph) return;
  const context = getAudioContext();
  const source = context.createMediaElementSource(state.player);
  const bass = context.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 180;
  const treble = context.createBiquadFilter(); treble.type = 'highshelf'; treble.frequency.value = 4200;
  const distortion = context.createWaveShaper(); distortion.oversample = '4x';
  const compressor = context.createDynamicsCompressor();
  const dry = context.createGain();
  const panner = context.createStereoPanner();
  const convolver = context.createConvolver(); convolver.buffer = audioGraph.convolver.buffer;
  const reverb = context.createGain();
  const delay = context.createDelay(1.2); delay.delayTime.value = 0.24;
  const delayWet = context.createGain();
  const feedback = context.createGain(); feedback.gain.value = 0.2;
  const modulationDelay = context.createDelay(0.08);
  const modulationWet = context.createGain();
  const modulationLfo = context.createOscillator();
  const modulationDepth = context.createGain();
  const pitchShifter = makePitchShifterNode(context);
  if (pitchShifter) { source.connect(pitchShifter); pitchShifter.connect(bass); }
  else source.connect(bass);
  bass.connect(treble); treble.connect(distortion); distortion.connect(compressor);
  const fxOutput = context.createGain();
  compressor.connect(dry); compressor.connect(convolver); compressor.connect(delay); compressor.connect(modulationDelay);
  dry.connect(panner); panner.connect(fxOutput);
  convolver.connect(reverb); reverb.connect(fxOutput);
  delay.connect(delayWet); delayWet.connect(fxOutput); delay.connect(feedback); feedback.connect(delay);
  modulationDelay.connect(modulationWet); modulationWet.connect(fxOutput);
  modulationLfo.connect(modulationDepth); modulationDepth.connect(modulationDelay.delayTime); modulationLfo.start();
  const waveHammer = createWaveHammerStage(context, fxOutput, audioGraph.master);
  state.fxGraph = { bass, treble, distortion, compressor, dry, panner, convolver, reverb, delay, delayWet, feedback, modulationDelay, modulationWet, modulationLfo, modulationDepth, waveHammer, pitchShifter };
  state.fxSignature = '';
}
function applyTimelineFxGraph(state, fx, audible) {
  ensureTimelineFxGraph(state);
  const graph = state.fxGraph;
  if (!graph) return;
  const signature = `${JSON.stringify(fx)}|${audible}`;
  if (state.fxSignature === signature) return;
  state.fxSignature = signature;
  graph.bass.gain.value = isEffectActive(fx, 'bass') ? Number(fx.bass || 0) : 0;
  if (graph.pitchShifter) graph.pitchShifter.parameters.get('semitones').value = activeRelease >= 2 ? pitchShiftSemitones(fx) : 0;
  graph.treble.gain.value = isEffectActive(fx, 'treble') ? Number(fx.treble || 0) : 0;
  graph.dry.gain.value = audible ? (isEffectActive(fx, 'volume') ? Number(fx.volume ?? 100) / 100 : 1) : 0;
  graph.panner.pan.value = isEffectActive(fx, 'pan') ? Math.max(-1, Math.min(1, Number(fx.pan || 0) / 100)) : 0;
  graph.reverb.gain.value = isEffectActive(fx, 'reverb') ? Number(fx.reverb || 0) / 100 * 0.55 * Number(audible) : 0;
  graph.delayWet.gain.value = isEffectActive(fx, 'delay') ? Number(fx.delay || 0) / 100 * 0.45 * Number(audible) : 0;
  graph.feedback.gain.value = isEffectActive(fx, 'delay') ? Math.min(0.6, Number(fx.delay || 0) / 100 * 0.55) : 0;
  const vibrato = isEffectActive(fx, 'vibrato') ? Number(fx.vibrato || 0) : 0;
  const chorus = isEffectActive(fx, 'chorus') ? Number(fx.chorus || 0) : 0;
  const flange = isEffectActive(fx, 'flange') ? Number(fx.flange || 0) : 0;
  const modulation = Math.max(vibrato, chorus, flange) / 100;
  graph.modulationWet.gain.value = modulation * 0.65 * Number(audible);
  graph.modulationDelay.delayTime.value = flange >= chorus && flange >= vibrato ? 0.004 : vibrato >= chorus ? 0.006 : 0.018;
  graph.modulationDepth.gain.value = modulation * (flange >= chorus && flange >= vibrato ? 0.002 : vibrato >= chorus ? 0.004 : 0.007);
  graph.modulationLfo.frequency.value = flange >= chorus && flange >= vibrato ? 0.35 : vibrato >= chorus ? 6 : 0.8;
  graph.compressor.ratio.value = Math.max(1, (isEffectActive(fx, 'smooth') ? Number(fx.smooth || 0) : 0) / 100 * 3);
  graph.compressor.threshold.value = -24;
  graph.compressor.knee.value = isEffectActive(fx, 'smooth') ? 18 : 24;
  applyWaveHammerStage(graph.waveHammer, fx);
  applyMasterFxSettings(masterFx);
  const amount = isEffectActive(fx, 'distortion') ? Number(fx.distortion || 0) : 0;
  if (!amount) graph.distortion.curve = null;
  else {
    const curve = new Float32Array(44100), scale = 1 + amount * 0.08;
    for (let i = 0; i < curve.length; i++) { const x = i * 2 / (curve.length - 1) - 1; curve[i] = Math.tanh(x * scale) / Math.tanh(scale); }
    graph.distortion.curve = curve;
  }
}
function combineTrackEventFx(track, clip) {
  const trackFx = { ...defaultFx(), ...(track.fx || {}) };
  const eventFx = { ...defaultFx(), ...(clip.fx || {}) };
  const fx = { ...trackFx, ...eventFx };
  fx.effects = [...new Set([...(trackFx.effects || []), ...(eventFx.effects || [])])];
  fx.waveHammerSettings = eventFx.effects?.includes('waveHammer') ? eventFx.waveHammerSettings : trackFx.waveHammerSettings;
  const trackVolume = isEffectActive(trackFx, 'volume') ? Number(trackFx.volume ?? 100) : 100;
  const eventVolume = isEffectActive(eventFx, 'volume') ? Number(eventFx.volume ?? 100) : 100;
  fx.volume = trackVolume * eventVolume / 100;
  for (const key of ['bass', 'treble', 'reverb', 'delay', 'vibrato', 'distortion', 'chorus', 'flange', 'pan', 'smooth', 'waveHammer']) {
    fx[key] = key === 'pan'
      ? Math.max(-100, Math.min(100, Number(trackFx[key] || 0) + Number(eventFx[key] || 0)))
      : key === 'bass' || key === 'treble'
        ? Math.max(-12, Math.min(12, Number(trackFx[key] || 0) + Number(eventFx[key] || 0)))
        : Math.min(100, Number(trackFx[key] || 0) + Number(eventFx[key] || 0));
  }
  fx.speed = Number(trackFx.speed ?? 100) * Number(eventFx.speed ?? 100) / 100;
  fx.pitch = Number(trackFx.pitch || 0) + Number(eventFx.pitch || 0);
  fx.pitchCents = Number(trackFx.pitchCents || 0) + Number(eventFx.pitchCents || 0);
  fx.method = eventFx.method === 'elastique' || trackFx.method === 'elastique' ? 'elastique' : 'classic';
  return fx;
}
function getTimelineTrackPlayer(trackId) {
  let state = timelineAudioPlayers.get(trackId);
  if (!state) {
    const player = new Audio();
    player.preload = 'auto';
    state = { player, clipId: null, fxGraph: null, fxSignature: '' };
    timelineAudioPlayers.set(trackId, state);
  }
  return state;
}
function pauseTimelineAudioPlayers() {
  for (const { player } of timelineAudioPlayers.values()) player.pause();
}
function syncTimelineAudioAt(time) {
  const audioTracks = tracks.filter((track) => track.type === 'audio');
  const anySolo = audioTracks.some((track) => track.solo);
  for (const state of timelineAudioPlayers.values()) {
    if (!audioTracks.some((track) => track.id === state.trackId)) state.player.pause();
  }
  for (const track of audioTracks) {
    let cursor = 0;
    let active = null;
    for (const clip of track.clips) {
      const duration = Number(clip.duration) || 0;
      const startTime = Number.isFinite(Number(clip.startTime)) ? Number(clip.startTime) : cursor;
      if (time >= startTime && time < startTime + duration) { active = { clip, offset: time - startTime }; break; }
      cursor = startTime + duration;
    }
    const state = getTimelineTrackPlayer(track.id);
    state.trackId = track.id;
    if (!active) {
      if (state.clipId) { state.player.pause(); state.clipId = null; }
      continue;
    }
    const entry = findMedia(active.clip.mediaId);
    if (!entry || (entry.type !== 'audio' && !(active.clip.linkedAudio && entry.type === 'video'))) {
      state.player.pause(); state.clipId = null; continue;
    }
    const fx = combineTrackEventFx(track, active.clip);
    const rate = clipPlaybackRate(fx);
    const audible = !track.muted && (!anySolo || track.solo);
    applyTimelineFxGraph(state, fx, audible);
    state.player.volume = 1;
    state.player.playbackRate = rate;
    setPitchPreservation(state.player, activeRelease >= 2 || (activeRelease >= 9 && fx.method === 'elastique'));
    if (state.clipId !== active.clip.id) {
      state.player.pause();
      state.clipId = active.clip.id;
      if (state.player.currentSrc !== entry.url && state.player.src !== entry.url) { state.player.src = entry.url; state.player.load(); }
      const startAtOffset = () => {
        if (!timelineAudioPlayback || !timelineClockPlaying || state.clipId !== active.clip.id) return;
        const eventStart = Number.isFinite(Number(active.clip.startTime)) ? Number(active.clip.startTime) : track.clips.slice(0, track.clips.indexOf(active.clip)).reduce((total, clip) => total + (Number(clip.duration) || 0), 0);
        const liveOffset = Math.max(0, timelineClockTime - eventStart);
        state.player.currentTime = Math.max(0, liveOffset * rate);
        state.player.play().catch(() => { transportStatus.textContent = 'Unable to play timeline audio'; });
      };
      if (state.player.readyState >= 1) startAtOffset();
      else state.player.addEventListener('loadedmetadata', startAtOffset, { once: true });
    } else if (timelineAudioPlayback && timelineClockPlaying && state.player.paused) {
      state.player.currentTime = Math.max(0, active.offset * rate);
      state.player.play().catch(() => { transportStatus.textContent = 'Unable to play timeline audio'; });
    }
  }
}
function videoOverlapDuration(clip) {
  if(!clip)return 0;const start=Number(clip.startTime)||0,end=start+(Number(clip.duration)||0);
  const track=tracks.find(item=>item.type==='video'&&item.clips.includes(clip));if(!track)return 0;
  let overlap=0;for(const other of track.clips){if(other===clip)continue;const otherStart=Number(other.startTime)||0,otherEnd=otherStart+(Number(other.duration)||0);if(otherStart<start&&otherEnd>start)overlap=Math.max(overlap,Math.min(end,otherEnd)-start);}
  return Math.max(0,overlap);
}
function transitionVisual(clip, localTime) {
  const transition=clip?.transition,overlap=videoOverlapDuration(clip),type=transition?.type||(overlap?'crossfade':undefined),duration=overlap||Math.max(.05,Number(transition?.duration)||.6),clipDuration=Math.max(0,Number(clip?.duration)||0);
  let p=Math.max(0,Math.min(1,(Number(localTime)||0)/duration));if(type==='fadeOut')p=Math.max(0,Math.min(1,(clipDuration-(Number(localTime)||0))/duration));
  const ease=1-Math.pow(1-p,2),state={alpha:['fadeIn','crossfade','wipe','fadeOut'].includes(type)?p:1,wipe:type==='wipe'?p:1,scaleX:1,scaleY:1,offsetX:0,transform:'',origin:'50% 50%'};
  if(type==='slideLeft'){state.offsetX=1-ease;state.transform='translateX('+(100*(1-ease))+'%)';}if(type==='slideRight'){state.offsetX=-(1-ease);state.transform='translateX('+(-100*(1-ease))+'%)';}
  if(type==='zoomIn'){state.scaleX=state.scaleY=.55+.45*ease;state.transform='scale('+(.55+.45*ease)+')';}if(type==='spin'){state.scaleX=state.scaleY=.65+.35*ease;state.transform='rotate('+(360*(1-ease))+'deg) scale('+(.65+.35*ease)+')';}
  if(type==='flip3d'){state.scaleX=.08+.92*Math.abs(Math.cos((1-ease)*Math.PI/2));state.transform='rotateY('+(-90*(1-ease))+'deg) scaleX('+state.scaleX+')';}if(type==='cube3d'){state.scaleX=.18+.82*Math.abs(Math.cos((1-ease)*Math.PI/2));state.offsetX=.08*(1-ease);state.transform='rotateY('+(-90*(1-ease))+'deg) scaleX('+state.scaleX+')';}
  if(type==='pageTurn3d'){state.scaleX=.22+.78*Math.abs(Math.cos((1-ease)*Math.PI/2));state.origin='left center';state.transform='rotateY('+(-78*(1-ease))+'deg) scaleX('+state.scaleX+')';}if(type==='carousel3d'){state.scaleX=.45+.55*Math.abs(Math.cos((1-ease)*Math.PI));state.transform='rotateY('+(-180*(1-ease))+'deg) scaleX('+state.scaleX+')';}
  if(type==='spin3d'){state.scaleX=state.scaleY=.55+.45*ease;state.transform='rotateY('+(-360*(1-ease))+'deg) scale('+(.55+.45*ease)+')';}return state;
}
function syncTimelineVideoAt(time) {
  let active = null;
  for (const track of tracks) {
    if (track.type !== 'video') continue;
    for (const clip of track.clips) {
      const start = Number(clip.startTime) || 0;
      const duration = Number(clip.duration) || 0;
      if (time >= start && time < start + duration && (!active || start >= active.start)) active = { track, clip, start };
    }
  }
  if (!active) {
    previewVideo.pause(); previewVideo.hidden = true; previewImage.hidden = true; audioPreview.hidden = true;
    previewEmpty.hidden = false; previewEmptyLabel.textContent = 'No media at playhead';
    timelineVideoClipId = null; stopVideoFxCanvas(); refreshSapphireWatermark(null);
    return;
  }
  const entry = findMedia(active.clip.mediaId);
  if (!entry) return;
  previewVideo.style.opacity='1'; previewImage.style.opacity='1'; previewVideo.style.clipPath=''; previewImage.style.clipPath='';
  previewEmpty.hidden = true;
  const localTime = Math.max(0, time - active.start);
  if (entry.type === 'image') {
    previewVideo.pause(); previewVideo.hidden = true; previewImage.hidden = false;
    previewImage.src = entry.url; timelineVideoClipId = active.clip.id;
    applyVideoFx(interpolateVideoFx(active.clip,localTime));
    const visual=transitionVisual(active.clip,localTime);previewImage.style.opacity=String(visual.alpha);previewImage.style.transform=visual.transform;previewImage.style.transformOrigin=visual.origin;previewStage.style.perspective='900px';previewImage.style.clipPath=visual.wipe<1?'inset(0 '+((1-visual.wipe)*100)+'% 0 0)':'';
    return;
  }
  previewImage.hidden = true; previewVideo.hidden = false; audioPreview.hidden = true;
  // The audio lane is the sole source of timeline event audio.
  previewVideo.muted = true;
  const changedClip = timelineVideoClipId !== active.clip.id || previewVideo.src !== entry.url;
  if (changedClip) {
    videoFxHasLastGoodFrame = false;
    timelineVideoClipId = active.clip.id;
    previewVideo.src = entry.url;
    previewVideo.load();
    previewVideo.addEventListener('loadedmetadata', () => {
      if (timelineVideoClipId !== active.clip.id) return;
      try { previewVideo.currentTime = Math.min(localTime, Math.max(0, previewVideo.duration - 0.001)); } catch { /* Metadata may still be loading. */ }
      if (timelineAudioPlayback && timelineClockPlaying) previewVideo.play().catch(() => {});
      else previewVideo.pause();
    }, { once: true });
  } else {
    if (Number.isFinite(previewVideo.duration) && Math.abs(previewVideo.currentTime - localTime) > 0.12) {
      try { previewVideo.currentTime = Math.min(localTime, Math.max(0, previewVideo.duration - 0.001)); } catch { /* Ignore seeks during media transitions. */ }
    }
    if (timelineClockPlaying && previewVideo.paused) previewVideo.play().catch(() => {});
  }
  const local=Math.max(0,time-active.start);
  const fx=interpolateVideoFx(active.clip,local);
  applyVideoFx(fx);
  const visual=transitionVisual(active.clip,local);previewVideo.style.opacity=String(visual.alpha);previewImage.style.opacity=String(visual.alpha);previewStage.style.perspective='900px';
  previewVideo.style.transform=visual.transform;previewImage.style.transform=visual.transform;previewVideo.style.transformOrigin=visual.origin;previewImage.style.transformOrigin=visual.origin;
  previewVideo.style.clipPath=visual.wipe<1?'inset(0 '+((1-visual.wipe)*100)+'% 0 0)':'';previewImage.style.clipPath=visual.wipe<1?'inset(0 '+((1-visual.wipe)*100)+'% 0 0)':'';
}
async function startTimelineAudioPlayback() {
  timelineAudioPlayback = true;
  eventClockMode = false;
  previewAudio.pause(); previewVideo.pause();
  const hasAudioSources = tracks.some((track) => track.type === 'audio' && track.clips.some((clip) => {
    const entry = findMedia(clip.mediaId); return entry?.type === 'audio' || (clip.linkedAudio && entry?.type === 'video');
  }));
  if (hasAudioSources) {
    try { await connectAudioGraph(); }
    catch { timelineAudioPlayback = false; transportStatus.textContent = 'Unable to start timeline audio'; return; }
  }
  startTimelineClock();
  syncTimelineAudioAt(timelineClockTime);
  syncTimelineVideoAt(timelineClockTime);
  startMasterMeter();
}
function clipStartTime(selection) {
  if (Number.isFinite(Number(selection.clip.startTime))) return Number(selection.clip.startTime);
  let start = 0;
  for (const clip of selection.track.clips) {
    if (clip.id === selection.clip.id) break;
    start += Number(clip.duration) || 0;
  }
  return start;
}
function startEventTimelineClock(player) {
  const selection = selectedClip();
  if (!selection) return false;
  eventClockMode = true;
  syncEventClockToPlayer(player);
  startTimelineClock();
  return true;
}
function syncEventClockToPlayer(player) {
  const selection = selectedClip();
  if (!selection || !player) return;
  const rate = Math.max(0.01, Number(player.playbackRate) || 1);
  timelineClockTime = clipStartTime(selection) + (player.currentTime || 0) / rate;
}
function updateTimelineClock(now) {
  if (!timelineClockPlaying) { timelineClockFrame = 0; return; }
  if (timelineAudioPlayback) {
    timelineClockTime = Math.max(0, (now - timelineClockStartedAt) / 1000);
    syncTimelineAudioAt(timelineClockTime);
    syncTimelineVideoAt(timelineClockTime);
    const duration = projectDuration();
    if (duration > 0 && timelineClockTime >= duration) {
      timelineClockTime = duration;
      timelineClockPlaying = false;
      timelineAudioPlayback = false;
      timelineClockFrame = 0;
      pauseTimelineAudioPlayers(); previewVideo.pause();
      playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play');
      transportStatus.textContent = 'Stopped';
      updateTimeReadout(null);
      return;
    }
    updateTimeReadout(null);
    timelineClockFrame = requestAnimationFrame(updateTimelineClock);
    return;
  }
  const player = currentPlayer();
  if (eventClockMode && selectedClip() && player && !player.paused) {
    timelineClockTime = Math.max(0, (now - timelineClockStartedAt) / 1000);
    updateTimeReadout(null);
    timelineClockFrame = requestAnimationFrame(updateTimelineClock);
    return;
  }
  timelineClockTime = Math.max(0, (now - timelineClockStartedAt) / 1000);
  const duration = projectDuration();
  if (duration > 0 && timelineClockTime >= duration) {
    timelineClockTime = duration;
    timelineClockPlaying = false;
    timelineClockFrame = 0;
    playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play');
    transportStatus.textContent = 'Stopped';
    updateTimeReadout(null);
    return;
  }
  updateTimeReadout(null);
  timelineClockFrame = requestAnimationFrame(updateTimelineClock);
}
function startTimelineClock() {
  timelineClockPlaying = true;
  timelineClockStartedAt = performance.now() - timelineClockTime * 1000;
  playButton.textContent = 'Ⅱ'; playButton.title = 'Pause'; playButton.setAttribute('aria-label', 'Pause');
  transportStatus.textContent = 'Playing';
  if (!timelineClockFrame) timelineClockFrame = requestAnimationFrame(updateTimelineClock);
}
function stopTimelineClock(reset = false) {
  if (timelineClockPlaying) timelineClockTime = Math.max(0, (performance.now() - timelineClockStartedAt) / 1000);
  timelineClockPlaying = false;
  if (timelineClockFrame) cancelAnimationFrame(timelineClockFrame);
  timelineClockFrame = 0;
  if (reset) { timelineClockTime = 0; eventClockMode = false; }
}
function setStoppedState() {
  stopTimelineClock(false);
  playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play');
  transportStatus.textContent = 'Stopped';
}
function stopPlayback(reset = true) {
  stopTimelineClock(reset);
  timelineAudioPlayback = false; timelineVideoClipId = null;
  pauseTimelineAudioPlayers();
  previewAudio.pause(); previewVideo.pause(); previewVideo.muted = false;
  if (reset) {
    if (previewAudio.src) previewAudio.currentTime = 0;
    if (previewVideo.src) previewVideo.currentTime = 0;
  }
  setStoppedState();
  updateTimeReadout(currentPlayer());
}
function pausePlayback() {
  if (timelineAudioPlayback) {
    stopTimelineClock(false);
    pauseTimelineAudioPlayers(); previewVideo.pause();
    updateTimeReadout(null);
    playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play');
    transportStatus.textContent = 'Paused';
    return;
  }
  const player = currentPlayer();
  if (!player) {
    if (timelineClockPlaying) {
      stopTimelineClock(false);
      updateTimeReadout(null);
      playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play');
      transportStatus.textContent = 'Paused';
    }
    return;
  }
  player.pause(); playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play'); transportStatus.textContent = 'Paused';
}
function moveFrame(delta) {
  if (timelineAudioPlayback) {
    pausePlayback();
    timelineClockTime = Math.max(0, timelineClockTime + delta / projectProperties.frameRate);
    syncTimelineAudioAt(timelineClockTime);
    syncTimelineVideoAt(timelineClockTime);
    transportStatus.textContent = 'Stopped'; updateTimeReadout(null); return;
  }
  const player = currentPlayer();
  if (!player) {
    stopTimelineClock(false);
    timelineClockTime = Math.max(0, timelineClockTime + delta / projectProperties.frameRate);
    playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play');
    transportStatus.textContent = 'Stopped'; updateTimeReadout(null); return;
  }
  player.pause(); player.currentTime = Math.max(0, (player.currentTime || 0) + delta / projectProperties.frameRate);
  if (eventClockMode) syncEventClockToPlayer(player);
  playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play'); transportStatus.textContent = 'Stopped'; updateTimeReadout(eventClockMode ? null : player);
}
previewVideo.addEventListener('timeupdate', () => { if (!timelineAudioPlayback) updateTimeReadout(previewVideo); });
previewAudio.addEventListener('timeupdate', () => { if (!timelineAudioPlayback) updateTimeReadout(previewAudio); });
for (const player of [previewVideo, previewAudio]) {
  player.addEventListener('ended', () => {
    if (timelineAudioPlayback) return;
    if (eventClockMode) syncEventClockToPlayer(player);
    setStoppedState();
    updateTimeReadout(null);
  });
  player.addEventListener('pause', () => {
    if (!timelineAudioPlayback && eventClockMode && timelineClockPlaying) {
      stopTimelineClock(false);
      syncEventClockToPlayer(player);
      updateTimeReadout(null);
    }
    if (timelineAudioPlayback && timelineClockPlaying) { playButton.textContent = 'Ⅱ'; playButton.title = 'Pause'; playButton.setAttribute('aria-label', 'Pause'); }
    else { playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play'); }
  });
  player.addEventListener('play', () => {
    playButton.textContent = 'Ⅱ'; playButton.title = 'Pause'; playButton.setAttribute('aria-label', 'Pause'); transportStatus.textContent = 'Playing';
    if (player === previewVideo && selectedVideoClip()) applyVideoFx(selectedVideoClip().clip.videoFx);
    if (!timelineAudioPlayback) startEventTimelineClock(player);
    startMasterMeter();
  });
}
playButton.addEventListener('click', async () => {
  const hasTimelineMedia = tracks.some((track) => track.clips.some((clip) => ['audio', 'video', 'image'].includes(findMedia(clip.mediaId)?.type)));
  if (hasTimelineMedia) {
    if (timelineAudioPlayback && timelineClockPlaying) { pausePlayback(); return; }
    if (timelineClockTime >= projectDuration()) timelineClockTime = 0;
    if (!timelineAudioPlayback) {
      const selection = selectedClip();
      if (selection?.track.type === 'audio') {
        const fx = selection.clip.fx || defaultFx();
        timelineClockTime = clipStartTime(selection) + (previewAudio.currentTime || 0) / Math.max(0.01, clipPlaybackRate(fx));
      }
    }
    startTimelineAudioPlayback();
    return;
  }
  const player = currentPlayer();
  if (!player) {
    if (timelineClockPlaying) pausePlayback();
    else startTimelineClock();
    return;
  }
  if (player.paused) {
    try { await connectAudioGraph(); await player.play(); }
    catch { transportStatus.textContent = 'Unable to play this media'; }
  } else pausePlayback();
});
document.querySelector('#go-start').addEventListener('click', () => {
  if (timelineAudioPlayback) {
    pausePlayback(); timelineClockTime = 0; syncTimelineAudioAt(0); syncTimelineVideoAt(0); updateTimeReadout(null);
    transportStatus.textContent = 'Stopped'; playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play'); return;
  }
  const player = currentPlayer();
  if (player) { player.pause(); player.currentTime = 0; if (eventClockMode) syncEventClockToPlayer(player); updateTimeReadout(eventClockMode ? null : player); }
  else { stopTimelineClock(true); updateTimeReadout(null); }
  transportStatus.textContent = 'Stopped'; playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play');
});
document.querySelector('#go-end').addEventListener('click', () => {
  if (timelineAudioPlayback) {
    pausePlayback(); timelineClockTime = projectDuration(); syncTimelineAudioAt(timelineClockTime); syncTimelineVideoAt(timelineClockTime); updateTimeReadout(null);
    transportStatus.textContent = 'Stopped'; playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play'); return;
  }
  const player = currentPlayer();
  if (player?.duration) { player.pause(); player.currentTime = Math.max(0, player.duration - 0.04); if (eventClockMode) syncEventClockToPlayer(player); updateTimeReadout(eventClockMode ? null : player); }
  else if (!player && projectDuration() > 0) { stopTimelineClock(false); timelineClockTime = projectDuration(); updateTimeReadout(null); }
  transportStatus.textContent = 'Stopped'; playButton.textContent = '▶'; playButton.title = 'Play'; playButton.setAttribute('aria-label', 'Play');
});
document.querySelector('#previous-frame').addEventListener('click', () => moveFrame(-1));
document.querySelector('#next-frame').addEventListener('click', () => moveFrame(1));

function getAudioContext() {
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
}
async function preparePitchShifter(context) {
  if (!context.audioWorklet || typeof AudioWorkletNode === 'undefined') return false;
  try {
    if (!pitchShifterModulePromise) pitchShifterModulePromise = context.audioWorklet.addModule('./pitch-shifter.js');
    await pitchShifterModulePromise;
    pitchShifterReady = true;
  } catch {
    pitchShifterReady = false;
  }
  return pitchShifterReady;
}
function makePitchShifterNode(context) {
  if (!pitchShifterReady) return null;
  const node = new AudioWorkletNode(context, 'fish-pitch-shifter', {
    numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'max',
  });
  return node;
}
async function connectAudioGraph() {
  const context = getAudioContext();
  if (context.state === 'suspended') await context.resume();
  if (!audioGraph) {
    await preparePitchShifter(context);
    const audioSource = context.createMediaElementSource(previewAudio);
    const videoSource = context.createMediaElementSource(previewVideo);
    const pitchShifter = makePitchShifterNode(context);
    const bass = context.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 180;
    const treble = context.createBiquadFilter(); treble.type = 'highshelf'; treble.frequency.value = 4200;
    const distortion = context.createWaveShaper(); distortion.oversample = '4x';
    const compressor = context.createDynamicsCompressor();
    const dry = context.createGain();
    const panner = context.createStereoPanner();
    const convolver = context.createConvolver(); convolver.buffer = makeRoomImpulse(context, 1.4, 2.2);
    const reverb = context.createGain();
    const delay = context.createDelay(1.2); delay.delayTime.value = 0.24;
    const feedback = context.createGain(); feedback.gain.value = 0.2;
    const delayWet = context.createGain();
    const modulationDelay = context.createDelay(0.08); modulationDelay.delayTime.value = 0.012;
    const modulationWet = context.createGain();
    const modulationLfo = context.createOscillator(); modulationLfo.frequency.value = 0.8;
    const modulationDepth = context.createGain(); modulationDepth.gain.value = 0.004;
    const master = context.createGain();
    const masterBass = context.createBiquadFilter(); masterBass.type = 'lowshelf'; masterBass.frequency.value = 180;
    const masterTreble = context.createBiquadFilter(); masterTreble.type = 'highshelf'; masterTreble.frequency.value = 4200;
    const masterDistortion = context.createWaveShaper(); masterDistortion.oversample = '4x';
    const masterCompressor = context.createDynamicsCompressor();
    const masterDry = context.createGain();
    const masterPanner = context.createStereoPanner();
    const masterConvolver = context.createConvolver(); masterConvolver.buffer = makeRoomImpulse(context, 1.4, 2.2);
    const masterReverb = context.createGain();
    const masterDelay = context.createDelay(1.2); masterDelay.delayTime.value = 0.24;
    const masterDelayWet = context.createGain();
    const masterFeedback = context.createGain(); masterFeedback.gain.value = 0.2;
    const masterModulationDelay = context.createDelay(0.08);
    const masterModulationWet = context.createGain();
    const masterModulationLfo = context.createOscillator(); masterModulationLfo.frequency.value = 0.8;
    const masterModulationDepth = context.createGain(); masterModulationDepth.gain.value = 0.004;
    const masterFxBus = context.createGain();
    const analyser = context.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.72;
    if (pitchShifter) { audioSource.connect(pitchShifter); pitchShifter.connect(bass); }
    else audioSource.connect(bass);
    bass.connect(treble); treble.connect(distortion); distortion.connect(compressor);
    const sourceFxOutput = context.createGain();
    compressor.connect(dry); compressor.connect(convolver); compressor.connect(delay); compressor.connect(modulationDelay);
    dry.connect(panner); panner.connect(sourceFxOutput);
    convolver.connect(reverb); reverb.connect(sourceFxOutput);
    delay.connect(delayWet); delayWet.connect(sourceFxOutput);
    delay.connect(feedback); feedback.connect(delay);
    modulationDelay.connect(modulationWet); modulationWet.connect(sourceFxOutput);
    modulationLfo.connect(modulationDepth); modulationDepth.connect(modulationDelay.delayTime); modulationLfo.start();
    const waveHammer = createWaveHammerStage(context, sourceFxOutput, master);
    videoSource.connect(master);
    master.connect(masterBass); masterBass.connect(masterTreble); masterTreble.connect(masterDistortion); masterDistortion.connect(masterCompressor);
    masterCompressor.connect(masterDry); masterDry.connect(masterPanner); masterPanner.connect(masterFxBus);
    masterCompressor.connect(masterConvolver); masterConvolver.connect(masterReverb); masterReverb.connect(masterFxBus);
    masterCompressor.connect(masterDelay); masterDelay.connect(masterDelayWet); masterDelayWet.connect(masterFxBus);
    masterDelay.connect(masterFeedback); masterFeedback.connect(masterDelay);
    masterCompressor.connect(masterModulationDelay); masterModulationDelay.connect(masterModulationWet); masterModulationWet.connect(masterFxBus);
    masterModulationLfo.connect(masterModulationDepth); masterModulationDepth.connect(masterModulationDelay.delayTime); masterModulationLfo.start();
    const masterWaveHammer = createWaveHammerStage(context, masterFxBus, analyser);
    analyser.connect(context.destination);
    audioGraph = { bass, treble, distortion, compressor, dry, panner, convolver, reverb, delay, feedback, delayWet, modulationDelay, modulationWet, modulationLfo, modulationDepth, master, analyser, waveHammer, masterWaveHammer, pitchShifter, masterFx: { bass: masterBass, treble: masterTreble, distortion: masterDistortion, compressor: masterCompressor, dry: masterDry, panner: masterPanner, convolver: masterConvolver, reverb: masterReverb, delay: masterDelay, delayWet: masterDelayWet, feedback: masterFeedback, modulationDelay: masterModulationDelay, modulationWet: masterModulationWet, modulationLfo: masterModulationLfo, modulationDepth: masterModulationDepth } };
  }
  applyFx(fxTarget || getCurrentFx());
  applyWaveHammerStage(audioGraph.masterWaveHammer, masterFx);
}
function updateMasterMeter() {
  if (!audioGraph?.analyser) { meterFrame = 0; return; }
  const samples = new Float32Array(audioGraph.analyser.fftSize);
  audioGraph.analyser.getFloatTimeDomainData(samples);
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  const rms = Math.sqrt(sum / samples.length);
  const target = rms > 0.0001 ? Math.max(0, Math.min(100, (20 * Math.log10(rms) + 48) / 48 * 100)) : 0;
  meterLevels = meterLevels.map((level) => target >= level ? target : Math.max(target, level - 3.5));
  document.querySelectorAll('.meter i').forEach((bar, index) => { bar.style.height = `${meterLevels[index] ?? target}%`; });
  const player = currentPlayer();
  if ((player && !player.paused) || meterLevels.some((level) => level > 0.5)) meterFrame = requestAnimationFrame(updateMasterMeter);
  else meterFrame = 0;
}
function startMasterMeter() {
  if (meterFrame) return;
  meterFrame = requestAnimationFrame(updateMasterMeter);
}
function makeRoomImpulse(context, seconds, decay) {
  const length = context.sampleRate * seconds;
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return buffer;
}
function getCurrentFx() {
  const activeClip = selectedClip();
  if (activeClip?.track.type === 'audio') return activeClip.clip.fx || activeClip.track.fx;
  const entry = findMedia(selectedMediaId);
  if (entry?.type === 'audio') return entry.fx;
  return tracks.find((track) => track.id === selectedTrackId && track.type === 'audio')?.fx || defaultFx();
}
function applyFx(fx) {
  if (!fx) return;
  fxTarget = fx;
  if (fx === masterFx) {
    applyMasterFxSettings(fx);
    renderFxManager();
    return;
  }
  const pitchPreservingStretch = activeRelease >= 2 || (activeRelease >= 9 && fx.method === 'elastique');
  setPitchPreservation(previewAudio, pitchPreservingStretch);
  previewAudio.playbackRate = clipPlaybackRate(fx);
  const playbackRateLabel = document.querySelector('#playback-rate');
  playbackRateLabel.textContent = previewAudio.playbackRate.toFixed(2);
  if (audioGraph) {
    if (audioGraph.pitchShifter) audioGraph.pitchShifter.parameters.get('semitones').value = isAudioEdition && activeRelease >= 2 ? pitchShiftSemitones(fx) : 0;
    const activeTrack = tracks.find((track) => track.id === selectedTrackId && track.type === 'audio');
    const anotherSolo = tracks.some((track) => track.type === 'audio' && track.solo && track.id !== activeTrack?.id);
    const trackGain = activeTrack?.muted || anotherSolo ? 0 : 1;
    audioGraph.bass.gain.value = isEffectActive(fx, 'bass') ? Number(fx.bass || 0) : 0;
    audioGraph.treble.gain.value = isEffectActive(fx, 'treble') ? Number(fx.treble || 0) : 0;
    audioGraph.dry.gain.value = (isEffectActive(fx, 'volume') ? Number(fx.volume ?? 100) / 100 : 1) * trackGain;
    audioGraph.panner.pan.value = isEffectActive(fx, 'pan') ? Math.max(-1, Math.min(1, Number(fx.pan || 0) / 100)) : 0;
    audioGraph.reverb.gain.value = isEffectActive(fx, 'reverb') ? Number(fx.reverb || 0) / 100 * 0.55 * trackGain : 0;
    audioGraph.delayWet.gain.value = isEffectActive(fx, 'delay') ? Number(fx.delay || 0) / 100 * 0.45 * trackGain : 0;
    audioGraph.feedback.gain.value = isEffectActive(fx, 'delay') ? Math.min(0.6, Number(fx.delay || 0) / 100 * 0.55) : 0;
    const vibrato = isEffectActive(fx, 'vibrato') ? Number(fx.vibrato || 0) : 0;
    const chorus = isEffectActive(fx, 'chorus') ? Number(fx.chorus || 0) : 0;
    const flange = isEffectActive(fx, 'flange') ? Number(fx.flange || 0) : 0;
    const modulation = Math.max(vibrato, chorus, flange) / 100;
    audioGraph.modulationWet.gain.value = modulation * 0.65 * trackGain;
    audioGraph.modulationDelay.delayTime.value = flange >= chorus && flange >= vibrato ? 0.004 : vibrato >= chorus ? 0.006 : 0.018;
    audioGraph.modulationDepth.gain.value = modulation * (flange >= chorus && flange >= vibrato ? 0.002 : vibrato >= chorus ? 0.004 : 0.007);
    audioGraph.modulationLfo.frequency.value = flange >= chorus && flange >= vibrato ? 0.35 : vibrato >= chorus ? 6 : 0.8;
    const smooth = isEffectActive(fx, 'smooth') ? Number(fx.smooth || 0) : 0;
    audioGraph.compressor.ratio.value = Math.max(1, smooth / 100 * 3);
    audioGraph.compressor.threshold.value = -24;
    audioGraph.compressor.knee.value = smooth ? 18 : 24;
    applyWaveHammerStage(audioGraph.waveHammer, fx);
    applyMasterFxSettings(masterFx);
    const distortionAmount = isEffectActive(fx, 'distortion') ? Math.max(0, Number(fx.distortion || 0)) : 0;
    if (distortionAmount) {
      const curve = new Float32Array(44100);
      const amount = 1 + distortionAmount * 0.08;
      for (let i = 0; i < curve.length; i++) { const x = i * 2 / (curve.length - 1) - 1; curve[i] = Math.tanh(x * amount) / Math.tanh(amount); }
      audioGraph.distortion.curve = curve;
    } else audioGraph.distortion.curve = null;
  }
  renderFxValues(fx);
}
const fxControlMap = { 'speed-amount': 'speed', 'pitch-amount': 'pitch', 'pitch-cents': 'pitchCents' };
function renderFxValues(fx) {
  const speedInput = document.querySelector('#speed-amount');
  speedInput.value = fx.speed ?? defaultFx().speed;
  const speed = Number(fx.speed ?? 100) / 100;
  const semitones = speedPitchSemitones(fx.speed ?? 100);
  const signedSpeedSemitones = `${semitones > 0 ? '+' : ''}${semitones.toFixed(1)}`;
  document.querySelector('#speed-value').textContent = isAudioEdition && activeRelease >= 2
    ? `${speed.toFixed(2)}×`
    : `${speed.toFixed(2)}× · ${signedSpeedSemitones} st`;
  const pitch = Number(fx.pitch ?? 0);
  const cents = Number(fx.pitchCents ?? 0);
  document.querySelector('#pitch-amount').value = String(pitch);
  document.querySelector('#pitch-cents').value = String(cents);
  document.querySelector('#pitch-value').textContent = `${pitch > 0 ? '+' : ''}${pitch} st`;
  document.querySelector('#pitch-cents-value').textContent = `${cents > 0 ? '+' : ''}${cents} ¢`;
  const isFirstAudioRelease = isAudioEdition && activeRelease <= 1;
  const hasIndependentAudioControls = isAudioEdition && activeRelease >= 2;
  const hasElastique = activeRelease >= 9;
  const method = document.querySelector('#pitch-method');
  const elastiqueOption = method.querySelector('option[value="elastique"]');
  elastiqueOption.hidden = !hasElastique;
  const visibleMethod = hasElastique ? (fx.method || 'classic') : 'classic';
  method.value = visibleMethod;
  const showAttributes = hasElastique && fx.method === 'elastique';
  const showSpeed = isFirstAudioRelease || hasIndependentAudioControls || (!isAudioEdition && activeRelease === 2);
  document.querySelector('#speed-control-wrap').hidden = !showSpeed;
  speedInput.hidden = !showSpeed;
  document.querySelector('#pitch-method-label').hidden = isFirstAudioRelease;
  method.hidden = isFirstAudioRelease;
  document.querySelector('#stretch-label').hidden = !showAttributes;
  document.querySelector('#stretch-attributes').hidden = !showAttributes;
  document.querySelector('#stretch-attributes').value = fx.attributes || 'Pro';
  document.querySelector('#pitch-amount-label').hidden = isFirstAudioRelease;
  document.querySelector('#pitch-pair').hidden = isFirstAudioRelease;
  const classicNote = document.querySelector('#classic-note');
  classicNote.hidden = false;
  classicNote.textContent = isFirstAudioRelease
    ? 'Speed ranges from 0.25× to 4×; pitch follows automatically (0.5× = −12 semitones, 2× = +12).'
    : hasIndependentAudioControls || (!isAudioEdition && activeRelease >= 2)
      ? 'Speed changes duration independently. Semitones and cents shift pitch without changing speed.'
      : visibleMethod === 'classic' ? 'Classic changes playback speed and pitch together.' : 'élastique can preserve pitch while stretching an event.';
}
function openAudioFx(target = null, name = '') {
  fxTarget = target || selectedClip()?.clip.fx || findMedia(selectedMediaId)?.fx || defaultFx();
  Object.assign(fxTarget, normalizeFx(fxTarget));
  const isMaster = fxTarget === masterFx;
  fxPanelTitle.textContent = isMaster ? 'Master FX' : 'Audio Event FX';
  document.querySelector('#audio-fx-target').textContent = isMaster ? 'Effects applied to the entire audio output.' : `${name || findMedia(selectedMediaId)?.file.name || 'Audio'} · built-in effects`;
  renderFxManager();
  propertiesPanel.hidden = true;
  videoEventFxPanel.hidden = true;
  panCropPanel.hidden = true;
  fxPanel.hidden = false;
}
function openMasterFx() { openAudioFx(masterFx, 'Master'); }
function enablePanelDragging(panel, handle) {
  let drag = null;
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button')) return;
    const rect = panel.getBoundingClientRect();
    panel.style.transform = 'none';
    panel.style.left = `${rect.left}px`; panel.style.top = `${rect.top}px`;
    drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  handle.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const rect = panel.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - rect.width - 8, drag.left + event.clientX - drag.x));
    const top = Math.max(8, Math.min(window.innerHeight - rect.height - 8, drag.top + event.clientY - drag.y));
    panel.style.left = `${left}px`; panel.style.top = `${top}px`;
  });
  const finish = () => { drag = null; };
  handle.addEventListener('pointerup', finish);
  handle.addEventListener('pointercancel', finish);
}
enablePanelDragging(fxPanel, document.querySelector('#audio-fx-drag-handle'));
enablePanelDragging(videoEventFxPanel, videoEventFxDragHandle);
enablePanelDragging(panCropPanel, document.querySelector('#pan-crop-drag-handle'));
enablePanelDragging(propertiesPanel, document.querySelector('#event-properties-drag-handle'));
function openEventProperties(target, name = '') {
  fxTarget = target;
  document.querySelector('#fx-target').textContent = activeRelease <= 1 ? (name || 'Audio event') : `${name || 'Audio event'} · time stretch and pitch shift`;
  renderFxValues(fxTarget);
  fxPanel.hidden = true;
  videoEventFxPanel.hidden = true;
  panCropPanel.hidden = true;
  propertiesPanel.hidden = false;
}
document.querySelector('#close-audio-fx').addEventListener('click', () => { fxPanel.hidden = true; });
document.querySelector('#close-video-event-fx').addEventListener('click', () => { videoEventFxPanel.hidden = true; });
document.querySelector('#close-pan-crop').addEventListener('click', () => { panCropPanel.hidden = true; });
document.querySelector('#close-event-properties').addEventListener('click', () => { propertiesPanel.hidden = true; });
document.querySelector('#master-fx-button').addEventListener('click', openMasterFx);
for (const [input, key] of [[panCropZoom, 'panZoom'], [panCropX, 'panX'], [panCropY, 'panY']]) {
  input.addEventListener('pointerdown', () => { if (panCropFxTarget) recordUndo(); }, { passive: true });
  input.addEventListener('keydown', (event) => {
    if (panCropFxTarget && ['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) recordUndo();
  });
  input.addEventListener('input', () => {
    if (!panCropFxTarget) return;
    panCropFxTarget[key] = Number(input.value);
    updatePanCropReadouts();
    applyVideoFx(panCropFxTarget);
  });
}
const panCropRotation = document.querySelector('#pan-crop-rotation');
panCropRotation.addEventListener('pointerdown',()=>{if(panCropFxTarget)recordUndo();},{passive:true});
panCropRotation.addEventListener('input',()=>{ if(!panCropFxTarget)return; panCropFxTarget.panRotation=Number(panCropRotation.value); document.querySelector('#pan-crop-rotation-value').textContent=`${panCropRotation.value}°`; applyVideoFx(panCropFxTarget); });
previewStage.addEventListener('contextmenu',(event)=>{ if(panCropPanel.hidden||!panCropFxTarget)return; event.preventDefault(); showContextMenu(event.clientX,event.clientY,[['Restore / Reset',()=>{recordUndo(); Object.assign(panCropFxTarget,{panX:0,panY:0,panZoom:100,panRotation:0,panFlipX:1,panFlipY:1}); panCropZoom.value='100'; panCropX.value='0'; panCropY.value='0'; panCropRotation.value='0'; document.querySelector('#pan-crop-rotation-value').textContent='0°'; updatePanCropReadouts(); applyVideoFx(panCropFxTarget); }],['Flip horizontal',()=>{recordUndo(); panCropFxTarget.panFlipX *= -1; applyVideoFx(panCropFxTarget); }],['Flip vertical',()=>{recordUndo(); panCropFxTarget.panFlipY *= -1; applyVideoFx(panCropFxTarget); }]]); });
const panCropZoomNumber = document.querySelector('#pan-crop-zoom-number');
function setPanCropZoom(value) {
  const zoom = Math.max(25, Math.min(400, Number(value) || 25));
  panCropZoom.value = String(zoom);
  panCropZoom.dispatchEvent(new Event('input', { bubbles: true }));
}
panCropZoomNumber.addEventListener('change', () => setPanCropZoom(panCropZoomNumber.value));
document.querySelector('#pan-crop-zoom-in').addEventListener('click', () => setPanCropZoom(Number(panCropZoom.value) + 10));
document.querySelector('#pan-crop-zoom-out').addEventListener('click', () => setPanCropZoom(Number(panCropZoom.value) - 10));
const panCropBox = document.querySelector('#pan-crop-box');
let panCropBoxDrag = null;
panCropBox.addEventListener('pointerdown', (event) => {
  if (!panCropFxTarget) return;
  const resizing = event.target.matches('i');
  panCropBoxDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, panX: Number(panCropFxTarget.panX) || 0, panY: Number(panCropFxTarget.panY) || 0, zoom: Number(panCropFxTarget.panZoom) || 100, resizing };
  panCropBox.setPointerCapture(event.pointerId);
  recordUndo(); event.preventDefault();
});
panCropBox.addEventListener('pointermove', (event) => {
  const drag = panCropBoxDrag;
  if (!drag || drag.id !== event.pointerId || !panCropFxTarget) return;
  const frame = document.querySelector('.pan-crop-safe-frame').getBoundingClientRect();
  if (drag.resizing) setPanCropZoom(drag.zoom + (event.clientX - drag.x) * 2);
  else {
    panCropX.value = String(Math.max(-100, Math.min(100, drag.panX + (event.clientX - drag.x) / frame.width * 100)));
    panCropY.value = String(Math.max(-100, Math.min(100, drag.panY + (event.clientY - drag.y) / frame.height * 100)));
    panCropX.dispatchEvent(new Event('input', { bubbles: true }));
    panCropY.dispatchEvent(new Event('input', { bubbles: true }));
  }
});
const endPanCropBoxDrag = (event) => { if (panCropBoxDrag?.id === event.pointerId) panCropBoxDrag = null; };
panCropBox.addEventListener('pointerup', endPanCropBoxDrag);
panCropBox.addEventListener('pointercancel', endPanCropBoxDrag);
let panCropPointerDrag = null;
previewStage.addEventListener('pointerdown', (event) => {
  if (panCropPanel.hidden || !panCropFxTarget || (previewVideo.hidden && previewImage.hidden)) return;
  recordUndo();
  panCropPointerDrag = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    panX: Number(panCropFxTarget.panX) || 0,
    panY: Number(panCropFxTarget.panY) || 0,
  };
  previewStage.setPointerCapture(event.pointerId);
  event.preventDefault();
});
previewStage.addEventListener('pointermove', (event) => {
  if (!panCropPointerDrag || panCropPointerDrag.pointerId !== event.pointerId || !panCropFxTarget) return;
  const element = !previewVideo.hidden ? previewVideo : previewImage;
  panCropFxTarget.panX = Math.max(-100, Math.min(100, panCropPointerDrag.panX + (event.clientX - panCropPointerDrag.x) / previewStage.clientWidth * 200));
  panCropFxTarget.panY = Math.max(-100, Math.min(100, panCropPointerDrag.panY + (event.clientY - panCropPointerDrag.y) / previewStage.clientHeight * 200));
  panCropX.value = String(Math.round(panCropFxTarget.panX));
  panCropY.value = String(Math.round(panCropFxTarget.panY));
  updatePanCropReadouts();
  applyVideoFx(panCropFxTarget);
});
const finishPanCropPointerDrag = (event) => {
  if (panCropPointerDrag?.pointerId === event.pointerId) panCropPointerDrag = null;
};
previewStage.addEventListener('pointerup', finishPanCropPointerDrag);
previewStage.addEventListener('pointercancel', finishPanCropPointerDrag);
for (const input of Object.keys(fxControlMap).map((id) => document.getElementById(id))) {
  input.addEventListener('input', () => {
    const key = fxControlMap[input.id];
    if (input.value === '' || input.value === '-') return;
    const min = Number(input.min), max = Number(input.max);
    const value = Math.max(min, Math.min(max, Number(input.value) || 0));
    input.value = String(value);
    setSelectedAudioFxField(key, value, fxTarget);
    if (key === 'speed') {
      const targetTrack = tracks.find((track) => track.fx === fxTarget);
      if (targetTrack) syncTrackClipDurations(targetTrack);
      else syncSelectedClipDuration(fxTarget);
    }
    renderFxValues(fxTarget);
    applyFx(fxTarget);
  });
  input.addEventListener('change', () => {
    if (input.value === '' || input.value === '-') { input.value = '0'; input.dispatchEvent(new Event('input', { bubbles: true })); }
  });
}
document.querySelector('#pitch-method').addEventListener('change', (event) => {
  setSelectedAudioFxField('method', event.target.value, fxTarget);
  const targetTrack = tracks.find((track) => track.fx === fxTarget);
  if (targetTrack) syncTrackClipDurations(targetTrack); else { for (const { track } of selectedAudioClips()) syncTrackClipDurations(track); syncSelectedClipDuration(fxTarget); }
  renderFxValues(fxTarget); applyFx(fxTarget);
});
document.querySelector('#stretch-attributes').addEventListener('change', (event) => { setSelectedAudioFxField('attributes', event.target.value, fxTarget); });

function showContextMenu(x, y, actions) {
  contextMenu.replaceChildren();
  actions.forEach(([label, run]) => {
    const button = document.createElement('button'); button.type = 'button'; button.role = 'menuitem'; button.textContent = label;
    button.addEventListener('click', () => { hideContextMenu(); run(); }); contextMenu.append(button);
  });
  if (!actions.length) return;
  contextMenu.hidden = false;
  const bounds = contextMenu.getBoundingClientRect();
  contextMenu.style.left = `${Math.min(x, window.innerWidth - bounds.width - 8)}px`;
  contextMenu.style.top = `${Math.min(y, window.innerHeight - bounds.height - 8)}px`;
}
function showEventDisplayMenu(anchor, clip) {
  contextMenu.replaceChildren();
  const options = [
    ['showTakeInfo', 'Active take information'],
    ['showEventLength', 'Event length'],
  ];
  options.forEach(([key, label]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.role = 'menuitemcheckbox';
    button.setAttribute('aria-checked', String(clip[key] !== false));
    button.textContent = label;
    button.addEventListener('click', () => {
      clip[key] = clip[key] === false;
      hideContextMenu();
      renderTracks();
    });
    contextMenu.append(button);
  });
  contextMenu.hidden = false;
  const bounds = contextMenu.getBoundingClientRect();
  contextMenu.style.left = `${Math.min(anchor.left, window.innerWidth - bounds.width - 8)}px`;
  contextMenu.style.top = `${Math.min(anchor.bottom, window.innerHeight - bounds.height - 8)}px`;
}
function hideContextMenu() { contextMenu.hidden = true; }
function setTimeDisplayMode(mode) {
  timeDisplayMode = isAudioEdition && mode !== 'seconds' ? 'time' : mode;
  updateTimeReadout(currentPlayer());
}
editor.addEventListener('contextmenu', (event) => {
  if (event.target.closest('.timeline-clip, .track-label, .track-lane, .media-card')) return;
  event.preventDefault();
  showContextMenu(event.clientX, event.clientY, [
    ['Import media…', () => fileInput.click()],
    ['Add audio track', () => addTrack('audio')],
    ...(!isAudioEdition ? [['Add video track', () => addTrack('video')]] : []),
  ]);
});
document.addEventListener('pointerdown', (event) => { if (!event.target.closest('#editor-context-menu')) hideContextMenu(); });
document.addEventListener('keydown', (event) => {
  const editing = event.target instanceof HTMLElement && (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName));
  if (!editing && (event.key === 'Delete' || event.key === 'Backspace') && selectedClipEntries().length) { event.preventDefault(); deleteSelectedClip(); return; }
  if (event.key !== 'Escape') return;
  if (!exitConfirm.hidden) { exitConfirm.hidden = true; afterEditorExit = null; backButton.focus(); return; }
  if (!projectPropertiesBackdrop.hidden) { closeProjectProperties(); return; }
  hideContextMenu(); fxPanel.hidden = true; videoEventFxPanel.hidden = true; panCropPanel.hidden = true; propertiesPanel.hidden = true; closeGridSpacing();
});

function resetProjectContents() {
  stopPlayback();
  videoEventFxPanel.hidden = true; panCropPanel.hidden = true; propertiesPanel.hidden = true; fxPanel.hidden = true;
  projectName = 'Untitled Project'; savedProjectHandle = null; savedProjectHandleProjectName = ''; projectNameLabel.textContent = projectName;
  media.forEach((entry) => URL.revokeObjectURL(entry.url));
  mediaArchive.forEach((entry) => URL.revokeObjectURL(entry.url)); mediaArchive.clear();
  media.length = 0; mediaGrid.replaceChildren();
  tracks = []; trackCounter = 1; addTrack(isAudioEdition ? 'audio' : 'video', true); if (!isAudioEdition) addTrack('audio', true);
  selectedMediaId = selectedClipId = null; selectedClipIds = new Set(); selectedTrackId = tracks.find((track) => track.type === 'audio')?.id; fxTarget = null;
  masterFx = defaultFx(); applyMasterFxSettings(masterFx);
  gridSpacing = 'seconds'; projectBpm = 120; projectProperties = defaultProjectProperties(); timeDisplayMode = 'time';
  updateProjectFormatLabels();
  showEmptyPreview(); renderTracks(); renderMediaEmpty(); updateProjectLength(); undoStack = []; redoStack = []; updateUndoButtons();
}
function actionNew() {
  if (!confirm('Start a new project? Unsaved timeline changes will be cleared.')) return;
  resetProjectContents();
  transportStatus.textContent = 'New project';
}
function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(binary);
}
function fromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function actionSave() {
  const enteredName = prompt('Project name:', projectName);
  if (enteredName === null) return;
  const requestedName = enteredName.trim() || projectName;
  const filename = `${requestedName.replace(/[\\/:*?"<>|]/g, '_').replace(/\.(fvid|fishvideo)$/i, '') || 'Fish Video Project'}.fvid`;
  let handle = null;
  let overwrite = false;
  try {
    if (savedProjectHandle && savedProjectHandleProjectName === requestedName && confirm(`Overwrite “${requestedName}”?`)) {
      handle = savedProjectHandle;
      overwrite = true;
    } else if (window.showSaveFilePicker) {
      handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'Fish Video Project', accept: { 'application/json': ['.fvid'] } }],
      });
    }
    transportStatus.textContent = 'Saving project…';
    const savedMedia = await Promise.all(media.map(async (entry) => ({
      id: entry.id, name: entry.file.name, type: entry.type, mime: entry.file.type, fx: entry.fx, duration: entry.duration,
      data: toBase64(await entry.file.arrayBuffer()),
    })));
    const data = {
      app: 'Fish Video', name: requestedName, version: activeVersion, bpm: projectBpm, gridSpacing, timeDisplayMode, properties: projectProperties, masterFx, media: savedMedia,
      tracks: tracks.map(({ id, type, name, height, muted, solo, clips, fx }) => ({ id, type, name, height, muted, solo, clips, fx })),
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    if (handle) {
      const writable = await handle.createWritable();
      await writable.write(blob); await writable.close();
      savedProjectHandle = handle;
      savedProjectHandleProjectName = requestedName;
    } else {
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      savedProjectHandle = null; savedProjectHandleProjectName = '';
    }
    projectName = requestedName; projectNameLabel.textContent = projectName;
    transportStatus.textContent = overwrite ? 'Project overwritten' : 'Project saved';
    return true;
  } catch (error) {
    transportStatus.textContent = error?.name === 'AbortError' ? 'Save canceled' : 'Could not save project';
    return false;
  }
}
function actionOpen() {
  // The native input picker is reliable in embedded/preview browsers where the
  // File System Access picker may be unavailable or reject its file type filter.
  projectFileInput.click();
}
async function loadProjectFile(file, handle = null) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'Fish Video' || !Array.isArray(data.tracks) || !Array.isArray(data.media)) throw new Error('That file is not a Fish Video project.');
    stopPlayback(true);
    showEmptyPreview();
    media.forEach((entry) => URL.revokeObjectURL(entry.url));
    mediaArchive.forEach((entry) => URL.revokeObjectURL(entry.url)); mediaArchive.clear(); media.length = 0; mediaGrid.replaceChildren();
    data.media.forEach((saved) => {
      const source = new File([fromBase64(saved.data)], saved.name, { type: saved.mime || '' });
      const entry = { id: saved.id, file: source, type: saved.type, fx: normalizeFx(saved.fx), duration: Number.isFinite(saved.duration) ? saved.duration : (saved.type === 'image' ? 5 : null), url: URL.createObjectURL(source) };
      media.push(entry); renderMediaItem(entry);
      if (['audio', 'video'].includes(entry.type) && !Number.isFinite(entry.duration)) readMediaDuration(entry);
    });
    renderMediaEmpty();
    tracks = data.tracks.map((track) => {
      let cursor = 0;
      const clips = (track.clips || []).map((clip) => {
        const duration = Number(clip.duration) || 5;
        const startTime = Number.isFinite(Number(clip.startTime)) ? Math.max(0, Number(clip.startTime)) : cursor;
        cursor = Math.max(cursor, startTime + duration);
        return { ...clip, startTime, duration, durationPending: Boolean(clip.durationPending) || !Number.isFinite(Number(clip.duration)), fx: normalizeFx(clip.fx) };
      });
      return { ...track, clips, fx: normalizeFx(track.fx) };
    });
    projectProperties = { ...defaultProjectProperties(), ...(data.properties || {}) };
    projectProperties.frameRate = Math.max(1,Math.min(240,Number(projectProperties.frameRate)||60));
    projectProperties.width = Math.max(16, Math.min(8192, Math.round(Number(projectProperties.width) || 1280)));
    projectProperties.height = Math.max(16, Math.min(8192, Math.round(Number(projectProperties.height) || 720)));
    projectProperties.audioSampleRate = [32000, 41000, 44100, 48000, 88200, 96000, 192000].includes(Number(projectProperties.audioSampleRate)) ? Number(projectProperties.audioSampleRate) : 48000;
    projectProperties.audioBitDepth = ['16', '24', '32', '32f'].includes(String(projectProperties.audioBitDepth)) ? String(projectProperties.audioBitDepth) : '16';
    projectProperties.pixelAspect = Math.max(.1,Math.min(10,Number(projectProperties.pixelAspect)||1));
    projectProperties.videoBitrate=Math.max(.1,Number(projectProperties.videoBitrate)||8); projectProperties.audioBitrate=Number(projectProperties.audioBitrate)||192; projectProperties.hdr=['off','hdr10','hlg'].includes(projectProperties.hdr)?projectProperties.hdr:'off';
    projectProperties.fieldOrder = ['progressive', 'upper', 'lower'].includes(projectProperties.fieldOrder) ? projectProperties.fieldOrder : 'progressive';
    projectProperties.renderQuality = ['best', 'good', 'preview', 'draft'].includes(projectProperties.renderQuality) ? projectProperties.renderQuality : 'good';
    projectBpm = Math.max(20, Math.min(300, Number(data.bpm) || 120));
    timeDisplayMode = ['time', 'seconds', 'frames', 'time-and-frames'].includes(data.timeDisplayMode) ? data.timeDisplayMode : 'time';
    masterFx = normalizeFx(data.masterFx);
    applyMasterFxSettings(masterFx);
    const savedGridSpacing = String(data.gridSpacing || 'seconds');
    const validGridSpacing = ['minutes', 'seconds', 'milliseconds', 'frames', 'measures', 'quarter', 'quarter-triplet', 'eighth', 'eighth-triplet', 'sixteenth', 'sixteenth-triplet', 'thirty-second', 'thirty-second-triplet'];
  gridSpacing = !isAudioEdition && validGridSpacing.includes(savedGridSpacing) && (activeRelease >= 3 || !savedGridSpacing.includes('triplet')) ? savedGridSpacing : 'seconds';
    gridTempoInput.value = String(projectBpm);
    updateProjectFormatLabels();
    selectedMediaId = selectedClipId = null;
    selectedTrackId = tracks.find((track) => track.type === 'audio')?.id;
    fxTarget = null;
    savedProjectHandle = handle;
    projectName = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : file.name.replace(/\.(fvid|fishvideo|json)$/i, '');
    savedProjectHandleProjectName = handle ? projectName : '';
    projectNameLabel.textContent = projectName;
    trackCounter = tracks.length + 1; renderTracks(); updateProjectLength(); transportStatus.textContent = 'Project opened · stopped';
  } catch { transportStatus.textContent = 'Could not open this project file'; }
}
projectFileInput.addEventListener('change', async () => {
  const file = projectFileInput.files[0];
  await loadProjectFile(file);
  projectFileInput.value = '';
});
function selectProjectPropertiesTab(name) {
  document.querySelectorAll('[data-properties-tab]').forEach((button) => button.classList.toggle('selected', button.dataset.propertiesTab === name));
  document.querySelectorAll('[data-properties-panel]').forEach((panel) => { panel.hidden = panel.dataset.propertiesPanel !== name; });
}
function openProjectProperties() {
  if (isAudioEdition || activeRelease < 2) return;
  projectWidthInput.value = String(projectProperties.width);
  projectHeightInput.value = String(projectProperties.height);
  projectFrameRateInput.value = String(projectProperties.frameRate);
  projectPixelAspectInput.value = String(projectProperties.pixelAspect);
  document.querySelector('#project-video-bitrate').value=String(projectProperties.videoBitrate||8);
  document.querySelector('#project-hdr').value=projectProperties.hdr||'off';
  document.querySelector('#project-audio-bitrate').value=String(projectProperties.audioBitrate||192);
  projectFieldOrderInput.value = projectProperties.fieldOrder;
  projectRenderQualityInput.value = projectProperties.renderQuality;
  projectAudioRateInput.value = String(projectProperties.audioSampleRate);
  projectAudioBitsInput.value = String(projectProperties.audioBitDepth);
  projectTempoInput.value = String(projectBpm);
  projectTimeFormatInput.value = timeDisplayMode;
  selectProjectPropertiesTab('video');
  projectPropertiesBackdrop.hidden = false;
}
function closeProjectProperties() { projectPropertiesBackdrop.hidden = true; }
document.querySelectorAll('[data-properties-tab]').forEach((button) => button.addEventListener('click', () => selectProjectPropertiesTab(button.dataset.propertiesTab)));
document.querySelector('#apply-project-properties').addEventListener('click', () => {
  const frameRate = Number(projectFrameRateInput.value);
  const width = Number(projectWidthInput.value);
  const height = Number(projectHeightInput.value);
  const tempo = Number(projectTempoInput.value);
  if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(tempo) || width < 16 || width > 8192 || height < 16 || height > 8192 || tempo < 20 || tempo > 300 || !Number.isFinite(frameRate) || frameRate<1 || frameRate>240) {
    transportStatus.textContent = 'Check the project property values';
    return;
  }
  recordUndo();
  projectProperties = {
    width: Math.round(width), height: Math.round(height), frameRate,
    pixelAspect: Number(projectPixelAspectInput.value) || 1, videoBitrate: Number(document.querySelector('#project-video-bitrate').value)||8, hdr: document.querySelector('#project-hdr').value,
    fieldOrder: projectFieldOrderInput.value, renderQuality: projectRenderQualityInput.value,
    audioSampleRate: Number(projectAudioRateInput.value), audioBitDepth: projectAudioBitsInput.value, audioBitrate:Number(document.querySelector('#project-audio-bitrate').value)||192,
  };
  projectBpm = tempo;
  timeDisplayMode = projectTimeFormatInput.value;
  gridTempoInput.value = String(projectBpm);
  updateProjectFormatLabels(); updateTimelineScale();
  transportStatus.textContent = 'Project properties updated';
  closeProjectProperties();
});
document.querySelector('#close-project-properties').addEventListener('click', closeProjectProperties);
document.querySelector('#cancel-project-properties').addEventListener('click', closeProjectProperties);
projectPropertiesBackdrop.addEventListener('click', (event) => { if (event.target === projectPropertiesBackdrop) closeProjectProperties(); });
function menuActions(name) {
  const common = {
    File: [['New project', actionNew], ['Open project…', actionOpen], ['Save project', actionSave], ...(!isAudioEdition ? [['Render video…', openRenderDialog], ['Project Properties…', openProjectProperties]] : []), ['Import media…', () => fileInput.click()], ['Close editor', () => backButton.click()]],
    Edit: [['Undo', undo], ['Redo', redo], ['Copy selected event', () => { const found = selectedClip(); copiedClip = found ? clone(found.clip) : null; }], ['Paste event', pasteClip], ['Delete selected event', deleteSelectedClip]],
    View: [[projectLibraryName(), () => setMediaTab(projectLibraryName())], ['Audio FX', () => setMediaTab('Audio FX')], ['Full screen preview', toggleFullscreen]],
    Insert: [['Audio track', () => addTrack('audio')], ...(!isAudioEdition ? [['Video track', () => addTrack('video')]] : []), ['Media event', () => fileInput.click()]],
    Tools: [['Event properties…', () => { const found = selectedClip(); if (found?.track.type === 'audio') openEventProperties(found.clip.fx, findMedia(found.clip.mediaId)?.file.name || found.track.name); }], ['Split selected event', () => { const found = selectedClip(); if (found) splitClip(found.track, found.clip); }]],
    Options: [
      ...(isAudioEdition || activeRelease < 2 ? [] : [['Grid spacing…', openGridSpacing]]),
      ['Global Settings', () => requestEditorExit(() => document.querySelector('#tab-settings').click())],
    ],
    Help: [['About Fish Video', () => requestEditorExit(() => document.querySelector('#about-open').click())]],
  };
  return common[name] || [];
}
function renderGridSpacingChoices() {
  document.querySelectorAll('#grid-spacing-backdrop button[data-grid]').forEach((button) => {
    const tripletUnavailable = button.hasAttribute('data-triplet') && activeRelease < 3;
    button.hidden = tripletUnavailable;
    button.classList.toggle('selected', button.dataset.grid === gridSpacing);
    button.setAttribute('aria-pressed', String(button.dataset.grid === gridSpacing));
  });
}
function openGridSpacing() {
  if (isAudioEdition || activeRelease < 2) return;
  gridTempoInput.value = String(projectBpm);
  renderGridSpacingChoices();
  gridSpacingBackdrop.hidden = false;
}
function closeGridSpacing() { gridSpacingBackdrop.hidden = true; }
document.querySelectorAll('#grid-spacing-backdrop button[data-grid]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.hasAttribute('data-triplet') && activeRelease < 3) return;
    gridSpacing = button.dataset.grid;
    renderGridSpacingChoices();
    updateTimelineScale();
  });
});
gridTempoInput.addEventListener('change', () => {
  projectBpm = Math.max(20, Math.min(300, Number(gridTempoInput.value) || 120));
  gridTempoInput.value = String(projectBpm);
  updateTimelineScale();
});
document.querySelector('#close-grid-spacing').addEventListener('click', closeGridSpacing);
gridSpacingBackdrop.addEventListener('click', (event) => { if (event.target === gridSpacingBackdrop) closeGridSpacing(); });
function selectedClip() {
  for (const track of tracks) { const clip = track.clips.find((item) => item.id === selectedClipId); if (clip) return { track, clip }; }
  return null;
}
function deleteSelectedClip() {
  const selected = selectedClipEntries();
  if (!selected.length) return;
  const ids = new Set(selected.map(({ clip }) => clip.id));
  recordUndo();
  for (const track of tracks) track.clips = track.clips.filter((clip) => !ids.has(clip.id));
  selectedClipIds = new Set(); selectedClipId = null;
  renderTracks(); updateProjectLength();
  transportStatus.textContent = selected.length + ' event' + (selected.length === 1 ? '' : 's') + ' removed';
}
function pasteClip() { const found = selectedClip(); if (copiedClip && found) duplicateClip(found.track, copiedClip); }
function toggleFullscreen() {
  const target = document.querySelector('.preview-dock');
  if (!document.fullscreenElement) target.requestFullscreen?.(); else document.exitFullscreen?.();
}
for (const menuButton of document.querySelectorAll('.editor-menubar [data-menu]')) {
  menuButton.addEventListener('click', () => {
    const rect = menuButton.getBoundingClientRect();
    showContextMenu(rect.left, rect.bottom, menuActions(menuButton.dataset.menu));
  });
}
document.querySelector('#render-video-button').addEventListener('click',openRenderDialog);
document.querySelector('#render-video-button').hidden=isAudioEdition;
function openRenderDialog() {
  if (isAudioEdition) return;
  const duration=projectDuration();
  if(!duration){transportStatus.textContent='Add media to the timeline before rendering';return;}
  const back=document.createElement('div'); back.className='render-dialog-backdrop';
  const dialog=document.createElement('section'); dialog.className='render-dialog'; dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true');
  const formats=[['video/webm','WebM (.webm)'],['video/mp4','MP4 (.mp4)']].filter(([mime])=>window.MediaRecorder && MediaRecorder.isTypeSupported(mime));
  if(!formats.length){transportStatus.textContent='This browser cannot render MP4 or WebM';return;}
  dialog.innerHTML='<h2>Render Video</h2><label>Format <select id="render-format"></select></label><label>Preset <select id="render-preset"><option value="preview">Preview · 720p</option><option value="standard">Standard · Project size</option><option value="best">Best · Project size</option></select></label><p>Project render · '+duration.toFixed(2)+' seconds</p><div class="render-actions"><button type="button" data-cancel>Cancel</button><button type="button" data-render>Start render</button></div>';
  const select=dialog.querySelector('#render-format'); formats.forEach(([mime,label])=>select.add(new Option(label,mime)));
  dialog.querySelector('[data-cancel]').onclick=()=>back.remove();
  dialog.querySelector('[data-render]').onclick=async()=>{
    if(!window.MediaRecorder){transportStatus.textContent='Video rendering is not supported in this browser';back.remove();return;}
    back.remove(); const preset=dialog.querySelector('#render-preset').value;
    const mobileRender=matchMedia('(max-width: 640px)').matches||navigator.maxTouchPoints>1;
    const projectWidth=Math.max(16,Number(projectProperties.width)||1280), projectHeight=Math.max(16,Number(projectProperties.height)||720);
    const presetScale=preset==='preview'?Math.min(1,720/projectHeight):1;
    const deviceScale=Math.min(1,(mobileRender?1920:3840)/Math.max(projectWidth,projectHeight));
    const scale=Math.min(presetScale,deviceScale);
    const canvas=document.createElement('canvas'); canvas.width=Math.max(16,Math.round(projectWidth*scale)); canvas.height=Math.max(16,Math.round(projectHeight*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!canvas.captureStream){transportStatus.textContent='Video rendering is not supported on this device';return;}
    const fps=Math.max(1,Math.min(mobileRender?30:60,Number(projectProperties.frameRate)||30));
    const supportsManualFrames=typeof CanvasCaptureMediaStreamTrack!=='undefined'&&typeof CanvasCaptureMediaStreamTrack.prototype.requestFrame==='function';
    let canvasStream;try{canvasStream=canvas.captureStream(supportsManualFrames?0:fps);}catch(error){console.error(error);transportStatus.textContent='Could not start video rendering on this device';return;}
    const hasTimelineAudio=tracks.some(track=>track.type==='audio'&&track.clips.some(clip=>{const entry=findMedia(clip.mediaId);return entry?.type==='audio'||(clip.linkedAudio&&entry?.type==='video');}));
    const activeVideoAt=time=>{let active=null;for(const track of tracks)if(track.type==='video')for(const clip of track.clips){const start=Number(clip.startTime)||0;if(time>=start&&time<start+(Number(clip.duration)||0)&&(!active||start>=active.start))active={clip,start};}return active;};
    let audioDestination=null;
    if(hasTimelineAudio){try{await connectAudioGraph();audioDestination=audioContext.createMediaStreamDestination();audioGraph.analyser.connect(audioDestination);}catch(error){canvasStream.getTracks().forEach(track=>track.stop());console.error(error);transportStatus.textContent='Could not prepare audio for rendering';return;}}
    const stream=new MediaStream([...canvasStream.getVideoTracks(),...(audioDestination?.stream.getAudioTracks()||[])]);const videoTrack=canvasStream.getVideoTracks()[0];
    const mime=select.value; let recorder;try{recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:Math.max(100000,Number(projectProperties.videoBitrate||8)*1000000)*(preset==='best'?1.5:1),...(hasTimelineAudio?{audioBitsPerSecond:192000}:{})});}catch(error){stream.getTracks().forEach(track=>track.stop());if(audioDestination)audioGraph.analyser.disconnect(audioDestination);console.error(error);transportStatus.textContent='This device cannot encode the selected video format with audio';return;} const chunks=[];
    recorder.ondataavailable=(event)=>{if(event.data?.size)chunks.push(event.data);};
    recorder.onstop=()=>{stopPlayback(false);const blob=new Blob(chunks,{type:mime});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=(projectName||'fish-video')+'.'+(mime==='video/mp4'?'mp4':'webm');link.click();setTimeout(()=>URL.revokeObjectURL(link.href),30000);stream.getTracks().forEach(t=>t.stop());if(audioDestination)try{audioGraph.analyser.disconnect(audioDestination);}catch{}transportStatus.textContent='Render complete';};
    const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    timelineClockTime = 0; stopPlayback(false);
    const firstVideo = activeVideoAt(0);
    if (firstVideo) {
      syncTimelineVideoAt(0);
      const firstEntry = findMedia(firstVideo.clip.mediaId);
      if (firstEntry?.type === 'video') {
        if (previewVideo.readyState < 2) await Promise.race([new Promise(resolve => previewVideo.addEventListener('loadeddata', resolve, { once: true })), wait(2200)]);
        if (previewVideo.readyState >= 1 && previewVideo.currentTime !== 0) {
          try { previewVideo.currentTime = 0; } catch {}
          if (previewVideo.seeking) await Promise.race([new Promise(resolve => previewVideo.addEventListener('seeked', resolve, { once: true })), wait(250)]);
        }
      } else if (firstEntry?.type === 'image' && previewImage.decode) await previewImage.decode().catch(() => {});
    }
    if (hasTimelineAudio) {
      for (const track of tracks.filter(item => item.type === 'audio')) {
        const clip = track.clips.find(item => (Number(item.startTime) || 0) <= 0 && (Number(item.startTime) || 0) + (Number(item.duration) || 0) > 0);
        const entry = clip && findMedia(clip.mediaId);
        if (!entry || (entry.type !== 'audio' && !(clip.linkedAudio && entry.type === 'video'))) continue;
        const state = getTimelineTrackPlayer(track.id); state.trackId = track.id; state.player.preload = 'auto';
        if (state.player.currentSrc !== entry.url && state.player.src !== entry.url) { state.player.src = entry.url; state.player.load(); }
        if (state.player.readyState < 1) await Promise.race([new Promise(resolve => state.player.addEventListener('loadedmetadata', resolve, { once: true })), wait(1800)]);
      }
      timelineAudioPlayback = true; timelineClockPlaying = true;
    }
    try{recorder.start(250);}catch(error){stream.getTracks().forEach(track=>track.stop());if(audioDestination)try{audioGraph.analyser.disconnect(audioDestination);}catch{}stopPlayback(false);console.error(error);transportStatus.textContent='Could not start the render on this device';return;}transportStatus.textContent=hasTimelineAudio?'Rendering video + audio…':'Rendering video…';
    const frameBuffer=document.createElement('canvas');frameBuffer.width=canvas.width;frameBuffer.height=canvas.height;
    const frameBufferCtx=frameBuffer.getContext('2d',{alpha:false});
    const lastGoodFrame=document.createElement('canvas');lastGoodFrame.width=canvas.width;lastGoodFrame.height=canvas.height;
    const lastGoodFrameCtx=lastGoodFrame.getContext('2d',{alpha:false});let hasGoodFrame=false;
    const renderFrames=async()=>{
      await runRenderClock({
        duration, fps,
        shouldContinue: () => recorder.state === 'recording',
        renderFrame: async ({ time }) => {
          timelineClockTime = time;
          // Audio follows the same wall-clock timeline; never speed it up to catch a dropped video frame.
          if (hasTimelineAudio) syncTimelineAudioAt(time);
          syncTimelineVideoAt(time);
          if (!sapphireWatermarkOverlay.hidden && !sapphireWatermarkOverlay.complete && sapphireWatermarkOverlay.decode) {
            await Promise.race([sapphireWatermarkOverlay.decode().catch(() => {}), wait(1200)]);
          }
          const active = activeVideoAt(time), entry = active && findMedia(active.clip.mediaId);
          if (entry?.type === 'video') {
            if (previewVideo.readyState < 1) await Promise.race([new Promise(resolve => previewVideo.addEventListener('loadedmetadata', resolve, { once: true })), wait(40)]);
            if (previewVideo.readyState >= 1 && Number.isFinite(previewVideo.duration)) {
              const wanted = Math.max(0, Math.min(time - active.start, Math.max(0, previewVideo.duration - .001)));
              if (Math.abs(previewVideo.currentTime - wanted) > .0005) await new Promise(resolve => {
                let timer;
                const done = () => { clearTimeout(timer); previewVideo.removeEventListener('seeked', done); resolve(); };
                previewVideo.addEventListener('seeked', done, { once: true });
                try { previewVideo.currentTime = wanted; } catch { done(); return; }
                timer = setTimeout(done, Math.min(12, 1000 / fps * .7));
              });
            }
          }
          const exportFx = active ? interpolateVideoFx(active.clip, time - active.start) : null;
          const exportFxSource = !previewVideo.hidden ? previewVideo : !previewImage.hidden ? previewImage : null;
          if (exportFxSource && exportFx && canvasVideoFxNeeded(exportFx, new Set(exportFx.effects || []))) {
            processVideoFxFrameSafe(exportFxSource, exportFx);
          }
          const source = !videoFxCanvas.hidden ? videoFxCanvas : exportFxSource;
          let validFrame = false;
          try {
            frameBufferCtx.save(); frameBufferCtx.setTransform(1, 0, 0, 1, 0, 0); frameBufferCtx.globalAlpha = 1; frameBufferCtx.filter = 'none'; frameBufferCtx.fillStyle = '#000'; frameBufferCtx.fillRect(0, 0, frameBuffer.width, frameBuffer.height);
            if (source) {
              const sw = source.videoWidth || source.naturalWidth || source.width, sh = source.videoHeight || source.naturalHeight || source.height;
              if (sw > 0 && sh > 0) {
                const fit = Math.min(frameBuffer.width / sw, frameBuffer.height / sh), w = sw * fit, h = sh * fit;
                const visual = transitionVisual(active?.clip, time - (active?.start || 0)), fx = exportFx;
                const shake = exportFx?.sapphireEffects?.includes('S_Shake') ? Number(exportFx.s_ShakeAmplitude || 0) / 5 : 0;
                const shakePhase = performance.now() / 1000 * Number(exportFx?.s_ShakeFrequency || 8) * Math.PI * 2;
                frameBufferCtx.translate(frameBuffer.width / 2 + visual.offsetX * frameBuffer.width + Math.sin(shakePhase) * shake, frameBuffer.height / 2 + Math.cos(shakePhase * .83) * shake);
                frameBufferCtx.scale(visual.scaleX, visual.scaleY); frameBufferCtx.globalAlpha = visual.alpha;
                if (visual.wipe < 1) { frameBufferCtx.beginPath(); frameBufferCtx.rect(-frameBuffer.width / 2, -frameBuffer.height / 2, frameBuffer.width * visual.wipe, frameBuffer.height); frameBufferCtx.clip(); }
                frameBufferCtx.filter = 'brightness(' + (fx?.brightness ?? 100) / 100 + ') contrast(' + (fx?.contrast ?? 100) / 100 + ') saturate(' + (fx?.saturation ?? 100) / 100 + ') ' + sapphireCssFilters(fx || {}).join(' ');
                frameBufferCtx.drawImage(source, -w / 2, -h / 2, w, h); validFrame = true;
              }
            }
            frameBufferCtx.restore();
            if (validFrame) {
              if (!sapphireWatermarkOverlay.hidden && sapphireWatermarkOverlay.complete && sapphireWatermarkOverlay.naturalWidth) {
                frameBufferCtx.save(); frameBufferCtx.setTransform(1, 0, 0, 1, 0, 0); frameBufferCtx.globalAlpha = 1; frameBufferCtx.filter = 'none';
                frameBufferCtx.drawImage(sapphireWatermarkOverlay, 0, 0, frameBuffer.width, frameBuffer.height); frameBufferCtx.restore();
              }
              ctx.drawImage(frameBuffer, 0, 0); lastGoodFrameCtx.drawImage(frameBuffer, 0, 0); hasGoodFrame = true;
            } else if (hasGoodFrame) ctx.drawImage(lastGoodFrame, 0, 0);
          } catch (error) {
            try { frameBufferCtx.restore(); } catch {}
            if (hasGoodFrame) ctx.drawImage(lastGoodFrame, 0, 0);
            console.debug('Frame decode/render skipped; holding last valid frame', error);
          }
        },
        captureFrame: () => { if (hasGoodFrame) videoTrack?.requestFrame?.(); },
      });
      if (recorder.state === 'recording') recorder.stop();
      stopPlayback(false);
    };
    renderFrames().catch(error=>{console.error(error);transportStatus.textContent='Render failed';if(recorder.state==='recording')recorder.stop();});
  };
  back.append(dialog); back.addEventListener('click',(e)=>{if(e.target===back)back.remove();}); editor.append(back);
}
for (const button of document.querySelectorAll('.editor-toolbar [data-action]')) {
  button.addEventListener('click', () => {
    const actions = { new: actionNew, open: actionOpen, save: actionSave, undo, redo,
      'select-tool': () => { editor.dataset.tool = 'select'; transportStatus.textContent = 'Selection tool'; },
      'split-tool': () => { const found = selectedClip(); if (found) splitClip(found.track, found.clip); else transportStatus.textContent = 'Select an event to split'; } };
    actions[button.dataset.action]?.();
  });
}
function setMediaTab(name) {
  const target = name === 'Project Media' || name === 'Project Audio' ? projectLibraryName() : name;
  document.querySelectorAll('.dock-tab').forEach((tab) => tab.classList.toggle('active', tab.textContent.trim() === target));
  const showingAudioFx = name === 'Audio FX';
  const showingVideoFx = name === 'Video FX';
  if (!showingVideoFx) videoEventFxPanel.hidden = true;
  panCropPanel.hidden = true;
  const showingTransitions = name === 'Transitions';
  const transitionReleaseNote=document.querySelector('#transition-release-note');
  document.querySelectorAll('[data-min-release]').forEach(button=>{const unavailable=activeRelease<Number(button.dataset.minRelease);button.disabled=unavailable;button.setAttribute('aria-disabled',String(unavailable));});
  if(transitionReleaseNote)transitionReleaseNote.hidden=activeRelease>=6;
  document.querySelector('.media-toolbar').hidden = showingAudioFx || showingVideoFx || showingTransitions;
  mediaGrid.hidden = showingAudioFx || showingVideoFx || showingTransitions;
  audioFxBrowser.hidden = !showingAudioFx;
  videoFxBrowser.hidden = !showingVideoFx;
  transitionsBrowser.hidden = !showingTransitions;
  if (showingAudioFx) { renderAudioFxBrowser(); transportStatus.textContent = 'Audio FX'; }
  else if (showingVideoFx) { renderVideoFxBrowser(); transportStatus.textContent = 'Video FX'; }
  else if (name === 'Video FX' || name === 'Transitions') transportStatus.textContent = `${name} selected`;
  else transportStatus.textContent = projectLibraryName();
}
const vegasFxInfo = {
  brightnessContrast: { label: 'Brightness and Contrast', controls: [['brightness', 'Brightness', 0, 200, '%'], ['contrast', 'Contrast', 0, 200, '%']] },
  gaussianBlur: { label: 'Gaussian Blur', controls: [['blur', 'Amount', 0, 20, ' px']] },
  glow: { label: 'Glow', controls: [['glow', 'Intensity', 0, 100, '%']], options: [{ type: 'color', key: 'glowColor', label: 'Glow color' }] },
  sharpen: { label: 'Sharpen', controls: [['sharpen', 'Amount', 0, 1, '']] },
  blackWhite: { label: 'Black and White', controls: [['blackWhiteAmount', 'Amount', 0, 1, '']] },
  sepia: { label: 'Sepia', controls: [['sepiaAmount', 'Amount', 0, 1, '']], options: [{ type: 'color', key: 'sepiaColor', label: 'Tint color' }] },
  invert: { label: 'Invert', controls: [], options: [{ type: 'checkboxes', items: [['invertRed', 'Red'], ['invertGreen', 'Green'], ['invertBlue', 'Blue']] }] },
  border: { label: 'Border', minRelease: 4, controls: [['borderAmount', 'Width', 0, 20, ' px']] },
  channelBlend: { label: 'Channel Blend', minRelease: 6, controls: [['channelBlend', 'Blend', -100, 100, '%']] },
  cookieCutter: {
    label: 'Cookie Cutter', minRelease: 3,
    controls: [['cookieSize', 'Size', 5, 100, '%'], ['cookieAmountX', 'Repeat X', 1, 8, ''], ['cookieAmountY', 'Repeat Y', 1, 8, ''], ['cookieBorderSize', 'Border size', 0, 20, ' px'], ['cookieFeather', 'Feather (cut blur)', 0, 30, ' px']],
    options: [
      { type: 'select', key: 'cookieShape', label: 'Shape', items: [['circle', 'Circle'], ['square', 'Square'], ['triangle', 'Triangle'], ['rectangle', 'Rectangle'], ['diamond', 'Diamond'], ['hexagon', 'Hexagon'], ['star', 'Star']] },
      { type: 'color', key: 'cookieBorderColor', label: 'Border color' },
      { type: 'select', key: 'cookieMode', label: 'Method', items: [['in', 'Cut away all but section'], ['out', 'Cut away section']] },
    ],
  },
  deform: { label: 'Deform', controls: [['deformSqueeze', 'Squeeze amount', -1, 1, ''], ['deformShear', 'Shear amount', -1, 1, ''], ['deformCurve', 'Curve amount', -1, 1, '']], options: [
    { type: 'checkboxes', label: 'Squeeze directions', items: [['deformLeft','Left'],['deformRight','Right'],['deformTop','Top'],['deformBottom','Bottom']] },
    { type: 'checkboxes', label: 'Shear axes', items: [['deformShearHorizontal','Horizontal'],['deformShearVertical','Vertical']] },
    { type: 'checkboxes', label: 'Curve directions', items: [['deformCurveLeft','Left'],['deformCurveRight','Right'],['deformCurveTop','Top'],['deformCurveBottom','Bottom']] },
    { type: 'checkbox', key: 'deformCenter', label: 'Center image' }, { type: 'color', key: 'deformBackground', label: 'Background color' },
  ] },
  gradientMap: { label: 'Gradient Map', minRelease: 7, controls: [['gradientMap', 'Amount', 0, 100, '%']] },
  hslAdjust: { label: 'HSL Adjust', controls: [['saturation', 'Saturation', 0, 200, '%'], ['hue', 'Hue', -180, 180, '°']] },
  lightRays: { label: 'Light Rays', minRelease: 5, controls: [['lightRays', 'Intensity', 0, 100, '%']] },
  minMax: { label: 'Min and Max', minRelease: 3, controls: [['minMax', 'Amount', 0, 100, '%'], ['minThreshold', 'Minimum level', 0, 100, '%'], ['maxThreshold', 'Maximum level', 0, 100, '%']] },
  mirror: { label: 'Mirror', controls: [['mirrorPosition', 'Center', 0, 100, '%'], ['mirrorRotation', 'Rotate', -180, 180, '°']], options: [{ type: 'select', key: 'mirrorAxis', label: 'Reflection axis', items: [['vertical', 'Vertical'], ['horizontal', 'Horizontal']] }] },
  pinchPunch: { label: 'Pinch/Punch', controls: [['pinchPunch', 'Amount', -100, 100, '%']] },
  pixelate: { label: 'Pixelate', controls: [['pixelSize', 'Pixel size', 0, 1, '']] },
  radialBlur: { label: 'Radial Blur', minRelease: 7, controls: [['radialBlur', 'Amount', 0, 20, ' px']] },
  rays: { label: 'Rays', minRelease: 7, controls: [['rays', 'Intensity', 0, 100, '%']] },
  softContrast: { label: 'Soft Contrast', minRelease: 7, controls: [['softContrast', 'Amount', 0, 100, '%']] },
  spherize: { label: 'Spherize', minRelease: 4, controls: [['spherize', 'Amount', 0, 100, '%']] },
  starburst: { label: 'Starburst', minRelease: 8, controls: [['starburst', 'Intensity', 0, 100, '%']] },
  swirl: { label: 'Swirl', minRelease: 3, controls: [['swirlAmount', 'Swirl', -1, 1, ''], ['swirlX', 'Position X', 0, 100, '%'], ['swirlY', 'Position Y', 0, 100, '%'], ['swirlSize', 'Swirl size', 1, 100, '%']] },
  tvSimulator: { label: 'TV Simulator', minRelease: 5, controls: [['tvSimulator', 'Intensity', 0, 100, '%']] },
  wave: { label: 'Wave', controls: [['waveAmountH', 'Amount horizontal', -1, 1, ''], ['waveAmountV', 'Amount vertical', -1, 1, ''], ['waveSizeH', 'Size horizontal', 0, 1, ''], ['waveSizeV', 'Size vertical', 0, 1, ''], ['wavePhase', 'Phase', 0, 360, '°']] },
};
function selectedVideoClip() {
  const found = selectedClip();
  return found?.track.type === 'video' ? found : null;
}
function selectedClipEntries() {
  const ids = selectedClipIds.size ? new Set(selectedClipIds) : new Set(selectedClipId ? [selectedClipId] : []);
  return tracks.flatMap((track) => track.clips.filter((clip) => ids.has(clip.id)).map((clip) => ({ track, clip })));
}
function focusClipSelection(id) {
  if (!selectedClipIds.has(id)) selectedClipIds = new Set([id]);
  selectedClipId = id;
}
function selectedVideoClips() { return selectedClipEntries().filter((item) => item.track.type === 'video'); }
function selectedAudioClips() { return selectedClipEntries().filter((item) => item.track.type === 'audio'); }
function setSelectedAudioFxField(field, value, target = fxTarget) {
  const items = selectedAudioClips();
  const copyValue = () => value && typeof value === 'object' ? clone(value) : value;
  if (items.length < 2 || !items.some(({ clip }) => clip.fx === target)) { if (target) target[field] = copyValue(); return; }
  const changedTracks = new Set();
  for (const { track, clip } of items) { clip.fx ||= defaultFx(); clip.fx[field] = copyValue(); changedTracks.add(track); }
  if (field === 'speed') for (const track of changedTracks) syncTrackClipDurations(track);
}
function videoFxAtPlayhead(clip) {
  const local = Math.max(0, Math.min(Number(clip?.duration) || 0, timelineClockTime - (Number(clip?.startTime) || 0)));
  return clip?.keyframes?.length ? interpolateVideoFx(clip, local) : ensureVideoFx(clip);
}
function setSelectedVideoFxField(field, value) {
  for (const { clip } of selectedVideoClips()) {
    const fx = ensureVideoFx(clip);
    const next = Array.isArray(value) ? [...value] : value;
    if (field === 'effects' || field === 'codexEffects' || field === 'sapphireEffects' || !clip.keyframes?.length) { fx[field] = next; continue; }
    const local = Math.max(0, Math.min(Number(clip.duration) || 0, timelineClockTime - (Number(clip.startTime) || 0)));
    const frameTime = Math.round(local * projectProperties.frameRate) / projectProperties.frameRate;
    let key = clip.keyframes.find((item) => Math.abs(Number(item.time) - frameTime) < .5 / projectProperties.frameRate);
    if (!key) {
      const values = { ...interpolateVideoFx(clip, local) };
      delete values.effects; delete values.codexEffects;
      key = { time: frameTime, values, easing: 'Linear' }; clip.keyframes.push(key);
    }
    key.values ||= {};
    key.values[field] = Array.isArray(next) ? [...next] : next;
    clip.keyframes.sort((a, b) => a.time - b.time);
  }
}
function openVideoEventFxPanel(selection = selectedVideoClip()) {
  if (!selection) return;
  selectedClipId = selection.clip.id;
  selectedTrackId = selection.track.id;
  const name = findMedia(selection.clip.mediaId)?.file.name || selection.track.name;
  videoEventFxTarget.textContent = `${name} · Video Event FX`;
  fxPanel.hidden = true;
  panCropPanel.hidden = true;
  propertiesPanel.hidden = true;
  videoEventFxPanel.hidden = false;
  renderVideoFxBrowser();
}
function openPanCropPanel(track, clip, entry) {
  selectedClipId = clip.id;
  selectedTrackId = track.id;
  panCropFxTarget = ensureVideoFx(clip);
  panCropTargetLabel.textContent = `${entry?.file.name || track.name} · drag the preview to reposition`;
  document.querySelector('#pan-crop-rotation').value = String(panCropFxTarget.panRotation || 0);
  document.querySelector('#pan-crop-rotation-value').textContent = `${panCropFxTarget.panRotation || 0}°`;
  panCropZoom.value = String(panCropFxTarget.panZoom);
  panCropX.value = String(panCropFxTarget.panX);
  panCropY.value = String(panCropFxTarget.panY);
  updatePanCropReadouts();
  fxPanel.hidden = true;
  videoEventFxPanel.hidden = true;
  propertiesPanel.hidden = true;
  panCropPanel.hidden = false;
  if(entry&&entry.type==='video') previewVideo.pause();
  if (entry) applyVideoFx(panCropFxTarget);
}
function updatePanCropReadouts() {
  panCropZoomValue.textContent = `${panCropZoom.value}%`;
  panCropXValue.textContent = `X ${Math.round(Number(panCropX.value))}%`;
  panCropYValue.textContent = `Y ${Math.round(Number(panCropY.value))}%`;
  const zoomInput = document.querySelector('#pan-crop-zoom-number');
  if (zoomInput) zoomInput.value = panCropZoom.value;
  const box = document.querySelector('#pan-crop-box');
  if (box) {
    const scale = 100 / Math.max(25, Number(panCropZoom.value) || 25);
    box.style.width = `${scale * 100}%`;
    box.style.height = `${scale * 100}%`;
    box.style.left = `${50 + Number(panCropX.value) * scale / 2}%`;
    box.style.top = `${50 + Number(panCropY.value) * scale / 2}%`;
    box.style.transform = 'translate(-50%, -50%)';
  }
}
function installedCodeXPlugins() {
  try {
    const entries = JSON.parse(localStorage.getItem('fish-video-wax-installs') || '[]');
    return Array.isArray(entries) ? entries.filter((entry) => entry.category === 'CodeX (Fish Plug-ins)' && entry.id === 'codex-distortion' && activeRelease >= (Number(entry.minRelease) || 2)) : [];
  } catch { return []; }
}
let selectedCodexEffect = null;
function renderCodexDistortionControls(target) {
  const specs = [
    { name: 'Bend', controls: [['bendAmount', 'Curve amount', -100, 100, 'range']] },
    { name: 'Corner Pin', controls: [['cornerTopLeft', 'Top left', -50, 50, 'range'], ['cornerTopRight', 'Top right', -50, 50, 'range'], ['cornerBottomRight', 'Bottom right', -50, 50, 'range'], ['cornerBottomLeft', 'Bottom left', -50, 50, 'range']] },
    { name: 'Flip', controls: [['flipMode', 'Direction', ['none', 'horizontal', 'vertical', 'both'], 'select']] },
    { name: 'Hexagon Tiles', controls: [['tileShift', 'Tile size', 0, 100, 'range'], ['tileRotate', 'Rotation', -180, 180, 'range']] },
    { name: 'Kaleidoscope', controls: [['kaleidoscopeSegments', 'Mirrors', 2, 16, 'range'], ['kaleidoscopeRotation', 'Rotation', 0, 360, 'range'], ['kaleidoscopeSpeed', 'Speed', -10, 10, 'range']] },
    { name: 'Square Tiles', controls: [['tileShift', 'Tile size', 0, 100, 'range'], ['tileRotate', 'Rotation', -180, 180, 'range']] },
    { name: 'Squeeze', controls: [['squeezeAmount', 'Amount', -100, 100, 'range']] },
    { name: 'Warp Waves', controls: [['warpWaveAmount', 'Amplitude', 0, 100, 'range'], ['warpWaveAngle', 'Angle', 0, 360, 'range'], ['warpWaveSpeed', 'Speed', -10, 10, 'range'], ['warpWaveAxis', 'Direction', ['horizontal', 'vertical', 'both'], 'select']] },
  ];
  target.codexEffects = Array.isArray(target.codexEffects) ? target.codexEffects : [];
  if (!selectedCodexEffect || !target.codexEffects.includes(selectedCodexEffect)) selectedCodexEffect = target.codexEffects[0] || null;
  codexDistortionControls.replaceChildren();
  const top = document.createElement('div'); top.className = 'codex-effect-toolbar';
  const add = document.createElement('select'); add.setAttribute('aria-label', 'Choose distortion effect');
  add.add(new Option('Add effect…', ''));
  for (const spec of specs) if (!target.codexEffects.includes(spec.name)) add.add(new Option(spec.name, spec.name));
  const addButton = document.createElement('button'); addButton.type = 'button'; addButton.textContent = 'Add';
  addButton.disabled = add.options.length < 2;
  addButton.addEventListener('click', () => { if (!add.value) return; recordUndo(); target.codexEffects.push(add.value); selectedCodexEffect = add.value; applyVideoFx(target); renderVideoFxBrowser(); });
  const preset = document.createElement('select'); preset.setAttribute('aria-label', 'Distortion preset');
  [['', 'Preset…'], ['soft-wave', 'Soft Wave'], ['kaleidoscope', 'Kaleidoscope'], ['twist', 'Twist & Bend']].forEach(([v,l]) => preset.add(new Option(l,v)));
  preset.addEventListener('change', () => {
    if (!preset.value) return; recordUndo();
    const presets = {
      'soft-wave': { active:['Warp Waves'], warpWaveAmount:18, warpWaveAxis:'horizontal', warpWaveSpeed:1, warpWaveAngle:0 },
      kaleidoscope: { active:['Kaleidoscope'], kaleidoscopeSegments:8, kaleidoscopeRotation:0, kaleidoscopeSpeed:0 },
      twist: { active:['Bend','Warp Waves'], bendAmount:24, warpWaveAmount:12, warpWaveAxis:'both', warpWaveSpeed:0.5 }
    };
    const p = presets[preset.value]; target.codexEffects = [...new Set([...target.codexEffects, ...p.active])];
    for (const [k,v] of Object.entries(p)) if (k !== 'active') target[k] = v;
    selectedCodexEffect = p.active[0]; applyVideoFx(target); renderVideoFxBrowser();
  });
  top.append(add, addButton, preset); codexDistortionControls.append(top);
  const list = document.createElement('div'); list.className = 'codex-effect-list'; list.setAttribute('aria-label','Applied distortion effects');
  target.codexEffects.forEach((name, index) => {
    const row = document.createElement('div'); row.className = 'codex-effect-row'; row.draggable = true; row.dataset.effect = name;
    const select = document.createElement('button'); select.type='button'; select.className='codex-effect-select'; select.textContent=name; select.classList.toggle('selected',name===selectedCodexEffect);
    select.addEventListener('click',()=>{ selectedCodexEffect=name; renderCodexDistortionControls(target); });
    const up=document.createElement('button'); up.type='button'; up.textContent='↑'; up.title='Move up'; up.disabled=index===0;
    const down=document.createElement('button'); down.type='button'; down.textContent='↓'; down.title='Move down'; down.disabled=index===target.codexEffects.length-1;
    const remove=document.createElement('button'); remove.type='button'; remove.textContent='×'; remove.title='Remove effect';
    up.addEventListener('click',()=>moveCodexEffect(target,index,-1)); down.addEventListener('click',()=>moveCodexEffect(target,index,1));
    remove.addEventListener('click',()=>{ recordUndo(); target.codexEffects=target.codexEffects.filter((item)=>item!==name); if(selectedCodexEffect===name) selectedCodexEffect=target.codexEffects[0]||null; applyVideoFx(target); renderVideoFxBrowser(); });
    row.addEventListener('dragstart',(e)=>e.dataTransfer.setData('text/plain',name));
    row.addEventListener('dragover',(e)=>e.preventDefault());
    row.addEventListener('drop',(e)=>{e.preventDefault(); const from=target.codexEffects.indexOf(e.dataTransfer.getData('text/plain')); const to=target.codexEffects.indexOf(name); if(from<0||to<0||from===to)return; recordUndo(); target.codexEffects.splice(to,0,target.codexEffects.splice(from,1)[0]); applyVideoFx(target); renderVideoFxBrowser();});
    row.append(select,up,down,remove); list.append(row);
  });
  codexDistortionControls.append(list);
  const spec = specs.find((item)=>item.name===selectedCodexEffect);
  if (!spec) { const hint=document.createElement('p'); hint.className='fx-chain-empty'; hint.textContent='Add an effect, then select it to adjust its controls.'; codexDistortionControls.append(hint); return; }
  const section=document.createElement('fieldset'); section.className='codex-effect-card codex-managed-effect';
  const legend=document.createElement('legend'); legend.textContent=spec.name; section.append(legend);
  for (const [key, label, optionsOrMin, maxOrType, explicitType] of spec.controls) {
    const controlType = explicitType || (maxOrType === 'select' ? 'select' : 'range');
    const row = document.createElement('div'); row.className = 'codex-control codex-keyframe-control';
    const caption = document.createElement('span'); caption.textContent = label; row.append(caption);
    const output = document.createElement('output');
    if (controlType === 'select') {
      const input = document.createElement('select');
      for (const option of optionsOrMin) input.add(new Option(option[0].toUpperCase() + option.slice(1), option));
      input.value = String(target[key] ?? optionsOrMin[0]);
      output.textContent = input.value;
      input.addEventListener('change', () => { recordUndo(); setSelectedVideoFxField(key, input.value); applyVideoFx(videoFxAtPlayhead(selectedVideoClip()?.clip)); output.textContent = input.value; });
      row.append(input, output);
    } else {
      const pair = document.createElement('div'); pair.className = 'video-fx-control-inputs';
      const slider = document.createElement('input'); slider.type = 'range'; slider.min = String(optionsOrMin); slider.max = String(maxOrType); slider.step = key === 'kaleidoscopeSegments' ? '1' : '1'; slider.value = String(target[key] ?? (key === 'kaleidoscopeSegments' ? 6 : 0));
      const number = document.createElement('input'); number.type = 'number'; number.className = 'video-fx-number'; number.min = slider.min; number.max = slider.max; number.step = slider.step; number.value = slider.value; number.setAttribute('aria-label', label + ' value');
      const keyButton = document.createElement('button'); keyButton.type = 'button'; keyButton.className = 'video-fx-keyframe-button'; keyButton.textContent = '◆'; keyButton.title = 'Set ' + label + ' keyframe'; keyButton.setAttribute('aria-label', keyButton.title);
      const update = raw => { const val = Math.max(Number(slider.min), Math.min(Number(slider.max), Number(raw))); if (!Number.isFinite(val)) return; slider.value = number.value = String(val); output.textContent = String(val); setSelectedVideoFxField(key, val); applyVideoFx(videoFxAtPlayhead(selectedVideoClip()?.clip)); };
      output.textContent = slider.value;
      slider.addEventListener('pointerdown', () => recordUndo(), { passive: true }); number.addEventListener('focus', () => recordUndo());
      slider.addEventListener('input', () => update(slider.value)); number.addEventListener('change', () => update(number.value));
      keyButton.addEventListener('click', () => addVideoFxFieldKeyframe(key));
      pair.append(slider, number, keyButton); row.append(pair, output);
    }
    section.append(row);
  }
  codexDistortionControls.append(section);
}
function moveCodexEffect(target,index,direction) { const next=index+direction; if(next<0||next>=target.codexEffects.length)return; recordUndo(); [target.codexEffects[index],target.codexEffects[next]]=[target.codexEffects[next],target.codexEffects[index]]; applyVideoFx(target); renderVideoFxBrowser(); }

function installedDirectxPlugins() {
  try {
    const entries = JSON.parse(localStorage.getItem('fish-video-wax-installs') || '[]');
    return Array.isArray(entries) ? entries.filter(entry => entry.category === 'DirectX (Legacy)' && isDirectxPluginCompatible(entry)) : [];
  } catch { return []; }
}
function installedSapphirePlugins() {
  try {
    const entries = JSON.parse(localStorage.getItem('fish-video-wax-installs') || '[]');
    return Array.isArray(entries)
      ? entries.filter(entry => (entry.isSapphire || /sapphire/i.test(entry.name || '')) && ['DirectX (Legacy)', 'OFX'].includes(entry.category) && isDirectxPluginCompatible(entry))
      : [];
  } catch { return []; }
}
function sapphireMajor(plugin) {
  const match = String(plugin?.name || '').match(/Sapphire\s+(\d+)/i);
  if (!match) return 0;
  const value = Number(match[1]);
  return value >= 2019 ? 99 : value;
}
function isDirectxPluginCompatible(plugin) {
  const compatibility = String(plugin.compatibility || '').toLowerCase();
  const releases = [...compatibility.matchAll(/\d+(?:\.\d+)?/g)].map(match => Number.parseFloat(match[0]));
  const minRelease = Number.isFinite(plugin.minRelease) ? plugin.minRelease
    : compatibility.includes('and newer') ? releases[0] || 0 : releases.length > 1 ? releases[0] : 0;
  const maxRelease = Number.isFinite(plugin.maxRelease) ? plugin.maxRelease
    : compatibility.includes('and older') ? releases[0] || Infinity
      : compatibility.includes('and newer') ? Infinity
        : releases.length > 1 ? releases[1] : releases[0] || Infinity;
  return activeRelease >= minRelease && activeRelease <= maxRelease;
}
const sapphireCatalog = [
  { id: 'S_Glow', min: 5, controls: [['s_GlowIntensity', 'Intensity', 0, 100, '%']] },
  { id: 'S_Blur', min: 5, controls: [['s_BlurAmount', 'Amount', 0, 100, '%']] },
  { id: 'S_Shake', min: 5, controls: [['s_ShakeAmplitude', 'Amplitude', 0, 100, '%'], ['s_ShakeFrequency', 'Frequency', 1, 30, ' Hz']] },
  { id: 'S_LensFlare', min: 5, controls: [['s_LensFlareIntensity', 'Intensity', 0, 100, '%']] },
  { id: 'S_WarpBubble', min: 6, controls: [['s_WarpBubbleAmount', 'Amount', 0, 100, '%']] },
];
function hasSapphireEventPlugin(fx, plugin) {
  return fx.effects.includes('directx:' + plugin.key) || fx.effects.includes('sapphire:' + plugin.key);
}
function renderSapphireEventControls(target, displayFx, plugins) {
  sapphireEffectControls.replaceChildren();
  const activePlugins = target ? plugins.filter(plugin => hasSapphireEventPlugin(displayFx, plugin)) : [];
  sapphireEventUi.hidden = activePlugins.length === 0;
  if (!activePlugins.length) { sapphireVersionLabel.textContent = ''; return; }
  const major = Math.max(...activePlugins.map(sapphireMajor));
  sapphireVersionLabel.textContent = major >= 99 ? 'newer build' : major ? major + '.x' : 'installed';
  const available = sapphireCatalog.filter(effect => major >= effect.min).map(effect => ({ ...effect, controls: [...effect.controls] }));
  if (major >= 8) {
    const shake = available.find(effect => effect.id === 'S_Shake');
    if (shake) shake.controls.push(['s_ShakeRGB', 'RGB shift', 0, 100, '%']);
  }
  for (const effect of available) {
    const section = document.createElement('section'); section.className = 'video-fx-row sapphire-effect-row';
    const heading = document.createElement('div'); heading.className = 'video-fx-row-heading';
    const title = document.createElement('strong'); title.textContent = effect.id;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'fx-remove-button'; remove.textContent = '×'; remove.title = 'Remove ' + effect.id;
    remove.addEventListener('click', () => { recordUndo(); setSelectedVideoFxField('sapphireEffects', displayFx.sapphireEffects.filter(id => id !== effect.id)); applyVideoFx(videoFxAtPlayhead(selectedVideoClip()?.clip)); renderTracks(); renderVideoFxBrowser(); });
    heading.append(title, remove); section.append(heading);
    if (!(displayFx.sapphireEffects || []).includes(effect.id)) {
      const hint = document.createElement('p'); hint.className = 'fx-chain-empty'; hint.textContent = 'Add this S_ effect from the Sapphire list.'; section.append(hint);
    } else {
      for (const [fieldName, label, min, max, unit] of effect.controls) {
        const field = document.createElement('div'); field.className = 'video-fx-control video-fx-keyframe-control';
        const caption = document.createElement('span'); caption.textContent = label;
        const output = document.createElement('output');
        const pair = document.createElement('div'); pair.className = 'video-fx-control-inputs';
        const range = document.createElement('input'); range.type = 'range'; range.min = String(min); range.max = String(max); range.step = '1'; range.value = String(displayFx[fieldName] ?? 0);
        const number = document.createElement('input'); number.type = 'number'; number.className = 'video-fx-number'; number.min = range.min; number.max = range.max; number.step = range.step; number.value = range.value; number.setAttribute('aria-label', label + ' value');
        const keyButton = document.createElement('button'); keyButton.type = 'button'; keyButton.className = 'video-fx-keyframe-button'; keyButton.textContent = '◆'; keyButton.title = 'Set ' + label + ' keyframe'; keyButton.setAttribute('aria-label', keyButton.title);
        const sync = raw => { const value = Math.max(min, Math.min(max, Number(raw))); if (!Number.isFinite(value)) return; range.value = number.value = String(value); output.textContent = value + unit; setSelectedVideoFxField(fieldName, value); applyVideoFx(videoFxAtPlayhead(selectedVideoClip()?.clip)); };
        output.textContent = Number(range.value) + unit;
        range.addEventListener('pointerdown', () => recordUndo(), { passive: true }); number.addEventListener('focus', () => recordUndo());
        range.addEventListener('input', () => sync(range.value)); number.addEventListener('change', () => sync(number.value));
        keyButton.addEventListener('click', () => addVideoFxFieldKeyframe(fieldName));
        pair.append(range, number, keyButton); field.append(caption, output, pair); section.append(field);
      }
    }
    sapphireEffectControls.append(section);
  }
  if (!available.length) { const note = document.createElement('p'); note.className = 'fx-chain-empty'; note.textContent = 'No Sapphire-style effects are exposed for this installed version.'; sapphireEffectControls.append(note); }
}
function sapphireCssFilters(fx) {
  const effects = new Set(fx.sapphireEffects || []), filters = [];
  if (effects.has('S_Glow')) filters.push('drop-shadow(0 0 ' + (Number(fx.s_GlowIntensity) / 5) + 'px rgba(255,245,220,.9))');
  if (effects.has('S_Blur')) filters.push('blur(' + (Number(fx.s_BlurAmount) / 12) + 'px)');
  if (effects.has('S_LensFlare')) filters.push('drop-shadow(0 0 ' + (Number(fx.s_LensFlareIntensity) / 3) + 'px rgba(255,240,190,.8))');
  if (effects.has('S_Shake') && Number(fx.s_ShakeRGB) > 0) filters.push('hue-rotate(' + (Number(fx.s_ShakeRGB) * 1.8) + 'deg)');
  return filters;
}
function canvasVideoFxNeeded(fx, active) {
  return (fx.codexEffects || []).some((name)=>['Bend','Corner Pin','Hexagon Tiles','Square Tiles','Kaleidoscope','Warp Waves'].includes(name)) || (fx.sapphireEffects||[]).includes('S_WarpBubble') || active.has('cookieCutter') || active.has('mirror') ||
    (active.has('pixelate') && Number(fx.pixelSize) > 0) || (active.has('swirl') && Number(fx.swirlAmount) !== 0) ||
    (active.has('wave') && (Number(fx.waveAmountH) || Number(fx.waveAmountV))) ||
    (active.has('deform') && (Number(fx.deformSqueeze) || Number(fx.deformShear) || Number(fx.deformCurve))) ||
    (active.has('pinchPunch') && Number(fx.pinchPunch)) || (active.has('sharpen') && Number(fx.sharpen) > 0) ||
    (active.has('minMax') && (Number(fx.minMax) || Number(fx.minThreshold) || Number(fx.maxThreshold) !== 100)) ||
    (active.has('blackWhite') && Number(fx.blackWhiteAmount) > 0) || (active.has('sepia') && Number(fx.sepiaAmount) > 0) ||
    (active.has('invert') && (fx.invertRed || fx.invertGreen || fx.invertBlue));
}
function samplePixels(source, width, height, x, y, target, targetIndex) {
  const sx = Math.round(x), sy = Math.round(y);
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) {
    target[targetIndex] = target[targetIndex + 1] = target[targetIndex + 2] = target[targetIndex + 3] = 0;
    return;
  }
  const sourceIndex = (sy * width + sx) * 4;
  target[targetIndex] = source[sourceIndex]; target[targetIndex + 1] = source[sourceIndex + 1];
  target[targetIndex + 2] = source[sourceIndex + 2]; target[targetIndex + 3] = source[sourceIndex + 3];
}
function warpPixels(source, width, height, mapPoint, background = null) {
  const output = new Uint8ClampedArray(source.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const point = mapPoint(x, y);
      const sx = Math.round(point.x), sy = Math.round(point.y);
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) {
        if (background) { output[index] = background[0]; output[index + 1] = background[1]; output[index + 2] = background[2]; output[index + 3] = 255; }
        else output[index] = output[index + 1] = output[index + 2] = output[index + 3] = 0;
      } else samplePixels(source, width, height, sx, sy, output, index);
    }
  }
  return output;
}
function cookiePointInside(shape, x, y) {
  const nx = (x - .5) * 2, ny = (y - .5) * 2;
  if (shape === 'circle') return nx * nx + ny * ny <= 1;
  if (shape === 'square') return Math.abs(nx) <= 1 && Math.abs(ny) <= 1;
  if (shape === 'rectangle') return Math.abs(nx) <= 1 && Math.abs(ny) <= .62;
  if (shape === 'triangle') return ny >= -1 && ny <= 1 && Math.abs(nx) <= (ny + 1) / 2;
  if (shape === 'diamond') return Math.abs(nx) + Math.abs(ny) <= 1;
  if (shape === 'hexagon') return Math.abs(ny) <= 1 && Math.abs(nx) <= 1 - Math.abs(ny) * .42;
  if (shape === 'star') {
    const angle = Math.atan2(ny, nx) + Math.PI / 2;
    const radius = Math.hypot(nx, ny);
    const edge = .52 + .48 * Math.cos(5 * angle);
    return radius <= edge;
  }
  return true;
}
function cookieShapePath(context, shape, x, y, width, height) {
  context.beginPath();
  if (shape === 'circle') {
    context.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else if (shape === 'triangle' || shape === 'diamond' || shape === 'hexagon' || shape === 'star') {
    const sides = shape === 'triangle' ? 3 : shape === 'diamond' ? 4 : shape === 'hexagon' ? 6 : 10;
    for (let index = 0; index < sides; index++) {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / sides;
      const radius = shape === 'star' && index % 2 ? .48 : 1;
      const px = x + width / 2 + Math.cos(angle) * width / 2 * radius;
      const py = y + height / 2 + Math.sin(angle) * height / 2 * radius;
      if (!index) context.moveTo(px, py); else context.lineTo(px, py);
    }
    context.closePath();
  } else context.rect(x, y + (shape === 'rectangle' ? height * .19 : 0), width, height * (shape === 'rectangle' ? .62 : 1));
}
function processVideoFxFrame(sourceElement, fx) {
  const sourceWidth = sourceElement instanceof HTMLVideoElement ? sourceElement.videoWidth : sourceElement.naturalWidth;
  const sourceHeight = sourceElement instanceof HTMLVideoElement ? sourceElement.videoHeight : sourceElement.naturalHeight;
  if (!sourceWidth || !sourceHeight) return false;
  const quality=previewStage.dataset.quality||'auto'; const limit=({draft:320,preview:480,good:540,best:720,auto:480})[quality]||480;
  const scale = Math.min(1, limit / sourceWidth, limit / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale)), height = Math.max(1, Math.round(sourceHeight * scale));
  if (videoFxCanvas.width !== width || videoFxCanvas.height !== height) {
    videoFxCanvas.width = width; videoFxCanvas.height = height;
  }
  const context = videoFxCanvas.getContext('2d', { willReadFrequently: true });
  context.clearRect(0, 0, width, height);
  context.drawImage(sourceElement, 0, 0, width, height);
  let pixels = context.getImageData(0, 0, width, height).data;
  for (const effect of fx.effects || []) {
    if (effect === 'invert' && (fx.invertRed || fx.invertGreen || fx.invertBlue)) {
      const inverted = new Uint8ClampedArray(pixels);
      for (let index = 0; index < inverted.length; index += 4) {
        if (fx.invertRed) inverted[index] = 255 - inverted[index];
        if (fx.invertGreen) inverted[index + 1] = 255 - inverted[index + 1];
        if (fx.invertBlue) inverted[index + 2] = 255 - inverted[index + 2];
      }
      pixels = inverted;
    } else if (effect === 'sharpen' && Number(fx.sharpen) > 0) {
      const amount=Math.max(0,Math.min(1,Number(fx.sharpen))); const sharpened=new Uint8ClampedArray(pixels);
      for(let y=1;y<height-1;y++) for(let x=1;x<width-1;x++){ const i=(y*width+x)*4; for(let c=0;c<3;c++){ const original=pixels[i+c]; const edge=original*5-pixels[i-width*4+c]-pixels[i+width*4+c]-pixels[i-4+c]-pixels[i+4+c]; sharpened[i+c]=original+(edge-original)*amount; } }
      pixels=sharpened;
    } else if (effect === 'blackWhite' && Number(fx.blackWhiteAmount) > 0) {
      const amount = Math.max(0, Math.min(1, Number(fx.blackWhiteAmount)));
      const adjusted = new Uint8ClampedArray(pixels);
      for (let i = 0; i < adjusted.length; i += 4) { const gray = adjusted[i] * .2126 + adjusted[i + 1] * .7152 + adjusted[i + 2] * .0722; for (let c = 0; c < 3; c++) adjusted[i + c] = pixels[i + c] * (1 - amount) + gray * amount; }
      pixels = adjusted;
    } else if (effect === 'sepia' && Number(fx.sepiaAmount) > 0) {
      const amount = Math.max(0, Math.min(1, Number(fx.sepiaAmount)));
      const tint = fx.sepiaColor || '#704214'; const tr = parseInt(tint.slice(1,3),16), tg = parseInt(tint.slice(3,5),16), tb = parseInt(tint.slice(5,7),16);
      const adjusted = new Uint8ClampedArray(pixels);
      for (let i = 0; i < adjusted.length; i += 4) { const lum = pixels[i] * .299 + pixels[i+1] * .587 + pixels[i+2] * .114; adjusted[i] = pixels[i] * (1-amount) + (lum * tr/180) * amount; adjusted[i+1] = pixels[i+1] * (1-amount) + (lum * tg/180) * amount; adjusted[i+2] = pixels[i+2] * (1-amount) + (lum * tb/180) * amount; }
      pixels = adjusted;
    } else if (effect === 'minMax') {
      const low = Math.max(0, Math.min(254, Number(fx.minThreshold) * 2.55)); const high = Math.max(low + 1, Math.min(255, Number(fx.maxThreshold) * 2.55));
      const strength = Number(fx.minMax) === 0 ? 1 : Math.max(0, Math.min(1, Number(fx.minMax) / 100)); const adjusted = new Uint8ClampedArray(pixels);
      for (let i=0;i<adjusted.length;i+=4) for(let c=0;c<3;c++){ const v=Math.max(0,Math.min(255,(pixels[i+c]-low)*255/(high-low))); adjusted[i+c]=pixels[i+c]*(1-strength)+v*strength; }
      pixels=adjusted;
    } else if (effect === 'pixelate') {
      const block = Math.max(1, Math.round(1 + Math.pow(Number(fx.pixelSize), 2) * Math.min(width, height) * .18));
      const pixelated = new Uint8ClampedArray(pixels.length);
      for (let y = 0; y < height; y += block) {
        for (let x = 0; x < width; x += block) {
          const sourceIndex = (Math.min(height - 1, y + Math.floor(block / 2)) * width + Math.min(width - 1, x + Math.floor(block / 2))) * 4;
          for (let by = y; by < Math.min(height, y + block); by++) {
            for (let bx = x; bx < Math.min(width, x + block); bx++) {
              const targetIndex = (by * width + bx) * 4;
              pixelated[targetIndex] = pixels[sourceIndex]; pixelated[targetIndex + 1] = pixels[sourceIndex + 1];
              pixelated[targetIndex + 2] = pixels[sourceIndex + 2]; pixelated[targetIndex + 3] = pixels[sourceIndex + 3];
            }
          }
        }
      }
      pixels = pixelated;
    } else if (effect === 'swirl' && Number(fx.swirlAmount)) {
      const centerX = width * Number(fx.swirlX) / 100, centerY = height * Number(fx.swirlY) / 100;
      const radius = Math.max(1, Math.min(width, height) * Number(fx.swirlSize) / 100);
      const amount = Number(fx.swirlAmount) * Math.PI * 2;
      pixels = warpPixels(pixels, width, height, (x, y) => {
        const dx = x - centerX, dy = y - centerY, distance = Math.hypot(dx, dy);
        if (distance > radius) return { x, y };
        const strength = 1 - distance / radius, angle = -amount * strength * strength;
        return { x: centerX + dx * Math.cos(angle) - dy * Math.sin(angle), y: centerY + dx * Math.sin(angle) + dy * Math.cos(angle) };
      });
    } else if (effect === 'wave' && (Number(fx.waveAmountH) || Number(fx.waveAmountV))) {
      const amountX = Number(fx.waveAmountH) * width * .12, amountY = Number(fx.waveAmountV) * height * .12;
      const cyclesX = 1 / Math.max(.02, Number(fx.waveSizeH)), cyclesY = 1 / Math.max(.02, Number(fx.waveSizeV)); const phase = Number(fx.wavePhase) * Math.PI / 180;
      pixels = warpPixels(pixels, width, height, (x, y) => ({ x: x - Math.sin(y / height * Math.PI * 2 * cyclesY + phase) * amountX, y: y - Math.sin(x / width * Math.PI * 2 * cyclesX + phase) * amountY }));
    } else if (effect === 'deform' && (Number(fx.deformSqueeze) || Number(fx.deformShear) || Number(fx.deformCurve))) {
      const squeeze=Number(fx.deformSqueeze), shear=Number(fx.deformShear), curve=Number(fx.deformCurve), center=fx.deformCenter !== false;
      const bg=(fx.deformBackground||'#000000').match(/[0-9a-f]{2}/gi)?.map(v=>parseInt(v,16))||[0,0,0];
      pixels=warpPixels(pixels,width,height,(x,y)=>{
        let nx=center ? (x/width-.5)*2 : x/width, ny=center ? (y/height-.5)*2 : y/height;
        let sx=nx, sy=ny;
        if(fx.deformLeft) sx += squeeze*.45*(center ? (1-nx)*Math.max(0,-nx) : (1-nx)); if(fx.deformRight) sx -= squeeze*.45*(center ? (1+nx)*Math.max(0,nx) : nx);
        if(fx.deformTop) sy += squeeze*.45*(center ? (1-ny)*Math.max(0,-ny) : (1-ny)); if(fx.deformBottom) sy -= squeeze*.45*(center ? (1+ny)*Math.max(0,ny) : ny);
        const ux=center?ny:ny-.5, uy=center?nx:nx-.5;
        if(fx.deformShearHorizontal) sx += shear*.35*ux; if(fx.deformShearVertical) sy += shear*.35*uy;
        if(fx.deformCurveLeft) sx += curve*.35*(1-Math.abs(ux))*Math.max(0,center?-nx:1-nx); if(fx.deformCurveRight) sx -= curve*.35*(1-Math.abs(ux))*Math.max(0,center?nx:nx);
        if(fx.deformCurveTop) sy += curve*.35*(1-Math.abs(uy))*Math.max(0,center?-ny:1-ny); if(fx.deformCurveBottom) sy -= curve*.35*(1-Math.abs(uy))*Math.max(0,center?ny:ny);
        return center ? {x:(sx+1)*width/2,y:(sy+1)*height/2} : {x:sx*width,y:sy*height};
      },bg);
    } else if (effect === 'pinchPunch' && Number(fx.pinchPunch)) {
      const amount=Number(fx.pinchPunch), cx=width/2, cy=height/2, radius=Math.min(width,height)*.72;
      pixels=warpPixels(pixels,width,height,(x,y)=>{const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)/radius;if(d>=1)return{x,y};const k=1-amount*.85*(1-d)*(1-d);return{x:cx+dx*k,y:cy+dy*k};});
    } else if (effect === 'mirror') {
      const center = Number(fx.mirrorPosition) / 100;
      if (fx.mirrorAxis === 'horizontal') {
        pixels = warpPixels(pixels, width, height, (x, y) => {
          const axis = height * center;
          return { x, y: y > axis ? axis - (y - axis) : y };
        });
      } else {
        pixels = warpPixels(pixels, width, height, (x, y) => {
          const axis = width * center;
          return { x: x > axis ? axis - (x - axis) : x, y };
        });
      }
    } else if (effect === 'cookieCutter') {
      const countX = Math.max(1, Math.round(Number(fx.cookieAmountX) || 1));
      const countY = Math.max(1, Math.round(Number(fx.cookieAmountY) || 1));
      const size = Math.max(5, Math.min(100, Number(fx.cookieSize) || 80)) / 100;
      const cutOut = fx.cookieMode === 'out';
      const masked = new Uint8ClampedArray(pixels);
      const feather = Math.max(0, Number(fx.cookieFeather) || 0) * scale;
      for (let y = 0; y < height; y++) {
        const cellY = Math.min(countY - 1, Math.floor(y / height * countY));
        const cellTop = cellY * height / countY, cellHeight = height / countY;
        for (let x = 0; x < width; x++) {
          const cellX = Math.min(countX - 1, Math.floor(x / width * countX));
          const cellLeft = cellX * width / countX, cellWidth = width / countX;
          const rectangle = fx.cookieShape === 'rectangle';
          const shapeWidth = (rectangle ? cellWidth : Math.min(cellWidth, cellHeight)) * size;
          const shapeHeight = (rectangle ? cellHeight : Math.min(cellWidth, cellHeight)) * size;
          const left = cellLeft + (cellWidth - shapeWidth) / 2;
          const top = cellTop + (cellHeight - shapeHeight) / 2;
          const localX = (x - left) / shapeWidth; const localY = (y - top) / shapeHeight;
          let coverage = cookiePointInside(fx.cookieShape, localX, localY) ? 1 : 0;
          if (feather > 0) { let insideSamples = 0; const offsets = [[-1,0],[1,0],[0,-1],[0,1],[-.707,-.707],[.707,-.707],[-.707,.707],[.707,.707]]; for (const [ox,oy] of offsets) if (cookiePointInside(fx.cookieShape, localX + ox*feather/shapeWidth, localY + oy*feather/shapeHeight)) insideSamples++; coverage = insideSamples / offsets.length; }
          const keep = cutOut ? 1 - coverage : coverage;
          masked[(y * width + x) * 4 + 3] = Math.round(masked[(y * width + x) * 4 + 3] * keep);
        }
      }
      pixels = masked;
    }
  }
  const codex = new Set(fx.codexEffects || []);
  const angle = (Number(fx.tileRotate) || 0) * Math.PI / 180;
  if (codex.has('Bend') && Number(fx.bendAmount)) {
    const bend = Number(fx.bendAmount) / 100 * width * .18;
    pixels = warpPixels(pixels,width,height,(x,y)=>({x:x + Math.sin((y/height)*Math.PI*2)*bend,y}));
  }
  if (codex.has('Corner Pin')) {
    const tl=Number(fx.cornerTopLeft)||0,tr=Number(fx.cornerTopRight)||0,br=Number(fx.cornerBottomRight)||0,bl=Number(fx.cornerBottomLeft)||0;
    if(tl||tr||br||bl) pixels=warpPixels(pixels,width,height,(x,y)=>{const nx=x/width,ny=y/height; const a=(1-nx)*(1-ny)*tl+nx*(1-ny)*tr+nx*ny*br+(1-nx)*ny*bl; return {x:x + a*width*.006*(nx<.5?-1:1),y:y+a*height*.006*(ny<.5?-1:1)};});
  }
  if (codex.has('Kaleidoscope')) {
    const count=Math.max(2,Math.min(16,Math.round(Number(fx.kaleidoscopeSegments)||6))),rotation=(Number(fx.kaleidoscopeRotation)||0)*Math.PI/180 + (performance.now()/1000)*(Number(fx.kaleidoscopeSpeed)||0)*.1, sector=Math.PI*2/count,cx=width/2,cy=height/2;
    pixels=warpPixels(pixels,width,height,(x,y)=>{const dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx)-rotation; let m=((a%sector)+sector)%sector; if(Math.floor((a+Math.PI*2)/sector)%2)m=sector-m; const q=m+rotation; return {x:cx+r*Math.cos(q),y:cy+r*Math.sin(q)};});
  }
  if (codex.has('Square Tiles') || codex.has('Hexagon Tiles')) {
    const count=Math.max(2,Math.min(12,Math.round(2+(Number(fx.tileShift)||0)/12))),hex=codex.has('Hexagon Tiles');
    pixels=warpPixels(pixels,width,height,(x,y)=>{let gx=x/width*count,gy=y/height*count; if(hex)gx+=(Math.floor(gy)%2)*.5; let col=Math.floor(gx),row=Math.floor(gy),u=gx-col,v=gy-row; if((col+row)%2){u=1-u;v=1-v;} if(angle){const dx=u-.5,dy=v-.5;u=dx*Math.cos(angle)-dy*Math.sin(angle)+.5;v=dx*Math.sin(angle)+dy*Math.cos(angle)+.5;} return {x:Math.max(0,Math.min(width-1,u*width)),y:Math.max(0,Math.min(height-1,v*height))};});
  }
  if (codex.has('Warp Waves') && Number(fx.warpWaveAmount)) {
    const amp=Number(fx.warpWaveAmount)/100*Math.min(width,height)*.12,phase=performance.now()/1000*(Number(fx.warpWaveSpeed)||0)*Math.PI,theta=(Number(fx.warpWaveAngle)||0)*Math.PI/180,axis=fx.warpWaveAxis||'horizontal';
    pixels=warpPixels(pixels,width,height,(x,y)=>{const wave=Math.sin((x*Math.sin(theta)+y*Math.cos(theta))/Math.min(width,height)*Math.PI*4+phase)*amp; return {x:x+(axis==='vertical'?0:wave),y:y+(axis==='horizontal'?0:wave)};});
  }
  if ((fx.sapphireEffects||[]).includes('S_WarpBubble') && Number(fx.s_WarpBubbleAmount)) {
    const cx=width/2,cy=height/2,radius=Math.min(width,height)*.48,power=Number(fx.s_WarpBubbleAmount)/100*.32;
    pixels=warpPixels(pixels,width,height,(x,y)=>{const dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy)/radius;if(r>=1)return{x,y};const scale=1-power*(1-r*r);return{x:cx+dx*scale,y:cy+dy*scale};});
  }
  context.putImageData(new ImageData(pixels, width, height), 0, 0);
  if (fx.effects?.includes('cookieCutter') && Number(fx.cookieBorderSize) > 0) {
    const countX = Math.max(1, Math.round(Number(fx.cookieAmountX) || 1));
    const countY = Math.max(1, Math.round(Number(fx.cookieAmountY) || 1));
    const size = Math.max(5, Math.min(100, Number(fx.cookieSize) || 80)) / 100;
    context.strokeStyle = fx.cookieBorderColor || '#ffffff';
    context.lineWidth = Number(fx.cookieBorderSize) * scale;
    for (let row = 0; row < countY; row++) {
      for (let column = 0; column < countX; column++) {
        const cellWidth = width / countX, cellHeight = height / countY;
        const rectangle = fx.cookieShape === 'rectangle';
        const shapeWidth = (rectangle ? cellWidth : Math.min(cellWidth, cellHeight)) * size;
        const shapeHeight = (rectangle ? cellHeight : Math.min(cellWidth, cellHeight)) * size;
        cookieShapePath(context, fx.cookieShape, column * cellWidth + (cellWidth - shapeWidth) / 2, row * cellHeight + (cellHeight - shapeHeight) / 2, shapeWidth, shapeHeight);
        context.stroke();
      }
    }
  }
  return true;
}
function processVideoFxFrameSafe(sourceElement, fx) {
  try {
    const rendered = processVideoFxFrame(sourceElement, fx);
    if (!rendered) return false;
    if (videoFxLastGoodCanvas.width !== videoFxCanvas.width || videoFxLastGoodCanvas.height !== videoFxCanvas.height) {
      videoFxLastGoodCanvas.width = videoFxCanvas.width; videoFxLastGoodCanvas.height = videoFxCanvas.height;
    }
    videoFxLastGoodCanvas.getContext('2d').drawImage(videoFxCanvas, 0, 0);
    videoFxHasLastGoodFrame = true;
    return true;
  } catch (error) {
    if (videoFxHasLastGoodFrame && videoFxLastGoodCanvas.width && videoFxLastGoodCanvas.height) {
      const context = videoFxCanvas.getContext('2d');
      context.clearRect(0, 0, videoFxCanvas.width, videoFxCanvas.height);
      context.drawImage(videoFxLastGoodCanvas, 0, 0, videoFxCanvas.width, videoFxCanvas.height);
    }
    console.debug('Holding the last valid FX frame', error);
    return false;
  }
}
function stopVideoFxCanvas() {
  if (videoFxCanvasFrame) cancelAnimationFrame(videoFxCanvasFrame);
  videoFxCanvasFrame = 0; videoFxCanvasSource = null; videoFxCanvasSettings = null; videoFxCanvas.hidden = true; videoFxHasLastGoodFrame = false;
  videoFxCanvas.style.filter = ''; videoFxCanvas.style.transform = ''; videoFxCanvas.style.boxShadow = '';
  previewVideo.style.visibility = ''; previewImage.style.visibility = '';
}
function applyVideoFx(settings = selectedVideoClip()?.clip.videoFx) {
  const video = !previewVideo.hidden;
  const element = video ? previewVideo : !previewImage.hidden ? previewImage : null;
  if (!element) { stopVideoFxCanvas(); return; }
  const fx = { ...defaultVideoFx(), ...(settings || {}) };
  refreshSapphireWatermark(fx);
  const active = new Set(fx.effects || []);
  const filterByEffect = new Map();
  if (active.has('brightnessContrast')) filterByEffect.set('brightnessContrast', [`brightness(${fx.brightness / 100})`, `contrast(${fx.contrast / 100})`]);
  if (active.has('colorCorrector')) filterByEffect.set('colorCorrector', [`saturate(${fx.saturation / 100})`, `hue-rotate(${fx.hue}deg)`]);
  if (active.has('gaussianBlur')) filterByEffect.set('gaussianBlur', [`blur(${fx.blur}px)`]);
  if (active.has('glow') && fx.glow > 0) filterByEffect.set('glow', [`drop-shadow(0 0 ${fx.glow / 5}px ${fx.glowColor || '#ffffff'})`]);
  if (active.has('channelBlend')) filterByEffect.set('channelBlend', [`hue-rotate(${fx.channelBlend * 1.8}deg)`]);
  if (active.has('lightRays')) filterByEffect.set('lightRays', [`drop-shadow(0 0 ${fx.lightRays / 4}px rgba(255,255,220,.9))`]);
  if (active.has('rays')) filterByEffect.set('rays', [`drop-shadow(0 0 ${fx.rays / 4}px rgba(255,255,220,.9))`]);
  if (active.has('starburst')) filterByEffect.set('starburst', [`drop-shadow(0 0 ${fx.starburst / 4}px rgba(255,255,220,.9))`]);
  if (active.has('radialBlur')) filterByEffect.set('radialBlur', [`blur(${fx.radialBlur}px)`]);
  if (active.has('minMax')) filterByEffect.set('minMax', [`contrast(${1 + fx.minMax / 150})`]);
  if (active.has('gradientMap')) filterByEffect.set('gradientMap', [`sepia(${fx.gradientMap / 100})`]);
  if (active.has('hslAdjust')) filterByEffect.set('hslAdjust', [`saturate(${fx.saturation / 100})`, `hue-rotate(${fx.hue}deg)`]);
  if (active.has('softContrast')) filterByEffect.set('softContrast', [`contrast(${1 - fx.softContrast / 300})`]);
  if (active.has('tvSimulator')) filterByEffect.set('tvSimulator', [`contrast(${1 + fx.tvSimulator / 200})`, `saturate(${1 - fx.tvSimulator / 100})`]);
  const filters = [...(fx.effects || []).flatMap((effect) => filterByEffect.get(effect) || []), ...sapphireCssFilters(fx)];
  const codexActive = new Set(fx.codexEffects || []);
  const codexTransforms = [];

  if (codexActive.has('Flip')) codexTransforms.push('scaleX(' + (['horizontal', 'both'].includes(fx.flipMode) ? -1 : 1) + ') scaleY(' + (['vertical', 'both'].includes(fx.flipMode) ? -1 : 1) + ')');

  if (codexActive.has('Squeeze')) { const squeeze = Number(fx.squeezeAmount || 0) / 100; codexTransforms.push('scaleX(' + (1 - squeeze * .65) + ') scaleY(' + (1 + squeeze * .35) + ')'); }
  if (codexActive.has('S_Shake') || (fx.sapphireEffects || []).includes('S_Shake')) { const strength=Number(fx.s_ShakeAmplitude||0)/5, phase=performance.now()/1000*Number(fx.s_ShakeFrequency||8)*Math.PI*2; codexTransforms.push('translate('+(Math.sin(phase)*strength)+'px, '+(Math.cos(phase*.83)*strength)+'px)'); }

  const transforms = {
    deform: '',
    pinchPunch: '',
    mirror: active.has('mirror') ? `rotate(${Number(fx.mirrorRotation) || 0}deg)` : '',
    spherize: active.has('spherize') ? `scaleX(${1 + fx.spherize / 500}) scaleY(${1 - fx.spherize / 700})` : '',
  };
  const zoom = Math.max(25, Math.min(400, Number(fx.panZoom) || 100)) / 100;
  const panX = (Number(fx.panX) || 0) / 100 * previewStage.clientWidth * .5;
  const panY = (Number(fx.panY) || 0) / 100 * previewStage.clientHeight * .5;
  const rotation = Number(fx.panRotation) || 0;
  const flipX = Number(fx.panFlipX) || 1, flipY = Number(fx.panFlipY) || 1;
  const panCropTransform = zoom !== 1 || panX || panY || rotation || flipX < 0 || flipY < 0 ? `translate(${panX}px, ${panY}px) rotate(${rotation}deg) scale(${zoom * flipX}, ${zoom * flipY})` : '';
  element.style.transform = [panCropTransform, ...(fx.effects || []).map((effect) => transforms[effect] || ''), ...codexTransforms].filter(Boolean).join(' ');
  element.style.clipPath = '';
  element.style.boxShadow = active.has('border') ? `inset 0 0 0 ${fx.borderAmount}px rgba(255,255,255,.9)` : '';
  element.style.filter = filters.join(' ');

  if (!canvasVideoFxNeeded(fx, active)) { stopVideoFxCanvas(); return; }
  if (videoFxCanvasFrame) cancelAnimationFrame(videoFxCanvasFrame);
  videoFxCanvas.hidden = false; videoFxCanvasSource = element; videoFxCanvasSettings = fx;
  element.style.visibility = 'hidden';
  videoFxCanvas.style.filter = filters.join(' ');
  videoFxCanvas.style.transform = element.style.transform;
  videoFxCanvas.style.boxShadow = element.style.boxShadow;
  const render = (timestamp = performance.now()) => {
    // Live preview only: keep the media element's own clock authoritative.
    if (videoFxCanvasSource !== element || videoFxCanvas.hidden) {
      videoFxCanvasFrame = 0;
      return;
    }
    const playingVideo = element instanceof HTMLVideoElement && !element.paused && !element.ended;
    if (!playingVideo || timestamp - videoFxCanvasLastFrameAt >= 1000 / 30) {
      videoFxCanvasLastFrameAt = timestamp;
      processVideoFxFrameSafe(element, fx);
    }
    if (playingVideo) videoFxCanvasFrame = requestAnimationFrame(render);
    else videoFxCanvasFrame = 0;
  };
  videoFxCanvasFrame = requestAnimationFrame(render);
}
previewVideo.addEventListener('loadeddata', () => {
  if (!videoFxCanvas.hidden && videoFxCanvasSource === previewVideo) applyVideoFx(videoFxCanvasSettings);
  else if (!previewVideo.hidden && activePreviewVideoFx) applyVideoFx(activePreviewVideoFx);
});
previewImage.addEventListener('load', () => {
  if (!videoFxCanvas.hidden && videoFxCanvasSource === previewImage) applyVideoFx(videoFxCanvasSettings);
  else if (!previewImage.hidden && activePreviewVideoFx) applyVideoFx(activePreviewVideoFx);
});
function renderVideoFxBrowser() {
  if (!videoFxBrowser) return;
  const selection = selectedVideoClip();
  const target = selection ? ensureVideoFx(selection.clip) : null;
  const displayFx = selection ? videoFxAtPlayhead(selection.clip) : null;
  videoFxHint.textContent = selection
    ? `Vegas effects · ${findMedia(selection.clip.mediaId)?.file.name || selection.track.name}`
    : 'Select a video event, then choose an effect.';
  videoFxButtons.replaceChildren();
  for (const [key, info] of Object.entries(vegasFxInfo)) {
    if (info.minRelease && activeRelease < info.minRelease) continue;
    const button = document.createElement('button'); button.type = 'button'; button.dataset.videoFx = key; button.textContent = info.label;
    const applied = Boolean(displayFx?.effects.includes(key));
    button.disabled = !target; button.classList.toggle('applied', applied);
    button.setAttribute('aria-pressed', String(applied));
    button.title = applied ? `Remove ${info.label}` : `Add ${info.label}`;
    videoFxButtons.append(button);
  }
  const dxSupported = !isAudioEdition && activeRelease >= 2;
  const plugins = dxSupported ? installedDirectxPlugins() : [];
  const codexPlugins = dxSupported ? installedCodeXPlugins() : [];
  directxFxBrowser.hidden = !dxSupported || plugins.length === 0;
  directxFxButtons.replaceChildren();
  directxFxEmpty.hidden = true;
  for (const plugin of plugins) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.directx = plugin.key; button.textContent = `${plugin.name} · DirectX`;
    button.disabled = !target;
    button.classList.toggle('applied', Boolean(displayFx?.effects.includes(`directx:${plugin.key}`)));
    directxFxButtons.append(button);
  }
  codexFxBrowser.hidden = !dxSupported || !codexPlugins.length;
  codexFxButtons.replaceChildren();
  for (const plugin of codexPlugins) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.codex = plugin.id; button.textContent = plugin.name; button.disabled = !target;
    button.classList.toggle('applied', Boolean(displayFx?.codexEffects?.length));
    codexFxButtons.append(button);
  }
  const sapphirePlugins = dxSupported ? installedSapphirePlugins() : [];
  sapphirePluginBrowser.hidden = !sapphirePlugins.length;
  sapphirePluginButtons.replaceChildren();
  const activeSapphirePlugins = target ? sapphirePlugins.filter(plugin => hasSapphireEventPlugin(displayFx, plugin)) : [];
  for (const plugin of sapphirePlugins) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.sapphirePlugin = plugin.key;
    button.textContent = plugin.name + ' · ' + (plugin.bits || plugin.category);
    button.disabled = !target;
    button.classList.toggle('applied', hasSapphireEventPlugin(displayFx || { effects: [] }, plugin));
    sapphirePluginButtons.append(button);
  }
  sapphireEffectButtons.replaceChildren();
  const availableSapphireMajor = Math.max(0, ...activeSapphirePlugins.map(sapphireMajor));
  const catalogMajor = Math.max(availableSapphireMajor, ...sapphirePlugins.map(sapphireMajor));
  for (const effect of sapphireCatalog.filter(item => catalogMajor >= item.min)) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.sapphireEffect = effect.id;
    button.textContent = effect.id; button.disabled = !target || !activeSapphirePlugins.length;
    button.classList.toggle('applied', Boolean(displayFx?.sapphireEffects?.includes(effect.id)));
    sapphireEffectButtons.append(button);
  }
  renderSapphireEventControls(target, displayFx, sapphirePlugins);
  videoFxChain.replaceChildren();
  // The distortion controls are a built-in editor surface; don't hide them
  // just because the optional CodeX compatibility package isn't installed.
  codexDistortionUi.hidden = !dxSupported || !target;
  if (target) renderCodexDistortionControls(target);
  else codexDistortionControls.replaceChildren();
  if (!target) return;
  if (!displayFx.effects.length) {
    const empty = document.createElement('p'); empty.className = 'fx-chain-empty'; empty.textContent = 'No effects on this event yet.';
    videoFxChain.append(empty);
    return;
  }
  for (const key of displayFx.effects) {
    const info = vegasFxInfo[key];
    const plugin = key.startsWith('directx:') ? plugins.find((item) => item.key === key.slice(8)) : null;
    if (!info && !plugin && !key.startsWith('directx:')) continue;
    const row = document.createElement('section'); row.className = 'video-fx-row';
    const heading = document.createElement('div'); heading.className = 'video-fx-row-heading';
    const title = document.createElement('strong'); title.textContent = info?.label || `${plugin?.name || 'DirectX Plug-in'} · DirectX`;
    const tools = document.createElement('div'); tools.className = 'video-fx-row-tools';
    const position = displayFx.effects.indexOf(key);
    const moveUp = document.createElement('button'); moveUp.type = 'button'; moveUp.className = 'video-fx-order-button'; moveUp.textContent = '↑'; moveUp.title = `Move ${title.textContent} up`; moveUp.disabled = position <= 0;
    moveUp.addEventListener('click', () => {
      if (position <= 0) return;
      recordUndo();
      const effects = [...displayFx.effects]; [effects[position - 1], effects[position]] = [effects[position], effects[position - 1]];
      setSelectedVideoFxField('effects', effects);
      applyVideoFx(videoFxAtPlayhead(selection.clip));
      renderTracks(); renderVideoFxBrowser();
    });
    const moveDown = document.createElement('button'); moveDown.type = 'button'; moveDown.className = 'video-fx-order-button'; moveDown.textContent = '↓'; moveDown.title = `Move ${title.textContent} down`; moveDown.disabled = position >= displayFx.effects.length - 1;
    moveDown.addEventListener('click', () => {
      if (position >= displayFx.effects.length - 1) return;
      recordUndo();
      const effects = [...displayFx.effects]; [effects[position], effects[position + 1]] = [effects[position + 1], effects[position]];
      setSelectedVideoFxField('effects', effects);
      applyVideoFx(videoFxAtPlayhead(selection.clip));
      renderTracks(); renderVideoFxBrowser();
    });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'fx-remove-button'; remove.textContent = '×'; remove.title = `Remove ${title.textContent}`;
    remove.addEventListener('click', () => {
      recordUndo(); setSelectedVideoFxField('effects', displayFx.effects.filter((effect) => effect !== key));
      applyVideoFx(videoFxAtPlayhead(selection.clip)); renderTracks(); renderVideoFxBrowser();
    });
    tools.append(moveUp, moveDown, remove);
    heading.append(title, tools); row.append(heading);
    for (const [control, label, min, max, unit] of info?.controls || []) {
      const field = document.createElement('div'); field.className = 'video-fx-control video-fx-keyframe-control';
      const caption = document.createElement('span'); caption.textContent = label;
      const output = document.createElement('output');
      const pair = document.createElement('div'); pair.className = 'video-fx-control-inputs';
      const input = document.createElement('input'); input.type = 'range'; input.min = String(min); input.max = String(max); input.step = max - min <= 2 ? '0.05' : '1'; input.value = String(displayFx[control] ?? 0);
      const number = document.createElement('input'); number.type = 'number'; number.className = 'video-fx-number'; number.min = String(min); number.max = String(max); number.step = input.step; number.value = input.value; number.setAttribute('aria-label', label + ' value');
      const keyButton = document.createElement('button'); keyButton.type = 'button'; keyButton.className = 'video-fx-keyframe-button'; keyButton.textContent = '◆'; keyButton.title = 'Set ' + label + ' keyframe at playhead'; keyButton.setAttribute('aria-label', keyButton.title);
      const update = (raw) => { const value = Math.max(min, Math.min(max, Number(raw))); if (!Number.isFinite(value)) return; input.value = String(value); number.value = String(value); output.textContent = Number(value).toFixed(max - min <= 2 ? 2 : 0) + unit; setSelectedVideoFxField(control, value); applyVideoFx(videoFxAtPlayhead(selection.clip)); };
      output.textContent = Number(input.value).toFixed(max - min <= 2 ? 2 : 0) + unit;
      pair.append(input, number, keyButton); field.append(caption, output, pair); row.append(field);
      input.addEventListener('pointerdown', () => recordUndo(), { passive: true });
      number.addEventListener('focus', () => recordUndo());
      input.addEventListener('input', () => update(input.value));
      number.addEventListener('change', () => update(number.value));
      keyButton.addEventListener('click', () => addVideoFxFieldKeyframe(control));
    }
    for (const option of info?.options || []) {
      if (option.type === 'checkboxes') {
        const field = document.createElement('fieldset'); field.className = 'video-fx-option video-fx-checks';
        const legend = document.createElement('legend'); legend.textContent = option.label || 'Channels to invert'; field.append(legend);
        for (const [key, label] of option.items) {
          const choice = document.createElement('label');
          const input = document.createElement('input'); input.type = 'checkbox'; input.checked = Boolean(displayFx[key]);
          input.addEventListener('change', () => { recordUndo(); setSelectedVideoFxField(key, input.checked); applyVideoFx(videoFxAtPlayhead(selection.clip)); });
          choice.append(input, document.createTextNode(label)); field.append(choice);
        }
        row.append(field);
        continue;
      }
      if (option.type === 'checkbox') {
        const field = document.createElement('label'); field.className = 'video-fx-option video-fx-single-check';
        const input = document.createElement('input'); input.type = 'checkbox'; input.checked = Boolean(displayFx[option.key]);
        input.addEventListener('change', () => { recordUndo(); setSelectedVideoFxField(option.key, input.checked); applyVideoFx(videoFxAtPlayhead(selection.clip)); });
        field.append(input, document.createTextNode(option.label)); row.append(field); continue;
      }
      const field = document.createElement('label'); field.className = 'video-fx-option';
      const label = document.createElement('span'); label.textContent = option.label;
      const input = document.createElement('input');
      input.type = option.type;
      if (option.type === 'select') {
        for (const [value, text] of option.items) input.add(new Option(text, value));
      }
      input.value = String(displayFx[option.key] ?? '');
      input.addEventListener(option.type === 'range' ? 'input' : 'change', () => {
        recordUndo();
        setSelectedVideoFxField(option.key, option.type === 'range' ? Number(input.value) : input.value);
        applyVideoFx(videoFxAtPlayhead(selection.clip));
      });
      field.append(label, input); row.append(field);
    }
    row.querySelectorAll('input, select').forEach((control) => control.addEventListener('change', () => { renderTracks(); renderVideoFxBrowser(); }));
    videoFxChain.append(row);
  }
}
// --- Place right below renderVideoFxBrowser ---

const AVAILABLE_TRANSITIONS = [
  { id: 'cross_dissolve', name: 'Cross Dissolve', category: 'Standard', presets: ['(Default)', 'Smooth Fade', 'Dip to Black'] },
  { id: 'wipe', name: 'Linear Wipe', category: 'Wipes', presets: ['(Default)', 'Clock Swipe', 'Gradient Wipe'] },
  { id: 'slide', name: 'Slide Push', category: 'Movement', presets: ['(Default)', 'Fast Slide', 'Zoom Push'] },
  { id: 'iris', name: 'Iris Shape', category: 'Stylized', presets: ['(Default)', 'Star Iris', 'Circle Cutout'] },
  { id: 's_transition_glow', name: 'S_TransitionGlow (Sapphire)', category: 'Sapphire 6.x', presets: ['(Default)', 'Flash Hit', 'Glow Blur Dissolve'] }
];

function renderVideoTransitionsBrowser(container, activeTransition, onUpdateTransition) {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'fx-tab-header';
  header.innerHTML = `<h3>Video Transitions</h3><p class="fx-subtitle">Drag onto clip edges or select to configure</p>`;
  container.appendChild(header);

  const listContainer = document.createElement('div');
  listContainer.className = 'fx-effect-list';

  AVAILABLE_TRANSITIONS.forEach(trans => {
    const item = document.createElement('div');
    item.className = `fx-effect-card ${activeTransition?.id === trans.id ? 'active' : ''}`;
    item.innerHTML = `
      <div class="fx-card-title">
        <span>${trans.name}</span>
        <button class="add-fx-btn">→</button>
      </div>
    `;

    item.addEventListener('click', () => {
      document.querySelectorAll('.fx-effect-card').forEach(c => c.classList.remove('active'));
      item.classList.add('active');
      renderTransitionControls(controlsPanel, trans, onUpdateTransition);
    });

    listContainer.appendChild(item);
  });

  container.appendChild(listContainer);

  const controlsPanel = document.createElement('div');
  controlsPanel.className = 'fx-controls-panel';
  container.appendChild(controlsPanel);
}

function renderTransitionControls(panel, transition, onUpdate) {
  panel.innerHTML = `<h4>${transition.name} Settings</h4>`;

  if (transition.presets) {
    const presetBox = document.createElement('div');
    presetBox.className = 'fx-preset-row';
    presetBox.innerHTML = `<label>Presets:</label>`;
    
    transition.presets.forEach((presetName, idx) => {
      const presetBtn = document.createElement('button');
      presetBtn.className = `fx-preset-icon ${idx === 0 ? 'active' : ''}`;
      presetBtn.innerText = presetName; // Includes '(Default)' as first item
      presetBtn.onclick = () => {
        document.querySelectorAll('.fx-preset-icon').forEach(b => b.classList.remove('active'));
        presetBtn.classList.add('active');
        onUpdate(transition.id, 'preset', presetName);
      };
      presetBox.appendChild(presetBtn);
    });
    panel.appendChild(presetBox);
  }

  const sliderGroup = document.createElement('div');
  sliderGroup.className = 'fx-slider-group';
  sliderGroup.innerHTML = `
    <label>Duration (Seconds):</label>
    <input type="range" min="0.1" max="3.0" step="0.1" value="1.0" class="fx-slider" />
    <span class="slider-val">1.0s</span>
  `;

  const slider = sliderGroup.querySelector('.fx-slider');
  const valDisplay = sliderGroup.querySelector('.slider-val');
  slider.oninput = (e) => {
    valDisplay.innerText = `${e.target.value}s`;
    onUpdate(transition.id, 'duration', parseFloat(e.target.value));
  };

  panel.appendChild(sliderGroup);
}
videoFxButtons.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-video-fx]');
  const selection = selectedVideoClip();
  if (!button || button.disabled || !selection) return;
  recordUndo();
  const displayed = videoFxAtPlayhead(selection.clip);
  const effects = displayed.effects.includes(button.dataset.videoFx)
    ? displayed.effects.filter((effect) => effect !== button.dataset.videoFx)
    : [...displayed.effects, button.dataset.videoFx];
  setSelectedVideoFxField('effects', effects);
  applyVideoFx(videoFxAtPlayhead(selection.clip)); renderTracks(); openVideoEventFxPanel(selection);
});
codexFxButtons.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-codex]');
  const selection = selectedVideoClip();
  if (!button || button.disabled || !selection) return;
  // Opening the installed plug-in must not silently enable every effect.
  ensureVideoFx(selection.clip);
  openVideoEventFxPanel(selection);
  renderVideoFxBrowser();
});
sapphirePluginButtons.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-sapphire-plugin]');
  const selection = selectedVideoClip();
  if (!button || button.disabled || !selection) return;
  const plugin = installedSapphirePlugins().find(item => item.key === button.dataset.sapphirePlugin);
  if (!plugin) return;
  recordUndo();
  const fx = ensureVideoFx(selection.clip);
  const key = 'sapphire:' + plugin.key;
  const existingLegacyKey = 'directx:' + plugin.key;
  const effects = [...fx.effects];
  if (effects.includes(key) || effects.includes(existingLegacyKey)) {
    for (const removeKey of [key, existingLegacyKey]) { const index = effects.indexOf(removeKey); if (index >= 0) effects.splice(index, 1); }
  } else effects.push(key);
  setSelectedVideoFxField('effects', effects);
  applyVideoFx(videoFxAtPlayhead(selection.clip));
  renderTracks(); openVideoEventFxPanel(selection);
});
sapphireEffectButtons.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-sapphire-effect]');
  const selection = selectedVideoClip();
  if (!button || button.disabled || !selection) return;
  const fx = ensureVideoFx(selection.clip);
  const id = button.dataset.sapphireEffect;
  recordUndo();
  const effects = [...fx.sapphireEffects];
  const index = effects.indexOf(id);
  if (index >= 0) effects.splice(index, 1); else effects.push(id);
  setSelectedVideoFxField('sapphireEffects', effects);
  applyVideoFx(videoFxAtPlayhead(selection.clip));
  renderTracks(); renderVideoFxBrowser();
});
directxFxButtons.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-directx]');
  const selection = selectedVideoClip();
  if (!button || button.disabled || !selection) return;
  recordUndo();
  const target = ensureVideoFx(selection.clip);
  const key = `directx:${button.dataset.directx}`;
  const effects = videoFxAtPlayhead(selection.clip).effects.includes(key)
    ? videoFxAtPlayhead(selection.clip).effects.filter((effect) => effect !== key)
    : [...videoFxAtPlayhead(selection.clip).effects, key];
  setSelectedVideoFxField('effects', effects);
  applyVideoFx(videoFxAtPlayhead(selection.clip));
  renderTracks(); openVideoEventFxPanel(selection);
});
function projectLibraryName() { return isAudioEdition ? 'Project Audio' : 'Project Media'; }
const browserFxInfo = {
  volume: { label: 'Volume', min: 0, max: 150, unit: '%' }, bass: { label: 'Bass', min: -12, max: 12, unit: ' dB' },
  treble: { label: 'Treble', min: -12, max: 12, unit: ' dB' }, reverb: { label: 'Reverb', min: 0, max: 100, unit: '%' },
  delay: { label: 'Delay', min: 0, max: 100, unit: '%' }, vibrato: { label: 'Vibrato', min: 0, max: 100, unit: '%' },
  distortion: { label: 'Distortion', min: 0, max: 100, unit: '%' }, chorus: { label: 'Chorus', min: 0, max: 100, unit: '%' },
  flange: { label: 'Flange', min: 0, max: 100, unit: '%' }, pan: { label: 'Pan', min: -100, max: 100, unit: '%' },
  smooth: { label: 'Smooth/Enhance', min: 0, max: 100, unit: '%' }, waveHammer: { label: 'Wave Hammer Surround', min: 0, max: 100, unit: '%' },
};
const imageLineX86Effects = [
  ['delay', 'IL Delay'], ['flangus', 'IL Flangus'], ['parametric-eq', 'IL Parametic EQ'], ['enhancer', 'IL Enhancer'], ['vocoder', 'IL Vocoder'],
];
const imageLineX64Effects = [...imageLineX86Effects, ['love-philter', 'IL Love Philter'], ['compressor', 'IL Compressor'], ['notebook', 'IL Notebook'], ['vocodex', 'IL Vocodex']];
const vstFxInfo = {};
for (const [id, label] of imageLineX86Effects) vstFxInfo[`vst:image-line-legacy:${id}`] = { label, architecture: 'x86', bundle: 'Image-Line Legacy' };
for (const [id, label] of imageLineX64Effects) vstFxInfo[`vst:image-line:${id}`] = { label, architecture: 'x64', bundle: 'Image-Line' };
function installedVst(architecture) {
  try {
    return JSON.parse(localStorage.getItem('fish-video-wax-installs') || '[]')
      .find((entry) => entry.category === 'VST (Audio)' && entry.bits === architecture) || null;
  } catch { return null; }
}
function selectedVideoVersionNumber() {
  if (isAudioEdition) return null;
  const match = activeVersion.match(/Video\s+(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}
function vstInstallCompatible(architecture) {
  if (architecture === 'x86') return Boolean(installedVst('x86'));
  const version = selectedVideoVersionNumber();
  return Boolean(version !== null && version >= 8.1 && installedVst('x64'));
}
function renderVstButtons(container) {
  container.replaceChildren();
  const x86Installed = vstInstallCompatible('x86');
  const x64Installed = vstInstallCompatible('x64');
  const groups = [
    { label: 'Image-Line Legacy · x86', prefix: 'vst:image-line-legacy:', effects: imageLineX86Effects, visible: x86Installed },
    { label: 'Image-Line · x64', prefix: 'vst:image-line:', effects: imageLineX64Effects, visible: x64Installed },
  ];
  for (const group of groups) {
    if (!group.visible) continue;
    const section = document.createElement('section'); section.className = 'vst-fx-group';
    const heading = document.createElement('h3'); heading.textContent = group.label;
    const buttons = document.createElement('div'); buttons.className = 'audio-fx-buttons';
    for (const [id, label] of group.effects) {
      const key = `${group.prefix}${id}`;
      const button = document.createElement('button'); button.type = 'button'; button.dataset.vst = key; button.textContent = label;
      buttons.append(button);
    }
    section.append(heading, buttons); container.append(section);
  }
}
function installedVstEffect(key) {
  const info = vstFxInfo[key];
  return info && vstInstallCompatible(info.architecture) ? info : null;
}
function addEffectToTarget(target, key) {
  target.effects ||= [];
  if (!target.effects.includes(key)) target.effects.push(key);
}
function renderEffectRows(target, container, showControls = true) {
  container.replaceChildren();
  const effects = target.effects || [];
  if (!effects.length) {
    const empty = document.createElement('p'); empty.className = 'fx-chain-empty'; empty.textContent = 'No effects added yet.'; container.append(empty); return;
  }
  effects.forEach((key) => {
    const info = browserFxInfo[key] || installedVstEffect(key);
    if (!info) return;
    const row = document.createElement('div'); row.className = 'fx-chain-row';
    const header = document.createElement('div'); header.className = 'fx-chain-row-heading';
    const title = document.createElement('strong'); title.textContent = vstFxInfo[key] ? `${info.label} · ${info.architecture}` : info.label;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'fx-remove-button'; remove.textContent = '×'; remove.title = `Remove ${info.label}`;
    remove.addEventListener('click', () => {
      recordUndo();
      setSelectedAudioFxField('effects', target.effects.filter((effect) => effect !== key), target);
      if (browserFxInfo[key]) setSelectedAudioFxField(key, key === 'waveHammer' ? 0 : defaultFx()[key], target);
      if (selectedBrowserFx === key) selectedBrowserFx = null;
      applyFx(target); renderFxManager(); renderAudioFxBrowser();
    });
    header.append(title, remove); row.append(header);
    if (showControls && browserFxInfo[key] && key !== 'waveHammer') {
      const field = document.createElement('label'); field.className = 'fx-chain-field';
      const value = document.createElement('output');
      const slider = document.createElement('input'); slider.type = 'range'; slider.min = String(info.min); slider.max = String(info.max); slider.step = '1'; slider.value = String(target[key] ?? defaultFx()[key]);
      const display = () => { value.textContent = `${slider.value}${info.unit}`; };
      display(); field.append(document.createTextNode(info.label), value); row.append(field, slider);
      slider.addEventListener('pointerdown', () => recordUndo(), { passive: true });
      slider.addEventListener('input', () => { setSelectedAudioFxField(key, Number(slider.value), target); display(); applyFx(target); renderAudioFxBrowser(); });
    }
    container.append(row);
  });
}
function renderFxManager() {
  if (!fxTarget) return;
  fxTarget.effects ||= [];
  renderEffectRows(fxTarget, fxChainList);
  const settings = fxTarget.waveHammerSettings || (fxTarget.waveHammerSettings = defaultFx().waveHammerSettings);
  waveHammerSettingsPanel.hidden = !fxTarget.effects.includes('waveHammer');
  waveHammerLimit.value = String(settings.dbLimit);
  waveHammerStrength.value = String(settings.strength);
  waveHammerApply.checked = settings.apply !== false;
  waveHammerLeft.checked = settings.left !== false;
  waveHammerRight.checked = settings.right !== false;
  document.querySelector('#wave-hammer-limit-value').textContent = `${settings.dbLimit} dB`;
  document.querySelector('#wave-hammer-strength-value').textContent = Number(settings.strength).toFixed(2);
}
function renderAudioFxBrowser() {
  if (!audioFxBrowser) return;
  const vstBrowser = document.querySelector('#vst-fx-browser');
  const vstButtons = document.querySelector('#vst-fx-buttons');
  const vstSupported = activeRelease >= 3;
  const selection = selectedClip();
  const target = selection?.track.type === 'audio' ? (selection.clip.fx ||= defaultFx()) : null;
  const hasTarget = Boolean(target);
  audioFxHint.textContent = hasTarget
    ? (activeRelease >= 3 ? `Effects for ${findMedia(selection.clip.mediaId)?.file.name || selection.track.name} · choose an effect to open its settings` : `Effects for ${findMedia(selection.clip.mediaId)?.file.name || selection.track.name} · click to add, double-click to manage`)
    : 'Select an audio event to add effects.';
  audioFxButtons.querySelectorAll('button[data-fx]').forEach((button) => {
    const key = button.dataset.fx;
    button.disabled = !hasTarget;
    button.classList.toggle('applied', hasTarget && (target.effects || []).includes(key));
    button.classList.toggle('selected', key === selectedBrowserFx);
    button.setAttribute('aria-pressed', String(hasTarget && (target.effects || []).includes(key)));
  });
  renderVstButtons(vstButtons);
  vstButtons.querySelectorAll('button[data-vst]').forEach((button) => {
    button.disabled = !vstSupported || !hasTarget;
    button.classList.toggle('applied', hasTarget && (target.effects || []).includes(button.dataset.vst));
    button.classList.toggle('selected', button.dataset.vst === selectedBrowserFx);
    button.setAttribute('aria-pressed', String(hasTarget && (target.effects || []).includes(button.dataset.vst)));
  });
  vstBrowser.hidden = !vstSupported || vstButtons.childElementCount === 0;
  audioFxChain.replaceChildren();
  if (hasTarget) renderEffectRows(target, audioFxChain, false);
}
audioFxButtons.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-fx]');
  const selection = selectedClip();
  if (!button || button.disabled || !selection || selection.track.type !== 'audio') return;
  recordUndo();
  const target = selection.clip.fx ||= defaultFx();
  const effects = [...(target.effects || [])];
  if (!effects.includes(button.dataset.fx)) effects.push(button.dataset.fx);
  setSelectedAudioFxField('effects', effects, target);
  selectedBrowserFx = button.dataset.fx;
  applyFx(target); renderFxManager(); renderAudioFxBrowser();
  if (activeRelease >= 3) openAudioFx(target, findMedia(selection.clip.mediaId)?.file.name || selection.track.name);
});
audioFxButtons.addEventListener('dblclick', (event) => {
  const button = event.target.closest('button[data-fx]');
  const selection = selectedClip();
  if (!button || button.disabled || !selection || selection.track.type !== 'audio') return;
  selectedBrowserFx = button.dataset.fx;
  openAudioFx(selection.clip.fx || (selection.clip.fx = defaultFx()), findMedia(selection.clip.mediaId)?.file.name || selection.track.name);
});
document.querySelector('#vst-fx-buttons').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-vst]');
  const selection = selectedClip();
  if (!button || button.disabled || !selection || selection.track.type !== 'audio') return;
  recordUndo();
  const target = selection.clip.fx ||= defaultFx();
  const effects = [...(target.effects || [])]; if (!effects.includes(button.dataset.vst)) effects.push(button.dataset.vst);
  setSelectedAudioFxField('effects', effects, target);
  selectedBrowserFx = button.dataset.vst;
  applyFx(target);
  openAudioFx(target, findMedia(selection.clip.mediaId)?.file.name || selection.track.name);
  renderAudioFxBrowser();
});
for (const input of [waveHammerLimit, waveHammerStrength, waveHammerApply, waveHammerLeft, waveHammerRight]) {
  input.addEventListener('pointerdown', () => recordUndo(), { passive: true });
  input.addEventListener('input', () => {
    if (!fxTarget) return;
    const settings = fxTarget.waveHammerSettings || (fxTarget.waveHammerSettings = defaultFx().waveHammerSettings);
    settings.dbLimit = Number(waveHammerLimit.value);
    settings.strength = Number(waveHammerStrength.value);
    settings.apply = waveHammerApply.checked;
    settings.left = waveHammerLeft.checked;
    settings.right = waveHammerRight.checked;
    setSelectedAudioFxField('waveHammerSettings', settings, fxTarget);
    document.querySelector('#wave-hammer-limit-value').textContent = `${settings.dbLimit} dB`;
    document.querySelector('#wave-hammer-strength-value').textContent = settings.strength.toFixed(2);
    applyFx(fxTarget);
  });
}
document.querySelectorAll('.dock-tab').forEach((tab) => tab.addEventListener('click', () => setMediaTab(tab.textContent.trim())));
document.querySelectorAll('[data-keyframe-add]').forEach(button=>button.addEventListener('click',()=>addVideoKeyframe(button.dataset.keyframeAdd)));
document.querySelector('.transition-buttons')?.addEventListener('click',event=>{const button=event.target.closest('[data-transition]');if(!button)return;if(Number(button.dataset.minRelease||0)>activeRelease){transportStatus.textContent='3D transitions require Video 6.0 or newer';return;}const found=selectedVideoClip();if(!found){transportStatus.textContent='Select a video event first';return;}recordUndo();const transitionDuration=videoOverlapDuration(found.clip)||.6;found.clip.transition={type:button.dataset.transition,duration:transitionDuration};renderTracks();transportStatus.textContent=`${button.textContent} · ${transitionDuration.toFixed(2)} s`;});
trackLabels.addEventListener('contextmenu', (event) => {
  const label = event.target.closest('.track-label');
  if (!label) return;
  event.preventDefault();
  const track = tracks.find((item) => item.id === label.dataset.trackId);
  selectedTrackId = track?.id;
  showContextMenu(event.clientX, event.clientY, [
    ['Add audio track', () => addTrack('audio')],
    ...(!isAudioEdition ? [['Add video track', () => addTrack('video')]] : []),
    ...(track?.type === 'audio' ? [['Audio track FX…', () => openAudioFx(track.fx, track.name)]] : []),
    ...(tracks.filter((item) => item.type === track?.type).length > 1 ? [['Remove track', () => removeTrack(track)]] : []),
  ]);
});

timeReadout.addEventListener('contextmenu', (event) => {
  event.preventDefault(); event.stopPropagation();
  showContextMenu(event.clientX, event.clientY, isAudioEdition
    ? [['Time', () => setTimeDisplayMode('time')], ['Seconds', () => setTimeDisplayMode('seconds')]]
    : [
      ['Time', () => setTimeDisplayMode('time')],
      ['Seconds', () => setTimeDisplayMode('seconds')],
      ['Frames', () => setTimeDisplayMode('frames')],
      ['Time and Frames', () => setTimeDisplayMode('time-and-frames')],
    ]);
});

document.querySelector('.preview-toolbar button').addEventListener('click', toggleFullscreen);
for (let index = 0; index < 15; index++) {
  const factor = 2 ** index;
  timelineZoomControl.add(new Option(`${factor}×`, String(factor)));
}
timelineZoomControl.value = '1';
timelineZoomControl.addEventListener('change', (event) => {
  timelineZoom = Number(event.target.value);
  timelineZoomIndex = Math.log2(timelineZoom);
  updateTimelineScale();
});
function zoomTimelineAt(delta, clientX) {
  const oldPixelsPerSecond = pixelsPerSecond();
  const bodyRect = timelineBody.getBoundingClientRect();
  const xInTimeline = clientX - bodyRect.left - trackLabels.offsetWidth;
  const anchorTime = Math.max(0, (timelineBody.scrollLeft + xInTimeline) / oldPixelsPerSecond);
  timelineZoomIndex = Math.max(0, Math.min(14, timelineZoomIndex + (delta < 0 ? 1 : -1)));
  timelineZoom = 2 ** timelineZoomIndex;
  timelineZoomControl.value = String(timelineZoom);
  updateTimelineScale();
  timelineBody.scrollLeft = Math.max(0, anchorTime * pixelsPerSecond() - xInTimeline);
  rulerScale.style.transform = `translateX(-${timelineBody.scrollLeft}px)`;
}
timelineBody.addEventListener('wheel', (event) => {
  if (!event.ctrlKey && !event.metaKey && !event.target.closest('.timeline-ruler')) return;
  event.preventDefault();
  zoomTimelineAt(event.deltaY || event.deltaX, event.clientX);
}, { passive: false });
timelineBody.addEventListener('scroll', () => { rulerScale.style.transform = `translateX(-${timelineBody.scrollLeft}px)`; });
window.addEventListener('resize', updateTimelineScale);
mediaGrid.addEventListener('dragover', (event) => event.preventDefault());
mediaGrid.addEventListener('drop', (event) => { event.preventDefault(); if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files); });
let lastTouchContextTap = null;
document.addEventListener('pointerup', (event) => {
  if (event.pointerType !== 'touch') return;
  const target = event.target.closest('.timeline-clip, .track-lane, .media-card');
  if (!target || event.target.closest('.media-thumb')) return;
  const now = performance.now();
  if (lastTouchContextTap && lastTouchContextTap.target === target && now - lastTouchContextTap.time < 420 && Math.hypot(event.clientX - lastTouchContextTap.x, event.clientY - lastTouchContextTap.y) < 32) {
    event.preventDefault();
    target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, view: window, clientX: event.clientX, clientY: event.clientY }));
    lastTouchContextTap = null;
  } else lastTouchContextTap = { target, time: now, x: event.clientX, y: event.clientY };
}, true);
renderTracks(); updateUndoButtons();
