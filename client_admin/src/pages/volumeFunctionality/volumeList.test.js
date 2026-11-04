import assert from "node:assert/strict";
import test from "node:test";
import { upsertVolume } from "./volumeList.js";

test("replaces a saved volume in place and appends new ones", () => {
  const list = [{ _id: "a", title: "A" }, { _id: "b", title: "B" }];
  assert.deepEqual(upsertVolume(list, { _id: "a", title: "A2" }).map((v) => v.title), ["A2", "B"]);
  assert.deepEqual(upsertVolume(list, { _id: "c", title: "C" }).map((v) => v._id), ["a", "b", "c"]);
  assert.equal(list[0].title, "A");
});
