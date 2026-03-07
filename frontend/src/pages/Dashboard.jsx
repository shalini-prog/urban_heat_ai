import { useEffect, useState } from "react";
import HeatMap from "../components/HeatMap";

/* ── Helpers ──────────────────────────────────────────────────────── */
function computeAQI(p) {
  if (p.aqi && p.aqi > 0) return p.aqi;
  const v = p.vegetation ?? 20;
  return Math.max(20, Math.min(500, Math.round(60 + (p.temperature - 35) * 8 - v * 0.5)));
}
function computeRisk(p) {
  if (p.risk_score && p.risk_score > 0) return p.risk_score;
  return Math.min(100, Math.max(0, Math.round(((p.temperature - 30) / 20) * 100)));
}
function tempColor(t) {
  if (t >= 44) return "#dc2626";
  if (t >= 42) return "#ea580c";
  if (t >= 40) return "#d97706";
  if (t >= 38) return "#ca8a04";
  return "#16a34a";
}

/* ── Animated number ──────────────────────────────────────────────── */
function AnimNum({ to, decimals = 1, suffix = "" }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const end = parseFloat(to) || 0;
    let cur = 0;
    const steps = 40, inc = end / steps;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= end) { setV(end); clearInterval(t); }
      else setV(cur);
    }, 18);
    return () => clearInterval(t);
  }, [to]);
  return <>{v.toFixed(decimals)}{suffix}</>;
}

/* ── Stat card ────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, suffix = "", decimals = 1, accent, note, delay = 0 }) {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)", padding: "20px 22px",
      boxShadow: "var(--shadow-sm)",
      animation: `fadeInUp 0.5s ease both`,
      animationDelay: `${delay}ms`,
      transition: "box-shadow 0.2s, transform 0.2s",
      cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)",
            textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: accent || "var(--text-primary)",
            fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
            <AnimNum to={value} decimals={decimals} suffix={suffix} />
          </div>
          {note && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>{note}</div>}
        </div>
        <div style={{ fontSize: 26, opacity: 0.85 }}>{icon}</div>
      </div>
    </div>
  );
}

/* ── City pill ────────────────────────────────────────────────────── */
function CityPill({ id, label, count, active, onClick }) {
  return (
    <button onClick={() => onClick(id)} style={{
      padding: "7px 18px",
      background: active ? "var(--blue)" : "var(--surface)",
      color: active ? "#fff" : "var(--text-secondary)",
      border: active ? "1.5px solid var(--blue)" : "1.5px solid var(--border)",
      borderRadius: 50, cursor: "pointer",
      fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
      boxShadow: active ? "0 2px 8px rgba(37,99,235,0.2)" : "var(--shadow-sm)",
      transition: "all 0.15s",
      display: "flex", alignItems: "center", gap: 7,
    }}>
      {label}
      <span style={{
        background: active ? "rgba(255,255,255,0.25)" : "var(--surface-2)",
        color: active ? "#fff" : "var(--text-muted)",
        borderRadius: 50, padding: "1px 7px", fontSize: 11, fontWeight: 600,
      }}>{count}</span>
    </button>
  );
}

/* ── Alert bar ────────────────────────────────────────────────────── */
function AlertBar({ zones }) {
  const hot = zones.filter(z => z.temperature >= 42);
  if (!hot.length) return null;
  return (
    <div style={{
      background: "#fff7ed", border: "1px solid #fdba74",
      borderRadius: "var(--radius)", padding: "12px 18px",
      display: "flex", alignItems: "center", gap: 12,
      animation: "fadeInUp 0.4s ease both",
      marginBottom: 20,
    }}>
      <span style={{ fontSize: 20 }}>🌡️</span>
      <div>
        <span style={{ fontWeight: 600, color: "#9a3412", fontSize: 13 }}>
          Heat Advisory —&nbsp;
        </span>
        <span style={{ color: "#c2410c", fontSize: 13 }}>
          {hot.length} zone{hot.length > 1 ? "s" : ""} above 42°C:&nbsp;
          {hot.slice(0, 3).map(z => z.area).join(", ")}{hot.length > 3 ? ` +${hot.length - 3} more` : ""}
        </span>
      </div>
    </div>
  );
}

