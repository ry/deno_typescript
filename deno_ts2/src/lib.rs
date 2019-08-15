/*
#[macro_use]
extern crate include_dir;
*/

extern crate deno;
extern crate serde;
extern crate serde_json;

mod ops;

use deno::ErrBox;
use deno::Isolate;
use deno::StartupData;
// use deno_snapshot::make_snapshot;
use std::path::PathBuf;
use std::path::Path;
use deno::js_check;

// make_snapshot!(TS_SNAPSHOT, "src/typescript.js", "src/main.js");

fn new_isolate() -> Isolate {
  // let mut isolate = Isolate::new(StartupData::Snapshot(TS_SNAPSHOT), false);
  let mut isolate = Isolate::new(StartupData::None, false);
  let typescript_code = include_str!("typescript.js");
  let main_code = include_str!("main.js");
  js_check(isolate.execute("typescript.js", typescript_code));
  js_check(isolate.execute("main.js", main_code));

  isolate.set_dispatch(move |op_id, control_buf, _zero_copy_buf| {
    println!("op_id {}", op_id);

    match op_id {
      49 => ops::get_souce_file(control_buf),
      50 => ops::exit(control_buf),
      _ => unreachable!(),
    }
  });
  isolate
}

fn compile_typescript(
  isolate: &mut Isolate,
  filename: &str,
) -> Result<(), ErrBox> {
  isolate.execute("<anon>", &format!("main({:?})", filename))?;
  Ok(())
}

pub fn make_ts_snapshot(out_path: &Path, root_names: Vec<PathBuf>) -> Result<(), ErrBox> {
  let mut ts_isolate = new_isolate();

  let runtime_isolate = Isolate::new(StartupData::None, true);

  for filename in root_names {
    let js_path_str = filename.to_str().unwrap();
    // TODO emit will be called, add these files to the runtime_isolate.
    // TODO lift js_check to caller?
    js_check(compile_typescript(&mut ts_isolate, js_path_str));
  }

  println!("creating snapshot ");
  let snapshot = runtime_isolate.snapshot()?;
  let snapshot_slice =
    unsafe { std::slice::from_raw_parts(snapshot.data_ptr, snapshot.data_len) };
  println!("created snapshot {} bytes", snapshot_slice.len());

  std::fs::write(out_path, snapshot_slice)?;
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  #[test]
  fn test_compile_typescript() {
    let mut isolate = new_isolate();
    js_check(compile_typescript(&mut isolate, "src/bundle.ts"));
  }

  /*
  #[test]
  fn test_make_snapshot() {
    let mut isolate = new_isolate();
    js_check(compile_typescript(&mut isolate, "src/bundle.ts"));
  }
  */
}
