import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { Text, Heading } from "@dynatrace/strato-components/typography";
import { ProgressCircle } from "@dynatrace/strato-components/content";
import { CorrelationsContext } from "./CorrelationsPanel";
import { useKpiMenu } from "./KpiMenuContext";

// ─── Forecast Context (allows KpiCard to auto-wire click-to-forecast) ───
type ForecastOpener = (label: string, sparkline: number[], color?: string) => void;
const ForecastContext = createContext<ForecastOpener | null>(null);
export const ForecastProvider = ForecastContext.Provider;

const GREEN = "#0D9C29";
const RED = "#C21930";

function Sparkline({ data, color = "#4589FF" }: { data: number[]; color?: string }) {
  const W = 88;
  const H = 28;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const trimmed = data.length > 2 ? data.slice(0, -1) : data;
  const valid = trimmed.filter((v) => v != null && !isNaN(v) && isFinite(v));
  if (valid.length < 2) return null;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;
  const points = valid.map((v, i) => ({
    x: (i / (valid.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 4) - 2,
    value: v,
  }));
  const pts = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fillPts = `0,${H} ${pts} ${W},${H}`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.round((x / W) * (valid.length - 1));
    setHoverIdx(Math.max(0, Math.min(valid.length - 1, idx)));
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <svg
        width={W}
        height={H}
        style={{ display: "block", marginTop: 6, opacity: 0.85, cursor: "crosshair" }}
        aria-hidden
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <polygon points={fillPts} fill={color} fillOpacity={0.1} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2.5} fill={color} />
        {hoverIdx !== null && points[hoverIdx] && (
          <>
            <line x1={points[hoverIdx].x} y1={0} x2={points[hoverIdx].x} y2={H} stroke={color} strokeWidth={0.75} strokeDasharray="2,2" opacity={0.6} />
            <circle cx={points[hoverIdx].x} cy={points[hoverIdx].y} r={3} fill={color} stroke="#fff" strokeWidth={1} />
          </>
        )}
      </svg>
      {hoverIdx !== null && points[hoverIdx] && (
        <div
          style={{
            position: "absolute",
            bottom: H + 8,
            left: Math.min(Math.max(points[hoverIdx].x - 30, 0), W - 60),
            background: "rgba(0,0,0,0.85)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 600,
            padding: "3px 6px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {typeof points[hoverIdx].value === "number" && points[hoverIdx].value >= 1000
            ? `${(points[hoverIdx].value / 1000).toFixed(1)}k`
            : points[hoverIdx].value.toFixed(points[hoverIdx].value % 1 === 0 ? 0 : 1)}
        </div>
      )}
    </div>
  );
}

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  rawValue?: number;
  prevRawValue?: number | null;
  sparkline?: number[];
  color?: string;
  higherIsBetter?: boolean;
  isLoading?: boolean;
  style?: React.CSSProperties;
  kpiKey?: string;
  onClick?: () => void;
  inverted?: boolean;
}

// ─── Dropdown Menu ────────────────────────────────────────────────────────────

interface MenuItem {
  icon: string;
  label: string;
  action: () => void;
  disabled?: boolean;
}

