'use strict';

var express = require('express');
const FabricCAServices = require('fabric-ca-client');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const { SHA3 } = require('sha3');
const hash = new SHA3(256);
const prettyPrintJson = require('pretty-print-json');
var bodyParser = require('body-parser');
var formidable = require('formidable');
const { PythonShell } = require("python-shell");
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:adminpw@blcluster.krh8q.mongodb.net/BL?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
var Binary = require('mongodb').Binary;
const { Console } = require('console');

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

async function main(){
    try {
        await enrollAdmin();
        await registerClient();
    } catch (error) {
        console.error(`Failed!`);
        process.exit(1);
    }
}

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

async function registerClient(){
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
        const userIdentity = await wallet.get('client');
        if (userIdentity) {
            console.log('An identity for the user "client" already exists in the wallet');
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
            enrollmentID: 'client',
            role: 'client'
        }, adminUser);
        const enrollment = await ca.enroll({
            enrollmentID: 'client',
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

        await wallet.put('client', x509Identity);
        console.log('Successfully registered and enrolled admin user "client" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user "client": ${error}`);
        process.exit(1);
    }
}

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/public/client-dashboard.html'));
});

app.get('/getLedger', async function(request, response) {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname,'..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('client');
        if (!identity) {
            console.log('An identity for the user "client" does not exist in the wallet');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'client', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('BEAS');

        // Get Ledger 
        let ledger = await contract.evaluateTransaction('getLedger');
        // console.log(`Transaction has been evaluated, result is: ${ledger.toString()}`);

        // Disconnect from the gateway.
        await gateway.disconnect();

        let legderData = JSON.parse(ledger.toString());
        let html = prettyPrintJson.toHtml(legderData);
        fs.readFile(__dirname + '/public/viewledger.html', function(err, data) {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.write(data + '<script>document.getElementById("result").innerHTML =`' + html + '`;</script>');
        });
        
    } catch (error) {
        console.error(`Failed!`);
        process.exit(1);
    }
});

app.get('/newBlock', function(request, response) {
    response.sendFile(path.join(__dirname + '/public/newBlock.html'));
});

