// This file is the UI orchestrator for the terminal screen.
// Keep rendering/input/state here while heavy terminal logic lives in ./terminal/* modules.

// Core React hooks used for state, lifecycle, and DOM refs.
// Drive a terminal-like interactive experience with controlled rendering.
import { useState, useEffect, useRef } from "react";

// Theme definitions used to style lines and cursor per selected terminal theme.
// Decouple visual styling from runtime command logic.
import { THEMES } from "../assets/themes";

// Modular terminal services (API, constants, typewriter, volume renderers, command engine).
// Keep this component easy to scan by delegating complex logic to focused files.
import { terminalApi } from "./terminal/apiClient";
import { DEFAULT_TERMINAL_FONT_KEY, INITIAL_TERMINAL_LINES, TERMINAL_FONT_OPTIONS } from "./terminal/constants";
import { createTypeLines } from "./terminal/typewriter";
import {
  displayVolume as renderVolumeData,
  displayVolumeScrambled as renderVolumeDataScrambled,
} from "./terminal/volumeDisplay";
import { createTerminalCommandProcessor } from "./terminal/commandProcessor";
import ScrambleOutput from "./terminal/ScrambleOutput";

const TERMINAL_FONT_STORAGE_KEY = "terminalFontPreference";

// Loads previously favorited volumes from localStorage.
// Persist user preferences between sessions and fail safely in SSR/error cases.
const loadFavorites = () => {
  // Guard for server-side rendering where window/localStorage does not exist.
  // Avoid runtime crashes outside browser environments.
  if (typeof window === "undefined") {
    return [];
  }

  try {
    // Parse stored favorites list.
    // Rehydrate user state at startup.
    const saved = localStorage.getItem("terminalFavorites");
    return saved ? JSON.parse(saved) : [];
  } catch {
    // Fallback when stored data is invalid JSON or inaccessible.
    // Keep app usable even with corrupted storage data.
    return [];
  }
};

const loadTerminalFontKey = () => {
  if (typeof window === "undefined") {
    return DEFAULT_TERMINAL_FONT_KEY;
  }

  try {
    const saved = localStorage.getItem(TERMINAL_FONT_STORAGE_KEY);
    if (!saved) {
      return DEFAULT_TERMINAL_FONT_KEY;
    }

    const exists = TERMINAL_FONT_OPTIONS.some((font) => font.key === saved);
    return exists ? saved : DEFAULT_TERMINAL_FONT_KEY;
  } catch {
    return DEFAULT_TERMINAL_FONT_KEY;
  }
};

