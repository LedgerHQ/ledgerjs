#!/bin/bash

set -e

cd ../..
PATH=$(yarn bin):$PATH
cd -
export NODE_ENV=production
BABEL_ENV=cjs babel --source-maps --watch -d lib src --config-file ../../babel.config.js &
flow-copy-source -v src lib  -w &
BABEL_ENV=es babel --source-maps --watch -d lib-es src --config-file ../../babel.config.js &
flow-copy-source -v src lib-es -w
