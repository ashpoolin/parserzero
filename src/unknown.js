
async function parseUnknownInstruction(txContext, disc, instruction, ix, program) {

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
    const instructionType = disc
    // const instructionType = decodeInstructionType(instruction);

    const payload = {}
    payload.program = program ? program : 'unknown'
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

    payload.misc1 = instruction.data
    payload.misc4 = instruction.programId.toBase58()

    return payload;
};

module.exports = { parseUnknownInstruction };

