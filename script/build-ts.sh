#!/bin/bash

set -e

rollup -c ../../rollup.config.js -n $(node -p "require('./package.json').name")
