#!/usr/bin/env bash
set -xv
./compile.sh
babel test.es6.js --out-file test.js --source-maps
node test.js
