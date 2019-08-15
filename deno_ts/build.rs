fn main() {
  let cwd = std::env::current_dir().unwrap();
  println!(
    "cargo:rerun-if-changed={}",
    cwd.join("src/main.js").display()
  );
  println!(
    "cargo:rerun-if-changed={}",
    cwd.join("src/typescript.js").display()
  );
}
