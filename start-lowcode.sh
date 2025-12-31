#!/bin/bash
cd /Users/rickholland/Downloads/Exprsn
export LOW_CODE_DEV_AUTH=true
export PORT=5001
export NODE_ENV=development
node src/exprsn-svr/index.js