// Main terminal component used by the admin/public terminal UI.
// Compose terminal modules into one predictable input -> process -> render loop.
const Terminal = ({ toggleFullScreen }) => {
  // Active visual theme name.
  // Let users switch terminal color/style presets at runtime.
  const [theme, setTheme] = useState("default");

  // Locally saved favorite volume numbers.
  // Support quick access and persistence for user-selected volumes.
  const [favorites, setFavorites] = useState(loadFavorites);

  // Terminal output buffer (every printed line in order).
  // Preserve command history and animated output like a real terminal.
  const [lines, setLines] = useState(INITIAL_TERMINAL_LINES);

  // Current text in input field.
  // Keep terminal input controlled and predictable.
  const [input, setInput] = useState("");

  // Busy flag while commands/typewriter are running.
  // Prevent overlapping commands and conflicting UI updates.
  const [isProcessing, setIsProcessing] = useState(false);

  // Data payload for the special scramble overlay animation.
  // Trigger/clear the VOIDZ-style scramble output when needed.
  const [scrambleData, setScrambleData] = useState(null);

  // Selected terminal font key.
  // This is configurable via terminal commands and persisted in localStorage.
  const [terminalFontKey, setTerminalFontKey] = useState(loadTerminalFontKey);

  // Interactive font selector state.
  // When open, Arrow keys move the cursor and Enter confirms selection.
  const [fontPickerState, setFontPickerState] = useState({ isOpen: false, selectedIndex: 0 });

  // Temporary preview font while selector is open.
  // This lets users see the highlighted font before committing with Enter.
  const [fontPreviewKey, setFontPreviewKey] = useState(null);

  // Input DOM ref.
  // Restore terminal focus after command execution and container clicks.
  const inputRef = useRef(null);

  // Bottom sentinel ref in output list.
  // Auto-scroll to latest output whenever lines change.
  const endOfLinesRef = useRef(null);

  // Focus the input whenever processing state changes.
  // Keep keyboard-first terminal flow without extra clicks.
  useEffect(() => {
    inputRef.current?.focus();
  }, [isProcessing]);

  // Scroll to newest line after output updates.
  // Always keep the latest terminal response visible.
  useEffect(() => {
    endOfLinesRef.current?.scrollIntoView();
  }, [lines]);

  // Persist favorites to localStorage on change.
  // Keep favorites durable across page reloads.
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("terminalFavorites", JSON.stringify(favorites));
    }
  }, [favorites]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TERMINAL_FONT_STORAGE_KEY, terminalFontKey);
    }
  }, [terminalFontKey]);

  // Keep preview font synchronized with selector cursor while open.
  // Closing selector clears preview and reverts to saved font unless Enter committed a new one.
  useEffect(() => {
    if (!fontPickerState.isOpen) {
      setFontPreviewKey(null);
      return;
    }

    const previewFont = TERMINAL_FONT_OPTIONS[fontPickerState.selectedIndex];
    if (previewFont) {
      setFontPreviewKey(previewFont.key);
    }
  }, [fontPickerState.isOpen, fontPickerState.selectedIndex]);

  // Utility to append one or many output lines.
  // Centralize output updates in a single helper.
  const addLines = (newLines) => setLines((prev) => [...prev, ...newLines]);

  // Typewriter printer factory bound to this component's state setters.
  // Reuse modular animation logic with local state context.
  const typeLines = createTypeLines({ setLines, setIsProcessing });

  // Command processor factory wired to APIs, state setters, and render helpers.
  // Keep command switch logic modular while exposing only needed dependencies.
  const processCommand = createTerminalCommandProcessor({
    api: terminalApi,
    typeLines,
    displayVolume: (volumeData) => renderVolumeData({ volumeData, typeLines }),
    displayVolumeScrambled: (volumeData) =>
      renderVolumeDataScrambled({
        volumeData,
        typeLines,
        addLines,
        setLines,
      }),
    addLines,
    setLines,
    setTheme,
    setFavorites,
    favorites,
    setScrambleData,
    toggleFullScreen,
    themes: THEMES,
    terminalFonts: TERMINAL_FONT_OPTIONS,
    terminalFontKey,
    setTerminalFontKey,
    setFontPickerState,
    setIsProcessing,
  });

  // Handles Enter key submission for terminal commands.
  // Mirror classic terminal behavior (echo command, execute, clear input).
  const handleKeyDown = (e) => {
    // Keyboard navigation mode for font picker.
    if (fontPickerState.isOpen && !isProcessing) {
      const totalFonts = TERMINAL_FONT_OPTIONS.length;
      if (totalFonts === 0) {
        setFontPickerState({ isOpen: false, selectedIndex: 0 });
        return;
      }

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const direction = e.key === "ArrowUp" ? -1 : 1;
        setFontPickerState((prev) => {
          const nextIndex = (prev.selectedIndex + direction + totalFonts) % totalFonts;
          return { ...prev, selectedIndex: nextIndex };
        });
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const normalizedIndex = Math.max(0, Math.min(fontPickerState.selectedIndex, totalFonts - 1));
        const selectedFont = TERMINAL_FONT_OPTIONS[normalizedIndex];
        if (selectedFont) {
          setTerminalFontKey(selectedFont.key);
          addLines([
            { text: `Terminal font set to '${selectedFont.name}'.`, type: "system" },
            { text: "This preference is saved locally and will persist across sessions.", type: "info" },
          ]);
        }
        setFontPickerState((prev) => ({ ...prev, isOpen: false, selectedIndex: normalizedIndex }));
        setInput("");
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setFontPickerState((prev) => ({ ...prev, isOpen: false }));
        addLines([{ text: "Font selection canceled.", type: "info" }]);
        return;
      }
    }

    if (e.key === "Enter" && !isProcessing) {
      const command = input.trim();

      // Echo user command into output history.
      // Preserve command trail for terminal readability.
      addLines([{ text: `> ${command}`, type: "user" }]);

      // Fire command processing async.
      // Keep key handler synchronous and avoid unhandled promise lint noise.
      void processCommand(command);

      // Reset input for next command.
      // Fast command chaining UX.
      setInput("");
    }
  };

  // Resolve active theme object with default fallback.
  // Prevent crashes if an unknown theme key is encountered.
  const currentTheme = THEMES[theme] || THEMES.default;
  const activeTerminalFontKey = fontPreviewKey || terminalFontKey;
  const currentFont =
    TERMINAL_FONT_OPTIONS.find((font) => font.key === activeTerminalFontKey) ||
    TERMINAL_FONT_OPTIONS.find((font) => font.key === DEFAULT_TERMINAL_FONT_KEY) ||
    TERMINAL_FONT_OPTIONS[0];
  const fontPickerIndex =
    TERMINAL_FONT_OPTIONS.length > 0
      ? Math.max(0, Math.min(fontPickerState.selectedIndex, TERMINAL_FONT_OPTIONS.length - 1))
      : 0;
  const terminalFontFamily = currentFont?.family;

  // Render terminal shell (output pane + prompt input).
  // Deliver classic terminal layout with modular behavior under the hood.
  return (
    <div
      className={`w-full h-full p-2 text-sm md:text-xs bg-black/90 rounded-lg overflow-hidden border border-white/10`}
      onClick={() => inputRef.current?.focus()}
      style={{ fontFamily: terminalFontFamily }}
    >
      {/* Scrollable output history region. */}
      {/* Keep command/output timeline readable and vertically navigable. */}
      <div className="overflow-y-auto h-full custom-scrollbar">
        {/* Render each terminal line with style based on line type. */}
        {/* Support system/info/user/error/scrambling visual distinctions. */}
        {lines.map((line, index) => {
          const lineStyle = currentTheme[line.type] || currentTheme.info;

          // Preserve visual spacing for intentionally blank lines.
          // Keep output formatting consistent with terminal-like spacing.
          const displayText = line.text.trim() === "" ? "\u00A0" : line.text;

          // Special render path for lines animated by TextScramble.
          // Expose stable DOM target via data-line-index for scramble engine.
          if (line.type === "scrambling") {
            return (
              <div key={index} className="flex">
                <pre
                  className={`whitespace-pre-wrap leading-relaxed ${currentTheme.greentext}`}
                  data-line-index={index}
                  style={{ fontFamily: terminalFontFamily }}
                >
                  {displayText}
                </pre>
              </div>
            );
          }

          // Default line renderer, plus optional typing cursor while animating.
          // Recreate real-time terminal typing feel.
          return (
            <div key={index} className="flex">
              <pre
                className={`whitespace-pre-wrap leading-relaxed ${lineStyle}`}
                style={{ fontFamily: terminalFontFamily }}
              >
                {displayText}
              </pre>
              {line.isTyping && <span className={`blinking-cursor ${currentTheme.cursor}`}>▋</span>}
            </div>
          );
        })}

        {/* Optional standalone scramble phrase animation block. */}
        {/* Support VOIDZ intro sequence independent from normal line rendering. */}
        {scrambleData && (
          <ScrambleOutput
            key={scrambleData.key}
            phrases={scrambleData.phrases}
            onComplete={() => setScrambleData(null)}
            fontFamily={terminalFontFamily}
          />
        )}

        {fontPickerState.isOpen && (
          <div className="mt-2 p-2 rounded border border-white/20 bg-black/50">
            <pre className={`whitespace-pre-wrap leading-relaxed ${currentTheme.system}`}>--- Font Selector ---</pre>
            <pre className={`whitespace-pre-wrap leading-relaxed ${currentTheme.info}`}>
              Use Arrow Up/Down to move (live preview), Enter to select, Esc to cancel.
            </pre>
            {TERMINAL_FONT_OPTIONS.map((font, index) => {
              const isCursor = index === fontPickerIndex;
              const isActivePreview = font.key === activeTerminalFontKey;
              const isSaved = font.key === terminalFontKey;

              const suffix = isActivePreview && !isSaved ? " (active preview)" : isSaved ? " (saved)" : "";
              const rowText = `${isCursor ? ">" : " "} ${font.name}${suffix}`;

              return (
                <div key={font.key} className="flex">
                  <pre
                    className={`whitespace-pre-wrap leading-relaxed ${isCursor ? currentTheme.system : currentTheme.info}`}
                    style={{ fontFamily: font.family }}
                  >
                    {rowText}
                  </pre>
                </div>
              );
            })}
          </div>
        )}

        {/* Invisible anchor used by auto-scroll effect. */}
        {/* Scroll to newest output reliably without manual scroll math. */}
        <div ref={endOfLinesRef} />
      </div>

      {/* Terminal prompt input row. */}
      {/* Collect commands and route them to the processor. */}
      <div className="flex mt-2">
        <span className={`mr-2 ${currentTheme.system}`}>$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          className={`flex-1 bg-transparent border-none outline-none ${currentTheme.user}`}
          style={{ fontFamily: terminalFontFamily }}
          autoFocus
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export default Terminal;
