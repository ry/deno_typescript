use deno::CoreOp;
use deno::Op;
use serde::Deserialize;
use serde_json::json;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GetSourceFile {
  file_name: String,
  language_version: i32,
  should_create_new_source_file: bool,
}

pub fn get_souce_file(control_buf: &[u8]) -> CoreOp {
  let v: GetSourceFile = serde_json::from_slice(control_buf).expect("ok");

  let r = std::fs::read(&v.file_name);
  let js_source = r.unwrap();
  let js_source_str = std::str::from_utf8(&js_source).unwrap();
  let response = json!({ "ok": js_source_str });
  let x = serde_json::to_string(&response).unwrap();
  let vec = x.to_string().into_bytes();
  Op::Sync(vec.into_boxed_slice())
}
