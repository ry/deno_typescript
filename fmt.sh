#!/bin/bash

cargo fmt
prettier --write {example,deno_typescript}/*.{js,ts}
prettier --write cli_snapshots/**/*.{js,ts}
