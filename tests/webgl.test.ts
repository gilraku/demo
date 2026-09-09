import test from "node:test";
import assert from "node:assert/strict";
import { probeWebGL } from "../lib/webgl";

test("retries without antialiasing when default context creation fails", () => {
  const attempts: WebGLContextAttributes[] = [];
  let released = false;
  const canvas = {
    addEventListener() {},
    removeEventListener() {},
    getContext(_kind: string, options: WebGLContextAttributes) {
      attempts.push(options);
      return options.antialias
        ? null
        : {
            getExtension: () => ({
              loseContext() {
                released = true;
              },
            }),
          };
    },
  };
  const result = probeWebGL(canvas as unknown as HTMLCanvasElement);
  assert.equal(result.available, true);
  assert.equal(result.antialias, false);
  assert.equal(attempts.length, 2);
  assert.equal(released, true);
});
test("failed contexts are reported as a browser initialization failure", () => {
  const canvas = {
    addEventListener() {},
    removeEventListener() {},
    getContext() {
      return null;
    },
  };
  const result = probeWebGL(canvas as unknown as HTMLCanvasElement);
  assert.equal(result.available, false);
  assert.match(result.reason, /browser/i);
  assert.doesNotMatch(result.reason, /perangkat.*tidak mendukung/i);
});
