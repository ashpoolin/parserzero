// system.js
const {LAMPORTS_PER_SOL, SystemInstruction} = require('@solana/web3.js');

function parseSystemInstruction(txContext, disc, instruction, ix) {

    const program = 'system'
    const signature = txContext.signature
    const slot = txContext.slot
    const blocktime = txContext.blocktime
    const err = txContext.err
    const fee = txContext.fee
    const data = txContext.data
    const signers = txContext.signers
    const owner = txContext.owner
    const ownerBalanceChanges = txContext.ownerBalanceChanges
    const ownerTokenBalanceChanges = txContext.ownerTokenBalanceChanges
    const instructionType = SystemInstruction.decodeInstructionType(instruction);

    const payload = {}
    payload.program = program
    payload.type = instructionType
    payload.signature = signature
    payload.err = err
    payload.slot = slot
    payload.blocktime = blocktime
    payload.fee = fee
    payload.signers = signers
    payload.owner = owner
    payload.ownerBalanceChanges = ownerBalanceChanges
    payload.ownerTokenBalanceChanges = ownerTokenBalanceChanges


// System Instruction Decoder Key:
//      Allocate	                decodeAllocate
//      AllocateWithSeed	        decodeAllocateWithSeed
//      Assign	                    decodeAssign
//      AssignWithSeed	            decodeAssignWithSeed
//      Create	                    decodeCreateAccount
//      CreateWithSeed	            decodeCreateWithSeed
//      AdvanceNonceAccount	        decodeNonceAdvance
//      AuthorizeNonceAccount	    decodeNonceAuthorize
//      InitializeNonceAccount	    decodeNonceInitialize
//      WithdrawNonceAccount	    decodeNonceWithdraw
//      Transfer	                decodeTransfer
//      TransferWithSeed	        decodeTransferWithSeed


    if (instructionType == 'Allocate') {
        const decoded = SystemInstruction.decodeAllocate(instruction);
        payload.source = decoded.accountPubkey.toBase58();
        payload.misc2 = decoded.space;
    } 
    else if (instructionType == 'AllocateWithSeed') {
        const decoded = SystemInstruction.decodeAllocateWithSeed(instruction);
        payload.source = decoded.accountPubkey.toBase58();
        payload.misc1 = decoded.seed;
        payload.misc2 = decoded.space;
        payload.misc3 = decoded.programId.toBase58();
        payload.misc4 = decoded.basePubkey.toBase58();
    } 
    else if (instructionType == 'Assign') {
        const decoded = SystemInstruction.decodeAssign(instruction);
        payload.source = decoded.accountPubkey.toBase58();
        payload.misc3 = decoded.programId.toBase58();
    } 
    else if (instructionType == 'AssignWithSeed') {
        const decoded = SystemInstruction.decodeAssignWithSeed(instruction);
        payload.source = decoded.accountPubkey.toBase58();
        payload.misc1 = decoded.seed;
        payload.misc3 = decoded.programId.toBase58();
        payload.misc4 = decoded.basePubkey.toBase58();
    } 
    else if (instructionType == 'Create') {
        const decoded = SystemInstruction.decodeCreateAccount(instruction);
        const lamports = Number(decoded.lamports);
        const uiAmount = lamports / LAMPORTS_PER_SOL;
        payload.source = decoded.fromPubkey.toBase58();
        payload.destination = decoded.newAccountPubkey.toBase58();
        payload.misc2 = decoded.space;
        payload.misc3 = decoded.programId.toBase58();
        payload.uiAmount = uiAmount;
    }
    else if (instructionType == 'CreateWithSeed') {
        const decoded = SystemInstruction.decodeCreateWithSeed(instruction);
        lamports = decoded.lamports;
        const uiAmount = lamports / LAMPORTS_PER_SOL;
        payload.source = decoded.fromPubkey.toBase58();
        payload.destination = decoded.newAccountPubkey.toBase58();
        payload.misc1 = decoded.seed;
        payload.misc2 = decoded.space;
        payload.misc3 = decoded.programId.toBase58();
        payload.misc4 = decoded.basePubkey.toBase58();
        payload.uiAmount = uiAmount;
    }
    else if (instructionType == 'AdvanceNonceAccount') {
        const decoded = SystemInstruction.decodeNonceAdvance(instruction);
        payload.auth1 = decoded.authorizedPubkey.toBase58();
        payload.misc1 = decoded.noncePubkey.toBase58();
    }
    else if (instructionType == 'AuthorizeNonceAccount') {
        const decoded = SystemInstruction.decodeNonceAuthorize(instruction);
        payload.auth1 = decoded.authorizedPubkey.toBase58();
        payload.auth2 = decoded.newAuthorizedPubkey.toBase58();
        payload.misc1 = decoded.noncePubkey.toBase58();
    }
    else if (instructionType == 'InitializeNonceAccount') {
        const decoded = SystemInstruction.decodeNonceInitialize(instruction);
        payload.auth1 = decoded.authorizedPubkey.toBase58();
        payload.misc1 = decoded.noncePubkey.toBase58();
    }
    else if (instructionType == 'WithdrawNonceAccount') {
        const decoded = SystemInstruction.decodeNonceWithdraw(instruction);
        payload.auth1 = decoded.authorizedPubkey.toBase58();
        payload.source = decoded.noncePubkey.toBase58();
        payload.destination = decoded.toPubkey.toBase58();
        payload.uiAmount = decoded.lamports / LAMPORTS_PER_SOL;
    }
    else if (instructionType == 'Transfer') {
        const decoded = SystemInstruction.decodeTransfer(instruction);
        const lamports = Number(decoded.lamports);
        payload.source = decoded.fromPubkey.toBase58();
        payload.destination = decoded.toPubkey.toBase58();
        payload.uiAmount = lamports / LAMPORTS_PER_SOL;
    }
    else if (instructionType == 'TransferWithSeed') {
        const decoded = SystemInstruction.decodeTransferWithSeed(instruction);
        const lamports = Number(decoded.lamports);
        payload.source = decoded.fromPubkey.toBase58();
        payload.destination = decoded.toPubkey.toBase58();
        payload.misc1 = decoded.seed;
        payload.misc3 = decoded.programId.toBase58();
        payload.misc4 = decoded.basePubkey.toBase58();
        payload.uiAmount = lamports / LAMPORTS_PER_SOL;
    }
    else {
    }
    return payload;

}

module.exports = { parseSystemInstruction };