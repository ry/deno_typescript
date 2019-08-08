extern crate deno;
extern crate proc_macro;
extern crate quote;
extern crate syn;

use deno::js_check;
use deno::Isolate;
use deno::StartupData;
use proc_macro2::Literal;
use proc_macro2::TokenTree;
use quote::ToTokens;
use quote::TokenStreamExt;
use std::path::PathBuf;

struct ByteString<'a>(&'a [u8]);

impl ToTokens for ByteString<'_> {
  fn to_tokens(&self, tokens: &mut proc_macro2::TokenStream) {
    let lit = TokenTree::Literal(Literal::byte_string(self.0));
    tokens.append(lit);
  }
}

// It would be nice to have snapshot!() be used as an expression instead of a
// proc_macro_attribute, but currently function proc macros cannot output
// expressions.
#[proc_macro_attribute]
pub fn snapshot(
  attr: proc_macro::TokenStream,
  item: proc_macro::TokenStream,
) -> proc_macro::TokenStream {
  let function = syn::parse_macro_input!(item as syn::ItemFn);
  let js_filename = syn::parse_macro_input!(attr as syn::LitStr).value();

  // This could allow us to use relative paths... but it's unstable.
  // let source_file = Span::call_site().source_file();
  // println!("source_file: {}", source_file);
  let cargo_manifest_dir = PathBuf::from(
    std::env::var_os("CARGO_MANIFEST_DIR")
      .expect("CARGO_MANIFEST_DIR env var not set"),
  );
  let js_path = cargo_manifest_dir.join(&js_filename);

  let name = &function.ident;
  println!("js_filename: {}", js_filename);
  println!("name: {}", name);
  // println!("attr: \"{}\"", attr.to_string());
  // println!("item: \"{}\"", item.to_string());

  let js_source = std::fs::read(&js_path).expect("couldn't read js_filename");

  // cargo:rerun-if-changed doesn't work....
  // println!("cargo:rerun-if-changed={}", js_path.display());

  let js_source_str = std::str::from_utf8(&js_source).unwrap();

  let will_snapshot = true;
  let mut isolate = Isolate::new(StartupData::None, will_snapshot);

  println!("executing javascript {}", js_path.display());
  js_check(isolate.execute(&js_filename, js_source_str));

  println!("creating snapshot {}", js_path.display());
  let snapshot = isolate.snapshot().expect("error snapshotting");

  let snapshot_slice =
    unsafe { std::slice::from_raw_parts(snapshot.data_ptr, snapshot.data_len) };

  println!("created snapshot {} bytes", snapshot_slice.len());

  let byte_string = ByteString(snapshot_slice);

  let tokens = quote::quote! {
    fn #name() -> &'static [u8] {
      #byte_string
    }
  };
  tokens.into()
}
