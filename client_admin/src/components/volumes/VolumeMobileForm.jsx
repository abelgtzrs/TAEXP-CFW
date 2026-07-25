import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Braces,
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
  "min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-primary/60";

const VolumeMobileForm = ({ formData, onFormChange, onSubmit, loading, submitButtonText = "Save volume" }) => {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem("tae.volumes.mobile.activeTab") || "import";
    } catch {
      return "import";
    }
  });
  const [parsedPreview, setParsedPreview] = useState({});
  const [masterBlessings, setMasterBlessings] = useState([]);
  const [masterError, setMasterError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("tae.volumes.mobile.activeTab", activeTab);
    } catch {
      // The selected tab still works when storage is unavailable.
    }
  }, [activeTab]);

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
    setActiveTab("content");
  };

  return (
    <form onSubmit={onSubmit} className="pb-24 text-text-main">
      <nav className="sticky top-0 z-20 grid grid-cols-4 gap-1 border-b border-white/10 bg-surface/95 p-2 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab("import")}
          className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition ${
            activeTab === "import" ? "bg-primary text-white" : "text-text-secondary"
          }`}
        >
          <WandSparkles size={16} /> Import
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition ${
            activeTab === "content" ? "bg-primary text-white" : "text-text-secondary"
          }`}
        >
          <FileText size={16} /> Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("blessings")}
          className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition ${
            activeTab === "blessings" ? "bg-primary text-white" : "text-text-secondary"
          }`}
        >
          <Sparkles size={16} /> Blessings
          {!!blessings.length && (
            <span className="absolute right-2 top-1.5 rounded-full bg-white/15 px-1.5 text-[9px]">{blessings.length}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition ${
            activeTab === "preview" ? "bg-primary text-white" : "text-text-secondary"
          }`}
        >
          <Braces size={16} /> Preview
        </button>
      </nav>

      <div className="p-3">
        {activeTab === "import" && (
          <section>
            <div className="mb-3">
              <h2 className="text-base font-semibold text-white">Paste raw greentext</h2>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Drop in a complete volume and we’ll separate its fields for editing.
              </p>
            </div>

            <textarea
              id="rawPastedText"
              name="rawPastedText"
              value={formData.rawPastedText || ""}
              onChange={handleChange}
              placeholder=">Paste a complete volume here…"
              className="h-[46dvh] min-h-72 w-full resize-y rounded-2xl border border-white/10 bg-black/25 p-3 font-mono text-sm leading-6 text-gray-200 outline-none placeholder:text-white/20 focus:border-primary/60"
              spellCheck={false}
            />

            <button
              type="button"
              onClick={applyParsedToFields}
              disabled={!formData.rawPastedText?.trim()}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-lg shadow-primary/20 disabled:opacity-40"
            >
              <Sparkles size={17} /> Parse and continue
            </button>
          </section>
        )}

        {activeTab === "content" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">Volume content</h2>
              <p className="mt-1 text-xs leading-5 text-text-secondary">Refine the fields that make up this entry.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs text-text-secondary">Volume #</span>
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
                  <span className="mb-1.5 block text-xs text-text-secondary">Edition</span>
                  <input
                    type="text"
                    name="edition"
                    value={formData.edition || ""}
                    onChange={handleChange}
                    placeholder="Optional"
                    className={fieldClass}
                  />
                </label>
              </div>

              <label className="mt-3 block">
                <span className="mb-1.5 block text-xs text-text-secondary">Title</span>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleChange}
                  placeholder="Volume title"
                  className={fieldClass}
                />
              </label>

              <label className="mt-3 block">
                <span className="mb-1.5 block text-xs text-text-secondary">Blessing intro</span>
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

            <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-text-secondary">Body</span>
                <span className="text-[10px] tabular-nums text-white/30">
                  {(formData.bodyText || "").split("\n").filter(Boolean).length} lines
                </span>
              </div>
              <textarea
                name="bodyText"
                value={formData.bodyText || ""}
                onChange={handleChange}
                rows={12}
                placeholder=">Begin the volume…"
                className={`${fieldClass} resize-y font-mono leading-6`}
                spellCheck={false}
              />

              <label className="mt-3 block">
                <span className="mb-1.5 block text-xs text-text-secondary">Dream</span>
                <textarea
                  name="dream"
                  value={formData.dream || ""}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Close with the dream…"
                  className={`${fieldClass} resize-y`}
                />
              </label>
            </div>
          </section>
        )}

        {activeTab === "blessings" && (
          <section>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">Blessings</h2>
                <p className="mt-1 text-xs text-text-secondary">{blessings.length} in this volume</p>
              </div>
              <button
                type="button"
                onClick={addBlessing}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-white"
              >
                <Plus size={15} /> Add
              </button>
            </div>

            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              <Link
                to="/admin/blessings"
                className="inline-flex min-h-9 flex-none items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-text-secondary"
              >
                <Library size={14} /> Library
              </Link>
              <button
                type="button"
                onClick={splitAllBlessings}
                disabled={!blessings.length}
                className="inline-flex min-h-9 flex-none items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-text-secondary disabled:opacity-40"
              >
                <Scissors size={14} /> Split all names
              </button>
            </div>

            {(missingFromMaster.length > 0 || masterError) && (
              <details className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
                <summary className="cursor-pointer text-xs text-amber-200">
                  {masterError || `${missingFromMaster.length} library blessings not used here`}
                </summary>
                {!masterError && (
                  <div className="mt-3">
                    <div className="max-h-44 space-y-1 overflow-y-auto">
                      {missingFromMaster.map((definition) => (
                        <button
                          key={definition._id}
                          type="button"
                          onClick={() => addFromMaster(definition)}
                          className="flex min-h-10 w-full items-center justify-between rounded-lg border border-amber-500/10 bg-black/10 px-3 text-left text-xs text-amber-100"
                        >
                          <span className="truncate">{definition.name}</span>
                          <Plus size={14} />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addAllMissingFromMaster}
                      className="mt-2 min-h-10 w-full rounded-lg bg-amber-500/10 text-xs font-semibold text-amber-100"
                    >
                      Add all missing
                    </button>
                  </div>
                )}
              </details>
            )}

            {!blessings.length && (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center">
                <Sparkles size={24} className="mx-auto mb-2 text-white/20" />
                <p className="text-sm font-medium text-white">No blessings yet</p>
                <p className="mt-1 text-xs text-text-secondary">Add one or pull from the master library.</p>
              </div>
            )}

            <div className="space-y-2">
              {blessings.map((blessing, index) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-black/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-white/30">BLESSING {String(index + 1).padStart(2, "0")}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => splitBlessingAtIndex(index)}
                        className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary active:bg-white/5"
                        aria-label="Split blessing name and description"
                      >
                        <Scissors size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlessing(index, -1)}
                        disabled={index === 0}
                        className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary disabled:opacity-20"
                        aria-label="Move blessing up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlessing(index, 1)}
                        disabled={index === blessings.length - 1}
                        className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary disabled:opacity-20"
                        aria-label="Move blessing down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlessing(index)}
                        className="grid h-9 w-9 place-items-center rounded-lg text-red-300 active:bg-red-500/10"
                        aria-label="Remove blessing"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <input
                    value={blessing.item || ""}
                    onChange={(event) => updateBlessing(index, "item", event.target.value)}
                    placeholder="Blessing name"
                    className={fieldClass}
                  />
                  <textarea
                    value={blessing.description || ""}
                    onChange={(event) => updateBlessing(index, "description", event.target.value)}
                    placeholder="Description or meaning…"
                    rows={3}
                    className={`${fieldClass} mt-2 resize-y`}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "preview" && (
          <section>
            <div className="mb-3">
              <h2 className="text-base font-semibold text-white">Parsed preview</h2>
              <p className="mt-1 text-xs leading-5 text-text-secondary">A read-only view of what the raw parser found.</p>
            </div>
            <pre className="h-[58dvh] min-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/25 p-3 font-mono text-xs leading-5 text-gray-300">
              {JSON.stringify(parsedPreview, null, 2)}
            </pre>
          </section>
        )}
      </div>

      <div
        className="fixed z-40 grid grid-cols-[auto_1fr] gap-2 border-t border-white/10 bg-surface/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(0,0,0,0.3)] backdrop-blur-md"
        style={{
          left: "var(--left-sidebar-width, 0px)",
          right: "var(--right-sidebar-width, 0px)",
          bottom: "var(--bottom-nav-height, 0px)",
        }}
      >
        <select
          name="status"
          value={formData.status || "draft"}
          onChange={handleChange}
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none"
          aria-label="Volume status"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-lg shadow-primary/20 disabled:opacity-50"
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

export default VolumeMobileForm;
