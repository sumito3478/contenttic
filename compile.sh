#!/usr/bin/env bash
set -xv
babel gulpfile.es6.js --out-file gulpfile.js --source-maps
gulp compile
