fn main() {
  println!("cargo:rerun-if-changed=deno_ts/src/main.js");
  println!("cargo:rerun-if-changed=deno_ts/src/typescript.js");
}
