use deno::js_check;
use deno::Isolate;
use deno::StartupData;
use deno_ts::make_ts_snapshot;

// make_snapshot!(SNAPSHOT, "src/bundle.js");

make_ts_snapshot!(TS_SNAPSHOT, "src/bundle.ts");

fn main() {
  let x = TS_SNAPSHOT;
  assert!(x.len() > 10);

  let mut isolate = Isolate::new(StartupData::Snapshot(x), false);
  js_check(isolate.execute(
    "<anon>",
    r#"
      if (add(1, 2) != 3) {
        throw Error("bad");
      } else {
        Deno.core.print('good\n')
      }
    "#,
  ));
}
