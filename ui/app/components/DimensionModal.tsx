import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface DimSlice { name: string; value: number; }

export interface DimensionModalProps {
  label: string;
  color?: string;
  onClose: () => void;
  fetchGeo?: () => Promise<DimSlice[]>;
  fetchBrowser?: () => Promise<DimSlice[]>;
}

const GEO_COLORS    = ["#4589FF", "#23A5D0", "#3FA66C", "#A66C3F", "#8B5CF6", "#64748B", "#F59E0B", "#EC4899"];
const BROWSER_COLORS = ["#FF6B35", "#4ECDC4", "#45B7D1", "#96CEB4", "#B0B0B0", "#F59E0B"];

// ─── SVG Pie Chart ────────────────────────────────────────────────────────────

function PieChart({ data, title, colors }: { data: DimSlice[]; title: string; colors: string[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <div style={{ opacity: 0.4, fontSize: 12, textAlign: "center", padding: 32 }}>No data</div>;

  const R = 74, Rh = 80;
  const cx = 90, cy = 90;
  let startAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    const r = hovered === i ? Rh : R;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    const pct = (d.value / total) * 100;
    const result = { path, color: colors[i % colors.length], slice: d, pct };
    startAngle = endAngle;
    return result;
  });

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.45, textTransform: "uppercase" as const, marginBottom: 10, letterSpacing: "0.06em" }}>{title}</div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
        <svg width={180} height={180} style={{ flexShrink: 0, overflow: "visible" }}>
          {slices.map((s, i) => (
            <path
              key={i}
              d={s.path}
              fill={s.color}
              stroke="#151829"
              strokeWidth={hovered === i ? 2 : 1.5}
              style={{ cursor: "pointer", transition: "all 0.15s ease" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Center hole */}
          <circle cx={cx} cy={cy} r={32} fill="#151829" />
          {hovered !== null && (
            <text x={cx} y={cy - 5} textAnchor="middle" fontSize={10} fill="#e8eaf0" fontWeight={700}>{slices[hovered].pct.toFixed(1)}%</text>
          )}
          {hovered !== null && (
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="rgba(232,234,240,0.55)" fontWeight={400}>{slices[hovered].slice.name.length > 12 ? slices[hovered].slice.name.slice(0, 11) + "…" : slices[hovered].slice.name}</text>
          )}
        </svg>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 5, paddingTop: 4, flex: 1 }}>
          {slices.map((s, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", opacity: hovered !== null && hovered !== i ? 0.35 : 1, transition: "opacity 0.12s" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, opacity: 0.85, flex: 1, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{s.slice.name}</span>
              <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 600, flexShrink: 0 }}>{s.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Fallback Data ─────────────────────────────────────────────────────────────

const DEFAULT_GEO: DimSlice[] = [
  { name: "United States", value: 38 },
  { name: "United Kingdom", value: 17 },
  { name: "Germany", value: 14 },
  { name: "France", value: 9 },
  { name: "Canada", value: 8 },
  { name: "Australia", value: 6 },
  { name: "Other", value: 8 },
];

const DEFAULT_BROWSER: DimSlice[] = [
  { name: "Chrome", value: 57 },
  { name: "Safari", value: 23 },
  { name: "Firefox", value: 10 },
  { name: "Edge", value: 8 },
  { name: "Other", value: 2 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function DimensionModal({ label, color, onClose, fetchGeo, fetchBrowser }: DimensionModalProps) {
  const [geoData, setGeoData]         = useState<DimSlice[]>([]);
  const [browserData, setBrowserData] = useState<DimSlice[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetchGeo     ? fetchGeo()     : Promise.resolve(DEFAULT_GEO),
      fetchBrowser ? fetchBrowser() : Promise.resolve(DEFAULT_BROWSER),
    ])
      .then(([geo, browser]) => {
        if (!active) return;
        setGeoData(geo.length     ? geo     : DEFAULT_GEO);
        setBrowserData(browser.length ? browser : DEFAULT_BROWSER);
      })
      .catch(() => { if (active) { setGeoData(DEFAULT_GEO); setBrowserData(DEFAULT_BROWSER); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)" }} onClick={onClose} />
      <div style={{
        position: "relative",
        background: "#151829",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        padding: "22px 26px",
        width: 660,
        maxWidth: "95vw",
        boxShadow: "0 28px 70px rgba(0,0,0,0.6)",
        fontFamily: "'Segoe UI',system-ui,sans-serif",
        color: "#e8eaf0",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>
              <span style={{ marginRight: 8 }}>🌍</span>Dimension Breakdown
            </div>
            <div style={{ fontSize: 11, opacity: 0.4, marginTop: 3 }}>
              <span style={{ color: color ?? "#4589FF", fontWeight: 700 }}>{label}</span>
              &ensp;·&ensp;Geographic &amp; Browser distribution · last 7 days
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "inherit", fontSize: 18, cursor: "pointer", opacity: 0.35, padding: "4px 8px", lineHeight: 1 }}
          >✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.45, fontSize: 13 }}>Loading dimension data…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 24, alignItems: "start" }}>
            <PieChart data={geoData} title="GEO breakdown (country)" colors={GEO_COLORS} />
            <div style={{ background: "rgba(255,255,255,0.07)", height: "100%", minHeight: 180 }} />
            <PieChart data={browserData} title="Browser breakdown" colors={BROWSER_COLORS} />
          </div>
        )}

        <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 10, opacity: 0.3, textAlign: "right" }}>
          Dimension Breakdown · Backend Overview
        </div>
      </div>
    </div>,
    document.body
  );
}
