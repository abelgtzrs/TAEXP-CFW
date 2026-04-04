import HELP_TEXT from "./helpText";
import { getAboutText, getCatText } from "./getAboutText";
import { VOIDZ_PHRASES } from "./constants";

const toInt = (value) => Number.parseInt(value, 10);

const normalizeFontToken = (value = "") => value.toLowerCase().trim().replace(/["']/g, "").replace(/\s+/g, "-");

const findFontOption = (fonts, input) => {
  const normalizedInput = normalizeFontToken(input);
  return fonts.find(
    (font) => normalizeFontToken(font.key) === normalizedInput || normalizeFontToken(font.name) === normalizedInput,
  );
};

export const createTerminalCommandProcessor = ({
  api,
  typeLines,
  displayVolume,
  displayVolumeScrambled,
  addLines,
  setLines,
  setTheme,
  setFavorites,
  favorites,
  setScrambleData,
  toggleFullScreen,
  themes,
  terminalFonts,
  terminalFontKey,
  setTerminalFontKey,
  setFontPickerState,
  setIsProcessing,
}) => {
  return async (command) => {
    const [cmd, ...args] = command.trim().toLowerCase().split(/\s+/);
    const availableFonts = Array.isArray(terminalFonts) ? terminalFonts : [];
    setIsProcessing(true);

    try {
      // Command router: each case handles one terminal command keyword.
      switch (cmd) {
        // api: Prints the currently resolved API base URL for debugging environment config.
        case "api":
          await typeLines([
            { text: `Current API base: ${api?.defaults?.baseURL}`, type: "system" },
            { text: "Set VITE_PUBLIC_API_BASE_URL (ending with /api) to override.", type: "info" },
          ]);
          break;

        // help: Displays all supported terminal commands and usage hints.
        case "help":
          await typeLines(HELP_TEXT);
          break;

        // about: Shows project/about text for The Abel Experience terminal.
        case "about": {
          const aboutLines = getAboutText()
            .split("\n")
            .map((line) => ({ text: line, type: "info" }));
          await typeLines(aboutLines);
          break;
        }

        // cat: Prints the terminal cat easter-egg text/art.
        case "cat": {
          const catLines = getCatText()
            .split("\n")
            .map((line) => ({ text: line, type: "info" }));
          await typeLines(catLines);
          break;
        }

        // date: Outputs the client machine's current date/time string.
        case "date":
          await typeLines([{ text: new Date().toString(), type: "info" }]);
          break;

        // connect: Opens the admin login page in a new tab.
        case "connect":
          addLines([{ text: "Redirecting to secure Admin Panel login...", type: "system" }]);
          window.open("http://localhost:5173/login", "_blank");
          break;

        // stats: Fetches and prints engagement metrics for one volume number.
        case "stats": {
          const statsNum = toInt(args[0]);
          if (!statsNum) {
            await typeLines([{ text: "Usage: stats [volume number]", type: "error" }]);
            break;
          }

          try {
            const res = await api.get(`/volumes/id/${statsNum}`);
            const vol = res.data.data;
            await typeLines([
              { text: `--- STATISTICS FOR VOLUME ${vol.volumeNumber} ---`, type: "system" },
              { text: `Title: ${vol.title}`, type: "info" },
              { text: `Times Favorited: ${vol.favoriteCount || 0}`, type: "info" },
              { text: `Number of Ratings: ${vol.ratingCount || 0}`, type: "info" },
              {
                text: `Average Rating: ${vol.averageRating ? vol.averageRating.toFixed(1) : "N/A"} / 100`,
                type: "info",
              },
            ]);
          } catch {
            await typeLines([{ text: `Error: Could not retrieve stats for Volume ${statsNum}.`, type: "error" }]);
          }
          break;
        }

        // blessing: Fetches and prints the random blessing/message of the day.
        case "blessing":
          try {
            const res = await api.get("/motd");
            const blessing = res.data.data;
            await typeLines([
              {
                text: `[Random Blessing] - ${blessing.item} (${blessing.description})`,
                type: "system",
              },
            ]);
          } catch {
            await typeLines([{ text: "Error: Could not retrieve Message of the Day.", type: "error" }]);
          }
          break;

        // latest: Fetches and displays the latest published volume.
        case "latest":
          try {
            const res = await api.get("/volumes/latest");
            await displayVolume(res.data.data);
          } catch {
            await typeLines([{ text: "Error: Could not fetch latest volume.", type: "error" }]);
          }
          break;

        // search: Finds volumes whose content/title matches the provided keyword(s).
        case "search": {
          const query = args.join(" ");
          if (!query) {
            await typeLines([{ text: "Usage: search [keyword]", type: "error" }]);
            break;
          }

          try {
            const res = await api.get(`/volumes/search?q=${query}`);
            const searchResultLines = res.data.data.map((vol) => ({
              text: `Volume ${vol.volumeNumber}: ${vol.title}`,
              type: "info",
            }));

            if (searchResultLines.length === 0) {
              searchResultLines.push({ text: "No matching volumes found.", type: "info" });
            }

            searchResultLines.unshift({ text: `--- Search results for "${query}" ---`, type: "system" });
            await typeLines(searchResultLines);
          } catch {
            await typeLines([{ text: "Error during search.", type: "error" }]);
          }
          break;
        }

        // theme: Sets the active terminal color theme by name.
        case "theme": {
          const inputTheme = args[0];
          if (!inputTheme) {
            await typeLines([{ text: 'Usage: theme [name]. Type "themes" to see available options.', type: "error" }]);
            break;
          }

          const availableThemes = Object.keys(themes);
          const matchedTheme = availableThemes.find(
            (themeName) => themeName.toLowerCase() === inputTheme.toLowerCase(),
          );

          if (matchedTheme) {
            setTheme(matchedTheme);
            await typeLines([{ text: `Theme set to '${matchedTheme}'.`, type: "system" }]);
          } else {
            await typeLines([
              {
                text: `Error: Theme not found. Available: ${availableThemes.join(", ")}`,
                type: "error",
              },
            ]);
          }
          break;
        }

        // themes: Lists all available terminal theme names.
        case "themes": {
          const themeLines = Object.keys(themes).map((themeName) => ({ text: `${themeName}`, type: "info" }));
          themeLines.unshift({ text: "--- Available Themes ---", type: "system" });
          await typeLines(themeLines);
          break;
        }

        // fonts: Opens keyboard picker mode for font selection.
        case "fonts": {
          if (availableFonts.length === 0) {
            await typeLines([{ text: "No terminal fonts configured.", type: "error" }]);
            break;
          }

          const activeIndex = Math.max(
            0,
            availableFonts.findIndex((font) => font.key === terminalFontKey),
          );

          setFontPickerState({ isOpen: true, selectedIndex: activeIndex });

          await typeLines([
            { text: "--- Font Selector Opened ---", type: "system" },
            { text: "Use Arrow Up/Down to move (live preview), Enter to select, Esc to cancel.", type: "info" },
          ]);
          break;
        }

        // font: Sets font directly by name, or opens picker mode when no name is provided.
        case "font": {
          if (availableFonts.length === 0) {
            await typeLines([{ text: "No terminal fonts configured.", type: "error" }]);
            break;
          }

          const requestedFont = args.join(" ").trim();
          if (!requestedFont) {
            const activeIndex = Math.max(
              0,
              availableFonts.findIndex((font) => font.key === terminalFontKey),
            );

            setFontPickerState({ isOpen: true, selectedIndex: activeIndex });

            await typeLines([
              { text: "--- Font Selector Opened ---", type: "system" },
              { text: "Use Arrow Up/Down to move (live preview), Enter to select, Esc to cancel.", type: "info" },
            ]);
            break;
          }

          const matchedFont = findFontOption(availableFonts, requestedFont);
          if (!matchedFont) {
            await typeLines([
              { text: `Error: Font not found: ${requestedFont}`, type: "error" },
              { text: 'Type "fonts" to list all available font names.', type: "info" },
            ]);
            break;
          }

          const matchedIndex = Math.max(
            0,
            availableFonts.findIndex((font) => font.key === matchedFont.key),
          );

          setFontPickerState({ isOpen: false, selectedIndex: matchedIndex });
          setTerminalFontKey(matchedFont.key);
          await typeLines([
            { text: `Terminal font set to '${matchedFont.name}'.`, type: "system" },
            { text: "This preference is saved locally and will persist across sessions.", type: "info" },
          ]);
          break;
        }

        // favorite: Marks a volume as favorite (server count + local favorites list).
        case "favorite": {
          const favNum = toInt(args[0]);
          if (!favNum) {
            await typeLines([{ text: "Usage: favorite [volume number]", type: "error" }]);
            break;
          }

          try {
            await api.post(`/volumes/${favNum}/favorite`);
            if (!favorites.includes(favNum)) {
              setFavorites((prev) => [...prev, favNum].sort((a, b) => a - b));
            }
            await typeLines([{ text: `Volume ${favNum} favorited! Thank you.`, type: "system" }]);
          } catch (error) {
            await typeLines([
              {
                text: error.response?.data?.message || "Could not favorite volume.",
                type: "error",
              },
            ]);
          }
          break;
        }

        // favorites: Shows the user's locally stored list of favorited volumes.
        case "favorites": {
          const favLines = favorites.map((num) => ({ text: `Volume ${num}`, type: "info" }));
          if (favLines.length === 0) {
            favLines.push({ text: "You have no favorited volumes.", type: "info" });
          }
          favLines.unshift({ text: "--- Your Favorite Volumes ---", type: "system" });
          await typeLines(favLines);
          break;
        }

        case "rate": {
          const rateNum = toInt(args[0]);
          const ratingVal = toInt(args[1]);
          if (!rateNum || !ratingVal || ratingVal < 1 || ratingVal > 100) {
            await typeLines([{ text: "Usage: rate [volume number] [rating 1-100]", type: "error" }]);
            break;
          }

          try {
            const res = await api.post("/volumes/rate", {
              volumeNumber: rateNum,
              rating: ratingVal,
            });
            await typeLines([{ text: res.data.message, type: "system" }]);
          } catch (error) {
            await typeLines([
              {
                text: error.response?.data?.message || "Error submitting rating.",
                type: "error",
              },
            ]);
          }
          break;
        }

        // clear: Clears all terminal output lines from the current view.
        case "clear":
          setLines([]);
          break;

        // catalogue: Fetches and lists all published volumes.
        case "catalogue":
          try {
            const res = await api.get("/volumes/catalogue");
            const catalogueLines = res.data.data.map((vol) => ({
              text: `Volume ${vol.volumeNumber}: ${vol.title}`,
              type: "info",
            }));
            catalogueLines.unshift({ text: "--- Published Volumes ---", type: "system" });
            await typeLines(catalogueLines);
          } catch (error) {
            const blocked =
              String(error?.message || "").includes("Blocked by client") ||
              String(error?.code || "").includes("ERR_BLOCKED_BY_CLIENT");
            const is404 = Number(error?.response?.status) === 404;
            let msg;

            if (blocked) {
              msg =
                "Request blocked by a browser extension (ad/privacy blocker). Please allowlist this site or try Incognito.";
            } else if (is404) {
              const base = api?.defaults?.baseURL || "";
              msg = `404 Not Found at ${base}/volumes/catalogue. Set VITE_PUBLIC_API_BASE_URL to your API (ending in /api), or host the API at the same origin under /api/public.`;
            } else {
              msg = "Error: Could not fetch volume catalogue.";
            }

            await typeLines([{ text: msg, type: "error" }]);
          }
          break;

        // random: Fetches and displays one random published volume.
        case "random":
          try {
            const res = await api.get("/volumes/random");
            await displayVolume(res.data.data);
          } catch {
            await typeLines([{ text: "Error: Could not fetch random volume.", type: "error" }]);
          }
          break;

        // view: Fetches and displays one specific volume by volume number.
        case "view":
          if (!args[0] || Number.isNaN(toInt(args[0]))) {
            await typeLines([
              {
                text: "Error: Please provide a valid volume number. Usage: view [number]",
                type: "error",
              },
            ]);
            break;
          }

          try {
            const res = await api.get(`/volumes/id/${args[0]}`);
            await displayVolume(res.data.data);
          } catch {
            await typeLines([{ text: `Error: Volume ${args[0]} not found or is not published.`, type: "error" }]);
          }
          break;

        // voidz: Runs special VOIDZ mode (phrase scramble) or scrambled display for a volume.
        case "voidz":
          if (!args[0] || Number.isNaN(toInt(args[0]))) {
            setScrambleData({
              key: Date.now(),
              phrases: VOIDZ_PHRASES,
            });
          } else {
            try {
              const res = await api.get(`/volumes/id/${args[0]}`);
              await displayVolumeScrambled(res.data.data);
            } catch {
              await typeLines([
                {
                  text: `Error: Volume ${args[0]} not found in the VOIDZ or is not published.`,
                  type: "error",
                },
              ]);
            }
          }
          break;

        // export: Exports a volume range to a downloadable text file.
        case "export": {
          const start = toInt(args[0]);
          const end = toInt(args[1]);
          if (!start || !end || start > end) {
            await typeLines([{ text: "Usage: export [start_number] [end_number]", type: "error" }]);
            break;
          }

          try {
            addLines([{ text: `Exporting volumes ${start} to ${end}...`, type: "system" }]);
            const res = await api.post("/volumes/export", { start, end });
            const content = res.data.data.content;

            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Abel_Experience_Export_${start}-${end}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            await typeLines([{ text: "Export complete. Check your downloads.", type: "system" }]);
          } catch (error) {
            await typeLines([{ text: error.response?.data?.message || "Error during export.", type: "error" }]);
          }
          break;
        }

        // fullscreen: Toggles terminal fullscreen mode via parent callback.
        case "fullscreen":
          if (toggleFullScreen) {
            toggleFullScreen();
          } else {
            await typeLines([{ text: "Fullscreen mode not available.", type: "error" }]);
          }
          break;

        // default: Handles unknown commands with a helpful error message.
        default:
          if (command.trim() !== "") {
            await typeLines([
              {
                text: `Command not found: ${command}. Type 'help' for a list of commands.`,
                type: "error",
              },
            ]);
          }
          break;
      }
    } finally {
      setIsProcessing(false);
    }
  };
};
