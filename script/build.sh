#!/bin/bash

set -e

cd ../..
PATH=$(yarn bin):$PATH
cd -
babel --source-maps -d lib src --config-file ../../.babelrc
flow-copy-source -v src lib
