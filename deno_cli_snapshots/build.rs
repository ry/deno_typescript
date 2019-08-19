fn main() {
  let c = std::env::var_os("CARGO_MANIFEST_DIR").unwrap();
  let main = std::path::PathBuf::from(c).join("js/main.ts");
  let state = deno_typescript::compile(&main).unwrap();
  deno_typescript::mksnapshot("SNAPSHOT", state).unwrap();
}
