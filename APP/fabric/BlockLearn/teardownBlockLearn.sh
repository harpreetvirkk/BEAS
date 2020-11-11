#!/bin/bash
# Exit on first error
set -ex

# Bring the test network down
pushd ../test-network
./network.sh down
popd

# clean out any old identites in the wallets
rm -rf javascript/client/wallet/*
rm -rf javascript/server/wallet/*

# Clean old downloads
rm -rf javascript/client/model/downloadedWeights/*
