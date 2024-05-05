// stake.js

const { LAMPORTS_PER_SOL, StakeInstruction } = require('@solana/web3.js');

// Stake Program Instructions Key:
// Authorize	        decodeAuthorize
// AuthorizeWithSeed	decodeAuthorizeWithSeed
// Deactivate	        decodeDeactivate
// Delegate	            decodeDelegate
// Initialize	        decodeInitialize
// Merge	            decodeMerge
// Split	            decodeSplit
// Withdraw	            decodeWithdraw

function parseStakeInstruction(txContext, disc, instruction, ix) {

    const program = 'stake'
    const signature = txContext.signature
    const slot = txContext.slot
    const blocktime = txContext.blocktime
    const err = txContext.err
    const fee = txContext.fee
    const data = txContext.data
    const signers = txContext.signers
    // const instructionType = stakeProgramDiscriminatorMap.get(disc);
    const instructionType = StakeInstruction.decodeInstructionType(instruction);

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

    if (instructionType == 'Authorize') {
        const decoded = StakeInstruction.decodeAuthorize(instruction);
        payload.auth1 = decoded.authorizedPubkey.toBase58()
        payload.auth2 = decoded.newAuthorizedPubkey.toBase58()
        payload.source = decoded.stakePubkey.toBase58()
        payload.misc2 = decoded.stakeAuthorizationType
        payload.misc3 = decoded.index
    }
    else if (instructionType == 'AuthorizeWithSeed') {
        const decoded = StakeInstruction.decodeAuthorizeWithSeed(instruction);
        payload.auth1 = decoded.authorityOwner.toBase58()
        payload.auth2 = decoded.newAuthorizedPubkey.toBase58()
        payload.auth3 = decoded.custodianPubkey.toBase58()
        payload.source = decoded.stakePubkey.toBase58()
        payload.misc1 = decoded.authoritySeed
        payload.misc2 = decoded.stakeAuthorizationType
        payload.misc3 = decoded.index
        payload.misc4 = decoded.authorityBase.toBase58()
    }
    else if (instructionType == 'Deactivate') {
        const decoded = StakeInstruction.decodeDeactivate(instruction);
        payload.auth1 = decoded.authorizedPubkey.toBase58()
        payload.source = decoded.stakePubkey.toBase58()
        // add uiAmount based on final balance of the stake
    }
    else if (instructionType == 'Delegate') {
        const decoded = StakeInstruction.decodeDelegate(instruction);
        payload.auth1 = decoded.authorizedPubkey.toBase58()
        payload.source = decoded.stakePubkey.toBase58()
        payload.misc1 = decoded.votePubkey.toBase58()
    }
    else if (instructionType == 'Initialize') {
        const decoded = StakeInstruction.decodeInitialize(instruction);
        payload.auth1 = decoded.authorized.staker.toBase58()
        payload.auth2 = decoded.authorized.withdrawer.toBase58()
        payload.auth3 = decoded.lockup.custodian.toBase58()
        payload.source = decoded.stakePubkey.toBase58()
        payload.misc2 = decoded.lockup.epoch
        payload.misc3 = decoded.lockup.unixTimestamp
    }
    else if (instructionType == 'Merge') {
        const decoded = StakeInstruction.decodeMerge(instruction);
        payload.stakePubkey = decoded.stakePubkey.toBase58()
        payload.sourceStakePubKey = decoded.sourceStakePubKey.toBase58()
        payload.authorizedPubkey = decoded.authorizedPubkey.toBase58()
        payload.uiAmount = data?.transaction.message.accountKeys.map((key, index) => {
            if (key.toString() === decoded.stakePubkey.toString()) {
                const balanceChange = postBalances[index] - preBalances[index];
                return balanceChange / LAMPORTS_PER_SOL;
            }
        }).filter(Boolean)[0]; // Filter out undefined and take the first valid entry
        // add uiAmount based on final balance of the stake
    }
    else if (instructionType == 'Split') {
        const decoded = StakeInstruction.decodeSplit(instruction);
        payload.stakePubkey = decoded.stakePubkey.toBase58()
        payload.splitStakePubkey = decoded.splitStakePubkey.toBase58()
        payload.authorizedPubkey = decoded.authorizedPubkey.toBase58()
        payload.uiAmount = Number(decoded.lamports) / LAMPORTS_PER_SOL
    }
    else if (instructionType == 'Withdraw') {
        const decoded = StakeInstruction.decodeWithdraw(instruction);
        payload.stakePubkey = decoded.stakePubkey.toBase58()
        payload.toPubkey = decoded.toPubkey.toBase58()
        payload.authorizedPubkey = decoded.authorizedPubkey.toBase58()
        payload.uiAmount = Number(decoded.lamports) / LAMPORTS_PER_SOL
        payload.custodianPubkey = decoded.custodianPubkey?.toBase58()
    }

    return payload;
}
module.exports = { parseStakeInstruction };