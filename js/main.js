const canvas = document.getElementById('riskCanvas');
window.__riskLastDraw = 0;
const ctx = canvas ? canvas.getContext('2d') : null;
const hazardSelect = document.getElementById('hazardSelect');
const confidenceBadge = document.getElementById('confidenceBadge');
const horizonRange = document.getElementById('horizonRange');
const horizonValue = document.getElementById('horizonValue');
const scenarioSelect = document.getElementById('scenarioSelect');
const scenarioBadge = document.getElementById('scenarioBadge');
const horizonBadge = document.getElementById('horizonBadge');
const legendHigh = document.getElementById('legendHigh');
const legendMed = document.getElementById('legendMed');
const legendLow = document.getElementById('legendLow');
const rainInput = document.getElementById('rainInput');
const tempInput = document.getElementById('tempInput');
const windInput = document.getElementById('windInput');
const rainValue = document.getElementById('rainValue');
const tempValue = document.getElementById('tempValue');
const windValue = document.getElementById('windValue');
const simSummary = document.getElementById('simSummary');
const allocList = document.getElementById('allocList');
const runSim = document.getElementById('runSim');
const crowdForm = document.getElementById('crowdForm');
const crowdStatus = document.getElementById('crowdStatus');
const langSelect = document.getElementById('langSelect');
const alertPreview = document.getElementById('alertPreview');
const genScript = document.getElementById('genScript');
const promptInput = document.getElementById('promptInput');
const scriptOutput = document.getElementById('scriptOutput');
const waForm = document.getElementById('waForm');
const waTo = document.getElementById('waTo');
const waMessage = document.getElementById('waMessage');
const waStatus = document.getElementById('waStatus');
const waEndpoint = 'http://localhost:8787/api/whatsapp/send';
const launchBtn = document.getElementById('launchBtn');
const pilotBtn = document.getElementById('pilotBtn');
const consoleModal = document.getElementById('consoleModal');
const pilotModal = document.getElementById('pilotModal');
const tileStatus = document.getElementById('tileStatus');
const pilotForm = document.getElementById('pilotForm');
const pilotStatus = document.getElementById('pilotStatus');
const earlyIndicator = document.getElementById('earlyIndicator');
const ewCountdown = document.getElementById('ewCountdown');
const ewStatus = document.getElementById('ewStatus');
const ewNext = document.getElementById('ewNext');
const ewSignals = document.getElementById('ewSignals');
const monitorStatus = document.getElementById('monitorStatus');
const explainabilityLine = document.getElementById('explainabilityLine');
const on = (el, event, handler) => { if (el) el.addEventListener(event, handler); };
const getValue = (el, fallback) => (el && typeof el.value !== 'undefined') ? el.value : fallback;

// Telemetry elements
const uptimeVal = document.getElementById('uptimeVal');
const latencyVal = document.getElementById('latencyVal');
const qpsVal = document.getElementById('qpsVal');
const reportsVal = document.getElementById('reportsVal');
const metricsSpark = document.getElementById('metricsSpark');
const sparkCtx = metricsSpark ? metricsSpark.getContext('2d') : null;
const opsChart = document.getElementById('opsChart');
const opsCtx = opsChart ? opsChart.getContext('2d') : null;
let opsSeries = [];

const sentimentVal = document.getElementById('sentimentVal');
const buzzVal = document.getElementById('buzzVal');
const word1 = document.getElementById('word1');
const word2 = document.getElementById('word2');
const word3 = document.getElementById('word3');
const socialTicker = document.getElementById('socialTicker');
const posBar = document.getElementById('posBar');
const neuBar = document.getElementById('neuBar');
const pumpsBar = document.getElementById('pumpsBar');
const medBar = document.getElementById('medBar');
const droneBar = document.getElementById('droneBar');
const shelterBar = document.getElementById('shelterBar');
const allocInline = document.getElementById('allocInline');

const hazardConfigs = {
  flood: { palette: ['#0d1b2a', '#1b263b', '#415a77', '#7cf7d4'], clusters: 4, wobble: 0.6 },
  wildfire: { palette: ['#2d0400', '#a8322d', '#ff7b72', '#ffd199'], clusters: 5, wobble: 1.2 },
  cyclone: { palette: ['#051a33', '#1f63ff', '#7dd3ff', '#d8f3ff'], clusters: 3, wobble: 1.0 },
  quake: { palette: ['#2a1600', '#f2994a', '#f2c94c', '#fff4c2'], clusters: 5, wobble: 0.7 }
};

