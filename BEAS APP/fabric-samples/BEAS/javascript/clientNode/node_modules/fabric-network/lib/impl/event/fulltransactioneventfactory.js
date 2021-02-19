"use strict";
/*
 * Copyright 2020 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.newFullTransactionEvent = exports.getTransactionEnvelopeIndexes = void 0;
const fabproto6 = require("fabric-protos");
const gatewayutils_1 = require("../gatewayutils");
const fullcontracteventfactory_1 = require("./fullcontracteventfactory");
const TransactionStatus = require("./transactionstatus");
function getTransactionEnvelopeIndexes(blockData) {
    const txEnvelopeIndexes = [];
    if (blockData.data) {
        const envelopes = blockData.data.data || [];
        envelopes.forEach((envelope, index) => {
            if (isTransactionPayload(envelope.payload)) {
                txEnvelopeIndexes.push(index);
            }
        });
    }
    return txEnvelopeIndexes;
}
exports.getTransactionEnvelopeIndexes = getTransactionEnvelopeIndexes;
function isTransactionPayload(payload) {
    return payload.header.channel_header.type === fabproto6.common.HeaderType.ENDORSER_TRANSACTION;
}
function newFullTransactionEvent(blockEvent, txEnvelopeIndex) {
    const block = blockEvent.blockData;
    if (block.metadata && block.data && block.data.data) {
        const blockMetadata = block.metadata.metadata || [];
        const transactionStatusCodes = blockMetadata[fabproto6.common.BlockMetadataIndex.TRANSACTIONS_FILTER];
        const envelope = block.data.data[txEnvelopeIndex];
        const transactionId = envelope.payload.header.channel_header.tx_id;
        const code = transactionStatusCodes[txEnvelopeIndex];
        const status = TransactionStatus.getStatusForCode(code);
        const transactionEvent = {
            transactionId,
            status,
            transactionData: envelope.payload.data,
            isValid: status === TransactionStatus.VALID_STATUS,
            getBlockEvent: () => blockEvent,
            getContractEvents: gatewayutils_1.cachedResult(() => fullcontracteventfactory_1.newFullContractEvents(transactionEvent))
        };
        return Object.freeze(transactionEvent);
    }
    throw Error('Missing transaction data');
}
exports.newFullTransactionEvent = newFullTransactionEvent;
//# sourceMappingURL=fulltransactioneventfactory.js.map