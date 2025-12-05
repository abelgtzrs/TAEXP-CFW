// Main terminal component for my Abel Experience public interface
// This recreates that retro terminal feel I want for the public site
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { THEMES } from "../assets/themes";
import HELP_TEXT from "./terminal/helpText";
import { getAboutText, getCatText } from "./terminal/getAboutText";
import { TextScramble } from "../utils/textScramble";

// Public API base URL resolver (works in dev and deployed)
const resolvePublicApiBase = () => {
  const envBase = (import.meta?.env?.VITE_PUBLIC_API_BASE_URL || import.meta?.env?.VITE_API_BASE_URL || "").trim();
  if (envBase) {
    try {
      const u = new URL(envBase, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      const path = u.pathname.replace(/\/$/, "");
      if (path.endsWith("/api")) {
        u.pathname = `${path}/public`;
      }
      return u.toString();
    } catch {
      return envBase; // fallback to raw string
    }
  }
  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/$/, "");
    // Netlify deployment fallback: hardcode Render API if no env provided
    if (/netlify\.app$/i.test(window.location.hostname)) {
      return "https://taexp3-0.onrender.com/api/public";
    }
    if (window.location.hostname === "localhost") {
      return "http://localhost:5000/api/public"; // local dev default
    }
    return `${origin}/api/public`; // deployed default assumes same-origin proxy
  }
  return "/api/public"; // SSR/safe fallback
};

const api = axios.create({
  baseURL: resolvePublicApiBase(),
  headers: { "Content-Type": "application/json" },
});

// Optional: log resolved base (helpful for diagnosing prod vs dev)
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.debug("Terminal API base:", api.defaults.baseURL);
}

// --- TYPEWRITER EFFECT CONFIGURATION ---
// I fine-tuned these values to get that perfect retro terminal typing feel
const BASE_TYPE_DELAY = 1; // Minimum delay between each character
const RANDOM_TYPE_DELAY = 15; // Random additional delay to make typing feel more natural
const GLITCH_CHANCE = 0.1; // 10% chance for each character to glitch - adds that cyberpunk feel
const GLITCH_CHARS = "█▓▒░^&*%$#@!+"; // Characters to use for glitch effects
const GLITCH_DELAY = 1; // How long to show the glitch character before the real one

// Component for the special scrambling animation effect used in the voidz command
// This handles the sci-fi text scrambling that cycles through phrases
const ScrambleOutput = ({ phrases, onComplete }) => {
  const elRef = useRef(null); // DOM element reference for the scrambling animation
  const fxRef = useRef(null); // TextScramble instance reference

  useEffect(() => {
    // Initialize my TextScramble utility once the component mounts
    fxRef.current = new TextScramble(elRef.current);

    let counter = 0;
    // Recursive function to cycle through all phrases with scrambling effect
    const next = () => {
      if (counter < phrases.length) {
        fxRef.current.setText(phrases[counter]).then(() => {
          setTimeout(() => {
            counter++;
            next(); // Move to next phrase
          }, 800); // 800ms pause between phrases feels right for dramatic effect
        });
      } else {
        // All phrases complete - notify parent component to clean up
        if (onComplete) {
          onComplete();
        }
      }
    };
    next(); // Start the animation sequence
  }, [phrases, onComplete]); // Re-run if phrases change

  // Rose color matches my terminal aesthetic
  return <div ref={elRef} className="text-rose-400 font-mono" />;
};

