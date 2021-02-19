#!/bin/bash
# Exit on first error
set -ex

# Bring the test network down
pushd ../test-network
./network.sh down
popd

# clean out any old identites in the wallets
rm -rf javascript/clientNode/wallet/*
rm -rf javascript/storageServer/wallet/*

# Clean old downloads
rm -rf javascript/clientNode/model/downloadedWeights/*
