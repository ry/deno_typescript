use std::path::PathBuf;

fn main() {
  let c = PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap());
  let input_path = c.join("foo.ts");

  let s = deno_typescript::compile(&input_path).unwrap();
  deno_typescript::mksnapshot("EXAMPLE2_SNAPSHOT", &s.lock().unwrap()).unwrap();
}
