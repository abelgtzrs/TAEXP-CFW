import { TextScramble } from "../../utils/textScramble";

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const buildVolumeContentLines = (volumeData) => {
  const allLines = [];

  volumeData.bodyLines.forEach((line) => {
    const formattedLine = line.trim() === "" ? "" : `> ${line}`;
    allLines.push(formattedLine);
  });

  if (volumeData.blessings && volumeData.blessings.length > 0) {
    allLines.push("");
    allLines.push(volumeData.blessingIntro);
    volumeData.blessings.forEach((b) => {
      const formattedBlessing = `- ${b.item} (${b.description})`;
      allLines.push(formattedBlessing);
    });
  }

  if (volumeData.dream) {
    allLines.push("");
    allLines.push(volumeData.dream);
  }

  if (volumeData.edition) {
    allLines.push("");
    const formattedEdition = `The Abel Experience™: ${volumeData.edition}`;
    allLines.push(formattedEdition);
  }

  return allLines;
};

export const displayVolume = async ({ volumeData, typeLines }) => {
  const linesToDisplay = [
    {
      text: `--- Initializing The Abel Experience™ Volume ${volumeData.volumeNumber}: ${volumeData.title} ---`,
      type: "system",
    },
    { text: " ", type: "info" },
  ];

  volumeData.bodyLines.forEach((line) => {
    const formattedLine = line.trim() === "" ? "" : `> ${line}`;
    linesToDisplay.push({
      text: formattedLine,
      type: "greentext",
    });
  });

  if (volumeData.blessings && volumeData.blessings.length > 0) {
    linesToDisplay.push({ text: " ", type: "info" });
    linesToDisplay.push({ text: volumeData.blessingIntro, type: "system" });
    volumeData.blessings.forEach((b) => {
      const formattedBlessing = `- ${b.item} (${b.description})`;
      linesToDisplay.push({ text: formattedBlessing, type: "info" });
    });
  }

  if (volumeData.dream) {
    linesToDisplay.push({ text: " ", type: "info" });
    linesToDisplay.push({ text: volumeData.dream, type: "system" });
  }

  if (volumeData.edition) {
    linesToDisplay.push({ text: " ", type: "info" });
    const formattedEdition = `The Abel Experience™: ${volumeData.edition}`;
    linesToDisplay.push({ text: formattedEdition, type: "system" });
  }

  await typeLines(linesToDisplay);
};

export const displayVolumeScrambled = async ({ volumeData, typeLines, addLines, setLines }) => {
  await typeLines([
    {
      text: `--- VOIDZ ACCESS: Volume ${volumeData.volumeNumber}: ${volumeData.title} ---`,
      type: "system",
    },
    { text: " ", type: "info" },
  ]);

  const allLines = buildVolumeContentLines(volumeData);

  for (const line of allLines) {
    if (line === "") {
      addLines([{ text: "", type: "info" }]);
      await wait(100);
      continue;
    }

    let currentLineIndex;
    setLines((prev) => {
      currentLineIndex = prev.length;
      return [...prev, { text: "", type: "scrambling" }];
    });

    await wait(100);

    const lineElement = document.querySelector(`[data-line-index="${currentLineIndex}"]`);
    if (lineElement) {
      const scrambler = new TextScramble(lineElement);
      await scrambler.setText(line);
    }

    await wait(150);
  }
};
