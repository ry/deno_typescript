use deno::js_check;
use deno::Isolate;
use deno::StartupData;

fn main() {
  let snapshot = StartupData::Snapshot(include_bytes!(env!("SNAPSHOT")));
  let mut isolate = Isolate::new(snapshot, false);
  js_check(isolate.execute(
    "<anon>",
    r#"
      printHello();
      if (add(1, 2) != 3) {
        throw Error("bad");
      } else {
        Deno.core.print('good\n')
      }
    "#,
  ));
}
