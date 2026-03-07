import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Heatmap layer (safe toggle) ──────────────────────────────────── */
function HeatLayer({ points, active }) {
  const map = useMap();
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      try { map.removeLayer(ref.current); } catch (_) {}
      ref.current = null;
    }
    if (!active || !points.length) return;

    import("leaflet.heat").then(() => {
      try {
        const data = points.map(p => [p.lat, p.lon, Math.min(p.temperature / 50, 1)]);
        ref.current = L.heatLayer(data, {
          radius: 40, blur: 25, maxZoom: 12,
          gradient: { 0.3: "#60a5fa", 0.5: "#fbbf24", 0.75: "#f97316", 1.0: "#dc2626" }
        }).addTo(map);
      } catch (e) { console.error(e); }
    });

    return () => {
      if (ref.current) {
        try { map.removeLayer(ref.current); } catch (_) {}
        ref.current = null;
      }
    };
  }, [active, points, map]);

  return null;
}

/* ── Helpers ──────────────────────────────────────────────────────── */
function tempColor(t) {
  if (t >= 44) return "#dc2626";
  if (t >= 42) return "#ea580c";
  if (t >= 45) return "#d97706";
  if (t >= 30) return "#ca8a04";
  if (t >= 25) return "#65a30d";
  return "#16a34a";
}
function tempBg(t) {
  if (t >= 44) return "#fee2e2";
  if (t >= 42) return "#ffedd5";
  if (t >= 40) return "#fef3c7";
  if (t >= 38) return "#fef9c3";
  return "#dcfce7";
}
function computeAQI(p) {
  if (p.aqi && p.aqi > 0) return p.aqi;
  const v = p.vegetation ?? 20;
  return Math.max(20, Math.min(500, Math.round(60 + (p.temperature - 35) * 8 - v * 0.5)));
}
function computeRisk(p) {
  if (p.risk_score && p.risk_score > 0) return p.risk_score;
  return Math.min(100, Math.max(0, Math.round(((p.temperature - 30) / 20) * 100)));
}
function aqiLabel(v) {
  if (v > 300) return { label: "Hazardous",   color: "#dc2626" };
  if (v > 200) return { label: "Very Poor",   color: "#ea580c" };
  if (v > 150) return { label: "Unhealthy",   color: "#d97706" };
  if (v > 100) return { label: "Moderate",    color: "#ca8a04" };
  if (v > 50)  return { label: "Fair",        color: "#65a30d" };
  return             { label: "Good",         color: "#16a34a" };
}

