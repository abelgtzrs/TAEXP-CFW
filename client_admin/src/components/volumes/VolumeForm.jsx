import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Braces,
  Check,
  ChevronDown,
  FileText,
  Library,
  Plus,
  Save,
  Scissors,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { listBlessingDefs } from "../../services/blessingsService";
import { parseRawGreentext } from "../../utils/greentextParser";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-primary/60 focus:ring-2 focus:ring-primary/10";

const VolumeForm = ({ formData, onFormChange, onSubmit, loading, submitButtonText = "Save volume" }) => {
  const [parsedPreview, setParsedPreview] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [masterBlessings, setMasterBlessings] = useState([]);
  const [masterError, setMasterError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setParsedPreview(parseRawGreentext(formData.rawPastedText || ""));
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.rawPastedText]);

  useEffect(() => {
    let mounted = true;

    const loadMasterBlessings = async () => {
      try {
        const definitions = await listBlessingDefs();
        if (mounted) setMasterBlessings(Array.isArray(definitions) ? definitions : []);
      } catch {
        if (mounted) setMasterError("Master blessing library unavailable");
      }
    };

    loadMasterBlessings();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (event) => {
    onFormChange({ ...formData, [event.target.name]: event.target.value });
  };

  const blessings = Array.isArray(formData.blessings) ? formData.blessings : [];
  const presentNameSet = new Set(blessings.map((blessing) => blessing?.item?.trim().toLowerCase()).filter(Boolean));
  const missingFromMaster = masterBlessings
    .filter((definition) => definition?.active !== false)
    .filter((definition) => !presentNameSet.has(String(definition?.name || "").trim().toLowerCase()));

  const updateBlessing = (index, field, value) => {
    const nextBlessings = [...blessings];
    nextBlessings[index] = { item: "", description: "", context: "", ...nextBlessings[index], [field]: value };
    onFormChange({ ...formData, blessings: nextBlessings });
  };

  const splitBlessingString = (text) => {
    const value = String(text || "").trim();
    const dashMatch = value.match(/^(.*?)\s+[–-]\s+(.*)$/);
    if (dashMatch) return { item: dashMatch[1].trim(), description: dashMatch[2].trim() };

    const parentheticalMatch = value.match(/^(.*?)(?:\s*\((.*)\))?$/);
    return {
      item: (parentheticalMatch?.[1] || value).trim(),
      description: (parentheticalMatch?.[2] || "").trim(),
    };
  };

  const splitBlessingAtIndex = (index) => {
    const currentBlessing = blessings[index] || {};
    const splitBlessing = splitBlessingString(currentBlessing.item);
    const nextBlessings = [...blessings];
    nextBlessings[index] = { ...splitBlessing, context: currentBlessing.context || "" };
    onFormChange({ ...formData, blessings: nextBlessings });
  };

  const splitAllBlessings = () => {
    const nextBlessings = blessings.map((blessing) => {
      const splitBlessing = splitBlessingString(blessing?.item);
      return {
        item: splitBlessing.item,
        description: blessing?.description || splitBlessing.description,
        context: blessing?.context || "",
      };
    });
    onFormChange({ ...formData, blessings: nextBlessings });
  };

  const addBlessing = () => {
    onFormChange({
      ...formData,
      blessings: [...blessings, { item: "", description: "", context: "" }],
    });
  };

  const removeBlessing = (index) => {
    onFormChange({ ...formData, blessings: blessings.filter((_, currentIndex) => currentIndex !== index) });
  };

  const moveBlessing = (index, direction) => {
    const destination = index + direction;
    if (destination < 0 || destination >= blessings.length) return;

    const nextBlessings = [...blessings];
    const [movedBlessing] = nextBlessings.splice(index, 1);
    nextBlessings.splice(destination, 0, movedBlessing);
    onFormChange({ ...formData, blessings: nextBlessings });
  };

  const addFromMaster = (definition) => {
    const item = String(definition?.name || "").trim();
    if (!item || presentNameSet.has(item.toLowerCase())) return;

    onFormChange({
      ...formData,
      blessings: [
        ...blessings,
        {
          item,
          description: definition?.defaultDescription || "",
          context: definition?.context || "",
        },
      ],
    });
  };

  const addAllMissingFromMaster = () => {
    if (!missingFromMaster.length) return;

    const additions = missingFromMaster.map((definition) => ({
      item: String(definition?.name || "").trim(),
      description: definition?.defaultDescription || "",
      context: definition?.context || "",
    }));
    onFormChange({ ...formData, blessings: [...blessings, ...additions] });
  };

  const applyParsedToFields = () => {
    const parsed = parseRawGreentext(formData.rawPastedText || "");
    onFormChange({
      ...formData,
      volumeNumber: parsed.volumeNumber ?? "",
      title: parsed.title ?? "",
      bodyText: (parsed.bodyLines || []).join("\n"),
      blessingIntro: parsed.blessingIntro ?? "",
      blessings: parsed.blessings || [],
      dream: parsed.dream ?? "",
      edition: parsed.edition ?? "",
    });
  };

  return (
    <form id="volume-form" onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden text-text-main">
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-3 sm:p-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] xl:overflow-hidden">
        <div className="min-w-0 space-y-4 xl:overflow-y-auto xl:pr-1">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/10">
            <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <WandSparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Start from raw greentext</h3>
                  <p className="text-xs text-text-secondary">Paste once, then populate the structured editor.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={applyParsedToFields}
                disabled={!formData.rawPastedText?.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sparkles size={14} /> Parse and apply
              </button>
            </div>

            <div className="p-3 sm:p-4">
              <textarea
                id="rawPastedText"
                name="rawPastedText"
                value={formData.rawPastedText || ""}
                onChange={handleChange}
                placeholder=">Paste a complete volume here…"
                className="h-44 w-full resize-y rounded-xl border border-white/10 bg-black/25 p-3 font-mono text-sm leading-5 text-gray-200 outline-none transition placeholder:text-white/20 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                spellCheck={false}
              />

              <button
                type="button"
                onClick={() => setShowPreview((current) => !current)}
                className="mt-2 inline-flex items-center gap-2 text-xs text-text-secondary transition hover:text-white"
              >
                <Braces size={14} />
                {showPreview ? "Hide parsed JSON" : "Review parsed JSON"}
                <ChevronDown size={14} className={`transition ${showPreview ? "rotate-180" : ""}`} />
              </button>

              {showPreview && (
                <pre className="mt-3 max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs leading-5 text-text-secondary">
                  {JSON.stringify(parsedPreview, null, 2)}
                </pre>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Volume details</h3>
                <p className="text-xs text-text-secondary">The identity and framing shown in the archive.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-text-secondary">Volume number</span>
                <input
                  type="number"
                  name="volumeNumber"
                  value={formData.volumeNumber || ""}
                  onChange={handleChange}
                  placeholder="42"
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-text-secondary">Edition</span>
                <input
                  type="text"
                  name="edition"
                  value={formData.edition || ""}
                  onChange={handleChange}
                  placeholder="Optional edition label"
                  className={fieldClass}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-text-secondary">Title</span>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleChange}
                  placeholder="Give this volume a memorable title"
                  className={fieldClass}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-text-secondary">Blessing intro</span>
                <input
                  type="text"
                  name="blessingIntro"
                  value={formData.blessingIntro || ""}
                  onChange={handleChange}
                  placeholder="Life is…"
                  className={fieldClass}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Story</h3>
                <p className="text-xs text-text-secondary">Write the main narrative and closing dream.</p>
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-text-secondary">
                Body
                <span className="font-normal tabular-nums text-white/30">
                  {(formData.bodyText || "").split("\n").filter(Boolean).length} lines
                </span>
              </span>
              <textarea
                name="bodyText"
                value={formData.bodyText || ""}
                onChange={handleChange}
                rows={14}
                placeholder=">Begin the volume…"
                className={`${fieldClass} resize-y font-mono leading-6`}
                spellCheck={false}
              />
            </label>

            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs font-medium text-text-secondary">Dream</span>
              <textarea
                name="dream"
                value={formData.dream || ""}
                onChange={handleChange}
                rows={4}
                placeholder="Close with the dream…"
                className={`${fieldClass} resize-y`}
              />
            </label>
          </section>
        </div>

        <aside className="min-h-0 min-w-0">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/10 xl:flex xl:h-full xl:flex-col">
            <div className="border-b border-white/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Blessings</h3>
                    <p className="text-xs text-text-secondary">{blessings.length} in this volume</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addBlessing}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-2 text-xs font-semibold text-white transition hover:brightness-110"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to="/admin/blessings"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-text-secondary transition hover:text-white"
                >
                  <Library size={13} /> Master library
                </Link>
                <button
                  type="button"
                  onClick={splitAllBlessings}
                  disabled={!blessings.length}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-text-secondary transition hover:text-white disabled:opacity-40"
                >
                  <Scissors size={13} /> Split all names
                </button>
              </div>
            </div>

            {(missingFromMaster.length > 0 || masterError) && (
              <div className="border-b border-white/10 bg-amber-500/[0.06] p-3">
                {masterError ? (
                  <p className="text-xs text-amber-200">{masterError}</p>
                ) : (
                  <details>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs text-amber-200">
                      <span>{missingFromMaster.length} library blessings not used here</span>
                      <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[10px]">Review</span>
                    </summary>
                    <div className="mt-3 max-h-36 space-y-1 overflow-y-auto pr-1">
                      {missingFromMaster.map((definition) => (
                        <div
                          key={definition._id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/10 bg-black/15 px-2.5 py-2"
                        >
                          <span className="min-w-0 truncate text-xs text-amber-100">{definition.name}</span>
                          <button
                            type="button"
                            onClick={() => addFromMaster(definition)}
                            className="rounded-md px-2 py-1 text-[10px] font-semibold text-amber-200 hover:bg-amber-500/10"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addAllMissingFromMaster}
                      className="mt-2 w-full rounded-lg border border-amber-500/20 bg-amber-500/10 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/15"
                    >
                      Add all missing blessings
                    </button>
                  </details>
                )}
              </div>
            )}

            <div className="space-y-2 p-2 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
              {!blessings.length && (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
                  <Sparkles size={24} className="mx-auto mb-2 text-white/20" />
                  <p className="text-sm font-medium text-white">No blessings yet</p>
                  <p className="mt-1 text-xs text-text-secondary">Add one manually or pull from the master library.</p>
                </div>
              )}

              {blessings.map((blessing, index) => (
                <div key={index} className="rounded-xl border border-white/10 bg-black/15 p-2.5 transition focus-within:border-primary/30">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-right font-mono text-[10px] text-white/25">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <input
                      value={blessing.item || ""}
                      onChange={(event) => updateBlessing(index, "item", event.target.value)}
                      placeholder="Blessing name"
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/20"
                    />
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => splitBlessingAtIndex(index)}
                        className="rounded-md p-1.5 text-white/30 transition hover:bg-primary/10 hover:text-primary"
                        title="Split name and description"
                      >
                        <Scissors size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlessing(index, -1)}
                        disabled={index === 0}
                        className="rounded-md p-1.5 text-white/30 transition hover:bg-white/5 hover:text-white disabled:opacity-20"
                        title="Move up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlessing(index, 1)}
                        disabled={index === blessings.length - 1}
                        className="rounded-md p-1.5 text-white/30 transition hover:bg-white/5 hover:text-white disabled:opacity-20"
                        title="Move down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlessing(index)}
                        className="rounded-md p-1.5 text-white/30 transition hover:bg-red-500/10 hover:text-red-300"
                        title="Remove blessing"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={blessing.description || ""}
                    onChange={(event) => updateBlessing(index, "description", event.target.value)}
                    placeholder="Description or meaning…"
                    rows={2}
                    className="mt-2 w-full resize-none rounded-lg border border-white/5 bg-black/15 px-2.5 py-2 text-xs leading-5 text-gray-300 outline-none transition placeholder:text-white/15 focus:border-primary/30"
                  />
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="z-20 flex flex-none flex-col gap-3 border-t border-white/10 bg-surface/95 px-4 py-3 shadow-[0_-12px_30px_rgba(0,0,0,0.25)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label htmlFor="status" className="text-xs font-medium text-text-secondary">
            Save as
          </label>
          <select
            id="status"
            name="status"
            value={formData.status || "draft"}
            onChange={handleChange}
            className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-primary/60"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <span className="hidden items-center gap-1.5 text-xs text-text-secondary sm:inline-flex">
            <Check size={13} className={formData.status === "published" ? "text-emerald-400" : "text-amber-400"} />
            {formData.status === "published" ? "Visible in the public viewer" : "Only visible to admins"}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Save size={16} />
          )}
          {loading ? "Saving…" : submitButtonText}
        </button>
      </div>
    </form>
  );
};

export default VolumeForm;
