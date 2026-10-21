const assert = require("node:assert/strict");
const test = require("node:test");
const { buildCollectionCompletion, buildPokemonCompletion } = require("./collectionCompletion");

test("collection completion counts unique valid owned items", () => {
  assert.deepEqual(buildCollectionCompletion(["a", "b", "c"], ["a", "a", "missing"]), {
    owned: 1,
    total: 3,
    percentage: 33.3,
  });
});

test("Pokemon completion counts each variant independently", () => {
  const completion = buildPokemonCompletion(
    ["a", "b", "c"],
    [
      { basePokemon: "a", variant: "Normal" },
      { basePokemon: "a", variant: "Normal" },
      { basePokemon: "a", variant: "Shiny" },
      { basePokemon: "b", variant: "Dark" },
    ],
    [{ name: "Dark", slug: "dark" }],
  );

  assert.deepEqual(completion.variants, [
    { name: "Normal", slug: "normal", owned: 1, total: 3, percentage: 33.3 },
    { name: "Shiny", slug: "shiny", owned: 1, total: 3, percentage: 33.3 },
    { name: "Dark", slug: "dark", owned: 1, total: 3, percentage: 33.3 },
  ]);
});
