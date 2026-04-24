export type ParsedGreentext = {
  volumeNumber: number | null;
  title: string;
  bodyLines: string[];
  blessingIntro: string;
  blessings: { item: string; description: string }[];
  dream: string;
  edition: string;
};

/**
 * Parses a raw greentext block into a structured volume object.
 * Mirrors the web admin parser (greentextParser.js).
 */
export function parseRawGreentext(rawText: string): ParsedGreentext {
  const empty: ParsedGreentext = {
    volumeNumber: null,
    title: "",
    bodyLines: [],
    blessingIntro: "",
    blessings: [],
    dream: "",
    edition: "",
  };

  if (!rawText || !rawText.trim()) return empty;

  const lines = rawText.split("\n");
  const result: ParsedGreentext = { ...empty };

  const BLESSING_INTRO_KEYWORD = "life is";
  const DREAM_KEYWORD = "the dream of";

  // Parse header line: "The Abel Experience™: Volume N – Title" or "Volume N – Title"
  const titleRegex = /Volume\s+(\d+)\s*[–-]\s*(.*)/i;
  const firstLineMatch = lines[0]?.trim().match(titleRegex);
  if (firstLineMatch) {
    result.volumeNumber = parseInt(firstLineMatch[1], 10);
    result.title = firstLineMatch[2].trim();
    result.edition = `${result.title} Edition`;
  }

  const blessingIntroIndex = lines.findIndex((l) => l.trim().toLowerCase().startsWith(BLESSING_INTRO_KEYWORD));
  const dreamIndex = lines.findIndex((l) => l.trim().toLowerCase().startsWith(DREAM_KEYWORD));

  const specialIndexes = [blessingIntroIndex, dreamIndex].filter((i) => i !== -1);
  const bodyEndIndex = specialIndexes.length > 0 ? Math.min(...specialIndexes) : lines.length;

  result.bodyLines = lines.slice(1, bodyEndIndex).map((l) => l.trimEnd());

  if (blessingIntroIndex !== -1) {
    result.blessingIntro = lines[blessingIntroIndex].trim();
    const endOfBlessings = dreamIndex > blessingIntroIndex ? dreamIndex : lines.length;
    const blessingLines = lines.slice(blessingIntroIndex + 1, endOfBlessings).filter((l) => l.trim() !== "");

    // Supports "Item (description)" and "Item – description" formats
    const blessingRegex = /^(.*?)(?:\s*\((.*)\)|\s*[–-]\s*(.*))?$/;
    for (const line of blessingLines) {
      const match = line.trim().match(blessingRegex);
      if (match) {
        result.blessings.push({
          item: match[1].trim(),
          description: match[2] || match[3] || "",
        });
      }
    }
  }

  if (dreamIndex !== -1) {
    result.dream = lines[dreamIndex].trim();
  }

  return result;
}
