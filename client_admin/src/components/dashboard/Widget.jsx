const Widget = ({ title, children, className = "" }) => {
  return (
    <div
      className={`widget-container p-2 md:p-2 h-full min-w-0 flex flex-col border rounded-2xl ${className}`}
    >
      {title && (
        <div className="border-b border-white/10 p-3">
          <h3 className="text-sm font-semibold tracking-tight text-text-main">{title}</h3>
        </div>
      )}

      <div className="flex-1 flex flex-col p-2 py-4">{children}</div>
    </div>
  );
};

export default Widget;
