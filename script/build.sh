#!/usr/bin/env bash

set -e

cd ../..
PATH=$(yarn bin):$PATH
cd -
export NODE_ENV=production
BABEL_ENV=cjs babel --source-maps -d lib src --config-file ../../babel.config.js
flow-copy-source -v src lib
BABEL_ENV=es babel --source-maps -d lib-es src --config-file ../../babel.config.js
flow-copy-source -v src lib-es
