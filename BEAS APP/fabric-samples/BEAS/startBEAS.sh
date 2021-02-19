#!/bin/bash
# Exit on first error
set -ex
starttime=$(date +%s)
# Bring the test network down
pushd ../test-network
./network.sh down
popd

# clean out any old identites in the wallets
rm -rf javascript/clientNode/wallet/*
rm -rf javascript/storageServer/wallet/*

# Clean old downloads
rm -rf javascript/clientNode/model/downloadedWeights/*

# Exit on first error
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

CC_SRC_LANGUAGE='javascript' # chaincode runtime language is node.js

CC_SRC_PATH="../chaincode/BEAS/javascript/"

# clean out any old identites in the wallets
rm -rf javascript/wallet/*

# clean the keystore
rm -rf ./hfc-key-store

# launch network; create channel and join peer to channel
pushd ../test-network
./network.sh down
./network.sh up createChannel -ca -s couchdb
./network.sh deployCC -ccn BEAS -ccv 1 -cci initLedger -ccl ${CC_SRC_LANGUAGE} -ccp ${CC_SRC_PATH}
popd

cat <<EOF

Total setup execution time : $(($(date +%s) - starttime)) secs ...
EOF