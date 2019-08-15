use deno_ts2::make_ts_snapshot;
use std::path::PathBuf;

fn main() {
  let snapshot_path = PathBuf::from(
    std::env::var_os("OUT_DIR").expect("OUT_DIR env var not set"),
  )
  .join("example2-snapshot.bin");
  let cargo_manifest_dir = PathBuf::from(
    std::env::var_os("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set"),
  );
  let roots = vec![cargo_manifest_dir.join("src/bundle.ts")];
  make_ts_snapshot(&snapshot_path, roots).expect("make_ts_snapshot failed");
  println!(
    "cargo:rustc-env=EXAMPLE2_SNAPSHOT={}",
    snapshot_path.display()
  );
}

// make_snapshot!(SNAPSHOT, "src/bundle.js");
