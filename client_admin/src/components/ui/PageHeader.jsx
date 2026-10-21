// A standard header for every page with optional right-side actions
const PageHeader = ({ title, subtitle, className = "", compact = true, actions = null }) => {
  const base = compact ? "mt-1 mb-0" : "mt-2 mb-2";
  return (
    <div className={`${base} pl-3 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-text-main leading-tight tracking-tight">{title}</h1>
            {subtitle && <p className="text-text-secondary mt-0.5 text-xs md:text-sm leading-snug">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex-shrink-0 pr-3 pt-0.5">{actions}</div>}
      </div>
    </div>
  );
};
export default PageHeader;
