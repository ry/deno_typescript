extern crate deno;
extern crate proc_macro;
extern crate quote;
extern crate syn;

use deno::js_check;
use deno::Isolate;
use deno::StartupData;
use proc_macro2::Literal;
use proc_macro2::TokenTree;
use proc_macro2::{Punct, Spacing, Span, TokenStream};
use quote::{ToTokens, TokenStreamExt};

struct ByteString<'a>(&'a [u8]);

impl ToTokens for ByteString<'_> {
  fn to_tokens(&self, tokens: &mut proc_macro2::TokenStream) {
    let lit = TokenTree::Literal(Literal::byte_string(self.0));
    tokens.append(lit);
  }
}

#[proc_macro_attribute]
pub fn snapshot(
  attr: proc_macro::TokenStream,
  item: proc_macro::TokenStream,
) -> proc_macro::TokenStream {
  let function = syn::parse_macro_input!(item as syn::ItemFn);
  let js_filename = syn::parse_macro_input!(attr as syn::LitStr).value();

  let name = &function.ident;
  println!("js_filename: {}", js_filename);
  println!("name: {}", name);
  // println!("attr: \"{}\"", attr.to_string());
  // println!("item: \"{}\"", item.to_string());

  let js_source =
    std::fs::read(&js_filename).expect("couldn't read js_filename");
  let js_source_str = std::str::from_utf8(&js_source).unwrap();

  let will_snapshot = true;
  let mut isolate = Isolate::new(StartupData::None, will_snapshot);

  println!("executing javascript {}", js_filename);
  js_check(isolate.execute(&js_filename, js_source_str));

  println!("creating snapshot {}", js_filename);
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
