#!/bin/bash

set -e

cd ../..
PATH=$(yarn bin):$PATH
cd -
babel --source-maps -d lib src --config-file ../../babel.config.json
flow-copy-source -v src lib
