import Widget from "../ui/Widget";

const TopProductsWidget = ({ products, loading }) => {
  const displayProducts = products || [];

  return (
    <Widget title="Top Collectibles by Units Acquired">
      {loading ? (
        <p className="text-sm text-text-tertiary">Loading...</p>
      ) : (
        <ul className="dash-rows -my-2">
          {displayProducts.map((product, index) => (
            <li key={product.name} className="flex items-center gap-3 py-2 text-sm">
              <span className="w-5 text-[11px] text-text-secondary tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              <span className="flex-1 truncate text-text-main">{product.name}</span>
              <span className="dash-value">{product.units}</span>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
};

export default TopProductsWidget;
