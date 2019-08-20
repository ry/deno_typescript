pub static CLI_SNAPSHOT: &[u8] = include_bytes!(env!("CLI_SNAPSHOT"));
pub static COMPILER_SNAPSHOT: &[u8] = include_bytes!(env!("COMPILER_SNAPSHOT"));

#[test]
fn cli_snapshot() {
  let mut isolate =
    deno::Isolate::new(deno::StartupData::Snapshot(CLI_SNAPSHOT), false);
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

#[test]
fn compiler_snapshot() {
  let mut isolate =
    deno::Isolate::new(deno::StartupData::Snapshot(COMPILER_SNAPSHOT), false);
  deno::js_check(isolate.execute(
    "<anon>",
    r#"
      if (!compilerMain) {
        throw Error("bad");
      }
      console.log(`ts version: ${ts.version}`);
    "#,
  ));
}
