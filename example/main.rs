use deno::js_check;
use deno::Isolate;
use deno::StartupData;

fn main() {
  let x = include_bytes!(env!("SNAPSHOT"));
  assert!(x.len() > 10);

  let mut isolate = Isolate::new(StartupData::Snapshot(x), false);
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
