use deno_ts::make_ts_snapshot;
use std::path::PathBuf;

fn main() {
  let out_dir = PathBuf::from(std::env::var_os("OUT_DIR").unwrap());
  let snapshot_path = out_dir.join("example2-snapshot.bin");
  let ts_out_dir = out_dir.join("ts_out");
  if !ts_out_dir.exists() {
    std::fs::create_dir(&ts_out_dir).unwrap();
  }
  let cargo_manifest_dir =
    PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap());

  let roots = vec![cargo_manifest_dir.join("src/bundle.ts")];
  make_ts_snapshot(&ts_out_dir, &snapshot_path, roots)
    .expect("make_ts_snapshot failed");
  println!(
    "cargo:rustc-env=EXAMPLE2_SNAPSHOT={}",
    snapshot_path.display()
  );
}
