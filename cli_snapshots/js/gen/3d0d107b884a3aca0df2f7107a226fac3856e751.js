// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { assertEquals as prettyAssertEqual } from "./pretty.ts";
export class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
}
export function equal(c, d) {
  const seen = new Map();
  return (function compare(a, b) {
    if (a && a instanceof Set && b && b instanceof Set) {
      if (a.size !== b.size) {
        return false;
      }
      for (const item of b) {
        if (!a.has(item)) {
          return false;
        }
      }
      return true;
    }
    // Have to render RegExp & Date for string comparison
    // unless it's mistreated as object
    if (
      a &&
      b &&
      ((a instanceof RegExp && b instanceof RegExp) ||
        (a instanceof Date && b instanceof Date))
    ) {
      return String(a) === String(b);
    }
    if (Object.is(a, b)) {
      return true;
    }
    if (a && typeof a === "object" && b && typeof b === "object") {
      if (seen.get(a) === b) {
        return true;
      }
      if (Object.keys(a || {}).length !== Object.keys(b || {}).length) {
        return false;
      }
      const merged = { ...a, ...b };
      for (const key in merged) {
        if (!compare(a && a[key], b && b[key])) {
          return false;
        }
      }
      seen.set(a, b);
      return true;
    }
    return false;
  })(c, d);
}
/** Make an assertion, if not `true`, then throw. */
export function assert(expr, msg = "") {
  if (!expr) {
    throw new AssertionError(msg);
  }
}
/**
 * Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw.
 */
export function assertEquals(actual, expected, msg) {
  prettyAssertEqual(actual, expected, msg);
}
/**
 * Make an assertion that `actual` and `expected` are not equal, deeply.
 * If not then throw.
 */
export function assertNotEquals(actual, expected, msg) {
  if (!equal(actual, expected)) {
    return;
  }
  let actualString;
  let expectedString;
  try {
    actualString = String(actual);
  } catch (e) {
    actualString = "[Cannot display]";
  }
  try {
    expectedString = String(expected);
  } catch (e) {
    expectedString = "[Cannot display]";
  }
  console.error(
    "Not Equals failed. actual =",
    actualString,
    "expected =",
    expectedString
  );
  if (!msg) {
    msg = `actual: ${actualString} expected: ${expectedString}`;
  }
  throw new AssertionError(msg);
}
/**
 * Make an assertion that `actual` and `expected` are strictly equal.  If
 * not then throw.
 */
export function assertStrictEq(actual, expected, msg) {
  if (actual !== expected) {
    let actualString;
    let expectedString;
    try {
      actualString = String(actual);
    } catch (e) {
      actualString = "[Cannot display]";
    }
    try {
      expectedString = String(expected);
    } catch (e) {
      expectedString = "[Cannot display]";
    }
    console.error(
      "strictEqual failed. actual =",
      actualString,
      "expected =",
      expectedString
    );
    if (!msg) {
      msg = `actual: ${actualString} expected: ${expectedString}`;
    }
    throw new AssertionError(msg);
  }
}
/**
 * Make an assertion that actual contains expected. If not
 * then thrown.
 */
export function assertStrContains(actual, expected, msg) {
  if (!actual.includes(expected)) {
    console.error(
      "stringContains failed. actual =",
      actual,
      "not containing ",
      expected
    );
    if (!msg) {
      msg = `actual: "${actual}" expected to contains: "${expected}"`;
    }
    throw new AssertionError(msg);
  }
}
/**
 * Make an assertion that `actual` contains the `expected` values
 * If not then thrown.
 */
export function assertArrayContains(actual, expected, msg) {
  let missing = [];
  for (let i = 0; i < expected.length; i++) {
    let found = false;
    for (let j = 0; j < actual.length; j++) {
      if (equal(expected[i], actual[j])) {
        found = true;
        break;
      }
    }
    if (!found) {
      missing.push(expected[i]);
    }
  }
  if (missing.length === 0) {
    return;
  }
  console.error(
    "assertArrayContains failed. actual=",
    actual,
    "not containing ",
    expected
  );
  if (!msg) {
    msg = `actual: "${actual}" expected to contains: "${expected}"`;
    msg += "\n";
    msg += `missing: ${missing}`;
  }
  throw new AssertionError(msg);
}
/**
 * Make an assertion that `actual` match RegExp `expected`. If not
 * then thrown
 */
export function assertMatch(actual, expected, msg) {
  if (!expected.test(actual)) {
    console.error(
      "stringMatching failed. actual =",
      actual,
      "not matching RegExp ",
      expected
    );
    if (!msg) {
      msg = `actual: "${actual}" expected to match: "${expected}"`;
    }
    throw new AssertionError(msg);
  }
}
/**
 * Forcefully throws a failed assertion
 */
export function fail(msg) {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  assert(false, `Failed assertion${msg ? `: ${msg}` : "."}`);
}
/** Executes a function, expecting it to throw.  If it does not, then it
 * throws.  An error class and a string that should be included in the
 * error message can also be asserted.
 */
export function assertThrows(fn, ErrorClass, msgIncludes = "", msg) {
  let doesThrow = false;
  try {
    fn();
  } catch (e) {
    if (ErrorClass && !(Object.getPrototypeOf(e) === ErrorClass.prototype)) {
      msg = `Expected error to be instance of "${ErrorClass.name}"${
        msg ? `: ${msg}` : "."
      }`;
      throw new AssertionError(msg);
    }
    if (msgIncludes && !e.message.includes(msgIncludes)) {
      msg = `Expected error message to include "${msgIncludes}", but got "${
        e.message
      }"${msg ? `: ${msg}` : "."}`;
      throw new AssertionError(msg);
    }
    doesThrow = true;
  }
  if (!doesThrow) {
    msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
    throw new AssertionError(msg);
  }
}
export async function assertThrowsAsync(fn, ErrorClass, msgIncludes = "", msg) {
  let doesThrow = false;
  try {
    await fn();
  } catch (e) {
    if (ErrorClass && !(Object.getPrototypeOf(e) === ErrorClass.prototype)) {
      msg = `Expected error to be instance of "${ErrorClass.name}"${
        msg ? `: ${msg}` : "."
      }`;
      throw new AssertionError(msg);
    }
    if (msgIncludes && !e.message.includes(msgIncludes)) {
      msg = `Expected error message to include "${msgIncludes}", but got "${
        e.message
      }"${msg ? `: ${msg}` : "."}`;
      throw new AssertionError(msg);
    }
    doesThrow = true;
  }
  if (!doesThrow) {
    msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
    throw new AssertionError(msg);
  }
}
/** Use this to stub out methods that will throw when invoked. */
export function unimplemented(msg) {
  throw new AssertionError(msg || "unimplemented");
}
/** Use this to assert unreachable code. */
export function unreachable() {
  throw new AssertionError("unreachable");
}
//# sourceMappingURL=asserts.js.map
