use deno::CoreOp;
use deno::Op;
use serde::Deserialize;
use serde_json::json;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Exit {
  code: i32,
}

pub fn exit(control_buf: &[u8]) -> CoreOp {
  let v: Exit = serde_json::from_slice(control_buf).expect("ok");
  std::process::exit(v.code);
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GetSourceFile {
  file_name: String,
  language_version: Option<i32>,
  should_create_new_source_file: bool,
}

pub fn get_souce_file(control_buf: &[u8]) -> CoreOp {
  let v: GetSourceFile =
    serde_json::from_slice(control_buf).unwrap_or_else(|_| {
      panic!(
        "bad control slice {}",
        std::str::from_utf8(control_buf).unwrap()
      )
    });

  let js_source_str = if !v.file_name.starts_with("$asset$/") {
    std::fs::read_to_string(&v.file_name).unwrap()
  } else {
    let asset = v.file_name.replace("$asset$/", "");
    match asset.as_str() {
      "deno_core.d.ts" => include_str!("deno_core.d.ts").to_string(),
      "lib.esnext.d.ts" => include_str!("lib.esnext.d.ts").to_string(),
      "lib.es2019.d.ts" => include_str!("lib.es2019.d.ts").to_string(),
      "lib.es2018.d.ts" => include_str!("lib.es2018.d.ts").to_string(),
      "lib.es2017.d.ts" => include_str!("lib.es2017.d.ts").to_string(),
      "lib.es2016.d.ts" => include_str!("lib.es2016.d.ts").to_string(),
      "lib.es5.d.ts" => include_str!("lib.es5.d.ts").to_string(),
      "lib.es2015.d.ts" => include_str!("lib.es2015.d.ts").to_string(),
      "lib.es2015.core.d.ts" => {
        include_str!("lib.es2015.core.d.ts").to_string()
      }
      "lib.es2015.collection.d.ts" => {
        include_str!("lib.es2015.collection.d.ts").to_string()
      }
      "lib.es2015.generator.d.ts" => {
        include_str!("lib.es2015.generator.d.ts").to_string()
      }
      "lib.es2015.iterable.d.ts" => {
        include_str!("lib.es2015.iterable.d.ts").to_string()
      }
      "lib.es2015.promise.d.ts" => {
        include_str!("lib.es2015.promise.d.ts").to_string()
      }
      "lib.es2015.symbol.d.ts" => {
        include_str!("lib.es2015.symbol.d.ts").to_string()
      }
      "lib.es2015.proxy.d.ts" => {
        include_str!("lib.es2015.proxy.d.ts").to_string()
      }
      "lib.es2015.symbol.wellknown.d.ts" => {
        include_str!("lib.es2015.symbol.wellknown.d.ts").to_string()
      }
      "lib.es2015.reflect.d.ts" => {
        include_str!("lib.es2015.reflect.d.ts").to_string()
      }
      "lib.es2016.array.include.d.ts" => {
        include_str!("lib.es2016.array.include.d.ts").to_string()
      }
      "lib.es2017.object.d.ts" => {
        include_str!("lib.es2017.object.d.ts").to_string()
      }
      "lib.es2017.sharedmemory.d.ts" => {
        include_str!("lib.es2017.sharedmemory.d.ts").to_string()
      }
      "lib.es2017.string.d.ts" => {
        include_str!("lib.es2017.string.d.ts").to_string()
      }
      "lib.es2017.intl.d.ts" => {
        include_str!("lib.es2017.intl.d.ts").to_string()
      }
      "lib.es2017.typedarrays.d.ts" => {
        include_str!("lib.es2017.typedarrays.d.ts").to_string()
      }
      "lib.es2018.asynciterable.d.ts" => {
        include_str!("lib.es2018.asynciterable.d.ts").to_string()
      }
      "lib.es2018.promise.d.ts" => {
        include_str!("lib.es2018.promise.d.ts").to_string()
      }
      "lib.es2018.regexp.d.ts" => {
        include_str!("lib.es2018.regexp.d.ts").to_string()
      }
      "lib.es2018.intl.d.ts" => {
        include_str!("lib.es2018.intl.d.ts").to_string()
      }
      "lib.es2019.array.d.ts" => {
        include_str!("lib.es2019.array.d.ts").to_string()
      }
      "lib.es2019.object.d.ts" => {
        include_str!("lib.es2019.object.d.ts").to_string()
      }
      "lib.es2019.string.d.ts" => {
        include_str!("lib.es2019.string.d.ts").to_string()
      }
      "lib.es2019.symbol.d.ts" => {
        include_str!("lib.es2019.symbol.d.ts").to_string()
      }
      "lib.esnext.bigint.d.ts" => {
        include_str!("lib.esnext.bigint.d.ts").to_string()
      }
      "lib.esnext.intl.d.ts" => {
        include_str!("lib.esnext.intl.d.ts").to_string()
      }
      _ => panic!("Unknown asset {}", asset),
    }
  };

  let response = json!({ "ok": js_source_str });
  let x = serde_json::to_string(&response).unwrap();
  let vec = x.to_string().into_bytes();
  Op::Sync(vec.into_boxed_slice())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WriteFile {
  file_name: String,
  data: String,
}

pub fn write_file(control_buf: &[u8]) -> CoreOp {
  let v: WriteFile = serde_json::from_slice(control_buf).expect("ok");

  std::fs::write(v.file_name, v.data).expect("Unable to write file");

  let response = json!({ "ok": true });
  let x = serde_json::to_string(&response).unwrap();
  let vec = x.to_string().into_bytes();
  Op::Sync(vec.into_boxed_slice())
}
