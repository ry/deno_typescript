use std::path::PathBuf;

fn main() {
  let c = PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap());
  let s = deno_typescript::compile(&c.join("main.ts")).unwrap();
  deno_typescript::mksnapshot("SNAPSHOT", &s.lock().unwrap()).unwrap();
}
