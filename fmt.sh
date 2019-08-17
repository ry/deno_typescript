#!/bin/bash

prettier --write {example,deno_typescript}/*.{js,ts,d.ts}
cargo fmt
