import { test } from "node:test";
import assert from "node:assert/strict";
import { topics } from "../lib/topics";

test("reclamation is only available in the post-mining stage", () => {
  const reclamation = topics.find((topic) => topic.id === "reclaim");

  assert.ok(reclamation);
  assert.deepEqual(reclamation.stages, ["post"]);
  assert.equal(
    topics.some(
      (topic) => topic.id === "reclaim" && topic.stages.includes("active"),
    ),
    false,
  );
});
