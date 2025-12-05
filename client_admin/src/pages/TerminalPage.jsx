import Terminal from "../components/Terminal";

const TerminalPage = () => {
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold text-primary mb-4">Public Terminal Viewer</h1>
      <div className="flex-1 min-h-0 bg-black/50 rounded-xl border border-white/10 p-1 shadow-2xl">
        <Terminal />
      </div>
    </div>
  );
};

export default TerminalPage;