const legendColors = {
  flood: { low: '#7cf7d4', med: '#53c6ff', high: '#0f3bd7' },
  wildfire: { low: '#ffd199', med: '#ff7b72', high: '#a8322d' },
  cyclone: { low: '#d8f3ff', med: '#7dd3ff', high: '#1f63ff' },
  quake: { low: '#fff4c2', med: '#f2c94c', high: '#d9534f' }
};

const scenarioStyles = {
  Baseline: { amp: 1, shift: 0 },
  'Rain +20%': { amp: 1.3, shift: 0.8 },
  'Temp +3C': { amp: 1.2, shift: 0.4 },
  'Wind shift 40': { amp: 1.15, shift: 1.2 }
};

const explainabilityMethods = {
  flood: ['Grad-CAM', 'SHAP', 'Attention'],
  wildfire: ['Integrated Gradients', 'SHAP', 'Occlusion'],
  cyclone: ['Grad-CAM', 'SHAP', 'Saliency'],
  quake: ['SHAP', 'Attention', 'Counterfactuals']
};

const sampleDrivers = {
  flood: ['Rain anomaly +0.42', 'River gauge +0.35', 'Soil saturation +0.21'],
  wildfire: ['Temp spike +0.38', 'NDVI dryness +0.31', 'Wind shift +0.26'],
  cyclone: ['SST +0.29', 'Pressure drop +0.27', 'Track consensus +0.24'],
  quake: ['Aftershock cluster +0.33', 'Depth anomaly +0.29', 'Fault stress +0.25']
};
function updateLegendColors(hazard) {
  const set = legendColors[hazard] || legendColors.flood;
  if (legendHigh) legendHigh.style.background = set.high;
  if (legendMed) legendMed.style.background = set.med;
  if (legendLow) legendLow.style.background = set.low;
  [legendHigh, legendMed, legendLow].forEach(el => el && (el.style.color = '#041227'));
}

function drawRiskOnce() {
  if (!ctx || !canvas) return;
  const hazard = getValue(hazardSelect, 'flood');
  const scenario = getValue(scenarioSelect, 'Baseline');
  const horizon = Number(getValue(horizonRange, 3));
  const cfg = hazardConfigs[hazard] || hazardConfigs.flood;
  const scene = scenarioStyles[scenario] || scenarioStyles.Baseline;
  const w = canvas.width, h = canvas.height;
  const rand = () => Math.random();
  const centers = Array.from({ length: cfg.clusters }, () => ({
    x: rand() * w,
    y: rand() * h,
    r: 60 + rand() * 180
  }));
  const time = Date.now() / 900;
  const image = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      let intensity = 0;
      centers.forEach((c, i) => {
        const dx = x - c.x - Math.sin(time / 2 + i) * cfg.wobble * 12;
        const dy = y - c.y - Math.cos(time / 3 + i) * cfg.wobble * 12;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const weight = Math.max(0, 1 - dist / (c.r + scene.shift * 25));
        intensity += weight * (0.6 + rand() * 0.6) * scene.amp;
      });
      const level = Math.max(0, Math.min(intensity, 1.2));
      const color = cfg.palette[Math.min(cfg.palette.length - 1, Math.floor(level * (cfg.palette.length - 1)))];
      image.data[idx]     = parseInt(color.slice(1, 3), 16);
      image.data[idx + 1] = parseInt(color.slice(3, 5), 16);
      image.data[idx + 2] = parseInt(color.slice(5, 7), 16);
      image.data[idx + 3] = 180 + Math.floor(level * 60);
    }
  }
  ctx.putImageData(image, 0, 0);
  window.__riskLastDraw = Date.now();

}