app.post('/trainNew', async function(request, response) {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname,'..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('client');
        if (!identity) {
            console.log('An identity for the user "client" does not exist in the wallet');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'client', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('BEAS');

        let latestGlobal = await contract.evaluateTransaction('getLatestGlobal');

        let latestGlobalData = JSON.parse(JSON.parse(latestGlobal.toString()));

        // console.log(latestGlobalData.Key);
        var key = latestGlobalData.Key;
        // console.log(key);

        await client.connect();
        const database = client.db("BL");
        const collection = database.collection("WeightFiles");

        var result = await collection.findOne({ blockKey: key.toString() });

        fs.writeFile(path.resolve(__dirname, 'model','downloadedWeights', result.file_name.toString()), result.file_data.buffer, function(err){
                if (err) throw err;
                console.log('Sucessfully saved!');
        });

        try{
            await fs.unlinkSync(path.join(__dirname,'model', 'upload', 'data.csv'));
        } catch (e){}

        var form = await new formidable.IncomingForm({ uploadDir: path.join(__dirname,'model', 'upload') });
        await form.parse(request, function(err, fields, files) {
            if (err)
                throw err; // process error
        });
        await form.on('fileBegin', function(name, file) {
            console.log(file.path);
            console.log(file.type);
        });
        await form.on('file', async function(name, file) {
            fs.rename(file.path, form.uploadDir + "/data.csv", function(error) {
                if (error)
                    throw error; // process error
            });
            console.log('Uploaded ' + file.name);
            var myPythonScriptPath = './model/model.py';
            var pyshell = await new PythonShell(myPythonScriptPath, {args: [key.toString()]});
    
            pyshell.on('message', function(message) {
                console.log(message);
            });
            var blockData;
            pyshell.end( async function(err) {
                if (err) {
                    throw err;
                };
                console.log('finished');
                try {
                    var outputWeightsFile = fs.readFileSync('./output.h5');
                    hash.update(outputWeightsFile);
                    var weightHash = hash.digest('hex');
                    var prevBlockId = key;
                    var blockType = 'L'
            
                    // Submit to Ledger
                    let timestamp = new Date();
            
                    await contract.submitTransaction('createBlock', blockType.toString(), weightHash.toString(), prevBlockId.toString(), timestamp.toString());
                    console.log('Weight Block has been submitted');
    
                    // Get block info
                    let block = await contract.evaluateTransaction('queryLedger', weightHash);
                    blockData = JSON.parse(block.toString());
                    if (blockData == 0){
                        await gateway.disconnect();
                        response.send('Error!');
                    } 
    
                    // Sending File to Mongo
    
                    client.connect(err => {
                        const WFcollection = client.db("BL").collection("WeightFiles");
                        var insert_data = {
                            blockKey : (blockData.Key).toString(),
                            blockType : 'L',
                            file_name : ((blockData.Key).toString()) + '.h5',
                            timestamp : timestamp,
                            file_data : Binary(outputWeightsFile)
                        };
                        WFcollection.insertOne(insert_data, function(err, res) {
                            if (err) throw err;
                            console.log("Weight File inserted to DB!");
                            let html = prettyPrintJson.toHtml(blockData);
                            fs.readFile(__dirname + '/public/submitSuccess.html', function(err, data) {
                            response.writeHead(200, { 'Content-Type': 'text/html' });
                            response.write(data + '<script>document.getElementById("result").innerHTML =`' + html + '`;</script>');
                        });
                        });
                    });
    
                    let latestLocals = await contract.evaluateTransaction('getLatestLocals');
                    let latestLocalsKeys = JSON.parse(latestLocals.toString());
                    console.log(latestLocalsKeys);
                    if (latestLocalsKeys.length % 3 == 0) {
                        //merge
                        var myPythonScriptPath = './model/merge.py';
                        var pyshell = await new PythonShell(myPythonScriptPath, {args: [latestLocalsKeys.toString()]});
                
                        pyshell.on('message', function(message) {
                            console.log(message);
                        });
                        var blockData;
                        pyshell.end( async function(err) {
                            if (err) {
                                throw err;
                            };
                            console.log('finished');

                            var outputWeightsFile = fs.readFileSync('./mergeG/newG.h5');
                            hash.update(outputWeightsFile);
                            var weightHash = hash.digest('hex');
                            var prevBlockId = key; // TODO Fix This <----
                            var blockType = 'G'
                    
                            // Submit to Ledger
                            let timestamp = new Date();
                    
                            await contract.submitTransaction('createBlock', blockType.toString(), weightHash.toString(), prevBlockId.toString(), timestamp.toString());
                            console.log('Global weight Block has been submitted');
            
                            // Get block info
                            let block = await contract.evaluateTransaction('queryLedger', weightHash);
                            blockData = JSON.parse(block.toString());
                            if (blockData == 0){
                                await gateway.disconnect();
                                response.send('Error!');
                            } 
            
                            // Sending File to Mongo
            
                            client.connect(err => {
                                const WFcollection = client.db("BL").collection("WeightFiles");
                                var insert_data = {
                                    blockKey : (blockData.Key).toString(),
                                    blockType : 'G',
                                    file_name : ((blockData.Key).toString()) + '.h5',
                                    timestamp : timestamp,
                                    file_data : Binary(outputWeightsFile)
                                };
                                WFcollection.insertOne(insert_data, function(err, res) {
                                    if (err) throw err;
                                    console.log("Global weight File inserted to DB!");
                                    // let html = prettyPrintJson.toHtml(blockData);
                                    // fs.readFile(__dirname + '/public/submitSuccess.html', function(err, data) {
                                    // response.writeHead(200, { 'Content-Type': 'text/html' });
                                    // response.write(data + '<script>document.getElementById("result").innerHTML =`' + html + '`;</script>');
                                // });
                                });
                            });
                            });
                    };
                } catch (error) {
                    console.error(error);
                    process.exit(1);
                };
            });
        });

        // await gateway.disconnect();

    } catch (error) {
        console.error(error);
        process.exit(1);
    }


    // Get Last Global Block Weights
    // Train on Last Global Block Weights using new data
    // send weights on blockchain
    // if 5 local, merge
});


main();

var server = app.listen(5010, function () {
    var host = 'localhost'
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
});