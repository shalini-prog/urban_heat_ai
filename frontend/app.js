/* ═══════════════════════════════════════════════════
   HeatSafe India — app.js
   All interactive logic: map, API, panels, geolocation
═══════════════════════════════════════════════════ */

'use strict';

const API = 'http://127.0.0.1:8000';

/* ── colour maps ── */
const RISK_COLOR = {
  Normal:  '#22d3a0',
  Caution: '#f0c050',
  Danger:  '#f97316',
  Extreme: '#ef4444'
};
const COLOR_KEY = { green: '#22d3a0', yellow: '#f0c050', orange: '#f97316', red: '#ef4444' };

/* ── state ── */
let map, markersLayer, youLayer;
let currentData   = [];
let currentLayer  = 'risk';
let sidebarOpen   = true;
let _clicked      = null;

/* ════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════ */
function init() {
  map = L.map('map', { zoomControl: true, attributionControl: false });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, subdomains: 'abcd'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  youLayer     = L.layerGroup().addTo(map);

  loadHeatmap();

  /* wiring */
  document.getElementById('citySelect').addEventListener('change', loadHeatmap);
  document.getElementById('layerRisk').addEventListener('click', () => setLayer('risk'));
  document.getElementById('layerTemp').addEventListener('click', () => setLayer('temp'));
  document.getElementById('btnRefresh').addEventListener('click', loadHeatmap);
  document.getElementById('btnMyLoc').addEventListener('click', useMyLocation);
  document.getElementById('btnSearch').addEventListener('click', searchAddress);
  document.getElementById('btnClear').addEventListener('click', clearAll);
  document.getElementById('btnForecast').addEventListener('click', runForecast);
  document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
  document.getElementById('addrInput').addEventListener('keydown', e => { if (e.key === 'Enter') searchAddress(); });
}

/* ════════════════════════════════════════════════
   HEATMAP
════════════════════════════════════════════════ */
async function loadHeatmap() {
  const city = document.getElementById('citySelect').value;
  showLoader(true, 'FETCHING HEAT DATA…');
  resetStats();

  try {
    const res = await fetch(`${API}/heatmap?city=${city}`);
    const json = await res.json();
    if (json.status !== 'success') throw new Error(json.message);
    currentData = json.data;
    plotMarkers(json.data);
    updateStats(json.data);
    fitMap(json.data);
  } catch {
    const demo = generateDemo(city);
    currentData = demo;
    plotMarkers(demo);
    updateStats(demo);
    const centres = { chennai: [13.067, 80.237, 11], delhi: [28.644, 77.216, 11] };
    const c = centres[city] || centres.chennai;
    map.setView([c[0], c[1]], c[2]);
  } finally {
    showLoader(false);
  }
}

/* ════════════════════════════════════════════════
   PLOT MARKERS
════════════════════════════════════════════════ */
function plotMarkers(data) {
  markersLayer.clearLayers();
  data.forEach((d, i) => {
    const col = RISK_COLOR[d.risk_level] || COLOR_KEY[d.color] || '#38bdf8';
    const size = currentLayer === 'temp'
      ? Math.max(8, Math.min(22, (d.temperature - 25) * 1.2))
      : 12;

    /* animated entrance stagger via CSS */
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${col};
        box-shadow:0 0 10px 3px ${col}55, 0 0 3px 1px ${col};
        border:1.5px solid rgba(255,255,255,0.25);
        cursor:pointer;
        animation:markerPop 0.4s ${i * 18}ms cubic-bezier(0.34,1.56,0.64,1) both;
      "></div>`,
      iconSize: [size, size], iconAnchor: [size / 2, size / 2]
    });

    const marker = L.marker([d.lat, d.lon], { icon });
    marker.bindTooltip(`<b>${d.area}</b><br>${d.temperature}°C — ${d.risk_level}`, {
      permanent: false, direction: 'top', className: 'heat-tooltip'
    });
    marker.bindPopup(buildPopup(d), { maxWidth: 240, className: 'heat-popup' });
    marker.on('click', () => {
      _clicked = d;
      showDetail(d);
      fillFcCoords(d.lat, d.lon);
      runForecast();
    });
    markersLayer.addLayer(marker);
  });
}

