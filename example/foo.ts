const window = (0, eval)("this");

// const core = window.Deno.core as DenoCore;

import { printHello } from "./print_hello.ts";

function add(x: number, y: number): number {
  return x + y;
}
window.add = add;
window.printHello = printHello;

printHello();
