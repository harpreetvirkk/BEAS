'use strict';

const { Contract } = require('fabric-contract-api');
const util = require('util');

var blockKey = 0;

class BlockLearn extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        // For initialisation, the model is trained using a minimum of 1 datapoint,
        // and the weights are sent to the ledger
        console.info('============= END : Initialize Ledger ===========');
    }

    async createBlock(ctx, weightHash, prevBlockKey, timestamp){
        console.info('============= START : Create Block ===========');
        try{
            const block = {
                weightHash,
                prevBlockKey,
                timestamp
            };
            console.log('New block created:\n');
            console.log(`Block Id : ${blockKey}`);
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
}
module.exports = BlockLearn;