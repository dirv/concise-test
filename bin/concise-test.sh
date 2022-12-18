#!/usr/bin/env bash

dir="$(dirname "$(realpath "$0")")"
node --loader $dir/../src/loader.mjs $dir/../src/cli.mjs $@

