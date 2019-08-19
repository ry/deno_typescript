use std::env;
use std::path::PathBuf;

fn main() {
  // deno_typescript::trace_serializer();

  let c = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").unwrap());
  let root_names = vec![c.join("js/main.ts")];
  /*
  let state = deno_typescript::compile(root_names).unwrap();
  deno_typescript::mksnapshot("SNAPSHOT", state).unwrap();
  */

  let o = PathBuf::from(env::var_os("OUT_DIR").unwrap());
  let bundle = o.join("CLI_SNAPSHOT.js");

  let state = deno_typescript::compile_bundle(&bundle, root_names).unwrap();
  assert!(bundle.exists());
  deno_typescript::mksnapshot_bundle(&bundle, "CLI_SNAPSHOT", state).unwrap();
}
