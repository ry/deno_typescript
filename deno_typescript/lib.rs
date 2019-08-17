extern crate deno;
extern crate serde;
extern crate serde_json;

mod ops;
use deno::deno_mod;
use deno::js_check;
use deno::ErrBox;
use deno::Isolate;
use deno::ModuleSpecifier;
use deno::StartupData;
pub use ops::EmitResult;
use ops::WrittenFile;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex;

#[derive(Debug)]
pub struct TSState {
  exit_code: i32,
  emit_result: Option<EmitResult>,
  // (url, corresponding_module, source_code)
  written_files: Vec<WrittenFile>,
}

pub struct TSIsolate {
  isolate: Isolate,
  state: Arc<Mutex<TSState>>,
}

impl TSIsolate {
  fn new() -> TSIsolate {
    // let mut isolate = Isolate::new(StartupData::Snapshot(TS_SNAPSHOT), false);
    let mut isolate = Isolate::new(StartupData::None, false);
    let typescript_code = include_str!("assets/typescript.js");
    let main_code = include_str!("compiler_main.js");
    js_check(isolate.execute("assets/typescript.js", typescript_code));
    js_check(isolate.execute("compiler_main.js", main_code));

    let state = Arc::new(Mutex::new(TSState {
      exit_code: 0,
      emit_result: None,
      written_files: Vec::new(),
    }));
    let state_ = state.clone();
    isolate.set_dispatch(move |op_id, control_buf, zero_copy_buf| {
      assert!(zero_copy_buf.is_none()); // zero_copy_buf unused in compiler.
      let mut s = state_.lock().unwrap();
      ops::dispatch_op(&mut s, op_id, control_buf)
    });
    TSIsolate { isolate, state }
  }

  // TODO(ry) Instead of Result<Arc<Mutex<TSState>>, ErrBox>, return something
  // like Result<TSState, ErrBox>. I think it would be nicer if this function
  // consumes TSIsolate.
  fn compile(
    mut self,
    config_json: &serde_json::Value,
    root_names: Vec<String>,
  ) -> Result<Arc<Mutex<TSState>>, ErrBox> {
    let root_names_json = serde_json::json!(root_names).to_string();
    let source =
      &format!("main({:?}, {})", config_json.to_string(), root_names_json);
    self.isolate.execute("<anon>", source)?;
    Ok(self.state.clone())
  }
}

// TODO(ry) Instead of Result<Arc<Mutex<TSState>>, ErrBox>, return something
// like Result<TSState, ErrBox>
pub fn compile(input: &Path) -> Result<Arc<Mutex<TSState>>, ErrBox> {
  let ts_isolate = TSIsolate::new();

  let config_json = serde_json::json!({
    "compilerOptions": {
      "declaration": true,
      "lib": ["esnext"],
      "module": "esnext",
      "target": "esnext",
      "listFiles": true,
      "listEmittedFiles": true,
      // Emit the source alongside the sourcemaps within a single file;
      // requires --inlineSourceMap or --sourceMap to be set.
      // "inlineSources": true,
      "sourceMap": true,
    },
  });
  assert!(input.exists(), "bundle input files missing");

  let root_names = vec![
    input.to_string_lossy().to_string(),
    // TODO(ry) getDefaultLibFileName doesn't work
    "$asset$/lib.deno_core.d.ts".to_string(),
  ];

  // TODO lift js_check to caller?
  let state = js_check(ts_isolate.compile(&config_json, root_names));

  Ok(state)
}

// TODO(ry) Instead of state: Arc<Mutex<TSState>>, take something like state:
// &TSState
pub fn mksnapshot(
  env_var: &str,
  state: Arc<Mutex<TSState>>,
) -> Result<(), ErrBox> {
  let mut runtime_isolate = Isolate::new(StartupData::None, true);
  let mut url2id: HashMap<String, deno_mod> = HashMap::new();
  let mut id2url: HashMap<deno_mod, String> = HashMap::new();

  let state = state.lock().unwrap();

  let main = state.written_files.last().unwrap().module_name.clone();

  for f in state.written_files.iter() {
    if f.url.ends_with(".js") {
      let is_main = f.module_name == main;
      let id =
        js_check(runtime_isolate.mod_new(is_main, &f.url, &f.source_code));
      url2id.insert(f.module_name.clone(), id);
      id2url.insert(id, f.module_name.clone());
    }
  }

  let url2id_ = url2id.clone(); // FIXME
  let mut resolve = move |specifier: &str, referrer: deno_mod| -> deno_mod {
    let referrer_url = id2url.get(&referrer).unwrap();
    let import_url =
      ModuleSpecifier::resolve_import(specifier, referrer_url.as_str())
        .unwrap();
    *url2id_.get(import_url.as_str()).unwrap()
  };

  // Instantiate each module.
  for (_url, id) in url2id.iter() {
    js_check(runtime_isolate.mod_instantiate(*id, &mut resolve));
  }

  // Execute the main module.
  let main_id = url2id.get(main.as_str()).unwrap();
  js_check(runtime_isolate.mod_evaluate(*main_id));

  println!("creating snapshot...");
  let snapshot = runtime_isolate.snapshot()?;
  let snapshot_slice =
    unsafe { std::slice::from_raw_parts(snapshot.data_ptr, snapshot.data_len) };
  println!("snapshot bytes {}", snapshot_slice.len());
  //
  let out_dir = PathBuf::from(std::env::var_os("OUT_DIR").unwrap());
  let snapshot_path = out_dir.join(env_var);

  fs::write(&snapshot_path, snapshot_slice)?;
  println!("snapshot path {} ", snapshot_path.display());
  println!("cargo:rustc-env={}={}", env_var, snapshot_path.display());
  Ok(())
}