function KpiDropdown({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="kpi-dropdown"
      style={{
        position: "absolute",
        top: "100%",
        right: 0,
        marginTop: 4,
        background: "#1e2235",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        padding: "4px 0",
        minWidth: 168,
        zIndex: 800,
        boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
        fontFamily: "'Segoe UI',system-ui,sans-serif",
      }}
    >
      {items.map((item, i) =>
        item.disabled ? (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 14px", fontSize: 12, opacity: 0.28, cursor: "default" }}
          >
            <span style={{ fontSize: 13, width: 18, textAlign: "center" }}>{item.icon}</span>
            {item.label}
          </div>
        ) : (
          <div
            key={i}
            className="kpi-dropdown-item"
            onClick={() => { item.action(); onClose(); }}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}
          >
            <span style={{ fontSize: 13, width: 18, textAlign: "center" }}>{item.icon}</span>
            {item.label}
          </div>
        )
      )}
    </div>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

export function KpiCard({
  label,
  value,
  rawValue,
  prevRawValue,
  sparkline,
  color,
  higherIsBetter = false,
  isLoading,
  style,
  onClick,
  inverted,
}: KpiCardProps) {
  const forecastOpener  = useContext(ForecastContext);
  const correlationsCtx = useContext(CorrelationsContext);
  const kpiMenu         = useKpiMenu();

  const [menuOpen, setMenuOpen] = useState(false);

  const hasSpark = sparkline && sparkline.length >= 3;
  const effectiveInverted = inverted ?? !higherIsBetter;

  const openForecast = hasSpark && (onClick ?? forecastOpener)
    ? () => {
        if (onClick) { onClick(); return; }
        if (forecastOpener) forecastOpener(label, sparkline!, color);
      }
    : undefined;

  const openRelated = hasSpark && correlationsCtx
    ? () => correlationsCtx.open({ label, sparkline: sparkline!, color, inverted: effectiveInverted })
    : undefined;

  const openDimension = kpiMenu
    ? () => kpiMenu.openDimension({ label, sparkline: sparkline ?? [], color })
    : undefined;

  const openHeatmap = kpiMenu
    ? () => kpiMenu.openHeatmap({ label, sparkline: sparkline ?? [], color })
    : undefined;

  const menuItems: MenuItem[] = [
    { icon: "📈", label: "Forecast",           action: openForecast ?? (() => {}), disabled: !openForecast },
    { icon: "⟷",  label: "Related Metrics",    action: openRelated  ?? (() => {}), disabled: !openRelated  },
    { icon: "🌍", label: "Dimension",           action: openDimension ?? (() => {}), disabled: !openDimension },
    { icon: "📅", label: "Heatmap",             action: openHeatmap  ?? (() => {}), disabled: !openHeatmap  },
  ];

  const delta = useMemo<number | null>(() => {
    if (rawValue == null || prevRawValue == null) return null;
    if (prevRawValue === 0) return rawValue === 0 ? 0 : 100;
    return ((rawValue - prevRawValue) / Math.abs(prevRawValue)) * 100;
  }, [rawValue, prevRawValue]);

  const trendUp    = delta !== null && delta > 0;
  const trendGood  = delta !== null && (higherIsBetter ? trendUp : !trendUp);
  const trendColor = delta === null ? undefined : delta === 0 ? undefined : trendGood ? GREEN : RED;
  const arrow      = delta === 0 ? "—" : trendUp ? "↑" : "↓";

  return (
    <div
      className="svc-chart-tile kpi-card"
      style={{
        flex: "1 1 140px",
        minHeight: "auto",
        padding: "12px 16px",
        textAlign: "center",
        transition: "box-shadow 0.15s",
        position: "relative",
        ...style,
      }}
      title={label}
    >
      {/* Three-dot menu trigger */}
      <button
        className="kpi-menu-btn"
        onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}
        title="More options"
      >
        ⋮
      </button>

      {menuOpen && (
        <KpiDropdown items={menuItems} onClose={() => setMenuOpen(false)} />
      )}

      <Text style={{ fontSize: 11, opacity: 0.7, display: "block" }}>{label}</Text>
      {isLoading ? (
        <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
          <ProgressCircle size="small" />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 5, marginTop: 4 }}>
            <Heading level={3} style={{ margin: 0, color }}>
              {value}
            </Heading>
            {delta !== null && (
              <span
                style={{ fontSize: 11, fontWeight: 700, color: trendColor, whiteSpace: "nowrap", lineHeight: 1 }}
                title={`vs previous period: ${trendUp ? "+" : ""}${delta.toFixed(1)}%`}
              >
                {arrow}&thinsp;{Math.abs(delta).toFixed(1)}%
              </span>
            )}
          </div>
          {sparkline && sparkline.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Sparkline data={sparkline} color={color ?? "#4589FF"} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