/* popup HTML */
function buildPopup(d) {
  const col = RISK_COLOR[d.risk_level] || '#38bdf8';
  return `
    <div class="pu-name">${d.area}</div>
    <div class="pu-row"><span class="pu-k">Temp</span><span class="pu-v" style="color:${col}">${d.temperature}°C</span></div>
    <div class="pu-row"><span class="pu-k">Heat Index</span><span class="pu-v">${d.heat_index}°C</span></div>
    <div class="pu-row"><span class="pu-k">Humidity</span><span class="pu-v">${d.humidity}%</span></div>
    <div class="pu-row"><span class="pu-k">Risk Score</span><span class="pu-v">${d.risk_score}/100</span></div>
    <span class="pu-badge risk-badge ${d.risk_level}">${d.risk_level}</span>
    <button class="pu-btn" onclick="document.querySelector('[data-loc]') && showDetail(window._hs_clicked)">View Details →</button>
  `;
}

/* ════════════════════════════════════════════════
   GEOLOCATION
════════════════════════════════════════════════ */
function useMyLocation() {
  if (!navigator.geolocation) {
    toast('Geolocation not supported by this browser', true);
    return;
  }
  showLoader(true, 'DETECTING YOUR LOCATION…');
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      map.setView([lat, lon], 13);
      placeYouHere(lat, lon);
      fillFcCoords(lat, lon);
      showLoader(false);
      toast('📍 Location detected — loading forecast…');
      await runForecast();
    },
    err => {
      showLoader(false);
      toast('Could not get your location: ' + err.message, true);
    },
    { timeout: 10000, maximumAge: 30000 }
  );
}

function placeYouHere(lat, lon) {
  youLayer.clearLayers();
  const icon = L.divIcon({
    className: '',
    html: `<div class="you-here-pulse"><div class="you-here-inner"></div></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7]
  });
  const m = L.marker([lat, lon], { icon });
  m.bindPopup(`
    <div class="pu-name">📍 You are here</div>
    <div class="pu-row"><span class="pu-k">Lat</span><span class="pu-v">${lat.toFixed(5)}</span></div>
    <div class="pu-row"><span class="pu-k">Lon</span><span class="pu-v">${lon.toFixed(5)}</span></div>
  `, { maxWidth: 200 });
  m.addTo(youLayer);
  m.openPopup();
}

/* ════════════════════════════════════════════════
   ADDRESS SEARCH
════════════════════════════════════════════════ */
async function searchAddress() {
  const addr = document.getElementById('addrInput').value.trim();
  if (!addr) { toast('Enter an address to search', true); return; }
  showLoader(true, 'SEARCHING ADDRESS…');

  try {
    const res = await fetch(`${API}/address_heat?address=${encodeURIComponent(addr)}`);
    const json = await res.json();
    if (json.status !== 'success') throw new Error(json.message);

    markersLayer.clearLayers();
    currentData = json.points;
    plotMarkers(json.points);
    updateStats(json.points);
    fitMap(json.points);
    toast(`Found ${json.points.length} locations for "${addr}"`);
  } catch {
    /* fallback: geocode via Nominatim and show nearby demo grid */
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`);
      const gj  = await geo.json();
      if (!gj.length) throw new Error('not found');
      const lat = parseFloat(gj[0].lat);
      const lon = parseFloat(gj[0].lon);
      map.setView([lat, lon], 13);
      placeYouHere(lat, lon);
      fillFcCoords(lat, lon);

      /* generate grid of demo points */
      const grid = generateGrid(lat, lon, addr);
      markersLayer.clearLayers();
      currentData = grid;
      plotMarkers(grid);
      updateStats(grid);
      toast(`Showing heat estimate for "${addr}"`);
      await runForecast();
    } catch {
      toast('Address not found. Try a more specific address.', true);
    }
  } finally {
    showLoader(false);
  }
}

