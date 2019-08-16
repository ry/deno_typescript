use std::path::PathBuf;

fn main() {
  let out_dir = PathBuf::from(std::env::var_os("OUT_DIR").unwrap());
  let snapshot_path = out_dir.join("example2-snapshot.bin");
  let c = PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap());
  let input_path = c.join("foo.ts");

  let s = deno_typescript::compile(&out_dir, &input_path).unwrap();
  deno_typescript::mksnapshot(
    "EXAMPLE2_SNAPSHOT",
    &s.lock().unwrap(),
    &snapshot_path,
  )
  .unwrap();
}
