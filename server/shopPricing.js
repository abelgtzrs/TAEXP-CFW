const SHOP_PRICES = Object.freeze({
  pokemon: 10,
  yugioh: 2,
  snoopy: 20,
  habbo: 20,
  abelpersona: 30,
});

const getPullPricing = (category, requestedQuantity) => {
  if (!Object.hasOwn(SHOP_PRICES, category)) return null;
  if (category !== "yugioh") return { quantity: 1, cost: SHOP_PRICES[category] };

  if (requestedQuantity !== undefined && !["number", "string"].includes(typeof requestedQuantity)) return null;
  const quantity = requestedQuantity === undefined ? 1 : Number(requestedQuantity);
  if (quantity === 1) return { quantity, cost: SHOP_PRICES.yugioh };
  if (quantity === 3) return { quantity, cost: 5 };
  return null;
};

module.exports = { SHOP_PRICES, getPullPricing };
