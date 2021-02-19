'use strict';

const { Contract } = require('fabric-contract-api');
const util = require('util');

var blockKey = 0;

class BEAS extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        // For initialisation, the model is trained using a minimum of 1 datapoint,
        // and the weights are sent to the ledger
        console.info('============= END : Initialize Ledger ===========');
    }

    async createBlock(ctx, blockType, weightHash, prevBlockKey, timestamp){
        console.info('============= START : Create Block ===========');
        try{
            const block = {
                blockType,
                weightHash,
                prevBlockKey,
                timestamp
            };
            console.log('New block created:\n');
            console.log(`Block Id : ${blockKey}`);
            console.log(`Block Type : ${blockType}`);
            console.log(`Prev Block Id : ${prevBlockKey}`);
            console.log(`Weight Hash : ${weightHash}`);
            
            console.log(`Timestamp : ${timestamp}`);
            
            await ctx.stub.putState(blockKey.toString(), Buffer.from(JSON.stringify(block)));
            blockKey += 1;

        } catch (error){
            console.log(`Error creating the block!: ${error}`);
        }
        console.info('============= END : Create Block ===========');
    }

    async getLedger(ctx){
        console.info('============= START : Get Ledger ===========');
        try{
            const startKey = '';
            const endKey = '';
            const allResults = [];
            for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
                const strValue = Buffer.from(value).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                } catch (err) {
                    console.log(err);
                    record = strValue;
                }
                allResults.push({ Key: key, Record: record });
            }
            console.info(allResults);
            return JSON.stringify(allResults);

        } catch (error){
            console.log(`Error getting the block!: ${error}`);
        }
        console.info('============= END : Get Ledger ===========');
    }

    async queryLedger(ctx, wHash){
        console.info('============= START : Q Ledger ===========');
        try{

            const startKey = '';
            const endKey = '';
            const allResults = [];
            for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
                const strValue = Buffer.from(value).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                } catch (err) {
                    console.log(err);
                    record = strValue;
                }
                allResults.push({ Key: key, Record: record });
            }
            for (let i = 0; i<allResults.length; i++ ){
                if (allResults[i].Record.weightHash.toString() == wHash.toString()){
                    return JSON.stringify(allResults[i]);
                }
            }
            return '0';


        } catch (error){
            console.log(`Error getting the block!: ${error}`);
        }
        console.info('============= END : Q Ledger ===========');
    }
    
    async getLatestGlobal(ctx){
        console.info('============= START : Get Latest Global Block ===========');
        try{

            const startKey = '';
            const endKey = '';
            const allResults = [];
            for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
                const strValue = Buffer.from(value).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                } catch (err) {
                    console.log(err);
                    record = strValue;
                }
                allResults.push({ Key: key, Record: record });
            }
            let latestGlobal;
            for (let i = 0; i<allResults.length; i++ ){
                if (allResults[i].Record.blockType.toString() == 'G'){
                    latestGlobal = JSON.stringify(allResults[i]);
                }
            }
            return JSON.stringify(latestGlobal);

        } catch (error){
            console.log(`Error getting the block!: ${error}`);
        }
        console.info('============= END : Get Latest Global Block ===========');
    }

    async getLatestLocals(ctx){
        console.info('============= START : Get Latest Local Blocks ===========');
        try{

            const startKey = '';
            const endKey = '';
            const allResults = [];
            for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
                const strValue = Buffer.from(value).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                } catch (err) {
                    console.log(err);
                    record = strValue;
                }
                allResults.push({ Key: key, Record: record });
            }
            let latestLocals = [];
            for (let i = 0; i<allResults.length; i++ ){
                if (allResults[i].Record.blockType.toString() == 'G'){
                    latestLocals.length = 0;
                } else {
                    latestLocals.push(allResults[i].Key);
                }
            }
            console.log(latestLocals);
            return (latestLocals);

        } catch (error){
            console.log(`Error getting the block!: ${error}`);
        }
        console.info('============= END : Get Latest Local Blocks ===========');
    }
}
module.exports = BEAS;