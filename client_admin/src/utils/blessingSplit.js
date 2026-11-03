// Splits a blessing entry "Name – details" into { item: "Name", description: "details" }.
// Returns null when the item has no en dash with text on both sides.
// An existing description is kept after the moved text so nothing is lost.
export function splitEntryAtDash(entry) {
  const raw = entry?.item || "";
  const idx = raw.indexOf("–");
  if (idx === -1) return null;
  const item = raw.slice(0, idx).trim();
  const moved = raw.slice(idx + 1).trim();
  if (!item || !moved) return null;
  const existing = (entry.description || "").trim();
  return { ...entry, item, description: existing ? `${moved} ${existing}` : moved };
}

// Returns [{ volume, blessings, changed }] for volumes with at least one splittable entry.
export function planDashSplits(volumes) {
  const plans = [];
  for (const volume of volumes || []) {
    let changed = 0;
    const blessings = (volume.blessings || []).map((entry) => {
      const split = splitEntryAtDash(entry);
      if (!split) return entry;
      changed += 1;
      return split;
    });
    if (changed) plans.push({ volume, blessings, changed });
  }
  return plans;
}

// Splits a free-form blessing name for the volume editors: "Name – details" or "Name - details",
// falling back to "Name (details)". Always returns { item, description }.
export function splitBlessingName(text) {
  const value = String(text || "").trim();
  const dashMatch = value.match(/^(.*?)\s+[–-]\s+(.*)$/);
  if (dashMatch) return { item: dashMatch[1].trim(), description: dashMatch[2].trim() };

  const parentheticalMatch = value.match(/^(.*?)(?:\s*\((.*)\))?$/);
  return {
    item: (parentheticalMatch?.[1] || value).trim(),
    description: (parentheticalMatch?.[2] || "").trim(),
  };
}
