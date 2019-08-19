use deno::Isolate;
use deno::StartupData;

pub fn isolate() -> Isolate {
  let snapshot = StartupData::Snapshot(include_bytes!(env!("CLI_SNAPSHOT")));
  Isolate::new(snapshot, false)
}

#[test]
fn cli_snapshot() {
  let mut isolate = isolate();
  deno::js_check(isolate.execute(
    "<anon>",
    r#"
      if (!window) {
        throw Error("bad");
      }
      console.log("we have console.log!!!");
    "#,
  ));
}
