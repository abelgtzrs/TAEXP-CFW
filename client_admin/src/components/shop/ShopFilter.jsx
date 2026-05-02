const ShopFilter = ({ value, onChange }) => {
  const options = [
    { key: "all", label: "All" },
    { key: "TT", label: "Temu Tokens" },
    { key: "GG", label: "Gatilla Gold" },
    { key: "❤️", label: "Hearts" },
  ];
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            aria-pressed={active}
            className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150"
            style={
              active
                ? { background: "var(--color-primary)", color: "var(--color-bg)" }
                : {
                    background: "transparent",
                    color: "var(--color-text-secondary)",
                    border: "1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)",
                  }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default ShopFilter;
