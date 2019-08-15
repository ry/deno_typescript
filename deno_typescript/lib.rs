extern crate deno;
extern crate serde;
extern crate serde_json;

mod ops;

use deno::js_check;
use deno::ErrBox;
use deno::Isolate;
use deno::StartupData;
use std::path::Path;
use std::path::PathBuf;

fn new_isolate() -> Isolate {
  // let mut isolate = Isolate::new(StartupData::Snapshot(TS_SNAPSHOT), false);
  let mut isolate = Isolate::new(StartupData::None, false);
  let typescript_code = include_str!("assets/typescript.js");
  let main_code = include_str!("main.js");
  js_check(isolate.execute("assets/typescript.js", typescript_code));
  js_check(isolate.execute("main.js", main_code));

  isolate.set_dispatch(move |op_id, control_buf, _zero_copy_buf| {
    // println!("op_id {}", op_id);
    match op_id {
      49 => ops::get_souce_file(control_buf),
      50 => ops::exit(control_buf),
      51 => ops::write_file(control_buf),
      _ => unreachable!(),
    }
  });
  isolate
}

fn compile_typescript(
  isolate: &mut Isolate,
  config_json: &serde_json::Value,
  root_names: Vec<PathBuf>,
) -> Result<(), ErrBox> {
  for f in &root_names {
    assert!(f.exists());
    println!("cargo:rerun-if-changed={}", f.display());
  }
  let root_names_json = serde_json::json!(root_names).to_string();
  let source =
    &format!("main({:?}, {})", config_json.to_string(), root_names_json);
  isolate.execute("<anon>", source)?;
  Ok(())
}

pub fn tsc(ts_out_dir: &Path, root_names: Vec<PathBuf>) -> Result<(), ErrBox> {
  let mut ts_isolate = new_isolate();

  let config_json = serde_json::json!({
    "allowJs": true,
    "allowNonTsExtensions": true,
    "checkJs": false,
    "esModuleInterop": true,
    "module": "ESNext",
    "outDir": ts_out_dir,
    "resolveJsonModule": false,
    "sourceMap": true,
    "stripComments": true,
    "target": "ESNext",
    "lib": ["lib.esnext.d.ts", "deno_core.d.ts"]
  });

  // TODO lift js_check to caller?
  js_check(compile_typescript(
    &mut ts_isolate,
    &config_json,
    root_names,
  ));

  Ok(())
}

pub fn mksnapshot(
  ts_out_dir: &Path,
  snapshot_path: &Path,
) -> Result<(), ErrBox> {
  let mut runtime_isolate = Isolate::new(StartupData::None, true);

  for entry in std::fs::read_dir(ts_out_dir)? {
    let entry = entry?;
    let path = entry.path();
    if let Some(ext) = path.extension() {
      if ext == "js" {
        println!("output file: {}", path.display());
        let data = std::fs::read_to_string(&path).unwrap();
        let path_str = path.to_str().unwrap();
        js_check(runtime_isolate.execute(path_str, &data));
      }
    }
  }

  println!("creating snapshot ");
  let snapshot = runtime_isolate.snapshot()?;
  let snapshot_slice =
    unsafe { std::slice::from_raw_parts(snapshot.data_ptr, snapshot.data_len) };
  println!("snapshot bytes {}", snapshot_slice.len());

  std::fs::write(snapshot_path, snapshot_slice)?;
  println!("snapshot path {} ", snapshot_path.display());
  Ok(())
}