/* ── Zone ranking table ───────────────────────────────────────────── */
function ZoneTable({ zones }) {
  const sorted = [...zones].sort((a, b) => b.temperature - a.temperature).slice(0, 8);
  if (!sorted.length) return (
    <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
      No zone data yet
    </div>
  );
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["#", "Area", "Temp", "Humidity", "AQI", "Risk"].map(h => (
              <th key={h} style={{
                padding: "8px 10px", textAlign: "left",
                fontSize: 11, color: "var(--text-muted)", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.5px"
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((z, i) => {
            const aqi = computeAQI(z);
            const risk = computeRisk(z);
            return (
              <tr key={i}
                style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "10px 10px", color: "var(--text-muted)", fontWeight: 500 }}>{i + 1}</td>
                <td style={{ padding: "10px 10px", fontWeight: 500, color: "var(--text-primary)" }}>{z.area}</td>
                <td style={{ padding: "10px 10px" }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontWeight: 700,
                    color: tempColor(z.temperature), fontSize: 13,
                    background: `${tempColor(z.temperature)}12`,
                    padding: "2px 7px", borderRadius: 6,
                  }}>{z.temperature}°C</span>
                </td>
                <td style={{ padding: "10px 10px", color: "var(--text-secondary)",
                  fontFamily: "'DM Mono', monospace" }}>{z.humidity}%</td>
                <td style={{ padding: "10px 10px", fontFamily: "'DM Mono', monospace",
                  color: aqi > 150 ? "#dc2626" : aqi > 100 ? "#d97706" : "#16a34a",
                  fontWeight: 600 }}>{aqi}</td>
                <td style={{ padding: "10px 10px", minWidth: 90 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, background: "var(--border)", borderRadius: 4, height: 5 }}>
                      <div style={{
                        height: "100%", borderRadius: 4, width: `${risk}%`,
                        background: risk > 70 ? "#dc2626" : risk > 40 ? "#d97706" : "#16a34a",
                        transition: "width 1s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace",
                      color: "var(--text-secondary)", minWidth: 28 }}>{risk}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Distribution bar ─────────────────────────────────────────────── */
function DistBar({ label, count, total, color }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace",
          fontWeight: 600, color }}>{count} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ background: "var(--border)", borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 4, background: color,
          transition: "width 1s ease",
        }} />
      </div>
    </div>
  );
}

/* ── Section header ───────────────────────────────────────────────── */
function SectionHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

