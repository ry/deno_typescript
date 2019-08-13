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
use syn::parse::{Parse, ParseStream};
use syn::{parse_macro_input, Ident, Token};

struct ByteString<'a>(&'a [u8]);

impl ToTokens for ByteString<'_> {
  fn to_tokens(&self, tokens: &mut proc_macro2::TokenStream) {
    let lit = TokenTree::Literal(Literal::byte_string(self.0));
    tokens.append(lit);
  }
}

struct SnapshotArgs {
  ident: Ident,
  filenames: Vec<syn::LitStr>,
}

impl Parse for SnapshotArgs {
  fn parse(input: ParseStream) -> syn::Result<Self> {
    let ident = input.parse()?;
    input.parse::<Token![,]>()?;

    let mut filenames = Vec::new();
    loop {
      let filename = input.parse()?;
      filenames.push(filename);
      let lookahead = input.lookahead1();
      if lookahead.peek(Token![,]) {
        input.parse::<Token![,]>()?;
      } else {
        break;
      }
    }
    //let filename = input.parse()?;
    Ok(SnapshotArgs { ident, filenames })
  }
}

// It would be nice to have snapshot!() be used as an expression instead of a
// proc_macro_attribute, but currently function proc macros cannot output
// expressions.
#[proc_macro]
pub fn make_snapshot(item: proc_macro::TokenStream) -> proc_macro::TokenStream {
  let args = parse_macro_input!(item as SnapshotArgs);

  let name = args.ident;

  let cargo_manifest_dir = PathBuf::from(
    std::env::var_os("CARGO_MANIFEST_DIR")
      .expect("CARGO_MANIFEST_DIR env var not set"),
  );

  let will_snapshot = true;
  let mut isolate = Isolate::new(StartupData::None, will_snapshot);

  for filename in args.filenames {
    let js_filename = filename.value();
    let js_path = cargo_manifest_dir.join(&js_filename);
    let js_source = std::fs::read(&js_path).expect("couldn't read js_filename");
    let js_source_str = std::str::from_utf8(&js_source).unwrap();
    println!("executing javascript {}", js_path.display());
    js_check(isolate.execute(&js_filename, js_source_str));
  }

  println!("creating snapshot ");
  let snapshot = isolate.snapshot().expect("error snapshotting");

  let snapshot_slice =
    unsafe { std::slice::from_raw_parts(snapshot.data_ptr, snapshot.data_len) };

  println!("created snapshot {} bytes", snapshot_slice.len());

  let byte_string = ByteString(snapshot_slice);

  let tokens = quote::quote! {
      static #name: &[u8] = #byte_string;
      // static foo__##name: &[u8] = include_bytes!(#js_filename_);
  };
  // println!("tokens {}", tokens.to_string());
  tokens.into()
}
