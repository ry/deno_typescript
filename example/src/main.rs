use deno::js_check;
use deno::Isolate;
use deno::StartupData;
use deno_snapshot::snapshot;

#[snapshot("src/bundle.js")]
fn get_snapshot() {}

fn main() {
  let x = get_snapshot();
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