/* ── Card wrapper ─────────────────────────────────────────────────── */
function Card({ children, style = {}, delay = 0 }) {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)", padding: "20px 22px",
      boxShadow: "var(--shadow-sm)",
      animation: "fadeInUp 0.5s ease both",
      animationDelay: `${delay}ms`,
      ...style
    }}>
      {children}
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────────────────── */
export default function Dashboard() {
  const [points, setPoints]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity]       = useState("both");
  const [updated, setUpdated] = useState(null);
  const [error, setError]     = useState(null);
  const [dark, setDark]        = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [chR, dlR] = await Promise.all([
        fetch("http://127.0.0.1:8000/heatmap?city=chennai"),
        fetch("http://127.0.0.1:8000/heatmap?city=delhi"),
      ]);
      const ch = await chR.json();
      const dl = await dlR.json();
      let all = [];
      if (ch.status === "success") all = all.concat(ch.data);
      if (dl.status === "success") all = all.concat(dl.data);
      setPoints(all);
      setUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      setError("Unable to connect to backend. Is the server running on port 8000?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = city === "both" ? points
    : city === "chennai" ? points.filter(p => p.lat < 15)
    : points.filter(p => p.lat >= 25);

  const avg    = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  const avgTemp  = avg(filtered.map(p => p.temperature));
  const maxTemp  = filtered.length ? Math.max(...filtered.map(p => p.temperature)) : 0;
  const avgHumid = avg(filtered.map(p => p.humidity));
  const avgAQI   = avg(filtered.map(p => computeAQI(p)));
  const highRisk = filtered.filter(p => p.temperature >= 42).length;

  const chennaiCount = points.filter(p => p.lat < 15).length;
  const delhiCount   = points.filter(p => p.lat >= 25).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "0 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60, boxShadow: "var(--shadow-sm)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, flexShrink: 0,
          }}>🌍</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)",
              letterSpacing: "-0.2px" }}>Urban Heat Island Monitor</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              AI-Powered Climate Intelligence Platform
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {updated && (
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Updated&nbsp;<span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{updated}</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%",
              background: loading ? "#d97706" : "#16a34a",
              animation: "pulse-dot 1.8s ease infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 500,
              color: loading ? "#d97706" : "#16a34a" }}>
              {loading ? "Fetching…" : "Live"}
            </span>
          </div>
          {/* Theme toggle */}
          <button onClick={() => setDark(d => !d)}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              padding: "7px 14px",
              background: dark ? "#2d3550" : "var(--surface-2)",
              color: dark ? "#e8edf5" : "var(--text-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8, cursor: "pointer",
              fontSize: 16, lineHeight: 1,
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
              boxShadow: "var(--shadow-sm)",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--blue)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <span style={{ fontSize: 15 }}>{dark ? "☀️" : "🌙"}</span>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{dark ? "Light" : "Dark"}</span>
          </button>

          <button onClick={fetchData}
            disabled={loading}
            style={{
              padding: "7px 16px",
              background: "var(--blue-soft)", color: "var(--blue)",
              border: "1px solid var(--blue-light)",
              borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
              opacity: loading ? 0.6 : 1, transition: "opacity 0.15s",
            }}>
            ↻ Refresh
          </button>
        </div>
      </header>

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      <main style={{ padding: "28px 36px", maxWidth: 1400, margin: "0 auto" }}>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fee2e2", border: "1px solid #fca5a5",
            borderRadius: "var(--radius)", padding: "12px 16px",
            color: "#991b1b", fontSize: 13, marginBottom: 20,
            animation: "fadeIn 0.3s ease",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* City filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 22,
          animation: "fadeInUp 0.4s ease both" }}>
          <CityPill id="both"    label="All Cities" count={points.length}    active={city === "both"}    onClick={setCity} />
          <CityPill id="chennai" label="Chennai"     count={chennaiCount}    active={city === "chennai"} onClick={setCity} />
          <CityPill id="delhi"   label="Delhi"       count={delhiCount}      active={city === "delhi"}   onClick={setCity} />
        </div>

        {/* Alert */}
        <AlertBar zones={filtered} />

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard icon="🌡️" label="Avg Temperature" value={avgTemp}  suffix="°C" decimals={1}
            accent={avgTemp >= 40 ? "#d97706" : undefined} delay={0} />
          <StatCard icon="🔥" label="Peak Temperature" value={maxTemp}  suffix="°C" decimals={1}
            accent={maxTemp >= 42 ? "#dc2626" : "#d97706"} delay={60} />
          <StatCard icon="💧" label="Avg Humidity"     value={avgHumid} suffix="%"  decimals={0}
            accent="#2563eb" delay={120} />
          <StatCard icon="💨" label="Avg AQI"          value={avgAQI}   suffix=""   decimals={0}
            accent={avgAQI > 150 ? "#dc2626" : avgAQI > 100 ? "#d97706" : "#16a34a"}
            note={avgAQI > 150 ? "Unhealthy" : avgAQI > 100 ? "Moderate" : "Good"}
            delay={180} />
          <StatCard icon="⚠️" label="High-Risk Zones"  value={highRisk} suffix=""   decimals={0}
            accent={highRisk > 0 ? "#ea580c" : "#16a34a"} delay={240} />
        </div>

        {/* Map + sidebar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginBottom: 24 }}>

          {/* Map */}
          <div style={{ animation: "fadeInUp 0.5s ease both", animationDelay: "100ms" }}>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px 14px",
                borderBottom: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Geospatial Heat Distribution</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
                    {filtered.length} monitoring zones active
                  </div>
                </div>
              </div>
              <HeatMap points={filtered} loading={loading} />
            </Card>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Zone distribution */}
            <Card delay={150}>
              <SectionHead title="Zone Distribution" sub="Classified by temperature range" />
              {[
                { label: "Extreme  ≥ 44°C",  color: "#dc2626", count: filtered.filter(p => p.temperature >= 44).length },
                { label: "Severe   42–44°C", color: "#ea580c", count: filtered.filter(p => p.temperature >= 42 && p.temperature < 44).length },
                { label: "High     40–42°C", color: "#d97706", count: filtered.filter(p => p.temperature >= 40 && p.temperature < 42).length },
                { label: "Moderate 38–40°C", color: "#ca8a04", count: filtered.filter(p => p.temperature >= 38 && p.temperature < 40).length },
                { label: "Normal   < 38°C",  color: "#16a34a", count: filtered.filter(p => p.temperature < 38).length },
              ].map(d => (
                <DistBar key={d.label} {...d} total={filtered.length} />
              ))}
            </Card>

            {/* System status */}
            <Card delay={200}>
              <SectionHead title="System Status" />
              {[
                { label: "API Server",         val: "Online",                    ok: !error },
                { label: "Chennai Sensors",    val: `${chennaiCount} zones`,     ok: chennaiCount > 0 },
                { label: "Delhi Sensors",      val: `${delhiCount} zones`,       ok: delhiCount > 0 },
                { label: "AI Forecast Model",  val: "Ready",                     ok: true },
                { label: "Recommendation AI",  val: "Ready",                     ok: true },
              ].map(({ label, val, ok }) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 0", borderBottom: "1px solid var(--border)"
                }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%",
                      background: ok ? "#16a34a" : "#dc2626",
                      boxShadow: ok ? "0 0 5px #16a34a60" : "0 0 5px #dc262660" }} />
                    <span style={{ fontSize: 11, fontWeight: 500,
                      color: ok ? "#16a34a" : "#dc2626" }}>{val}</span>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>

        {/* Top zones table */}
        <Card delay={250}>
          <SectionHead title="Top Heat Zones" sub="Ranked by temperature — click a point on the map for forecast & mitigation" />
          <ZoneTable zones={filtered} />
        </Card>

      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)", background: "var(--surface)",
        padding: "14px 36px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Urban Heat Island Monitoring System · AI-Powered Climate Analysis
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          FastAPI · React · Leaflet · OpenWeatherMap
        </span>
      </footer>
    </div>
  );
}