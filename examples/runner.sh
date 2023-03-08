#!/bin/bash
THIS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd $THIS_DIR/.. # project root
npm run build
npm link
cd $THIS_DIR/../examples/node.js
npm link node-rules
for i in *.js; do node $i; done;