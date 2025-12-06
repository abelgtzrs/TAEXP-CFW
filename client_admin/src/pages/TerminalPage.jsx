import { useState } from "react";
import Terminal from "../components/Terminal";

const TerminalPage = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {!isFullScreen && (
        <h1 className="text-2xl font-bold text-primary mb-4">
          Public Terminal Viewer
        </h1>
      )}
      <div
        className={`${
          isFullScreen
            ? "fixed inset-0 z-[9999] bg-black p-0 w-screen h-screen"
            : "flex-1 min-h-0 bg-black/50 rounded-xl border border-white/10 p-1 shadow-2xl"
        }`}
      >
        <Terminal toggleFullScreen={() => setIsFullScreen(!isFullScreen)} />
      </div>
    </div>
  );
};

export default TerminalPage;
