const window = (0, eval)("this");

import { printHello } from "./print_hello.ts";

function add(x: number, y: number): number {
  return x + y;
}
window.add = add;
window.printHello = printHello;
