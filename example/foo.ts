function add(x: number, y: number): number {
  // foo
  return x + y;
}

const window = (0, eval)("this");
const core = window.Deno.core as DenoCore;

function printHello(): void {
  core.print("hello\n");
}