function refreshExplainability() {
  const hazard = getValue(hazardSelect, 'flood');
  const driversList = document.getElementById('driversList');
  const drivers = sampleDrivers[hazard] || [];
  if (driversList) driversList.innerHTML = drivers.map(d => `<li class="chip">${d}</li>`).join('');
  const methods = explainabilityMethods[hazard] || explainabilityMethods.flood;
  if (explainabilityLine) explainabilityLine.textContent = methods.join(' | ');
  scenarioBadge.textContent = getValue(scenarioSelect, 'Baseline');
}

let lastRiskFrame = 0;
const riskFrameInterval = 450;

function animateRisk(ts) {
  const now = typeof ts === 'number' ? ts : (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (now - lastRiskFrame >= riskFrameInterval) {
    drawRiskOnce();
    lastRiskFrame = now;
  }
  requestAnimationFrame(animateRisk);
}

updateLegendColors(getValue(hazardSelect, 'flood'));
refreshExplainability();
requestAnimationFrame(animateRisk);

on(hazardSelect, 'change', () => {
  confidenceBadge.textContent = `${70 + Math.floor(Math.random() * 25)}%`;
  updateLegendColors(hazardSelect.value);
  refreshExplainability();
});

on(horizonRange, 'input', (e) => {
  const val = `+${e.target.value}h`;
  horizonValue.textContent = val;
  horizonBadge.textContent = val;
});


on(scenarioSelect, 'change', () => {
  refreshExplainability();
});

[rainInput, tempInput, windInput].forEach((input) => {
  on(input, 'input', () => {
    rainValue.textContent = `${rainInput.value >= 0 ? '+' : ''}${rainInput.value}%`;
    tempValue.textContent = `${tempInput.value >= 0 ? '+' : ''}${tempInput.value}C`;
    windValue.textContent = `${windInput.value}`;
  });
});

on(runSim, 'click', () => {
  const rain = Number(rainInput.value);
  const temp = Number(tempInput.value);
  const wind = Number(windInput.value);
  const delta = Math.round(rain * 0.4 + temp * 1.3 + wind * 0.1);
  simSummary.textContent = `Risk delta ${delta >= 0 ? '+' : ''}${delta}% | Est. ${12 + Math.floor(Math.random()*6)}k people affected | ${18 + Math.floor(Math.random()*8)} shelters impacted`;
  const actions = [
    `Deploy ${Math.max(2, Math.ceil(rain / 10))} pumps to riverine wards`,
    `Stage ${Math.max(1, Math.ceil(temp / 2))} med teams near heat-prone blocks`,
    `Add drone sweep cadence every ${Math.max(15, 60 - wind)} minutes`
  ];
  allocList.innerHTML = actions.map(a => `<li>${a}</li>`).join('');
});

on(crowdForm, 'submit', (e) => {
  e.preventDefault();
  crowdStatus.textContent = 'Report received  credibility score 0.82, routing to triage ops.';
});

on(waForm, 'submit', (e) => {
  e.preventDefault();
  if (!waStatus) return;
  const rawTo = (waTo && waTo.value ? waTo.value : '').trim();
  const to = rawTo.replace(/[^\d+]/g, '');
  const text = (waMessage && waMessage.value ? waMessage.value : '').trim();
  if (!to || !text) {
    waStatus.textContent = 'Enter recipient and message.';
    waStatus.style.color = '#ff7b72';
    return;
  }
  waStatus.textContent = 'Sent to WhatsApp.';
  waStatus.style.color = '#7cf7d4';
});

const alertTexts = {
  en: 'Flood warning: move to higher ground within 45 minutes. Follow local authority guidance.',
  hi: '???? ???????: ???? 45 ???? ??? ???????? ????? ?? ????? ??????? ????????? ?? ???? ?????',
  es: 'Alerta de inundacin: suba a terreno elevado en los prximos 45 minutos. Siga a las autoridades locales.',
  sw: 'Onyo la mafuriko: nenda sehemu ya juu ndani ya dakika 45. Fuata maelekezo ya mamlaka.',
  fil: 'Babala sa baha: lumikas sa mas mataas na lugar sa loob ng 45 minuto. Sundin ang lokal na awtoridad.',
  fr: 'Alerte inondation : gagnez un point haut dans les 45 minutes. Suivez les consignes locales.',
  bn: '????? ???????: ??????? ?? ??????? ????? ???? ?????? ???? ???????? ????????? ?????? ?????'
};

on(langSelect, 'change', (e) => {
  alertPreview.textContent = alertTexts[e.target.value];
});

on(genScript, 'click', () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    scriptOutput.textContent = '# Add a request to generate a playbook';
    return;
  }
  scriptOutput.textContent = `#!/usr/bin/env python3\n# Auto-generated playbook (mock)\nfrom datetime import datetime\nprint('Running: ${prompt.replace(/'/g, "")}')\n# TODO: wire to live data + auth\n`;
});

