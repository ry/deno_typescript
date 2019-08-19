// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { equal } from "./asserts.ts";
import { red, green, white, gray, bold } from "../colors/mod.ts";
import diff, { DiffType } from "./diff.ts";
import { format } from "./format.ts";
const CAN_NOT_DISPLAY = "[Cannot display]";
function createStr(v) {
  try {
    return format(v);
  } catch (e) {
    return red(CAN_NOT_DISPLAY);
  }
}
function createColor(diffType) {
  switch (diffType) {
    case DiffType.added:
      return s => green(bold(s));
    case DiffType.removed:
      return s => red(bold(s));
    default:
      return white;
  }
}
function createSign(diffType) {
  switch (diffType) {
    case DiffType.added:
      return "+   ";
    case DiffType.removed:
      return "-   ";
    default:
      return "    ";
  }
}
function buildMessage(diffResult) {
  const messages = [];
  messages.push("");
  messages.push("");
  messages.push(
    `    ${gray(bold("[Diff]"))} ${red(bold("Left"))} / ${green(bold("Right"))}`
  );
  messages.push("");
  messages.push("");
  diffResult.forEach(result => {
    const c = createColor(result.type);
    messages.push(c(`${createSign(result.type)}${result.value}`));
  });
  messages.push("");
  return messages;
}
export function assertEquals(actual, expected, msg) {
  if (equal(actual, expected)) {
    return;
  }
  let message = "";
  const actualString = createStr(actual);
  const expectedString = createStr(expected);
  try {
    const diffResult = diff(
      actualString.split("\n"),
      expectedString.split("\n")
    );
    message = buildMessage(diffResult).join("\n");
  } catch (e) {
    message = `\n${red(CAN_NOT_DISPLAY)} + \n\n`;
  }
  if (msg) {
    message = msg;
  }
  throw new Error(message);
}
//# sourceMappingURL=pretty.js.map
