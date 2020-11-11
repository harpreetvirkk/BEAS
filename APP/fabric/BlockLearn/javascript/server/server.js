'use strict';

var express = require('express');
const FabricCAServices = require('fabric-ca-client');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const { SHA3 } = require('sha3');
const hash = new SHA3(256);
var bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:adminpw@blcluster.krh8q.mongodb.net/BL?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
var Binary = require('mongodb').Binary;

// var app = express()
// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
// app.use(bodyParser.json());

async function enrollAdmin(){
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname,'..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

async function registerServer(){
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname,'..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get('server');
        if (userIdentity) {
            console.log('An identity for the user "server" already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: 'org1.department1',
            enrollmentID: 'server',
            role: 'client'
        }, adminUser);
        const enrollment = await ca.enroll({
            enrollmentID: 'server',
            enrollmentSecret: secret
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('server', x509Identity);
        console.log('Successfully registered and enrolled admin user "server" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user "server": ${error}`);
        process.exit(1);
    }
}

async function loadGenesis(){
    
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname,'..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('server');
        if (!identity) {
            console.log('An identity for the user "server" does not exist in the wallet');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'server', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('BlockLearn');

        // Load genesis block and compute hash of weight file (genesis.h5)
        var genesisWeightsFile = fs.readFileSync('./genesis/genesis.h5');
        hash.update(genesisWeightsFile);
        var weightHash = hash.digest('hex');
        var prevBlockId = -1;

        // Submit to Ledger
        let timestamp = new Date();

        await contract.submitTransaction('createBlock', weightHash.toString(), prevBlockId.toString(), timestamp.toString());
        console.log('Genesis Weight Block has been submitted to the Ledger!');

        // Disconnect from the gateway.
        await gateway.disconnect();

        await client.connect(err => {
            const WFcollection = client.db("BL").collection("WeightFiles");
            WFcollection.drop(function(err, delOK){
                if (err) console.log('Previous Weight Collection does not exist! Creating!');
                if (delOK) console.log("Old Weights deleted from DB!");
            })
            var insert_data = {
                blockKey : (0).toString(),
                file_name : '0.h5',
                timestamp : timestamp,
                file_data : Binary(genesisWeightsFile)
            };
            WFcollection.insertOne(insert_data, function(err, res) {
                if (err) throw err;
                console.log("Genesis Weight File inserted to DB!");
                console.log('Clients can now connect!');
                process.exit(1);
            });
        });

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

async function main(){
    try {
        await enrollAdmin();
        await registerServer();
        await loadGenesis();
        
    } catch (error) {
        console.error(`Failed!`);
        process.exit(1);
    }
}

main();

// var server = app.listen(5050, function () {
//     var host = 'localhost'
//     var port = server.address().port
//     console.log("Example app listening at http://%s:%s", host, port)
// })