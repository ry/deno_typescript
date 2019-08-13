extern crate deno;
extern crate proc_macro;
extern crate quote;
extern crate serde;
extern crate serde_json;
extern crate syn;

mod ops;

use deno::js_check;
use deno::ErrBox;
use deno::Isolate;
use deno::StartupData;
use deno_snapshot::make_snapshot;
use proc_macro2::Literal;
use proc_macro2::TokenTree;
use quote::ToTokens;
use quote::TokenStreamExt;
use std::path::PathBuf;
use syn::parse::{Parse, ParseStream};
use syn::{parse_macro_input, Ident, Token};

make_snapshot!(TS_SNAPSHOT, "src/typescript.js", "src/main.js");

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

fn new_isolate() -> Isolate {
  let mut isolate = Isolate::new(StartupData::Snapshot(TS_SNAPSHOT), false);
  isolate.set_dispatch(move |op_id, control_buf, _zero_copy_buf| {
    println!("op_id {}", op_id);

    match op_id {
      49 => ops::get_souce_file(control_buf),
      _ => unreachable!(),
    }
  });
  isolate
}

fn compile_typescript(
  isolate: &mut Isolate,
  filename: &str,
) -> Result<(), ErrBox> {
  isolate.execute("<anon>", &format!("main({:?})", filename))?;
  Ok(())
}

// It would be nice to have snapshot!() be used as an expression instead of a
// proc_macro_attribute, but currently function proc macros cannot output
// expressions.
#[proc_macro]
pub fn make_ts_snapshot(
  item: proc_macro::TokenStream,
) -> proc_macro::TokenStream {
  let args = parse_macro_input!(item as SnapshotArgs);

  let name = args.ident;

  let mut ts_isolate = new_isolate();

  let runtime_isolate = Isolate::new(StartupData::None, true);

  let cargo_manifest_dir = PathBuf::from(
    std::env::var_os("CARGO_MANIFEST_DIR")
      .expect("CARGO_MANIFEST_DIR env var not set"),
  );

  for filename in args.filenames {
    let js_filename = filename.value();
    let js_path = cargo_manifest_dir.join(&js_filename);
    let js_path_str = js_path.to_str().unwrap();
    // TODO emit will be called, add these files to the runtime_isolate.
    js_check(compile_typescript(&mut ts_isolate, js_path_str));
  }

  println!("creating snapshot ");
  let snapshot = runtime_isolate.snapshot().expect("error snapshotting");

  let snapshot_slice =
    unsafe { std::slice::from_raw_parts(snapshot.data_ptr, snapshot.data_len) };

  println!("created snapshot {} bytes", snapshot_slice.len());

  let byte_string = ByteString(snapshot_slice);

  let tokens = quote::quote! {
      static #name: &[u8] = #byte_string;
      // static foo__##name: &[u8] = include_bytes!(#js_filename_);
  };
  tokens.into()
}

#[cfg(test)]
mod tests {
  use super::*;
  #[test]
  fn test_compile_typescript() {
    let mut isolate = new_isolate();
    js_check(compile_typescript(&mut isolate, "src/bundle.ts"));
  }
}