/* ── Sparkline ────────────────────────────────────────────────────── */
function Sparkline({ data }) {
  if (!data?.length) return null;
  const temps = data.map(d => d.temp);
  const min = Math.min(...temps) - 0.5;
  const max = Math.max(...temps) + 0.5;
  const W = 220, H = 48;
  const pts = temps.map((t, i) => {
    const x = (i / (temps.length - 1)) * W;
    const y = H - ((t - min) / (max - min)) * H;
    return `${x},${y}`;
  }).join(" ");
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>
        7-Day Temperature Forecast
      </div>
      <svg width={W} height={H + 16} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke="url(#sg)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />
        {temps.map((t, i) => {
          const x = (i / (temps.length - 1)) * W;
          const y = H - ((t - min) / (max - min)) * H;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3.5" fill={tempColor(t)} stroke="#fff" strokeWidth="1.5" />
              <text x={x} y={H + 14} textAnchor="middle"
                style={{ fontSize: "9px", fill: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                {days[i] || `D${i+1}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Popup ────────────────────────────────────────────────────────── */
function ZonePopup({ p, onFetchForecast, forecast, loadingForecast, recommendation, loadingRec, onFetchRec }) {
  const aqi = computeAQI(p);
  const risk = computeRisk(p);
  const aqiInfo = aqiLabel(aqi);
  const tc = tempColor(p.temperature);
  const tb = tempBg(p.temperature);

  return (
    <div style={{ width: 280, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>{p.area}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>📍 {p.pincode}</div>
          </div>
          <div style={{
            background: tb, color: tc, borderRadius: 8, padding: "4px 10px",
            fontSize: 15, fontWeight: 700, fontFamily: "'DM Mono', monospace",
            border: `1px solid ${tc}30`
          }}>
            {p.temperature}°C
          </div>
        </div>
        <div style={{
          marginTop: 8, display: "inline-block",
          background: tb, color: tc,
          fontSize: 11, fontWeight: 500, padding: "2px 8px",
          borderRadius: 20, border: `1px solid ${tc}25`
        }}>
          {p.zone_label || p.heat_zone_label || "—"}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Humidity",    value: `${p.humidity}%`,        icon: "💧" },
          { label: "Vegetation",  value: `${p.vegetation ?? 0}%`, icon: "🌿" },
          { label: "AQI",         value: `${aqi} — ${aqiInfo.label}`, icon: "💨",
            valueColor: aqiInfo.color, span: true },
        ].map(({ label, value, icon, valueColor, span }) => (
          <div key={label}
            style={{
              background: "var(--surface-2)", borderRadius: 8,
              padding: "8px 10px", gridColumn: span ? "1/-1" : undefined
            }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{icon} {label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: valueColor || "var(--text-primary)",
              fontFamily: "'DM Mono', monospace" }}>{value}</div>
          </div>
        ))}

        {/* Risk bar */}
        <div style={{ background: "var(--surface-2)", borderRadius: 8, padding: "8px 10px", gridColumn: "1/-1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>⚠️ Heat Risk Score</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: tempColor(p.temperature),
              fontFamily: "'DM Mono', monospace" }}>{risk}%</span>
          </div>
          <div style={{ background: "var(--border)", borderRadius: 4, height: 5, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${risk}%`,
              background: `linear-gradient(90deg, #fbbf24, ${tempColor(p.temperature)})`,
              borderRadius: 4, transition: "width 0.8s ease"
            }} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "0 16px 12px", display: "flex", gap: 8 }}>
        {!forecast && (
          <button onClick={() => onFetchForecast(p)}
            disabled={loadingForecast}
            style={{
              flex: 1, padding: "8px 0",
              background: loadingForecast ? "var(--surface-2)" : "var(--blue)",
              color: loadingForecast ? "var(--text-muted)" : "#fff",
              border: "none", borderRadius: 8, cursor: loadingForecast ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}>
            {loadingForecast ? "Loading…" : "📈 Forecast"}
          </button>
        )}
        {!recommendation && (
          <button onClick={() => onFetchRec(p)}
            disabled={loadingRec}
            style={{
              flex: 1, padding: "8px 0",
              background: loadingRec ? "var(--surface-2)" : "var(--green)",
              color: loadingRec ? "var(--text-muted)" : "#fff",
              border: "none", borderRadius: 8, cursor: loadingRec ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}>
            {loadingRec ? "Loading…" : "🌿 Mitigate"}
          </button>
        )}
      </div>

      {/* Forecast panel */}
      {forecast && (
        <div style={{ margin: "0 16px 12px", background: "#eff6ff",
          borderRadius: 10, padding: "12px 14px", border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--blue)", marginBottom: 8 }}>
            Temperature Forecast
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
            {[
              { label: "Tomorrow",   val: forecast.tomorrow_temp },
              { label: "Next Week",  val: forecast.next_week_temp },
              { label: "Next Month", val: forecast.next_month_temp },
            ].filter(x => x.val != null).map(({ label, val }) => (
              <div key={label} style={{ textAlign: "center", background: "#fff",
                borderRadius: 8, padding: "6px 4px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: tempColor(val),
                  fontFamily: "'DM Mono', monospace" }}>{val}°</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          {forecast.alert_message && (
            <div style={{ fontSize: 11, color: forecast.alert ? "#dc2626" : "#16a34a",
              background: forecast.alert ? "#fee2e2" : "#dcfce7",
              borderRadius: 6, padding: "5px 8px", marginBottom: 6 }}>
              {forecast.alert_message}
            </div>
          )}
          <Sparkline data={forecast.weekly_trend} />
        </div>
      )}

      {/* Recommendation panel */}
      {recommendation && (
        <div style={{ margin: "0 16px 14px", background: "#f0fdf4",
          borderRadius: 10, padding: "12px 14px", border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", marginBottom: 8 }}>
            Cooling Recommendations
          </div>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {recommendation.map((r, i) => (
              <li key={i} style={{ fontSize: 11, color: "var(--text-primary)",
                background: "#fff", borderRadius: 6, padding: "5px 8px",
                border: "1px solid #dcfce7" }}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────── */
export default function HeatMap({ points = [], loading = false }) {
  const [heatMode, setHeatMode] = useState(false);
  const [forecasts, setForecasts]       = useState({});
  const [recommendations, setRecs]      = useState({});
  const [loadingFc, setLoadingFc]       = useState({});
  const [loadingRc, setLoadingRc]       = useState({});

  const key = p => `${p.lat}_${p.lon}`;

  const fetchForecast = async (p) => {
    const k = key(p);
    setLoadingFc(s => ({ ...s, [k]: true }));
    try {
      const r = await fetch(
        `http://127.0.0.1:8000/forecast?temp=${p.temperature}&humidity=${p.humidity}&vegetation=${p.vegetation ?? 0.2}`
      );
      const d = await r.json();
      if (d.status === "success") setForecasts(s => ({ ...s, [k]: d.forecast }));
    } catch (e) { console.error(e); }
    finally { setLoadingFc(s => ({ ...s, [k]: false })); }
  };

  const fetchRec = async (p) => {
    const k = key(p);
    setLoadingRc(s => ({ ...s, [k]: true }));
    try {
      const zone = p.zone_label || p.heat_zone_label || "Warm";
      const r = await fetch(
        `http://127.0.0.1:8000/recommendation?temp=${p.temperature}&humidity=${p.humidity}&vegetation=${p.vegetation ?? 0.2}&zone=${encodeURIComponent(zone)}`
      );
      const d = await r.json();
      if (d.recommendations) setRecs(s => ({ ...s, [k]: d.recommendations }));
    } catch (e) { console.error(e); }
    finally { setLoadingRc(s => ({ ...s, [k]: false })); }
  };

  return (
    <div style={{
      borderRadius: "var(--radius-lg)", overflow: "hidden",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-md)",
      position: "relative",
    }}>
      {/* Toolbar */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 1000,
        display: "flex", gap: 8,
      }}>
        <button
          onClick={() => setHeatMode(m => !m)}
          style={{
            padding: "7px 16px",
            background: "var(--surface)",
            color: heatMode ? "var(--orange)" : "var(--blue)",
            border: `1.5px solid ${heatMode ? "var(--orange)" : "var(--blue)"}`,
            borderRadius: 8, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
            boxShadow: "var(--shadow-sm)",
            transition: "all 0.2s",
            display: "flex", alignItems: "center", gap: 6,
          }}>
          {heatMode
            ? <><span style={{ fontSize: 14 }}>●</span> Point View</>
            : <><span style={{ fontSize: 14 }}>◉</span> Heat View</>
          }
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 2000,
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 14,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTop: "3px solid var(--blue)",
            animation: "spin 0.8s linear infinite",
          }} />
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
            Fetching sensor data…
          </span>
        </div>
      )}

      <MapContainer
        center={[22.9734, 78.6569]}
        zoom={5}
        style={{ height: 560, width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <HeatLayer points={points} active={heatMode} />

        {!heatMode && points.map((p, i) => {
          const k = key(p);
          return (
            <CircleMarker
              key={i}
              center={[p.lat, p.lon]}
              radius={9}
              pathOptions={{
                color: "#fff",
                fillColor: tempColor(p.temperature),
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup minWidth={280} maxWidth={300} autoPan={true}>
                <ZonePopup
                  p={p}
                  forecast={forecasts[k]}
                  recommendation={recommendations[k]}
                  loadingForecast={!!loadingFc[k]}
                  loadingRec={!!loadingRc[k]}
                  onFetchForecast={fetchForecast}
                  onFetchRec={fetchRec}
                />
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 16, left: 12, zIndex: 1000,
        background: "var(--surface)", borderRadius: "var(--radius)",
        border: "1px solid var(--border)", padding: "10px 14px",
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)",
          letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>
          Temperature
        </div>
        {[
          { color: "#dc2626", label: "≥ 44°C  Extreme"   },
          { color: "#ea580c", label: "42–44°C  Severe"   },
          { color: "#d97706", label: "40–42°C  High"     },
          { color: "#ca8a04", label: "38–40°C  Moderate" },
          { color: "#16a34a", label: "< 38°C   Normal"   },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}