const Terminal = () => {
  // --- STATE MANAGEMENT ---
  const [startTime] = useState(Date.now()); // Track session start for potential uptime display
  const [theme, setTheme] = useState("default"); // Current terminal theme - users can switch with 'theme' command

  // Persistent favorites stored in localStorage - I want users to keep their favorites between sessions
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem("terminalFavorites")) || []);

  // Main terminal lines array - each line has text, type (for styling), and optional isTyping flag
  const [lines, setLines] = useState([
    {
      text: "The Abel Experience™ Cognitive Framework v3.0 — Distributed Terminal Interface | Encrypted | Monitored",
      type: "system", // System messages get special styling
    },
    {
      text: "Session initialized: Core modules linked | Memory sectors mapped | Operator input unlocked",
      type: "system",
    },
    {
      text: 'Type "help" to display available commands.',
      type: "info", // Info messages are more neutral
    },
  ]);

  const [input, setInput] = useState(""); // Current user input
  const [isProcessing, setIsProcessing] = useState(false); // Prevents input during command execution
  const [scrambleData, setScrambleData] = useState(null); // Data for the voidz scrambling animation

  // Login state for the connect command - not used yet but keeping for future expansion
  const [loginStep, setLoginStep] = useState("none"); // 'none', 'awaiting_password'
  const [loginEmail, setLoginEmail] = useState("");

  // DOM references for focus management and auto-scrolling
  const inputRef = useRef(null);
  const endOfLinesRef = useRef(null);

  // --- EFFECTS ---
  // Keep input focused so users can type immediately without clicking
  useEffect(() => {
    inputRef.current?.focus();
  }, [isProcessing]);

  // Auto-scroll to bottom when new lines are added - essential for terminal feel
  useEffect(() => {
    endOfLinesRef.current?.scrollIntoView();
  }, [lines]);

  // Persist favorites to localStorage whenever they change - don't want users to lose their lists
  useEffect(() => {
    localStorage.setItem("terminalFavorites", JSON.stringify(favorites));
  }, [favorites]);

  // --- HELPER FUNCTIONS ---
  // Simple helper to add new lines to the terminal output
  const addLines = (newLines) => setLines((prev) => [...prev, ...newLines]);

  // --- TYPEWRITER EFFECT WITH GLITCHES ---
  // This is the core function that creates the retro terminal typing animation
  // I spent a lot of time tweaking this to get the perfect feel
  const typeLines = async (linesToType) => {
    setIsProcessing(true); // Block input during typing animation

    for (const line of linesToType) {
      let currentText = "";
      // Add a new line with isTyping flag for the cursor animation
      setLines((prev) => [...prev, { text: "", type: line.type, isTyping: true }]);

      // Type each character individually with delays and potential glitches
      for (let i = 0; i < line.text.length; i++) {
        // Random glitch effect - skip spaces since they don't look good glitched
        if (Math.random() < GLITCH_CHANCE && line.text[i] !== " ") {
          // Show a random glitch character first
          const randomGlitchChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          setLines((prev) => {
            const nextLines = [...prev];
            nextLines[nextLines.length - 1].text = currentText + randomGlitchChar;
            return nextLines;
          });
          await new Promise((resolve) => setTimeout(resolve, GLITCH_DELAY));
        }

        // Add the actual character
        currentText += line.text[i];
        setLines((prev) => {
          const nextLines = [...prev];
          nextLines[nextLines.length - 1].text = currentText;
          return nextLines;
        });

        // Variable delay to make typing feel more human
        const delay = BASE_TYPE_DELAY + Math.random() * RANDOM_TYPE_DELAY;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Mark line as finished typing (removes cursor)
      setLines((prev) => {
        const nextLines = [...prev];
        nextLines[nextLines.length - 1].isTyping = false;
        return nextLines;
      });
    }
    setIsProcessing(false); // Re-enable input
  };

  // --- NORMAL VOLUME DISPLAY ---
  // Standard way to display volume content with typing animation
  // Used by commands like 'view', 'latest', 'random'
  const displayVolume = async (volumeData) => {
    let linesToDisplay = [];

    // Header with volume info
    linesToDisplay.push({
      text: `--- Initializing The Abel Experience™ Volume ${volumeData.volumeNumber}: ${volumeData.title} ---`,
      type: "system",
    });
    linesToDisplay.push({ text: ` `, type: "info" }); // Empty line for spacing

    // Main content with greentext formatting (> prefix)
    volumeData.bodyLines.forEach((line) => {
      const formattedLine = line.trim() === "" ? "" : `> ${line}`;
      linesToDisplay.push({
        text: formattedLine,
        type: "greentext", // Special greentext styling
      });
    });

    // Optional blessings section - not all volumes have these
    if (volumeData.blessings && volumeData.blessings.length > 0) {
      linesToDisplay.push({ text: ` `, type: "info" });
      linesToDisplay.push({ text: volumeData.blessingIntro, type: "system" });
      volumeData.blessings.forEach((b) => {
        const formattedBlessing = `- ${b.item} (${b.description})`;
        linesToDisplay.push({ text: formattedBlessing, type: "info" });
      });
    }

    // Optional dream section
    if (volumeData.dream) {
      linesToDisplay.push({ text: ` `, type: "info" });
      linesToDisplay.push({ text: volumeData.dream, type: "system" });
    }

    // Optional edition info
    if (volumeData.edition) {
      linesToDisplay.push({ text: ` `, type: "info" });
      const formattedEdition = `The Abel Experience™: ${volumeData.edition}`;
      linesToDisplay.push({ text: formattedEdition, type: "system" });
    }

    await typeLines(linesToDisplay);
  };

  // --- VOIDZ SCRAMBLED VOLUME DISPLAY ---
  // Special display mode for the 'voidz' command - shows content with line-by-line scrambling
  // This was tricky to implement because I needed to coordinate DOM updates with the TextScramble animation
  const displayVolumeScrambled = async (volumeData) => {
    // Start with a special VOIDZ header
    await typeLines([
      {
        text: `--- VOIDZ ACCESS: Volume ${volumeData.volumeNumber}: ${volumeData.title} ---`,
        type: "system",
      },
      { text: ` `, type: "info" },
    ]);

    // Prepare all content lines in advance so I can scramble them one by one
    let allLines = [];

    // Add main content lines
    volumeData.bodyLines.forEach((line) => {
      const formattedLine = line.trim() === "" ? "" : `> ${line}`;
      allLines.push(formattedLine);
    });

    // Add blessings if they exist
    if (volumeData.blessings && volumeData.blessings.length > 0) {
      allLines.push(""); // Empty line for spacing
      allLines.push(volumeData.blessingIntro);
      volumeData.blessings.forEach((b) => {
        const formattedBlessing = `- ${b.item} (${b.description})`;
        allLines.push(formattedBlessing);
      });
    }

    // Add dream section if it exists
    if (volumeData.dream) {
      allLines.push(""); // Empty line
      allLines.push(volumeData.dream);
    }

    // Add edition info if it exists
    if (volumeData.edition) {
      allLines.push(""); // Empty line
      const formattedEdition = `The Abel Experience™: ${volumeData.edition}`;
      allLines.push(formattedEdition);
    }

    // Now display each line with scrambling effect
    for (const line of allLines) {
      if (line === "") {
        // Empty lines don't need scrambling - just add them immediately
        addLines([{ text: "", type: "info" }]);
        await new Promise((resolve) => setTimeout(resolve, 100)); // Brief pause for pacing
      } else {
        // Add a placeholder line that will be targeted for scrambling
        let currentLineIndex;
        setLines((prev) => {
          currentLineIndex = prev.length; // Get index before adding the line
          return [...prev, { text: "", type: "scrambling" }]; // Special type for scrambling lines
        });

        // Wait for React to update the DOM before trying to find the element
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Find the DOM element and apply the scrambling animation
        // Using data-line-index attribute to target the specific line
        const lineElement = document.querySelector(`[data-line-index="${currentLineIndex}"]`);
        if (lineElement) {
          const scrambler = new TextScramble(lineElement);
          await scrambler.setText(line); // This returns a promise when animation completes
        }

        // Small delay between lines for dramatic effect
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }
  };

  // --- COMMAND PROCESSING ENGINE ---
  // This is the heart of the terminal - parses commands and executes them
  // I organized it as a big switch statement for clarity and easy expansion
  const processCommand = async (command) => {
    const [cmd, ...args] = command.trim().toLowerCase().split(" ");
    setIsProcessing(true); // Block input during command execution

    switch (cmd) {
      // Diagnostic: show current API base
      case "api":
        await typeLines([
          { text: `Current API base: ${api?.defaults?.baseURL}`, type: "system" },
          { text: "Set VITE_PUBLIC_API_BASE_URL (ending with /api) to override.", type: "info" },
        ]);
        break;
      // Show available commands - pulls from external help file
      case "help":
        await typeLines(HELP_TEXT);
        break;

      // Display information about The Abel Experience project
      case "about":
        const aboutLines = getAboutText()
          .split("\n")
          .map((line) => ({ text: line, type: "info" }));
        await typeLines(aboutLines);
        break;

      // Fun ASCII cat easter egg
      case "cat":
        const catLines = getCatText()
          .split("\n")
          .map((line) => ({ text: line, type: "info" }));
        await typeLines(catLines);
        break;

      // Simple date command like real terminals
      case "date":
        await typeLines([{ text: new Date().toString(), type: "info" }]);
        break;

      // Redirect to admin panel login - keeping it simple and secure
      case "connect":
        addLines([
          {
            text: "Redirecting to secure Admin Panel login...",
            type: "system",
          },
        ]);
        // Opening in new tab is safer than trying to handle auth in the terminal
        window.open("http://localhost:5173/login", "_blank");
        break;

      // Display statistics for a specific volume - useful for seeing engagement
      case "stats":
        const statsNum = parseInt(args[0]);
        if (!statsNum) {
          await typeLines([{ text: "Usage: stats [volume number]", type: "error" }]);
          break;
        }
        try {
          const res = await api.get(`/volumes/id/${statsNum}`);
          const vol = res.data.data;
          await typeLines([
            {
              text: `--- STATISTICS FOR VOLUME ${vol.volumeNumber} ---`,
              type: "system",
            },
            { text: `Title: ${vol.title}`, type: "info" },
            {
              text: `Times Favorited: ${vol.favoriteCount || 0}`,
              type: "info",
            },
            {
              text: `Number of Ratings: ${vol.ratingCount || 0}`,
              type: "info",
            },
            {
              text: `Average Rating: ${vol.averageRating ? vol.averageRating.toFixed(1) : "N/A"} / 100`,
              type: "info",
            },
          ]);
        } catch (error) {
          await typeLines([
            {
              text: `Error: Could not retrieve stats for Volume ${statsNum}.`,
              type: "error",
            },
          ]);
        }
        break;

      // Get a random blessing/message of the day from the API
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
        } catch (error) {
          await typeLines([
            {
              text: "Error: Could not retrieve Message of the Day.",
              type: "error",
            },
          ]);
        }
        break;

      // Display the most recently published volume
      case "latest":
        try {
          const res = await api.get("/volumes/latest");
          await displayVolume(res.data.data);
        } catch (error) {
          await typeLines([{ text: "Error: Could not fetch latest volume.", type: "error" }]);
        }
        break;

      // Search volumes by keyword - very useful for finding specific content
      case "search":
        if (!args[0]) {
          await typeLines([{ text: "Usage: search [keyword]", type: "error" }]);
          break;
        }
        try {
          const res = await api.get(`/volumes/search?q=${args.join(" ")}`);
          let searchResultLines = res.data.data.map((vol) => ({
            text: `Volume ${vol.volumeNumber}: ${vol.title}`,
            type: "info",
          }));
          if (searchResultLines.length === 0) {
            searchResultLines.push({
              text: "No matching volumes found.",
              type: "info",
            });
          }
          searchResultLines.unshift({
            text: `--- Search results for "${args.join(" ")}" ---`,
            type: "system",
          });
          await typeLines(searchResultLines);
        } catch (error) {
          await typeLines([{ text: "Error during search.", type: "error" }]);
        }
        break;

      // Change terminal theme - I have multiple themes defined in assets/themes
      case "theme":
        const inputTheme = args[0];
        if (!inputTheme) {
          await typeLines([
            {
              text: 'Usage: theme [name]. Type "themes" to see available options.',
              type: "error",
            },
          ]);
          break;
        }

        // Case-insensitive theme matching
        const availableThemes = Object.keys(THEMES);
        const matchedTheme = availableThemes.find((theme) => theme.toLowerCase() === inputTheme.toLowerCase());

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

      // List all available themes
      case "themes":
        const themeLines = Object.keys(THEMES).map((themeName) => ({
          text: `${themeName}`,
          type: "info",
        }));
        themeLines.unshift({
          text: "--- Available Themes ---",
          type: "system",
        });
        await typeLines(themeLines);
        break;

      // Favorite a volume - updates both local storage and global count on server
      case "favorite":
        const favNum = parseInt(args[0]);
        if (!favNum) {
          await typeLines([{ text: "Usage: favorite [volume number]", type: "error" }]);
          break;
        }
        try {
          // Hit the backend to increment global favorite count
          await api.post(`/volumes/${favNum}/favorite`);
          // Also save locally for the 'favorites' command
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

      // Show user's personal favorites list
      case "favorites":
        let favLines = favorites.map((num) => ({
          text: `Volume ${num}`,
          type: "info",
        }));
        if (favLines.length === 0) {
          favLines.push({
            text: "You have no favorited volumes.",
            type: "info",
          });
        }
        favLines.unshift({
          text: "--- Your Favorite Volumes ---",
          type: "system",
        });
        await typeLines(favLines);
        break;

      // Rate a volume from 1-100 - helps with engagement metrics
      case "rate":
        const rateNum = parseInt(args[0]);
        const ratingVal = parseInt(args[1]);
        if (!rateNum || !ratingVal || ratingVal < 1 || ratingVal > 100) {
          await typeLines([
            {
              text: "Usage: rate [volume number] [rating 1-100]",
              type: "error",
            },
          ]);
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

      // Clear terminal screen - simple reset
      case "clear":
        setLines([]);
        break;

      // List all published volumes
      case "catalogue":
        try {
          const res = await api.get("/volumes/catalogue");
          const catalogueLines = res.data.data.map((vol) => ({
            text: `Volume ${vol.volumeNumber}: ${vol.title}`,
            type: "info",
          }));
          catalogueLines.unshift({
            text: "--- Published Volumes ---",
            type: "system",
          });
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

      // Display a random volume - good for discovery
      case "random":
        try {
          const res = await api.get("/volumes/random");
          await displayVolume(res.data.data);
        } catch (error) {
          await typeLines([{ text: "Error: Could not fetch random volume.", type: "error" }]);
        }
        break;
      // View a specific volume by number
      case "view":
        if (!args[0] || isNaN(parseInt(args[0]))) {
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
        } catch (error) {
          await typeLines([
            {
              text: `Error: Volume ${args[0]} not found or is not published.`,
              type: "error",
            },
          ]);
        }
        break;

      // VOIDZ command - my favorite feature! Either shows scrambling animation or volume with effects
      case "voidz":
        if (!args[0] || isNaN(parseInt(args[0]))) {
          // No volume number = show the original scrambling phrases
          setScrambleData({
            key: Date.now(), // Unique key to trigger re-render
            phrases: [
              "INITIATING COGNITIVE SYNC...",
              "ACCESSING THE VOIDZ...",
              "REALITY MATRIX COMPROMISED.",
              "ERROR: UNSTABLE PARADIGM.",
              "RESTORING... OK.",
            ],
          });
        } else {
          // Volume number provided = show that volume with line-by-line scrambling
          try {
            const res = await api.get(`/volumes/id/${args[0]}`);
            await displayVolumeScrambled(res.data.data);
          } catch (error) {
            await typeLines([
              {
                text: `Error: Volume ${args[0]} not found in the VOIDZ or is not published.`,
                type: "error",
              },
            ]);
          }
        }
        break;
      // Export a range of volumes as a text file - useful for backups
      case "export":
        const start = parseInt(args[0]);
        const end = parseInt(args[1]);
        if (!start || !end || start > end) {
          await typeLines([
            {
              text: "Usage: export [start_number] [end_number]",
              type: "error",
            },
          ]);
          break;
        }
        try {
          addLines([{ text: `Exporting volumes ${start} to ${end}...`, type: "system" }]);
          const res = await api.post("/volumes/export", { start, end });
          const content = res.data.data.content;

          // Client-side file download using Blob API
          const blob = new Blob([content], {
            type: "text/plain;charset=utf-8",
          });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `Abel_Experience_Export_${start}-${end}.txt`;
          document.body.appendChild(link);
          link.click(); // Trigger download
          document.body.removeChild(link); // Clean up

          await typeLines([{ text: "Export complete. Check your downloads.", type: "system" }]);
        } catch (error) {
          await typeLines([
            {
              text: error.response?.data?.message || "Error during export.",
              type: "error",
            },
          ]);
        }
        break;

      // Default case for unrecognized commands
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
    setIsProcessing(false); // Re-enable input after command completes
  };

  // --- INPUT HANDLING ---
  // Handle Enter key to submit commands
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isProcessing) {
      const command = input.trim();
      addLines([{ text: `> ${command}`, type: "user" }]); // Echo command back to terminal
      processCommand(command);
      setInput(""); // Clear input field
    }
  };

  // --- RENDER LOGIC ---
  const currentTheme = THEMES[theme] || THEMES.default;
  return (
    // Full screen terminal with click-to-focus behavior
    <div className={`w-full h-[95dvh] p-2 text-sm md:text-xs`} onClick={() => inputRef.current?.focus()}>
      <div className="overflow-y-auto h-full">
        {/* Render all terminal lines */}
        {lines.map((line, index) => {
          const lineStyle = currentTheme[line.type] || currentTheme.info; // Fallback to info style
          const displayText = line.text.trim() === "" ? "\u00A0" : line.text; // Non-breaking space for empty lines

          // Special handling for scrambling lines - need data attribute for targeting
          if (line.type === "scrambling") {
            return (
              <div key={index} className="flex">
                <pre
                  className={`whitespace-pre-wrap leading-relaxed ${currentTheme.greentext}`}
                  data-line-index={index} // This is how I target lines for scrambling
                >
                  {displayText}
                </pre>
              </div>
            );
          }

          // Normal line rendering with optional typing cursor
          return (
            <div key={index} className="flex">
              <pre className={`whitespace-pre-wrap leading-relaxed ${lineStyle}`}>{displayText}</pre>
              {line.isTyping && <span className={`blinking-cursor ${currentTheme.cursor}`}>▋</span>}
            </div>
          );
        })}

        {/* Conditionally render the ScrambleOutput component for voidz command */}
        {scrambleData && (
          <ScrambleOutput
            key={scrambleData.key} // Force re-render with new key
            phrases={scrambleData.phrases}
            onComplete={() => setScrambleData(null)} // Clean up when animation finishes
          />
        )}

        {/* Invisible div for auto-scrolling to bottom */}
        <div ref={endOfLinesRef} />
      </div>

      {/* Terminal input area */}
      <div className="flex mt-2">
        <span className={`${currentTheme.user}`}>&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing} // Disable during command execution
          className={`flex-grow bg-transparent border-none focus:ring-0 focus:outline-none ml-2 text-base md:text-xs ${currentTheme.user}`}
          autoComplete="off" // Prevent browser autocomplete
        />
      </div>
    </div>
  );
};

export default Terminal;
