use deno::js_check;
use deno::Isolate;
use deno::StartupData;
use deno_snapshot::make_snapshot;

make_snapshot!(SNAPSHOT, "src/bundle.js");

fn main() {
  let x = SNAPSHOT;
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
