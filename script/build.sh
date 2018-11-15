#!/bin/bash

set -e

cd ../..
PATH=$(yarn bin):$PATH
cd -
babel --config-file ../../babel.config.js --source-maps -d lib src
flow-copy-source -v src lib