function generateGrid(lat, lon, label) {
  const points = [];
  const offsets = [
    [0,0],[0.01,0],[-0.01,0],[0,0.01],[0,-0.01],
    [0.01,0.01],[-0.01,0.01],[0.01,-0.01],[-0.01,-0.01]
  ];
  offsets.forEach(([dlat, dlon], i) => {
    const temp = 30 + Math.random() * 14;
    const humidity = 40 + Math.random() * 50;
    const rs = Math.round(20 + Math.random() * 75);
    const risk_level = rs < 30 ? 'Normal' : rs < 50 ? 'Caution' : rs < 70 ? 'Danger' : 'Extreme';
    points.push({
      area: i === 0 ? label : `${label} (zone ${i})`,
      lat: lat + dlat, lon: lon + dlon,
      temperature: Math.round(temp * 10) / 10,
      humidity: Math.round(humidity),
      heat_index: Math.round(temp + humidity * 0.1),
      vegetation: Math.round(Math.random() * 50) / 100,
      risk_score: rs, risk_level,
      color: { Normal:'green', Caution:'yellow', Danger:'orange', Extreme:'red' }[risk_level],
      worker_safety: buildSafety(risk_level, Math.round(temp + humidity * 0.1))
    });
  });
  return points;
}

/* ════════════════════════════════════════════════
   FORECAST
════════════════════════════════════════════════ */
async function runForecast() {
  const lat = parseFloat(document.getElementById('fcLat').value);
  const lon = parseFloat(document.getElementById('fcLon').value);
  if (isNaN(lat) || isNaN(lon)) return;

  document.getElementById('forecastResult').innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;color:var(--text2);font-size:0.65rem">
      <div class="spinner" style="width:14px;height:14px;border-width:2px"></div>Running forecast…
    </div>`;

  try {
    const res = await fetch(`${API}/forecast?lat=${lat}&lon=${lon}`);
    const json = await res.json();
    if (json.status !== 'success') throw new Error(json.message);
    renderForecast(json);
  } catch {
    const temp = 31 + Math.random() * 12;
    renderForecast({
      current_temp: Math.round(temp * 10) / 10,
      forecast: {
        tomorrow_temp: Math.round((temp + 1.2 + Math.random()) * 10) / 10,
        next_week_temp: Math.round((temp + 3 + Math.random() * 2) * 10) / 10,
        trend: temp > 40 ? 'increasing' : temp > 36 ? 'slightly increasing' : 'stable',
        heatwave_alert: (temp + 1.2) >= 40
      }
    });
  }
}

function renderForecast(json) {
  const f = json.forecast;
  const trendIcon = { increasing: '↑', 'slightly increasing': '↗', stable: '→', decreasing: '↓' };
  const trendCls  = f.trend.includes('increasing') ? 'up' : f.trend === 'stable' ? 'stable' : 'down';

  document.getElementById('forecastResult').innerHTML = `
    <div class="fc-grid">
      <div class="fc-cell">
        <div class="fc-label">Now</div>
        <div class="fc-val">${json.current_temp}<span class="fc-unit">°C</span></div>
      </div>
      <div class="fc-cell">
        <div class="fc-label">Tomorrow</div>
        <div class="fc-val" style="color:${f.tomorrow_temp >= 40 ? 'var(--c-extreme)' : 'var(--accent)'}">${f.tomorrow_temp}<span class="fc-unit">°C</span></div>
      </div>
      <div class="fc-cell full">
        <div class="fc-label">Next Week</div>
        <div class="fc-val" style="color:${f.next_week_temp >= 42 ? 'var(--c-extreme)' : 'var(--c-danger)'}">${f.next_week_temp}<span class="fc-unit">°C</span></div>
      </div>
    </div>
    <span class="trend-pill ${trendCls}">${trendIcon[f.trend] || '→'} ${f.trend}</span>
    ${f.heatwave_alert ? `
    <div class="hw-alert">
      🚨 <div><strong>HEATWAVE ALERT</strong><br>Extreme heat expected. Take immediate precautions.</div>
    </div>` : ''}
  `;

  /* global heatwave strip */
  const strip = document.getElementById('hw-strip');
  if (f.heatwave_alert) strip.classList.add('show');
}

/* ════════════════════════════════════════════════
   DETAIL PANEL
════════════════════════════════════════════════ */
function showDetail(d) {
  window._hs_clicked = d;
  const col = RISK_COLOR[d.risk_level] || '#38bdf8';

  document.getElementById('locationPanel').innerHTML = `
    <div class="loc-header">
      <div class="loc-name">${d.area}</div>
      <span class="risk-badge ${d.risk_level}">${d.risk_level}</span>
    </div>
    <div class="metric-grid">
      <div class="met">
        <div class="ml">🌡 Temp</div>
        <div class="mv" style="color:${col}">${d.temperature}<span class="mu">°C</span></div>
      </div>
      <div class="met">
        <div class="ml">💧 Heat Index</div>
        <div class="mv">${d.heat_index}<span class="mu">°C</span></div>
      </div>
      <div class="met">
        <div class="ml">💦 Humidity</div>
        <div class="mv">${d.humidity}<span class="mu">%</span></div>
      </div>
      <div class="met">
        <div class="ml">🌿 Vegetation</div>
        <div class="mv">${Math.round((d.vegetation || 0.2) * 100)}<span class="mu">%</span></div>
      </div>
    </div>
    <div class="risk-bar-wrap">
      <div class="rb-row"><span>Risk Score</span><span style="color:${col};font-weight:700">${d.risk_score}/100</span></div>
      <div class="rb-track"><div class="rb-fill" style="width:${d.risk_score}%"></div></div>
    </div>
    <div class="coords">📍 ${(+d.lat).toFixed(5)}, ${(+d.lon).toFixed(5)}</div>
  `;

  /* safety */
  const ws = d.worker_safety;
  if (ws) {
    const hours = (ws.work_schedule?.safe_hours || []).map(h => `<span class="hour-tag">${h}</span>`).join('');
    document.getElementById('safetyPanel').innerHTML = `
      <div class="safety-item">
        <div class="si-ico">⏰</div>
        <div>
          <div class="si-label">Safe Working Hours</div>
          <div class="si-val">${hours || '—'}</div>
          <div style="font-size:0.6rem;color:var(--text3);margin-top:3px">${ws.work_schedule?.message || ''}</div>
        </div>
      </div>
      <div class="safety-item">
        <div class="si-ico">💧</div>
        <div><div class="si-label">Water Intake</div><div class="si-val">${ws.water_intake}</div></div>
      </div>
      <div class="safety-item">
        <div class="si-ico">🔄</div>
        <div><div class="si-label">Rest Cycle</div><div class="si-val">${ws.rest_cycle}</div></div>
      </div>
      ${ws.warning && ws.warning !== 'Normal conditions' ? `
      <div class="safety-item">
        <div class="si-ico">⚠️</div>
        <div><div class="si-label">Warning</div><div class="si-val si-warn">${ws.warning}</div></div>
      </div>` : ''}
    `;
    document.getElementById('safetySection').style.display = '';
  }

  /* recs */
  const recs = getRecs(d.risk_level);
  document.getElementById('recsPanel').innerHTML = `
    <div class="rec-group">
      <div class="rec-group-label">⚡ Immediate</div>
      ${recs.immediate.map(r => `<div class="rec-item"><div class="rec-dot" style="background:var(--c-extreme)"></div><div class="rec-text">${r}</div></div>`).join('')}
    </div>
    <div class="rec-group">
      <div class="rec-group-label">📅 Short-term</div>
      ${recs.short.map(r => `<div class="rec-item"><div class="rec-dot" style="background:var(--c-danger)"></div><div class="rec-text">${r}</div></div>`).join('')}
    </div>
    <div class="rec-group">
      <div class="rec-group-label">🌱 Long-term</div>
      ${recs.long.map(r => `<div class="rec-item"><div class="rec-dot" style="background:var(--c-normal)"></div><div class="rec-text">${r}</div></div>`).join('')}
    </div>
  `;
  document.getElementById('recsSection').style.display = '';
}

/* ════════════════════════════════════════════════
   RECOMMENDATIONS DB
════════════════════════════════════════════════ */
function getRecs(level) {
  const db = {
    Extreme: {
      immediate: ['Evacuate outdoor workers immediately', 'Activate emergency cooling stations', 'Issue public heat health alert'],
      short:     ['Deploy mobile water tankers', 'Open air-conditioned public shelters', 'Restrict non-essential outdoor activity'],
      long:      ['Plant shade trees in high-risk zones', 'Install cool roofs & reflective surfaces', 'Develop urban green corridors']
    },
    Danger: {
      immediate: ['Limit outdoor work to cooler hours', 'Ensure shade & water access for workers', 'Monitor workers for heat exhaustion'],
      short:     ['Set up cooling zones in work areas', 'Schedule regular water breaks', 'Provide electrolyte drinks'],
      long:      ['Increase green cover in area', 'Install misting systems in public spaces', 'Urban planning review for heat mitigation']
    },
    Caution: {
      immediate: ['Encourage hydration every 30 min', 'Wear hats & light clothing outdoors', 'Avoid direct sun during noon hours'],
      short:     ['Monitor heat index forecasts daily', 'Prepare cooling facilities in advance', 'Distribute ORS packets proactively'],
      long:      ['Community awareness campaigns', 'Install solar-powered shade structures', 'Green roof incentive programs']
    },
    Normal: {
      immediate: ['Maintain regular hydration', 'Monitor weather updates', 'Keep emergency kits ready'],
      short:     ['Continue monitoring conditions', 'Prepare contingency heat plans', 'Ensure healthcare centres are stocked'],
      long:      ['Urban greening initiatives', 'Heat action plan development', 'Community heat resilience programs']
    }
  };
  return db[level] || db.Normal;
}

/* ════════════════════════════════════════════════
   WORKER SAFETY BUILDER
════════════════════════════════════════════════ */
function buildSafety(lvl, hi) {
  const schedules = {
    Extreme: { safe_hours: ['5:30 AM – 10 AM', '5 PM – 8 PM'],  message: 'Avoid outdoor work 10 AM – 5 PM' },
    Danger:  { safe_hours: ['6 AM – 11 AM', '4 PM – 7 PM'],     message: 'Limit work during peak heat' },
    Caution: { safe_hours: ['6 AM – 12 PM', '3 PM – 7 PM'],     message: 'Moderate heat — take precautions' },
    Normal:  { safe_hours: ['Any time'],                         message: 'Safe conditions' }
  };
  const water = hi >= 50 ? '1.0 – 1.5 L/hour' : hi >= 40 ? '0.7 – 1.0 L/hour' : hi >= 30 ? '0.5 – 0.7 L/hour' : '0.3 – 0.5 L/hour';
  const rest  = { Extreme: '20 min work / 40 min rest', Danger: '30 min work / 30 min rest', Caution: '45 min work / 15 min rest', Normal: 'Normal schedule' }[lvl];
  return {
    work_schedule: schedules[lvl],
    water_intake:  water,
    rest_cycle:    rest,
    warning:       (lvl === 'Extreme' || lvl === 'Danger') ? 'High risk of heatstroke' : 'Normal conditions'
  };
}

/* ════════════════════════════════════════════════
   DEMO DATA GENERATOR
════════════════════════════════════════════════ */
function generateDemo(city) {
  const cfg = {
    chennai: {
      lat: 13.067, lon: 80.237, base: 33,
      areas: ['T. Nagar','Adyar','Anna Nagar','Velachery','Tambaram','Sholinganallur',
               'Perambur','Royapuram','Guindy','Mylapore','Kodambakkam','Nungambakkam',
               'Porur','Chromepet','Besant Nagar','Thiruvanmiyur']
    },
    delhi: {
      lat: 28.644, lon: 77.216, base: 37,
      areas: ['Connaught Place','Lajpat Nagar','Karol Bagh','Dwarka','Rohini','Saket',
               'Nehru Place','Janakpuri','Pitampura','Mayur Vihar','Vasant Kunj',
               'Shahdara','Noida Sector 18','Faridabad','Gurgaon','Noida']
    }
  };
  const c = cfg[city] || cfg.chennai;
  return c.areas.map(area => {
    const temp     = c.base + Math.random() * 10;
    const humidity = 40 + Math.random() * 50;
    const rs       = Math.round(20 + Math.random() * 75);
    const risk_level = rs < 30 ? 'Normal' : rs < 50 ? 'Caution' : rs < 70 ? 'Danger' : 'Extreme';
    const hi       = Math.round(temp + humidity * 0.15);
    return {
      area,
      lat: c.lat + (Math.random() - 0.5) * 0.28,
      lon: c.lon + (Math.random() - 0.5) * 0.28,
      temperature: Math.round(temp * 10) / 10,
      humidity:    Math.round(humidity),
      heat_index:  hi,
      vegetation:  Math.round(Math.random() * 50) / 100,
      risk_score:  rs,
      risk_level,
      color: { Normal:'green', Caution:'yellow', Danger:'orange', Extreme:'red' }[risk_level],
      worker_safety: buildSafety(risk_level, hi)
    };
  });
}

/* ════════════════════════════════════════════════
   UTILITIES
════════════════════════════════════════════════ */
function setLayer(l) {
  currentLayer = l;
  document.getElementById('layerRisk').classList.toggle('active', l === 'risk');
  document.getElementById('layerTemp').classList.toggle('active', l === 'temp');
  if (currentData.length) plotMarkers(currentData);
}

function updateStats(data) {
  const c = { Normal:0, Caution:0, Danger:0, Extreme:0 };
  data.forEach(d => c[d.risk_level] !== undefined && c[d.risk_level]++);
  document.getElementById('cntExtreme').textContent = c.Extreme;
  document.getElementById('cntDanger').textContent  = c.Danger;
  document.getElementById('cntCaution').textContent = c.Caution;
  document.getElementById('cntSafe').textContent    = c.Normal;
}

function resetStats() {
  ['cntExtreme','cntDanger','cntCaution','cntSafe'].forEach(id => document.getElementById(id).textContent = '—');
}

function fitMap(data) {
  if (!data.length) return;
  const lats = data.map(d => +d.lat), lons = data.map(d => +d.lon);
  map.setView([
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lons) + Math.max(...lons)) / 2
  ], 12);
}

function clearAll() {
  markersLayer.clearLayers();
  youLayer.clearLayers();
  currentData = [];
  resetStats();
  document.getElementById('locationPanel').innerHTML = `
    <div class="empty"><div class="empty-ico">🗺️</div>Click a map marker to view location heat risk details</div>`;
  document.getElementById('safetySection').style.display = 'none';
  document.getElementById('recsSection').style.display = 'none';
  document.getElementById('forecastResult').innerHTML = `
    <div style="color:var(--text3);font-size:0.65rem;text-align:center;padding:8px 0">Enter coordinates or click a marker first</div>`;
  document.getElementById('hw-strip').classList.remove('show');
  toast('Map cleared');
}

function fillFcCoords(lat, lon) {
  document.getElementById('fcLat').value = (+lat).toFixed(5);
  document.getElementById('fcLon').value = (+lon).toFixed(5);
}

function showLoader(v, msg) {
  const el = document.getElementById('loader');
  el.classList.toggle('hidden', !v);
  if (msg) el.querySelector('.loader-msg').textContent = msg;
}

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  document.getElementById('sidebar').classList.toggle('collapsed', !sidebarOpen);
  document.getElementById('sidebar-toggle').textContent = sidebarOpen ? '⊞' : '⊟';
}

function toast(msg, err = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (err ? ' err' : '');
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', init);