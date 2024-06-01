// compute-budget.js

const { LAMPORTS_PER_SOL, ComputeBudgetInstruction } = require('@solana/web3.js');

// Compute Budget Program Instructions Key:
// RequestUnits         decodeRequestUnits
// RequestHeapFrame     decodeRequestHeapFrame
// SetComputeUnitLimit  decodeSetComputeUnitLimit
// SetComputeUnitPrice  decodeSetComputeUnitPrice

async function parseComputeBudgetInstruction(txContext, disc, instruction, ix) {

    const program = 'compute-budget'
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
    // const instructionType = stakeProgramDiscriminatorMap.get(disc);
    const instructionType = ComputeBudgetInstruction.decodeInstructionType(instruction);

    const preBalances = data.meta.preBalances
    const postBalances = data.meta.postBalances

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

    if (instructionType == 'RequestUnits') {
        const decoded = ComputeBudgetInstruction.decodeRequestUnits(instruction);
        payload.misc1 = decoded.units
        payload.misc2 = decoded.additionalFee
    }
    else if (instructionType == 'RequestHeapFrame') {
        const decoded = ComputeBudgetInstruction.decodeRequestHeapFrame(instruction);
        payload.misc4 = decoded.bytes
    }
    else if (instructionType == 'SetComputeUnitLimit') {
        const decoded = ComputeBudgetInstruction.decodeSetComputeUnitLimit(instruction);
        payload.misc1 = decoded.units

    }
    else if (instructionType == 'SetComputeUnitPrice') {
        const decoded = ComputeBudgetInstruction.decodeSetComputeUnitPrice(instruction);
        payload.misc3 = Number(decoded.microLamports)
        // payload.uiAmount = Number(decoded.microLamports) * 1.0E-6 / LAMPORTS_PER_SOL
    }
    else {

    }
    return payload;
}
module.exports = { parseComputeBudgetInstruction };