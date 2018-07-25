#!/bin/bash

set -e

cd ../..
PATH=$(yarn bin):$PATH
cd -
babel --watch --source-maps -d lib src &
flow-copy-source -w -v src lib