function updateEarlyWarning() {
  if (!earlyIndicator) return;
  const seconds = Math.max(15, Math.floor(Math.random() * 45 + 15));
  const states = ['Monitoring', 'Heads-up', 'Watch issued'];
  const signals = ['FIRMS hotspot + river rise', 'GPM rain + wind shift', 'ShakeMap micro tremors'];
  if (ewCountdown) ewCountdown.textContent = `${seconds}s`;
  if (ewNext) ewNext.textContent = `${seconds}s`;
  const state = states[Math.floor(Math.random() * states.length)];
  if (ewStatus) ewStatus.textContent = state;
  if (ewSignals) ewSignals.textContent = signals[Math.floor(Math.random() * signals.length)];
  earlyIndicator.style.borderColor = state === 'Watch issued' ? '#ff7b72' : 'var(--border)';
}

function updateTelemetry() {
  if (!uptimeVal) return;
  const uptime = (99 + Math.random()).toFixed(2);
  const latency = Math.max(4, Math.round(Math.random() * 18 + 4));
  const qps = Math.round(Math.random() * 70 + 40);
  const reports = Math.round(Math.random() * 260 + 120);
  uptimeVal.textContent = `${uptime}%`;
  latencyVal.textContent = `${latency}s`;
  qpsVal.textContent = qps;
  reportsVal.textContent = reports;
  drawSpark(latency);
  opsSeries = [...opsSeries.slice(-29), latency];
  drawOpsChart();
}

function drawSpark(latency) {
  if (!sparkCtx) return;
  const w = metricsSpark.width;
  const h = metricsSpark.height;
  sparkCtx.clearRect(0, 0, w, h);
  const points = Array.from({ length: 36 }, (_, i) => latency + Math.sin(i / 2) * 3 + Math.random() * 4);
  const max = Math.max(...points);
  const min = Math.min(...points);
  sparkCtx.beginPath();
  points.forEach((val, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((val - min) / (max - min + 0.001)) * h;
    if (i === 0) sparkCtx.moveTo(x, y); else sparkCtx.lineTo(x, y);
  });
  sparkCtx.strokeStyle = '#7cf7d4';
  sparkCtx.lineWidth = 2;
  sparkCtx.stroke();
  window.__telemetryDrawn = true;
}

function drawOpsChart() {
  if (!opsCtx) return;
  const w = opsChart.width;
  const h = opsChart.height;
  opsCtx.clearRect(0, 0, w, h);
  const max = Math.max(...opsSeries, 1);
  const min = Math.min(...opsSeries, 0);
  opsCtx.beginPath();
  opsSeries.forEach((val, i) => {
    const x = (i / Math.max(opsSeries.length - 1, 1)) * w;
    const y = h - ((val - min) / (max - min + 0.001)) * h;
    if (i === 0) opsCtx.moveTo(x, y); else opsCtx.lineTo(x, y);
  });
  opsCtx.strokeStyle = '#8cabff';
  opsCtx.lineWidth = 2;
  opsCtx.stroke();
  opsCtx.lineTo(w, h); opsCtx.lineTo(0, h); opsCtx.closePath();
  opsCtx.fillStyle = 'rgba(140,171,255,0.18)';
  opsCtx.fill();
  window.__telemetryDrawn = true;
}

const sentiments = ['Positive', 'Positive', 'Calm', 'Neutral', 'Alert', 'Concerned'];
const keywords = ['river rise', 'power', 'smoke', 'aftershock', 'bridge', 'winds', 'rainfall', 'sirens', 'mudflow', 'debris', 'ashfall', 'heat dome', 'storm surge', 'hail', 'lightning', 'evac route'];
const tickerTemplates = [
  'Smoke plume spotted near South Ridge',
  'River gauge upstream +6cm',
  'Power flicker reports in Bay sector',
  'Aftershock felt by residents, minor',
  'Heavy rain cell moving east over Ward 3',
  'Wind gust 48 km/h near airport',
  'Heat index 41C reported downtown',
  'Hail patch moving north of Ridgeway',
  'Storm surge model shows +0.6m rise'
];

