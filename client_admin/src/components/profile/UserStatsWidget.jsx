import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Database,
  Dumbbell,
  FileText,
  Flame,
  Goal,
  ListChecks,
  Music,
  Palette,
  Package,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import Widget from "../ui/Widget";

const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const toNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
};

const formatNumber = (value) => numberFormatter.format(toNumber(value));
const formatPercent = (value) => `${Math.round(clamp(value))}%`;
const safePercent = (value, total) => (toNumber(total) > 0 ? clamp((toNumber(value) / toNumber(total)) * 100) : 0);

const AERO_COLOR_PRESETS = [
  { label: "Sky", value: "#0ea5e9" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Cobalt", value: "#2563eb" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Emerald", value: "#059669" },
];

const hexToRgb = (hex) => {
  const clean = String(hex || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return [14, 165, 233];
  return [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16));
};

const aeroShell =
  "relative overflow-hidden rounded-lg border border-sky-200/30 bg-[linear-gradient(180deg,rgba(255,255,255,var(--aero-white-top)),rgba(var(--aero-rgb),var(--aero-shell-mid))_42%,rgba(8,47,73,var(--aero-shell-low)))] font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_18px_38px_rgba(8,47,73,0.22)] backdrop-blur-md";
const aeroPanel =
  "rounded-lg border border-sky-200/25 bg-[linear-gradient(180deg,rgba(255,255,255,var(--aero-white-panel)),rgba(var(--aero-rgb),var(--aero-panel-mid))_48%,rgba(3,7,18,var(--aero-panel-low)))] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),inset_0_-1px_0_rgba(var(--aero-rgb),0.18),0_10px_26px_rgba(8,47,73,0.18)] backdrop-blur";
const aeroPanelInteractive =
  "rounded-lg border text-left transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_10px_26px_rgba(8,47,73,0.16)] backdrop-blur";
const aeroCell =
  "rounded-md border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,var(--aero-white-cell)),rgba(var(--aero-rgb),var(--aero-cell-mid))_50%,rgba(3,7,18,var(--aero-cell-low)))] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]";
const aeroIcon =
  "inline-flex shrink-0 items-center justify-center rounded-md border border-white/25 bg-[linear-gradient(180deg,rgba(255,255,255,var(--aero-white-icon)),rgba(var(--aero-rgb),var(--aero-icon-mid))_52%,rgba(3,7,18,var(--aero-icon-low)))] shadow-[inset_0_1px_0_rgba(255,255,255,0.44),0_4px_12px_rgba(8,47,73,0.2)]";
const aeroText = "text-sky-50";
const aeroMuted = "text-sky-100/70";
const aeroFine = "text-sky-100/55";
const aeroStatRow = "border-b border-sky-100/10 py-2 last:border-b-0";

const getGoalProgress = (goal) => {
  const target = toNumber(goal?.target);
  if (target <= 0) return 0;
  return clamp((toNumber(goal?.current) / target) * 100);
};

const getStatus = (score, reverse = false) => {
  const value = reverse ? 100 - score : score;
  if (value >= 70) return { label: "On track", color: "#34d399" };
  if (value >= 35) return { label: "Needs attention", color: "#f59e0b" };
  return { label: "Low activity", color: "#94a3b8" };
};

const ProgressBar = ({ value, color = "#60a5fa" }) => (
  <div className="h-2 w-full overflow-hidden rounded-full border border-white/20 bg-sky-950/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
    <div
      className="h-full rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_0_10px_rgba(56,189,248,0.35)]"
      style={{
        width: `${clamp(value)}%`,
        background: `linear-gradient(180deg, rgba(255,255,255,0.58), ${color} 42%, rgba(8,47,73,0.78))`,
      }}
    />
  </div>
);

const ViewButton = ({ active, children, icon, onClick, title }) => {
  const Icon = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold transition-colors ${
        active
          ? "border-sky-100/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(var(--aero-rgb),0.22)_52%,rgba(12,74,110,0.38))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_0_14px_rgba(var(--aero-rgb),0.24)]"
          : "border-sky-100/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(var(--aero-rgb),0.07)_54%,rgba(3,7,18,0.14))] text-sky-100/70 hover:border-sky-100/35 hover:text-white"
      }`}
    >
      <Icon size={13} />
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
};

const StatInfoPopover = ({ info, onClose, popoverRef }) => {
  if (!info) return null;

  return (
    <div
      ref={popoverRef}
      className={`${aeroPanel} fixed z-[70] w-[min(92vw,360px)] p-4`}
      style={{ left: info.x, top: info.y, transform: "translateX(-50%)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-wide ${aeroFine}`}>Statistic details</p>
          <h4 className={`mt-1 truncate text-lg font-black ${aeroText}`}>{info.title}</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded-md border border-white/20 bg-white/10 text-sm font-bold text-sky-50/80 hover:bg-white/20"
          aria-label="Close statistic details"
        >
          x
        </button>
      </div>

      <div className={`${aeroCell} mt-4 px-3 py-2`}>
        <p className={`text-[10px] uppercase tracking-wide ${aeroFine}`}>Value</p>
        <p className={`mt-1 font-mono text-2xl font-black ${aeroText}`}>{info.value}</p>
        {info.summary && <p className={`mt-1 text-xs leading-relaxed ${aeroMuted}`}>{info.summary}</p>}
      </div>

      {info.detail && <p className={`mt-4 text-sm leading-relaxed ${aeroMuted}`}>{info.detail}</p>}

      {(info.calculation || info.inputs?.length > 0) && (
        <div className={`${aeroCell} mt-4 p-3`}>
          {info.calculation && (
            <>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${aeroFine}`}>Calculation</p>
              <p className="mt-1 text-sm leading-relaxed text-sky-50/85">{info.calculation}</p>
            </>
          )}
          {info.inputs?.length > 0 && (
            <p className={`mt-2 font-mono text-[10px] uppercase tracking-wide ${aeroFine}`}>
              Uses: {info.inputs.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const OverallCard = ({ group, onInfo }) => {
  const Icon = group.Icon;

  return (
    <div className={`${aeroPanel} p-4`}>
      <button
        type="button"
        onClick={(event) =>
          onInfo(event, {
            title: group.label,
            value: group.value,
            summary: group.summary,
            detail: group.detail,
            calculation: group.calculation,
            inputs: group.inputs,
          })
        }
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className={`${aeroIcon} h-10 w-10`} style={{ color: group.color }}>
            <Icon size={19} />
          </span>
          <div className="min-w-0">
            <p className={`text-sm font-bold ${aeroText}`}>{group.label}</p>
            <p className={`truncate text-xs ${aeroMuted}`}>{group.summary}</p>
          </div>
        </div>
        <p className={`font-mono text-2xl font-black leading-none ${aeroText}`}>{group.value}</p>
      </button>
      <div className="mt-4 grid grid-cols-2 gap-x-5">
        {group.stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={(event) =>
              onInfo(event, {
                title: `${group.label}: ${stat.label}`,
                value: stat.value,
                summary: stat.summary || group.summary,
                detail: stat.detail || group.detail,
                calculation: stat.calculation || group.calculation,
                inputs: stat.inputs || group.inputs,
              })
            }
            className={`${aeroStatRow} w-full text-left hover:bg-white/5`}
          >
            <p className={`truncate text-[10px] uppercase tracking-wide ${aeroFine}`}>{stat.label}</p>
            <p className={`mt-1 truncate font-mono text-sm font-bold ${aeroText}`}>{stat.value}</p>
          </button>
        ))}
      </div>
      {group.topItems?.length > 0 && (
        <div className="mt-4 border-t border-sky-100/20 pt-3">
          <p className={`mb-2 text-[10px] font-bold uppercase tracking-wide ${aeroFine}`}>{group.topLabel}</p>
          <div className="divide-y divide-sky-100/10">
            {group.topItems.slice(0, 4).map((item, index) => (
              <button
                key={`${item.label}-${index}`}
                type="button"
                onClick={(event) =>
                  onInfo(event, {
                    title: item.label,
                    value: item.value,
                    summary: item.subLabel || group.topLabel,
                    detail: item.detail || group.detail,
                    calculation: item.calculation,
                    inputs: item.inputs || group.inputs,
                  })
                }
                className="flex w-full items-center justify-between gap-3 py-2 text-left first:pt-0 last:pb-0 hover:bg-white/5"
              >
                <div className="min-w-0">
                  <p className={`truncate text-xs font-semibold ${aeroText}`}>{item.label}</p>
                  {item.subLabel && <p className={`truncate text-[11px] ${aeroMuted}`}>{item.subLabel}</p>}
                </div>
                <p className="shrink-0 font-mono text-xs font-bold text-sky-50/80">{item.value}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const OverallSection = ({ groups, onInfo }) => (
  <div className="space-y-3">
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wide ${aeroFine}`}>Overall totals</p>
      <p className={`mt-1 text-sm ${aeroMuted}`}>
        Key lifetime and output totals, grouped by area so the numbers are easier to scan and compare.
      </p>
    </div>
    <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
      {groups.map((group) => (
        <OverallCard key={group.id} group={group} onInfo={onInfo} />
      ))}
    </div>
  </div>
);

const RankedList = ({ list, onInfo }) => {
  const Icon = list.Icon;

  return (
    <div className={`${aeroPanel} p-4`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={`${aeroIcon} h-8 w-8`} style={{ color: list.color }}>
          <Icon size={16} />
        </span>
        <div>
          <p className={`text-sm font-bold ${aeroText}`}>{list.label}</p>
          <p className={`text-xs ${aeroMuted}`}>{list.summary}</p>
        </div>
      </div>
      {list.items.length > 0 ? (
        <div className="space-y-2">
          {list.items.slice(0, 5).map((item, index) => (
            <button
              key={`${list.label}-${item.label}-${index}`}
              type="button"
              onClick={(event) =>
                onInfo(event, {
                  title: item.label,
                  value: item.value,
                  summary: item.subLabel || list.summary,
                  detail: item.detail || `${list.label} ranked by synced Spotify plays stored in this app.`,
                  calculation: item.calculation || "Grouped and sorted by play count from synced SpotifyLog records.",
                  inputs: item.inputs || ["musicStats.topArtists", "musicStats.topAlbums", "musicStats.topTracks"],
                })
              }
              className={`${aeroCell} grid w-full grid-cols-[24px_1fr_auto] items-center gap-3 px-3 py-2 text-left hover:border-white/35`}
            >
              <span className="font-mono text-xs text-sky-100/50">{index + 1}</span>
              <div className="min-w-0">
                <p className={`truncate text-sm font-semibold ${aeroText}`}>{item.label}</p>
                {item.subLabel && <p className={`truncate text-xs ${aeroMuted}`}>{item.subLabel}</p>}
              </div>
              <p className="font-mono text-xs font-bold text-sky-50/80">{item.value}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-sky-100/25 bg-sky-950/20 px-3 py-6 text-center text-sm text-sky-100/65">
          No synced data yet
        </div>
      )}
    </div>
  );
};

const RankedListsSection = ({ lists, onInfo }) => (
  <div className="grid gap-3 xl:grid-cols-3">
    {lists.map((list) => (
      <RankedList key={list.label} list={list} onInfo={onInfo} />
    ))}
  </div>
);

const SummaryCard = ({ item, active, onClick }) => {
  const Icon = item.Icon;
  const status = getStatus(item.score, item.reverseStatus);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${aeroPanelInteractive} p-4 ${
        active
          ? "border-sky-100/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(56,189,248,0.14)_52%,rgba(8,47,73,0.24))] ring-1 ring-sky-200/20"
          : "border-sky-100/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(14,165,233,0.06)_50%,rgba(3,7,18,0.18))] hover:border-sky-100/35 hover:bg-sky-400/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`${aeroIcon} h-9 w-9`} style={{ color: item.color }}>
          <Icon size={18} />
        </span>
        <span
          className="rounded-full border bg-white/10 px-2 py-0.5 text-[10px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]"
          style={{ borderColor: `${status.color}66`, color: status.color }}
        >
          {status.label}
        </span>
      </div>
      <div className="mt-4">
        <p className={`text-sm font-semibold ${aeroMuted}`}>{item.label}</p>
        <p className={`mt-1 text-3xl font-black leading-none ${aeroText}`}>{item.value}</p>
        <p className={`mt-2 min-h-[2.25rem] text-xs leading-relaxed ${aeroMuted}`}>{item.summary}</p>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <ProgressBar value={item.score} color={item.color} />
        <span className="w-10 text-right font-mono text-xs text-sky-100/65">{Math.round(item.score)}</span>
      </div>
    </button>
  );
};

const DetailPanel = ({ item }) => (
  <div className={`${aeroPanel} p-4`}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wide ${aeroFine}`}>Selected metric</p>
        <h4 className={`mt-1 text-xl font-black ${aeroText}`}>{item.label}</h4>
        <p className={`mt-2 max-w-3xl text-sm leading-relaxed ${aeroMuted}`}>{item.detail}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
        <div className={`${aeroCell} px-3 py-2`}>
          <p className={`text-[10px] uppercase tracking-wide ${aeroFine}`}>Value</p>
          <p className={`font-mono text-lg font-bold ${aeroText}`}>{item.value}</p>
        </div>
        <div className={`${aeroCell} px-3 py-2`}>
          <p className={`text-[10px] uppercase tracking-wide ${aeroFine}`}>Score</p>
          <p className={`font-mono text-lg font-bold ${aeroText}`}>{Math.round(item.score)}</p>
        </div>
        <div className={`${aeroCell} px-3 py-2`}>
          <p className={`text-[10px] uppercase tracking-wide ${aeroFine}`}>Inputs</p>
          <p className={`font-mono text-lg font-bold ${aeroText}`}>{item.inputs.length}</p>
        </div>
      </div>
    </div>

    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.1fr]">
      <div className={`${aeroCell} p-3`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className={`text-[10px] font-bold uppercase tracking-wide ${aeroFine}`}>Progress</p>
          <p className="font-mono text-xs text-sky-100/65">{formatPercent(item.score)}</p>
        </div>
        <ProgressBar value={item.score} color={item.color} />
      </div>
      <div className={`${aeroCell} p-3`}>
        <p className={`text-[10px] font-bold uppercase tracking-wide ${aeroFine}`}>Calculation</p>
        <p className="mt-2 text-sm leading-relaxed text-sky-50/85">{item.calculation}</p>
        <p className={`mt-2 font-mono text-[10px] uppercase tracking-wide ${aeroFine}`}>
          Uses: {item.inputs.join(", ")}
        </p>
      </div>
    </div>
  </div>
);

const BreakdownRow = ({ item, onSelect }) => {
  const Icon = item.Icon;
  const status = getStatus(item.score, item.reverseStatus);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${aeroPanelInteractive} grid gap-3 border-sky-100/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(14,165,233,0.06)_50%,rgba(3,7,18,0.18))] p-3 hover:border-sky-100/35 hover:bg-sky-400/10 md:grid-cols-[1fr_120px_1.3fr_24px]`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={`${aeroIcon} h-9 w-9`} style={{ color: item.color }}>
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <p className={`truncate text-sm font-bold ${aeroText}`}>{item.label}</p>
          <p className={`truncate text-xs ${aeroMuted}`}>{item.summary}</p>
        </div>
      </div>
      <div>
        <p className={`font-mono text-lg font-black leading-none ${aeroText}`}>{item.value}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: status.color }}>
          {status.label}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar value={item.score} color={item.color} />
        <span className="w-9 text-right font-mono text-xs text-sky-100/60">{Math.round(item.score)}</span>
      </div>
      <ChevronRight size={16} className="hidden self-center text-sky-100/45 md:block" />
    </button>
  );
};

const DataSourceView = ({ normalized, derived, acquisitionTypes, onInfo }) => (
  <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
    <div className={`${aeroPanel} p-4`}>
      <div className={`mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide ${aeroFine}`}>
        <Database size={13} />
        Source Fields
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(normalized).map(([key, value]) => (
          <button
            key={key}
            type="button"
            onClick={(event) =>
              onInfo(event, {
                title: key,
                value: typeof value === "number" ? formatNumber(value) : String(value),
                summary: "Normalized source field",
                detail:
                  "This is one normalized value derived from the dashboard stats API payload before the widget builds summaries.",
                inputs: [key],
              })
            }
            className={`${aeroCell} px-3 py-2 text-left hover:border-white/35`}
          >
            <p className={`truncate font-mono text-[10px] ${aeroFine}`}>{key}</p>
            <p className={`truncate font-mono text-sm font-bold ${aeroText}`}>
              {typeof value === "number" ? formatNumber(value) : String(value)}
            </p>
          </button>
        ))}
      </div>
    </div>
    <div className={`${aeroPanel} p-4`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide ${aeroFine}`}>
          <BarChart3 size={13} />
          Derived Values
        </div>
        <span className="rounded-full border border-sky-100/20 bg-white/10 px-2 py-0.5 font-mono text-[10px] text-sky-100/55">
          current payload
        </span>
      </div>
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-sky-100/15 bg-sky-950/35 p-3 font-mono text-xs leading-relaxed text-sky-50/85 shadow-[inset_0_1px_6px_rgba(0,0,0,0.25)]">
        {JSON.stringify({ derived, acquisitionTypes }, null, 2)}
      </pre>
    </div>
  </div>
);

const AeroSettingsView = ({ settings, onChange }) => (
  <div className={`${aeroPanel} w-[min(92vw,390px)] p-4`}>
    <div className="flex flex-col gap-4">
      <div>
        <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${aeroFine}`}>
          <SlidersHorizontal size={14} />
          Aero appearance
        </div>
        <h4 className={`mt-2 text-xl font-black ${aeroText}`}>Glass settings</h4>
        <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${aeroMuted}`}>
          Adjust the tint and transparency used by the profile statistics panels. These settings are saved in this
          browser.
        </p>
      </div>
      <div className={`${aeroCell} w-full p-3`}>
        <p className={`text-[10px] font-bold uppercase tracking-wide ${aeroFine}`}>Current tint</p>
        <div className="mt-3 flex items-center gap-3">
          <span
            className="h-10 w-10 rounded-md border border-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_18px_rgba(8,47,73,0.2)]"
            style={{ backgroundColor: settings.color }}
          />
          <div>
            <p className={`font-mono text-sm font-bold ${aeroText}`}>{settings.color.toUpperCase()}</p>
            <p className={`text-xs ${aeroMuted}`}>{settings.transparency}% opacity</p>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-5 grid gap-4">
      <div className={`${aeroCell} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="aero-transparency" className={`text-sm font-bold ${aeroText}`}>
            Glass opacity
          </label>
          <span className="rounded-md border border-white/20 bg-white/10 px-2 py-1 font-mono text-xs text-sky-50/80">
            {settings.transparency}%
          </span>
        </div>
        <input
          id="aero-transparency"
          type="range"
          min="25"
          max="95"
          step="5"
          value={settings.transparency}
          onChange={(event) => onChange({ transparency: Number(event.target.value) })}
          className="mt-4 w-full accent-sky-300"
        />
        <div className={`mt-2 flex justify-between text-[10px] uppercase tracking-wide ${aeroFine}`}>
          <span>Clearer</span>
          <span>Richer</span>
        </div>
      </div>

      <div className={`${aeroCell} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div className={`flex items-center gap-2 text-sm font-bold ${aeroText}`}>
            <Palette size={15} />
            Glass color
          </div>
          <input
            type="color"
            value={settings.color}
            onChange={(event) => onChange({ color: event.target.value })}
            className="h-8 w-12 cursor-pointer rounded border border-white/25 bg-transparent"
            aria-label="Custom Aero glass color"
          />
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {AERO_COLOR_PRESETS.map((preset) => {
            const active = settings.color.toLowerCase() === preset.value.toLowerCase();
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => onChange({ color: preset.value })}
                title={preset.label}
                aria-label={`${preset.label} Aero color`}
                className={`h-10 rounded-md border transition-all ${
                  active
                    ? "border-white/70 shadow-[0_0_0_2px_rgba(255,255,255,0.18)]"
                    : "border-white/20 hover:border-white/45"
                }`}
                style={{ backgroundColor: preset.value }}
              />
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

const UserStatsWidget = ({ stats = {} }) => {
  const [activeView, setActiveView] = useState("overview");
  const [selectedMetricId, setSelectedMetricId] = useState("taskCompletion");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statPopover, setStatPopover] = useState(null);
  const settingsPopoverRef = useRef(null);
  const statPopoverRef = useRef(null);
  const [aeroSettings, setAeroSettings] = useState(() => {
    if (typeof window === "undefined") return { transparency: 70, color: "#0ea5e9" };
    try {
      const saved = JSON.parse(localStorage.getItem("tae.profileStats.aero") || "{}");
      return {
        transparency: clamp(toNumber(saved.transparency) || 70, 25, 95),
        color: /^[#][0-9a-f]{6}$/i.test(saved.color) ? saved.color : "#0ea5e9",
      };
    } catch {
      return { transparency: 70, color: "#0ea5e9" };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("tae.profileStats.aero", JSON.stringify(aeroSettings));
    } catch {
      // localStorage can be unavailable in private or restricted browser contexts.
    }
  }, [aeroSettings]);

  useEffect(() => {
    if (!settingsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!settingsPopoverRef.current?.contains(event.target)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [settingsOpen]);

  useEffect(() => {
    if (!statPopover) return undefined;

    const handlePointerDown = (event) => {
      if (!statPopoverRef.current?.contains(event.target)) {
        setStatPopover(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [statPopover]);

  const updateAeroSettings = (next) => {
    setAeroSettings((current) => ({
      ...current,
      ...next,
      transparency: next.transparency === undefined ? current.transparency : clamp(next.transparency, 25, 95),
      color: next.color === undefined ? current.color : next.color,
    }));
  };

  const aeroAlpha = aeroSettings.transparency / 100;
  const aeroRgb = hexToRgb(aeroSettings.color).join(", ");
  const aeroVariables = {
    "--aero-rgb": aeroRgb,
    "--aero-white-top": (0.06 + aeroAlpha * 0.18).toFixed(3),
    "--aero-shell-mid": (aeroAlpha * 0.18).toFixed(3),
    "--aero-shell-low": (aeroAlpha * 0.36).toFixed(3),
    "--aero-white-panel": (0.05 + aeroAlpha * 0.17).toFixed(3),
    "--aero-panel-mid": (aeroAlpha * 0.2).toFixed(3),
    "--aero-panel-low": (aeroAlpha * 0.3).toFixed(3),
    "--aero-white-cell": (0.05 + aeroAlpha * 0.18).toFixed(3),
    "--aero-cell-mid": (aeroAlpha * 0.16).toFixed(3),
    "--aero-cell-low": (aeroAlpha * 0.24).toFixed(3),
    "--aero-white-icon": (0.1 + aeroAlpha * 0.24).toFixed(3),
    "--aero-icon-mid": (aeroAlpha * 0.22).toFixed(3),
    "--aero-icon-low": (aeroAlpha * 0.32).toFixed(3),
  };

  const model = useMemo(() => {
    const raw = stats || {};
    const taskStats = raw.taskStats || {};
    const musicStats = raw.musicStats || {};
    const volumeStats = raw.volumeStats || {};
    const workoutStats = raw.workoutStats || {};
    const bookStats = raw.bookStats || {};
    const allGoals = Array.isArray(raw.allGoals) ? raw.allGoals : [];
    const recentAcquisitions = Array.isArray(raw.recentAcquisitions) ? raw.recentAcquisitions : [];
    const goalFallback = raw.goals && typeof raw.goals === "object" ? Object.values(raw.goals).map(toNumber) : [];
    const completedGoals = allGoals.filter((goal) => getGoalProgress(goal) >= 100).length;
    const goalProgressAverage =
      allGoals.length > 0
        ? allGoals.reduce((sum, goal) => sum + getGoalProgress(goal), 0) / allGoals.length
        : goalFallback.length > 0
          ? goalFallback.reduce((sum, value) => sum + clamp(value), 0) / goalFallback.length
          : 0;

    const acquisitionTypes = recentAcquisitions.reduce((acc, item) => {
      const type = item?.type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const normalized = {
      habitsCompleted: toNumber(raw.totalHabitsCompleted ?? raw.habitsCompleted ?? raw.habitsCompletedToday),
      totalWorkouts: toNumber(raw.totalWorkouts),
      workoutsThisWeek: toNumber(raw.workoutsThisWeek),
      booksFinished: toNumber(raw.booksFinished),
      collectibles: toNumber(raw.gachaPulls),
      currentStreak: toNumber(raw.activeStreaks),
      longestStreak: toNumber(raw.longestLoginStreak ?? raw.longestStreak),
      volumesPublished: toNumber(volumeStats.published ?? raw.volumesPublished),
      tasksCompletedToday: toNumber(raw.tasksCompletedToday),
      tasksPending: toNumber(raw.tasksPending),
      lifetimeTasks: toNumber(taskStats.total),
      lifetimeTasksCompleted: toNumber(taskStats.completed),
      lifetimeTasksTodo: toNumber(taskStats.todo),
      lifetimeTasksInProgress: toNumber(taskStats.inProgress),
      lifetimeUrgentTasks: toNumber(taskStats.urgent),
      lifetimeHighPriorityTasks: toNumber(taskStats.highPriority),
      totalSubtasks: toNumber(taskStats.totalSubtasks),
      completedSubtasks: toNumber(taskStats.completedSubtasks),
      musicConnected: Boolean(musicStats.connected),
      musicTotalTracks: toNumber(musicStats.totalTracks),
      musicTotalMinutes: toNumber(musicStats.totalMinutes),
      musicTotalHours: toNumber(musicStats.totalHours),
      musicTodayTracks: toNumber(musicStats.todayTracks),
      musicWeekTracks: toNumber(musicStats.weekTracks),
      musicMonthTracks: toNumber(musicStats.monthTracks),
      musicYearTracks: toNumber(musicStats.yearTracks),
      musicWeekMinutes: toNumber(musicStats.weekMinutes),
      musicMonthMinutes: toNumber(musicStats.monthMinutes),
      musicYearMinutes: toNumber(musicStats.yearMinutes),
      musicTopArtistName: musicStats.topArtist?.name || "None yet",
      musicTopArtistPlays: toNumber(musicStats.topArtist?.plays),
      totalVolumes: toNumber(volumeStats.total),
      draftVolumes: toNumber(volumeStats.drafts),
      archivedVolumes: toNumber(volumeStats.archived),
      volumeFavorites: toNumber(volumeStats.favorites),
      volumeRatings: toNumber(volumeStats.ratings),
      volumeAverageRating: toNumber(volumeStats.averageRating),
      volumeBlessings: toNumber(volumeStats.blessings),
      volumeBodyLines: toNumber(volumeStats.bodyLines),
      publishedVolumeBlessings: toNumber(volumeStats.publishedBlessings),
      publishedVolumeLines: toNumber(volumeStats.publishedBodyLines),
      workoutSessions: toNumber(workoutStats.sessions ?? raw.totalWorkouts),
      workoutDurationMinutes: toNumber(workoutStats.durationMinutes),
      workoutDurationHours: toNumber(workoutStats.durationHours),
      workoutAverageDuration: toNumber(workoutStats.averageDuration),
      workoutExercises: toNumber(workoutStats.exercises),
      workoutSets: toNumber(workoutStats.sets),
      workoutReps: toNumber(workoutStats.reps),
      workoutVolume: toNumber(workoutStats.volume),
      workoutCalories: toNumber(workoutStats.calories),
      workoutDistance: toNumber(workoutStats.distance),
      totalBooks: toNumber(bookStats.total),
      activeBooks: toNumber(bookStats.active),
      ownedBooks: toNumber(bookStats.owned),
      bookPagesRead: toNumber(bookStats.pagesRead),
      bookTotalPages: toNumber(bookStats.totalPages),
      bookPagesLeft: toNumber(bookStats.pagesLeft),
      bookCompletionRate: toNumber(bookStats.completionRate),
      bookRatings: toNumber(bookStats.ratings),
      bookAverageRating: toNumber(bookStats.averageRating),
      bookNotes: toNumber(bookStats.notes),
      bookPdfs: toNumber(bookStats.pdfs),
      totalBudget: toNumber(raw.totalBudget),
      activeGoals: toNumber(raw.activeGoals ?? allGoals.length),
      completedGoals,
      goalProgressAverage,
      recentAcquisitions: recentAcquisitions.length,
      collectionTypes: Object.keys(acquisitionTypes).length,
    };
    const musicTopArtists = Array.isArray(musicStats.topArtists) ? musicStats.topArtists : [];
    const musicTopAlbums = Array.isArray(musicStats.topAlbums) ? musicStats.topAlbums : [];
    const musicTopTracks = Array.isArray(musicStats.topTracks) ? musicStats.topTracks : [];
    const workoutFeelings = Array.isArray(workoutStats.feelings) ? workoutStats.feelings : [];

    const totalTasks = normalized.tasksCompletedToday + normalized.tasksPending;
    const taskCompletion = safePercent(normalized.tasksCompletedToday, totalTasks);
    const backlogShare = safePercent(normalized.tasksPending, Math.max(totalTasks, 1));
    const streakProgress = safePercent(normalized.currentStreak, Math.max(normalized.longestStreak, 1));
    const weeklyWorkoutShare = safePercent(normalized.workoutsThisWeek, Math.max(normalized.totalWorkouts, 7));
    const collectionDiversity = clamp((normalized.collectionTypes / 4) * 100);
    const readingScore = clamp(normalized.booksFinished * 8);
    const publishingScore = clamp(normalized.volumesPublished * 12);
    const budgetScore = clamp(Math.log10(normalized.totalBudget + 1) * 18);
    const lifetimeTaskCompletion = safePercent(normalized.lifetimeTasksCompleted, normalized.lifetimeTasks);
    const subtaskCompletion = safePercent(normalized.completedSubtasks, normalized.totalSubtasks);
    const musicRecentShare = safePercent(normalized.musicWeekTracks, normalized.musicTotalTracks);
    const musicListeningScore = clamp(Math.log10(normalized.musicTotalTracks + 1) * 22 + musicRecentShare * 0.35);
    const volumePublishRate = safePercent(normalized.volumesPublished, normalized.totalVolumes);
    const volumeEngagementScore = clamp(
      normalized.volumeFavorites * 4 + normalized.volumeRatings * 6 + normalized.volumeAverageRating * 12,
    );
    const workoutConsistencyScore = clamp(
      normalized.workoutsThisWeek * 18 + Math.log10(normalized.workoutSessions + 1) * 18,
    );
    const workoutVolumeScore = clamp(
      Math.log10(normalized.workoutSets + normalized.workoutReps + normalized.workoutVolume + 1) * 18,
    );
    const bookProgressScore = normalized.bookTotalPages > 0 ? normalized.bookCompletionRate : readingScore;
    const bookLibraryScore = clamp(normalized.totalBooks * 6 + normalized.bookPagesRead / 120);

    const overallGroups = [
      {
        id: "tasks",
        label: "Tasks",
        value: formatNumber(normalized.lifetimeTasks),
        summary: `${formatNumber(normalized.lifetimeTasksCompleted)} completed lifetime`,
        score: lifetimeTaskCompletion,
        color: "#34d399",
        Icon: ListChecks,
        stats: [
          {
            label: "Completed",
            value: formatNumber(normalized.lifetimeTasksCompleted),
            detail: "Completed tasks across the full task history.",
            inputs: ["taskStats.completed"],
          },
          {
            label: "Open",
            value: formatNumber(normalized.lifetimeTasksTodo + normalized.lifetimeTasksInProgress),
            detail: "Tasks currently marked todo or in progress.",
            inputs: ["taskStats.todo", "taskStats.inProgress"],
          },
          {
            label: "High priority",
            value: formatNumber(normalized.lifetimeHighPriorityTasks),
            detail: "Tasks marked high or urgent priority.",
            inputs: ["taskStats.highPriority"],
          },
          {
            label: "Subtasks",
            value: `${formatNumber(normalized.completedSubtasks)} / ${formatNumber(normalized.totalSubtasks)}`,
            detail: "Completed subtasks compared with total subtasks.",
            inputs: ["taskStats.completedSubtasks", "taskStats.totalSubtasks"],
          },
        ],
        detail: "Lifetime task totals from the dashboard stats API.",
        calculation:
          "Counts Task documents owned by the user and groups them by status, priority, and subtask completion.",
        inputs: ["taskStats"],
      },
      {
        id: "music",
        label: "Music",
        value: formatNumber(normalized.musicTotalTracks),
        summary: normalized.musicConnected
          ? `${formatNumber(normalized.musicTotalHours)} hours logged`
          : "Spotify not connected",
        color: "#22c55e",
        Icon: Music,
        stats: [
          { label: "This week", value: formatNumber(normalized.musicWeekTracks) },
          { label: "This month", value: formatNumber(normalized.musicMonthTracks) },
          { label: "This year", value: formatNumber(normalized.musicYearTracks) },
          { label: "Week minutes", value: formatNumber(normalized.musicWeekMinutes) },
        ],
        topLabel: "Top artists",
        topItems: musicTopArtists.map((artist) => ({
          label: artist.name || "Unknown Artist",
          subLabel: `${formatNumber(artist.minutes)} min`,
          value: `${formatNumber(artist.plays)} plays`,
        })),
        detail: "Synced Spotify listening totals stored in this app.",
        calculation: "Counts SpotifyLog records and sums track duration.",
        inputs: ["musicStats"],
      },
      {
        id: "volumes",
        label: "Volumes",
        value: formatNumber(normalized.volumesPublished),
        summary: `${formatNumber(normalized.totalVolumes)} total, ${formatNumber(normalized.draftVolumes)} drafts`,
        color: "#a78bfa",
        Icon: FileText,
        stats: [
          { label: "Lines published", value: formatNumber(normalized.publishedVolumeLines) },
          { label: "Blessings published", value: formatNumber(normalized.publishedVolumeBlessings) },
          { label: "Favorites", value: formatNumber(normalized.volumeFavorites) },
          {
            label: "Avg rating",
            value: normalized.volumeRatings > 0 ? normalized.volumeAverageRating.toFixed(1) : "No ratings",
          },
        ],
        detail: "Published volume output and engagement from Volume records.",
        calculation:
          "Counts published Volume records and sums published body lines, blessings, favorites, and ratings.",
        inputs: ["volumeStats"],
      },
      {
        id: "workouts",
        label: "Workouts",
        value: formatNumber(normalized.workoutSessions),
        summary: `${formatNumber(normalized.workoutDurationHours)} hours logged`,
        color: "#38bdf8",
        Icon: Dumbbell,
        stats: [
          { label: "This week", value: formatNumber(normalized.workoutsThisWeek) },
          { label: "Exercises", value: formatNumber(normalized.workoutExercises) },
          { label: "Sets", value: formatNumber(normalized.workoutSets) },
          { label: "Reps", value: formatNumber(normalized.workoutReps) },
        ],
        topLabel: "Session feelings",
        topItems: workoutFeelings.map((feeling) => ({
          label: feeling.label || "Unspecified",
          value: `${formatNumber(feeling.count)} logs`,
        })),
        detail: "Workout totals from logged workout sessions.",
        calculation: "Aggregates WorkoutLog sessions, duration, exercises, sets, reps, and session feelings.",
        inputs: ["workoutStats"],
      },
      {
        id: "books",
        label: "Books",
        value: formatNumber(normalized.totalBooks),
        summary: `${formatNumber(normalized.booksFinished)} finished, ${formatNumber(normalized.activeBooks)} active`,
        color: "#c084fc",
        Icon: BookOpen,
        stats: [
          { label: "Pages read", value: formatNumber(normalized.bookPagesRead) },
          { label: "Pages left", value: formatNumber(normalized.bookPagesLeft) },
          { label: "Progress", value: formatPercent(normalized.bookCompletionRate) },
          {
            label: "Avg rating",
            value: normalized.bookRatings > 0 ? normalized.bookAverageRating.toFixed(1) : "No ratings",
          },
        ],
        detail: "Reading and library totals from tracked Book records.",
        calculation: "Aggregates book count, finished status, pages read, total pages, ratings, notes, and PDFs.",
        inputs: ["bookStats"],
      },
    ];

    const rankedLists = [
      {
        label: "Top artists",
        summary: "By synced plays",
        color: "#22c55e",
        Icon: Music,
        items: musicTopArtists.map((artist) => ({
          label: artist.name || "Unknown Artist",
          subLabel: `${formatNumber(artist.minutes)} minutes`,
          value: `${formatNumber(artist.plays)} plays`,
        })),
      },
      {
        label: "Top albums",
        summary: "By synced plays",
        color: "#14b8a6",
        Icon: Music,
        items: musicTopAlbums.map((album) => ({
          label: album.name || "Unknown Album",
          subLabel: `${formatNumber(album.minutes)} minutes`,
          value: `${formatNumber(album.plays)} plays`,
        })),
      },
      {
        label: "Top tracks",
        summary: "By synced plays",
        color: "#84cc16",
        Icon: Music,
        items: musicTopTracks.map((track) => ({
          label: track.name || "Unknown Track",
          subLabel: track.artist || "Unknown Artist",
          value: `${formatNumber(track.plays)} plays`,
        })),
      },
    ];

    const items = [
      {
        id: "lifetimeTaskCompletion",
        label: "Lifetime task completion",
        value: normalized.lifetimeTasks > 0 ? formatPercent(lifetimeTaskCompletion) : "No tasks",
        score: lifetimeTaskCompletion,
        color: "#34d399",
        Icon: ListChecks,
        inputs: ["taskStats.total", "taskStats.completed"],
        summary: `${formatNumber(normalized.lifetimeTasksCompleted)} of ${formatNumber(normalized.lifetimeTasks)} tasks completed`,
        detail:
          "Shows completed tasks across the full task history returned by the dashboard stats endpoint. This is a lifetime metric, separate from today's task completion.",
        calculation: "Lifetime completed tasks divided by lifetime total tasks.",
      },
      {
        id: "taskCompletion",
        label: "Task completion today",
        value: totalTasks > 0 ? formatPercent(taskCompletion) : "No tasks",
        score: taskCompletion,
        color: "#34d399",
        Icon: CheckCircle2,
        inputs: ["tasksCompletedToday", "tasksPending"],
        summary: `${formatNumber(normalized.tasksCompletedToday)} done, ${formatNumber(normalized.tasksPending)} pending`,
        detail:
          "Shows how much of today's visible task workload has been completed. Pending tasks are included so the percentage reflects the current queue, not just completed work.",
        calculation: "Completed tasks divided by completed plus pending tasks.",
      },
      {
        id: "backlogShare",
        label: "Pending task share",
        value: totalTasks > 0 ? formatPercent(backlogShare) : "No tasks",
        score: backlogShare,
        reverseStatus: true,
        color: "#fb7185",
        Icon: ListChecks,
        inputs: ["tasksPending", "tasksCompletedToday"],
        summary: `${formatNumber(normalized.tasksPending)} open tasks`,
        detail:
          "Shows how much of the current task queue is still open. Lower is better because it means completed work is taking up more of the queue.",
        calculation: "Pending tasks divided by completed plus pending tasks.",
      },
      {
        id: "musicListeningScore",
        label: "Music listening",
        value: `${formatNumber(normalized.musicTotalTracks)} tracks`,
        score: musicListeningScore,
        color: "#22c55e",
        Icon: Music,
        inputs: ["musicStats.totalTracks", "musicStats.weekTracks", "musicStats.totalHours"],
        summary: `${formatNumber(normalized.musicTotalHours)} hours logged`,
        detail:
          "Summarizes locally logged Spotify plays. It uses saved SpotifyLog records only, so it reflects what has been synced into this app rather than a live Spotify account total.",
        calculation: "Log-scaled total tracks plus a small recent-listening adjustment from this week's plays.",
      },
      {
        id: "volumesPublishedAmount",
        label: "Volumes published",
        value: formatNumber(normalized.volumesPublished),
        score: publishingScore,
        color: "#a78bfa",
        Icon: FileText,
        inputs: ["volumeStats.published"],
        summary: `${formatNumber(normalized.totalVolumes)} total volume records`,
        detail:
          "Shows the number of published volumes directly. Drafts and archived volumes are shown in the overall totals for context, but this metric focuses on shipped output.",
        calculation: "Published volume count returned by the dashboard stats endpoint.",
      },
      {
        id: "publishedVolumeLines",
        label: "Lines published",
        value: formatNumber(normalized.publishedVolumeLines),
        score: clamp(Math.log10(normalized.publishedVolumeLines + 1) * 22),
        color: "#818cf8",
        Icon: FileText,
        inputs: ["volumeStats.publishedBodyLines"],
        summary: `${formatNumber(normalized.publishedVolumeBlessings)} published blessings`,
        detail:
          "Counts body lines from volumes whose status is published. This keeps draft writing separate from published output.",
        calculation: "Sum of bodyLines length for published volumes only.",
      },
      {
        id: "publishedVolumeBlessings",
        label: "Blessings published",
        value: formatNumber(normalized.publishedVolumeBlessings),
        score: clamp(Math.log10(normalized.publishedVolumeBlessings + 1) * 28),
        color: "#f0abfc",
        Icon: Award,
        inputs: ["volumeStats.publishedBlessings"],
        summary: `${formatNumber(normalized.volumeBlessings)} total blessings across all statuses`,
        detail:
          "Counts blessing entries from published volumes only, with total blessings kept available in the source data for comparison.",
        calculation: "Sum of blessings length for published volumes only.",
      },
      {
        id: "volumeEngagementScore",
        label: "Volume engagement",
        value: `${formatNumber(normalized.volumeFavorites)} favorites`,
        score: volumeEngagementScore,
        color: "#f59e0b",
        Icon: Award,
        inputs: ["volumeStats.favorites", "volumeStats.ratings", "volumeStats.averageRating"],
        summary: `${formatNumber(normalized.volumeRatings)} ratings, ${normalized.volumeAverageRating.toFixed(1)} average`,
        detail:
          "Combines favorites, rating count, and average rating into a simple engagement indicator. The raw counts remain visible so the score is not the only thing to interpret.",
        calculation:
          "Favorites multiplied by 4, ratings multiplied by 6, plus average rating multiplied by 12; capped at 100.",
      },
      {
        id: "workoutVolume",
        label: "Workout volume",
        value: formatNumber(normalized.workoutVolume),
        score: workoutVolumeScore,
        color: "#38bdf8",
        Icon: Dumbbell,
        inputs: ["workoutStats.sets", "workoutStats.reps", "workoutStats.volume"],
        summary: `${formatNumber(normalized.workoutSets)} sets, ${formatNumber(normalized.workoutReps)} reps`,
        detail:
          "Summarizes logged strength-training work using the set data stored on workout logs. Volume is reps multiplied by weight where weight exists.",
        calculation: "Log-scaled total of sets, reps, and weighted volume.",
      },
      {
        id: "workoutDuration",
        label: "Workout duration",
        value: `${formatNumber(normalized.workoutDurationHours)} hrs`,
        score: workoutConsistencyScore,
        color: "#0ea5e9",
        Icon: Dumbbell,
        inputs: ["workoutStats.durationMinutes", "workoutStats.sessions", "workoutStats.thisWeek"],
        summary: `${formatNumber(normalized.workoutAverageDuration)} min average session`,
        detail:
          "Shows total logged workout time and average session duration. This depends on sessions with duration values filled in.",
        calculation:
          "Total session minutes converted to hours; score blends weekly sessions and lifetime session count.",
      },
      {
        id: "bookPages",
        label: "Reading pages",
        value: formatNumber(normalized.bookPagesRead),
        score: bookProgressScore,
        color: "#c084fc",
        Icon: BookOpen,
        inputs: ["bookStats.pagesRead", "bookStats.totalPages"],
        summary: `${formatNumber(normalized.bookPagesLeft)} pages left`,
        detail:
          "Tracks pages read across the user's book records. Completion uses pages read divided by total pages, so partial reading progress is visible even before books are finished.",
        calculation: "Pages read divided by total pages across all books.",
      },
      {
        id: "bookLibrary",
        label: "Book library",
        value: formatNumber(normalized.totalBooks),
        score: bookLibraryScore,
        color: "#d8b4fe",
        Icon: BookOpen,
        inputs: ["bookStats.total", "bookStats.finished", "bookStats.active", "bookStats.averageRating"],
        summary: `${formatNumber(normalized.booksFinished)} finished, ${formatNumber(normalized.activeBooks)} active`,
        detail:
          "Shows the size and status of the user's tracked book library, including active books and ratings when available.",
        calculation: "Scaled from total books and pages read; the raw library counts are the primary values.",
      },
      {
        id: "streakProgress",
        label: "Current streak vs best",
        value: `${formatNumber(normalized.currentStreak)} / ${formatNumber(normalized.longestStreak)} days`,
        score: streakProgress,
        color: "#f59e0b",
        Icon: Flame,
        inputs: ["currentStreak", "longestStreak"],
        summary: `${formatPercent(streakProgress)} of longest streak`,
        detail:
          "Compares the active login streak with the longest login streak saved for the user. This avoids overstating streak strength when the active streak is small relative to the record.",
        calculation: "Current login streak divided by longest login streak.",
      },
      {
        id: "weeklyWorkoutShare",
        label: "Workouts this week",
        value: formatNumber(normalized.workoutsThisWeek),
        score: weeklyWorkoutShare,
        color: "#38bdf8",
        Icon: Dumbbell,
        inputs: ["workoutsThisWeek", "totalWorkouts"],
        summary: `${formatNumber(normalized.totalWorkouts)} lifetime workouts`,
        detail:
          "Shows recent workout activity while still keeping lifetime workouts visible. The score is scaled conservatively against a seven-day week or the lifetime total, whichever is larger.",
        calculation: "Workouts in the last seven days divided by max(lifetime workouts, 7).",
      },
      {
        id: "readingScore",
        label: "Books finished",
        value: formatNumber(normalized.booksFinished),
        score: readingScore,
        color: "#c084fc",
        Icon: BookOpen,
        inputs: ["booksFinished"],
        summary: "Lifetime finished books",
        detail:
          "Displays finished books from the dashboard stats endpoint. The progress score is a simple scaled indicator for this widget, not a reading goal completion percentage.",
        calculation: "Finished books multiplied by 8, capped at 100.",
      },
      {
        id: "collectionDiversity",
        label: "Collection diversity",
        value: `${formatNumber(normalized.collectionTypes)} types`,
        score: collectionDiversity,
        color: "#f472b6",
        Icon: Package,
        inputs: ["recentAcquisitions"],
        summary: `${formatNumber(normalized.collectibles)} total collectibles`,
        detail:
          "Uses recent acquisition types to show whether collection activity is spread across categories. Total collectibles are shown separately so volume and variety are not confused.",
        calculation: "Recent acquisition type count divided by four supported collection categories.",
      },
      {
        id: "goalProgressAverage",
        label: "Average goal progress",
        value: formatPercent(normalized.goalProgressAverage),
        score: normalized.goalProgressAverage,
        color: "#84cc16",
        Icon: Goal,
        inputs: ["allGoals", "goals"],
        summary: `${formatNumber(normalized.completedGoals)} completed goals`,
        detail:
          "Averages structured yearly goal progress when available, then falls back to dashboard goal percentages. Each goal is capped at 100% so over-complete goals do not distort the average.",
        calculation: "Average of current divided by target across yearly goals, capped per goal.",
      },
      {
        id: "publishingScore",
        label: "Volumes published",
        value: formatNumber(normalized.volumesPublished),
        score: publishingScore,
        color: "#a78bfa",
        Icon: Award,
        inputs: ["volumesPublished"],
        summary: "Admin publishing output",
        detail: "Displays the published volume count returned by the dashboard stats endpoint.",
        calculation: "Published volumes multiplied by 12, capped at 100.",
      },
      {
        id: "budgetScore",
        label: "Budget total",
        value: currencyFormatter.format(normalized.totalBudget),
        score: budgetScore,
        color: "#2dd4bf",
        Icon: WalletCards,
        inputs: ["totalBudget"],
        summary: "Total budget amount",
        detail:
          "Shows the total budget amount returned by the dashboard stats endpoint. The score uses a logarithmic scale so larger dollar values remain readable beside non-financial stats.",
        calculation: "log10(total budget + 1) multiplied by 18, capped at 100.",
      },
    ];

    const overallScore =
      items.length > 0
        ? items.reduce((sum, item) => sum + (item.reverseStatus ? 100 - item.score : item.score), 0) / items.length
        : 0;

    return {
      normalized,
      derived: {
        taskCompletion,
        backlogShare,
        streakProgress,
        weeklyWorkoutShare,
        collectionDiversity,
        readingScore,
        publishingScore,
        budgetScore,
        lifetimeTaskCompletion,
        subtaskCompletion,
        musicRecentShare,
        musicListeningScore,
        volumePublishRate,
        volumeEngagementScore,
        overallScore,
      },
      acquisitionTypes,
      overallGroups,
      rankedLists,
      items,
      overallScore,
    };
  }, [stats]);

  const selectedItem = model.items.find((item) => item.id === selectedMetricId) || model.items[0];

  const selectFromBreakdown = (metricId) => {
    setSelectedMetricId(metricId);
    setActiveView("overview");
    setSettingsOpen(false);
  };

  const selectView = (view) => {
    setActiveView(view);
    setSettingsOpen(false);
  };

  const openStatPopover = (event, info) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 360;
    const height = 320;
    const padding = 16;
    const viewportWidth = typeof window === "undefined" ? width + padding * 2 : window.innerWidth;
    const viewportHeight = typeof window === "undefined" ? height + padding * 2 : window.innerHeight;
    const x = clamp(rect.left + rect.width / 2, padding + width / 2, viewportWidth - padding - width / 2);
    const below = rect.bottom + 10;
    const y = below + height > viewportHeight - padding ? Math.max(padding, rect.top - height - 10) : below;

    setSettingsOpen(false);
    setStatPopover({ ...info, x, y });
  };

  return (
    <div style={aeroVariables}>
      <Widget
        title="Profile Statistics"
        className={`${aeroShell} h-full`}
        padding="p-4 sm:p-5"
        variant="plain"
        titleChildren={
          <div className="flex items-center gap-1.5">
            <ViewButton
              active={activeView === "overview"}
              icon={BarChart3}
              onClick={() => selectView("overview")}
              title="Overview"
            >
              Overview
            </ViewButton>
            <ViewButton
              active={activeView === "breakdown"}
              icon={ListChecks}
              onClick={() => selectView("breakdown")}
              title="Breakdown"
            >
              Breakdown
            </ViewButton>
            <ViewButton active={activeView === "data"} icon={Database} onClick={() => selectView("data")} title="Data">
              Data
            </ViewButton>
            <div ref={settingsPopoverRef} className="relative">
              <ViewButton
                active={settingsOpen}
                icon={SlidersHorizontal}
                onClick={() => setSettingsOpen((open) => !open)}
                title="Aero settings"
              >
                Settings
              </ViewButton>
              {settingsOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 origin-top-right">
                  <div className="rounded-lg border border-white/25 bg-sky-950/35 p-1 shadow-[0_18px_42px_rgba(3,7,18,0.45)] backdrop-blur-md">
                    <AeroSettingsView settings={aeroSettings} onChange={updateAeroSettings} />
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1.1fr]">
            <div className={`${aeroPanel} p-4`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${aeroFine}`}>Overall activity</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className={`text-4xl font-black leading-none ${aeroText}`}>{formatPercent(model.overallScore)}</p>
                  <p className={`mt-2 text-sm ${aeroMuted}`}>
                    Based on tasks, music, volumes, streaks, workouts, reading, collections, goals, and budget data.
                  </p>
                </div>
                <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full border border-sky-100/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.26),rgba(56,189,248,0.10)_52%,rgba(8,47,73,0.22))] text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_20px_rgba(8,47,73,0.25)] sm:flex">
                  <BarChart3 size={26} />
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar value={model.overallScore} color="#22d3ee" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className={`${aeroCell} p-3`}>
                <p className={`text-[10px] uppercase tracking-wide ${aeroFine}`}>Lifetime tasks</p>
                <p className={`mt-1 font-mono text-2xl font-black ${aeroText}`}>
                  {formatNumber(model.normalized.lifetimeTasks)}
                </p>
              </div>
              <div className={`${aeroCell} p-3`}>
                <p className={`text-[10px] uppercase tracking-wide ${aeroFine}`}>Music tracks</p>
                <p className={`mt-1 font-mono text-2xl font-black ${aeroText}`}>
                  {formatNumber(model.normalized.musicTotalTracks)}
                </p>
              </div>
              <div className={`${aeroCell} p-3`}>
                <p className={`text-[10px] uppercase tracking-wide ${aeroFine}`}>Volumes</p>
                <p className={`mt-1 font-mono text-2xl font-black ${aeroText}`}>
                  {formatNumber(model.normalized.totalVolumes)}
                </p>
              </div>
              <div className={`${aeroCell} p-3`}>
                <p className={`text-[10px] uppercase tracking-wide ${aeroFine}`}>Collectibles</p>
                <p className={`mt-1 font-mono text-2xl font-black ${aeroText}`}>
                  {formatNumber(model.normalized.collectibles)}
                </p>
              </div>
            </div>
          </div>

          <OverallSection groups={model.overallGroups} />

          <div className="space-y-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${aeroFine}`}>Music top lists</p>
              <p className={`mt-1 text-sm ${aeroMuted}`}>
                Ranked from synced Spotify listening history stored in the app.
              </p>
            </div>
            <RankedListsSection lists={model.rankedLists} />
          </div>

          {activeView === "overview" && (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {model.items.map((item) => (
                  <SummaryCard
                    key={item.id}
                    item={item}
                    active={item.id === selectedItem.id}
                    onClick={() => setSelectedMetricId(item.id)}
                  />
                ))}
              </div>
              <DetailPanel item={selectedItem} />
            </>
          )}

          {activeView === "breakdown" && (
            <div className="grid gap-3">
              {model.items.map((item) => (
                <BreakdownRow key={item.id} item={item} onSelect={() => selectFromBreakdown(item.id)} />
              ))}
            </div>
          )}

          {activeView === "data" && (
            <DataSourceView
              normalized={model.normalized}
              derived={model.derived}
              acquisitionTypes={model.acquisitionTypes}
            />
          )}
        </div>
      </Widget>
    </div>
  );
};

export default UserStatsWidget;
