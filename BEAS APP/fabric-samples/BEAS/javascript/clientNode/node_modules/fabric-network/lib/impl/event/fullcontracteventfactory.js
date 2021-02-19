"use strict";
/*
 * Copyright 2020 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.newFullContractEvents = void 0;
function newFullContractEvents(transactionEvent) {
    const transactionActions = transactionEvent.transactionData.actions || [];
    return transactionActions.map((transactionAction) => {
        // payload is defined as 'bytes' in the protobuf.
        const payload = transactionAction.payload;
        // payload has been decoded by fabric-common event service before being stored as TransactionEvent
        const chaincodeEvent = payload.action.proposal_response_payload.extension.events;
        return newFullContractEvent(transactionEvent, chaincodeEvent);
    });
}
exports.newFullContractEvents = newFullContractEvents;
function newFullContractEvent(transactionEvent, chaincodeEvent) {
    const contractEvent = {
        chaincodeId: chaincodeEvent.chaincode_id,
        eventName: chaincodeEvent.event_name,
        payload: chaincodeEvent.payload,
        getTransactionEvent: () => transactionEvent
    };
    return Object.freeze(contractEvent);
}
//# sourceMappingURL=fullcontracteventfactory.js.map