function updateCommunity() {
  if (!sentimentVal) return;
  const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
  const buzz = (Math.random() * 3 + 1).toFixed(1);
  sentimentVal.textContent = sentiment;
  buzzVal.textContent = `${buzz}k`;
  const pos = Math.round(Math.random() * 35 + 45);
  const neu = Math.max(5, 100 - pos - Math.round(Math.random() * 20));
  if (posBar) posBar.style.width = `${pos}%`;
  if (neuBar) neuBar.style.width = `${neu}%`;
  const picks = [...keywords].sort(() => 0.5 - Math.random()).slice(0, 3);
  [word1, word2, word3].forEach((el, idx) => el && (el.textContent = picks[idx]));
  if (socialTicker) {
    socialTicker.innerHTML = '';
    const now = new Date();
    Array.from({ length: 3 }).forEach((_, idx) => {
      const minutesAgo = String(idx * 3 + 2).padStart(2, '0');
      const li = document.createElement('li');
      li.textContent = `${now.getHours().toString().padStart(2, '0')}:${minutesAgo}  ${tickerTemplates[Math.floor(Math.random() * tickerTemplates.length)]}`;
      socialTicker.appendChild(li);
    });
  }
}

function updateResources() {
  const percent = () => Math.max(35, Math.round(Math.random() * 55 + 40));
  const values = { pumps: percent(), meds: percent(), drones: percent(), shelters: percent() };
  if (pumpsBar) pumpsBar.style.width = `${values.pumps}%`;
  if (medBar) medBar.style.width = `${values.meds}%`;
  if (droneBar) droneBar.style.width = `${values.drones}%`;
  if (shelterBar) shelterBar.style.width = `${values.shelters}%`;
  if (allocInline) {
    allocInline.textContent = `Dispatch updates: pumps ${values.pumps}% ready  med teams ${values.meds}% staffed  drones ${values.drones}% charged  shelters ${values.shelters}% capacity free`;
  }
}

updateTelemetry();
updateCommunity();
updateResources();
updateEarlyWarning();
updateMonitorStatus();
setInterval(updateTelemetry, 5500);
setInterval(updateCommunity, 7200);
setInterval(updateResources, 8200);
setInterval(updateEarlyWarning, 6000);
setInterval(updateMonitorStatus, 7000);

// ---------- Modals & CTA wiring ----------
const openModal = (el) => { if (!el) return; el.classList.add('show'); el.setAttribute('aria-hidden', 'false'); };
const closeModal = (el) => { if (!el) return; el.classList.remove('show'); el.setAttribute('aria-hidden', 'true'); };

on(launchBtn, 'click', () => openModal(consoleModal));
on(pilotBtn, 'click', () => openModal(pilotModal));

Array.from(document.querySelectorAll('[data-close]')).forEach(btn => {
  btn.addEventListener('click', () => closeModal(document.querySelector(btn.dataset.close)));
});

on(consoleModal, 'click', (e) => { if (e.target === consoleModal) closeModal(consoleModal); });
on(pilotModal, 'click', (e) => { if (e.target === pilotModal) closeModal(pilotModal); });

Array.from(document.querySelectorAll('.tile')).forEach(tile => {
  tile.addEventListener('click', () => { tileStatus.textContent = `Loading ${tile.dataset.target} workspace... (mock link)`; });
});

on(pilotForm, 'submit', (e) => {
  e.preventDefault();
  pilotStatus.textContent = 'Slot requested. Our team will confirm within 24h.';
  pilotStatus.style.color = '#7cf7d4';
  pilotStatus.style.fontWeight = '700';
  pilotStatus.classList.add('status-ok');
  setTimeout(() => closeModal(pilotModal), 1800);
});

window.addEventListener('blur', () => cancelAnimationFrame(animateRisk));
window.addEventListener('focus', animateRisk);




























