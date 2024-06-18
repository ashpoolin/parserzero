const anchor = require("@project-serum/anchor");
const bs58 = require('bs58');
const BN = require('bn.js');
const fs = require("fs");
const { PublicKey } = require('@solana/web3.js');

const idl = JSON.parse(fs.readFileSync("./src/ionet_airdrop/merkle_distributor.json", "utf8"));

const programId = new anchor.web3.PublicKey(
    "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N"
  );
  
  // Create the program interface
  const ionProgram = new anchor.Program(idl, programId);

async function parseIONetInstruction(txContext, disc, instruction, ix, program) {

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

    // console.log(instruction);
    // console.log(ix);
        // const ix = bs58.decode(instruction.data);
        const ixHex = Array.prototype.map
          .call(ix, (x) => ("00" + x.toString(16)).slice(-2))
          .join("");
        const decodedInstruction = ionProgram.coder.instruction.decode(ixHex);

        // console.log(JSON.stringify(decodedInstruction, null, 2));

        // const amountHex = decodedInstruction.amountUnlocked.toString('hex'); // Assuming amountUnlocked is a Buffer
        // const amount = new BN(amountHex, 16).toString(10); // Convert hex to base10
    
    const payload = {}
    payload.program = program ? program : 'ionet'
    // payload.amount = decodedInstruction.amountUnlocked.toString('hex');
    // payload.amount = decodedInstruction.data.amountUnlocked
    payload.amount = new BN(decodedInstruction.data.amountUnlocked).toString(10);
    payload.type = decodedInstruction.name
    payload.signature = signature
    payload.err = err
    payload.slot = slot
    payload.blocktime = blocktime
    payload.fee = fee
    payload.signers = signers
    payload.owner = owner
    payload.ownerBalanceChanges = ownerBalanceChanges
    payload.ownerTokenBalanceChanges = ownerTokenBalanceChanges
    // payload.misc1 = instruction.data
    payload.misc4 = instruction.programId.toBase58()

    if ( decodedInstruction.name === 'newClaim') {
        payload.auth1 = new PublicKey(instruction.keys[0].pubkey).toBase58()
        payload.auth2 = new PublicKey(instruction.keys[4].pubkey).toBase58()
        payload.source = new PublicKey(instruction.keys[2].pubkey).toBase58()
        payload.destination = new PublicKey(instruction.keys[3].pubkey).toBase58()
        payload.misc3 = new BN(decodedInstruction.data.amountLocked).toString(10); // maybe doesn't go in misc3
    }

    return payload;
};

module.exports = { parseIONetInstruction };

