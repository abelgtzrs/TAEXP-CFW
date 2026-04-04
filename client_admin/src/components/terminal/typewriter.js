import { TYPEWRITER_CONFIG } from "./constants";

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export const createTypeLines = ({ setLines, setIsProcessing }) => {
  return async (linesToType = []) => {
    setIsProcessing(true);

    for (const line of linesToType) {
      let currentText = "";
      const lineType = line?.type || "info";
      const fullText = String(line?.text ?? "");

      setLines((prev) => [...prev, { text: "", type: lineType, isTyping: true }]);

      for (let i = 0; i < fullText.length; i += 1) {
        if (Math.random() < TYPEWRITER_CONFIG.glitchChance && fullText[i] !== " ") {
          const randomGlitchChar =
            TYPEWRITER_CONFIG.glitchChars[Math.floor(Math.random() * TYPEWRITER_CONFIG.glitchChars.length)];

          setLines((prev) => {
            const nextLines = [...prev];
            nextLines[nextLines.length - 1].text = currentText + randomGlitchChar;
            return nextLines;
          });

          await wait(TYPEWRITER_CONFIG.glitchDelay);
        }

        currentText += fullText[i];
        setLines((prev) => {
          const nextLines = [...prev];
          nextLines[nextLines.length - 1].text = currentText;
          return nextLines;
        });

        const delay = TYPEWRITER_CONFIG.baseTypeDelay + Math.random() * TYPEWRITER_CONFIG.randomTypeDelay;
        await wait(delay);
      }

      setLines((prev) => {
        const nextLines = [...prev];
        nextLines[nextLines.length - 1].isTyping = false;
        return nextLines;
      });
    }

    setIsProcessing(false);
  };
};
