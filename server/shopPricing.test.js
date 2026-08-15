const assert = require("node:assert/strict");
const { getPullPricing } = require("./shopPricing");

assert.deepEqual(getPullPricing("pokemon"), { quantity: 1, cost: 10 });
assert.deepEqual(getPullPricing("yugioh", 1), { quantity: 1, cost: 2 });
assert.deepEqual(getPullPricing("yugioh", 3), { quantity: 3, cost: 5 });
assert.equal(getPullPricing("yugioh", 2), null);
assert.equal(getPullPricing("yugioh", true), null);
assert.deepEqual(getPullPricing("snoopy"), { quantity: 1, cost: 20 });
assert.deepEqual(getPullPricing("habbo"), { quantity: 1, cost: 20 });
assert.deepEqual(getPullPricing("abelpersona"), { quantity: 1, cost: 30 });

console.log("Shop pricing checks passed.");
