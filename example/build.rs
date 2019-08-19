fn main() {
  let c =
    std::path::PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap());
  let root_names = vec![c.join("main.ts")];
  let state = deno_typescript::compile(root_names).unwrap();
  deno_typescript::mksnapshot("SNAPSHOT", state).unwrap();
}
