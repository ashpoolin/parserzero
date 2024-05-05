   // vote.js
const { LAMPORTS_PER_SOL, VoteInstruction } = require('@solana/web3.js');

// Vote Program Instruction Key:
// Authorize        	decodeAuthorize
// AuthorizeWithSeed    decodeAuthorizeWithSeed
// InitializeAccount    decodeInitializeAccount
// Withdraw     	    decodeWithdraw

function parseVoteInstruction(txContext, disc, instruction, ix) {

    const program = 'vote'
    const signature = txContext.signature
    const slot = txContext.slot
    const blocktime = txContext.blocktime
    const err = txContext.err
    const fee = txContext.fee
    const data = txContext.data
    const signers = txContext.signers
    const instructionType = VoteInstruction.decodeInstructionType(instruction);

    const payload = {}
    payload.program = program
    payload.type = instructionType
    payload.signature = signature
    payload.err = err
    payload.slot = slot
    payload.blocktime = blocktime
    payload.fee = fee
    payload.signers = signers

    const preBalances = data.meta.preBalances
    const postBalances = data.meta.postBalances

    if ( instructionType == 'Authorize') {
        const decoded = VoteInstruction.decodeAuthorize(instruction);
        payload.auth1 = decoded.authorizedPubkey.toBase58()
        payload.auth2 = decoded.newAuthorizedPubkey.toBase58()
        payload.source = decoded.votePubkey.toBase58()
        payload.misc2 = decoded.voteAuthorizationType.index
    }
    else if ( instructionType == 'AuthorizeWithSeed') {
        const decoded = VoteInstruction.decodeAuthorizeWithSeed(instruction);
        payload.auth1 = decoded.currentAuthorityDerivedKeyOwnerPubkey.toBase58()
        payload.auth2 = decoded.newAuthorizedPubkey.toBase58()
        payload.source = decoded.votePubkey.toBase58()
        payload.misc1 = decoded.currentAuthorityDerivedKeySeed
        payload.misc2 = decoded.voteAuthorizationType.index
        payload.misc4 = decoded.currentAuthorityDerivedKeyBasePubkey.toBase58()
    }
    else if ( instructionType == 'InitializeAccount') {
        const decoded = VoteInstruction.decodeInitializeAccount(instruction);
        payload.auth1 = decoded.voteInit.authorizedVoter.toBase58()
        payload.auth2 = decoded.voteInit.authorizedWithdrawer.toBase58()
        payload.source = decoded.votePubkey.toBase58()
        payload.destination = decoded.nodePubkey.toBase58()
        payload.misc1 = decoded.voteInit
        payload.misc2 = decoded.voteInit.commission
    }
    else if ( instructionType == 'Withdraw') {
        const decoded = VoteInstruction.decodeWithdraw(instruction);
        payload.auth1 = decoded.authorizedWithdrawerPubkey.toBase58()
        payload.source = decoded.votePubkey.toBase58()
        payload.destination = decoded.toPubkey.toBase58()
        payload.uiAmount = decoded.lamports / LAMPORTS_PER_SOL
    }

    return payload;
}
module.exports = { parseVoteInstruction };