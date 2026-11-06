import React from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import Widget from "../ui/Widget";
import CoherenceChart from "./charts/CoherenceChart";
import AnomalyChart from "./charts/AnomalyChart";
import DriftChart from "./charts/DriftChart";
import SystemStatusChart from "./charts/SystemStatusChart";
import { ChartDataProvider } from "./charts/ChartDataContext";
import ChartEditorModal from "./charts/ChartEditorModal";

// `tab` is the ChartEditorModal tab; line counts come from the API, so that slide has no editor.
const SLIDES = [
  { id: "coherence", title: "Narrative coherence", Chart: CoherenceChart, tab: "coherence" },
  { id: "lines", title: "Volume line counts", Chart: AnomalyChart },
  { id: "drift", title: "Temporal drift", Chart: DriftChart, tab: "drift" },
  { id: "status", title: "System status", Chart: SystemStatusChart, tab: "status" },
];

// Custom chart names by slide id, kept in this browser like the chart data.
const TITLES_KEY = "dashboardChartTitlesV1";
const MAX_TITLE_LENGTH = 40;

const loadTitles = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(TITLES_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

// All dashboard charts in one widget, sliding horizontally between them.
export default function LoreChartWidget() {
  const [index, setIndex] = React.useState(0);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [titles, setTitles] = React.useState(loadTitles);
  const [renaming, setRenaming] = React.useState(false);
  const cancelRenameRef = React.useRef(false);
  const slide = SLIDES[index];
  const titleOf = (s) => titles[s.id] || s.title;
  const go = (next) => setIndex((next + SLIDES.length) % SLIDES.length);

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") go(index - 1);
    if (e.key === "ArrowRight") go(index + 1);
  };

  // An empty name, or the default name, clears the custom one.
  const saveTitle = (value) => {
    setRenaming(false);
    if (cancelRenameRef.current) {
      cancelRenameRef.current = false;
      return;
    }
    const name = value.trim().slice(0, MAX_TITLE_LENGTH);
    const next = { ...titles };
    if (name && name !== slide.title) next[slide.id] = name;
    else delete next[slide.id];
    setTitles(next);
    try {
      localStorage.setItem(TITLES_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: the name still applies until reload.
    }
  };

  const titleNode = renaming ? (
    <input
      autoFocus
      defaultValue={titleOf(slide)}
      maxLength={MAX_TITLE_LENGTH}
      placeholder={slide.title}
      aria-label="Chart name"
      onFocus={(e) => e.target.select()}
      onBlur={(e) => saveTitle(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation(); // keep arrow keys from switching charts while typing
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          cancelRenameRef.current = true;
          e.currentTarget.blur();
        }
      }}
      className="dash-input !min-h-[24px] w-48 !py-0.5 normal-case tracking-normal"
    />
  ) : (
    <button
      type="button"
      onClick={() => setRenaming(true)}
      className="group/title inline-flex items-center gap-1.5 uppercase"
      title="Rename chart"
    >
      {titleOf(slide)}
      <Pencil
        size={11}
        aria-hidden="true"
        className="text-text-secondary opacity-0 transition-opacity group-hover/title:opacity-100 group-focus-visible/title:opacity-100"
      />
    </button>
  );

  return (
    <ChartDataProvider>
      <Widget
        title={titleNode}
        className="h-full min-h-0"
        padding="px-4 pt-3 pb-2.5"
        titleChildren={
          <div className="flex items-center gap-1">
            {slide.tab && (
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="dash-btn !min-h-[26px] !px-2 !text-[11px]"
              >
                Edit data
              </button>
            )}
            <button type="button" onClick={() => go(index - 1)} className="dash-btn dash-btn-icon" aria-label="Previous chart">
              <ChevronLeft size={15} />
            </button>
            <button type="button" onClick={() => go(index + 1)} className="dash-btn dash-btn-icon" aria-label="Next chart">
              <ChevronRight size={15} />
            </button>
          </div>
        }
      >
        <section
          className="flex h-full min-h-0 flex-col"
          aria-roledescription="carousel"
          aria-label="Charts"
          onKeyDown={onKeyDown}
        >
          <div className="min-h-0 flex-1 overflow-hidden">
            <div
              className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {SLIDES.map((s, i) => (
                <div
                  key={s.id}
                  className="h-full w-full shrink-0"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${SLIDES.length}: ${titleOf(s)}`}
                  aria-hidden={i !== index}
                  inert={i !== index ? "" : undefined}
                >
                  {React.createElement(s.Chart)}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 flex justify-center gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show ${titleOf(s)}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                  i === index ? "w-5 bg-primary" : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </section>
      </Widget>
      <ChartEditorModal isOpen={editorOpen} onClose={() => setEditorOpen(false)} initialTab={slide.tab} />
    </ChartDataProvider>
  );
}
