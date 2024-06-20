// index.js
require('dotenv').config();
const bs58 = require('bs58');
const BN = require('bn.js');
const Buffer = require('buffer').Buffer;
const { Connection, LAMPORTS_PER_SOL, PublicKey, TransactionInstruction } = require('@solana/web3.js');
const { stringify } = require('csv-stringify/sync');

// const { publicKey, u64 } = require('@solana/buffer-layout-utils');
// const { blob,  u8, u32, nu64, ns64, struct, seq } = require('@solana/buffer-layout'); // Layout

const programMap = require('./src/utils/programMap');

const { parseSystemInstruction } = require('./src/system/system');
const { parseStakeInstruction } = require('./src/stake/stake');
const { parseVoteInstruction } = require('./src/vote/vote');
const { parseSplTokenInstruction } = require('./src/spl-token/spl-token');
const { parseComputeBudgetInstruction } = require('./src/compute-budget/compute-budget');
const { getOwnerOrTokenOwner, findOwnerBalanceChanges, findTokenBalanceChanges } = require('./src/utils/balanceChanges');
const { parseMerkleDistInstruction } = require('./src/merkle-distributor/merkle-distributor');
const { parseUnknownInstruction } = require('./src/unknown');
const { logCSV } = require('./src/utils/csvlogger');


const SOLANA_CONNECTION = new Connection(process.env.SOLANA_CONNECTION, 'confirmed', {
  maxSupportedTransactionVersion: 0
});

async function parseSolanaTransaction() {
  try {
    const promises = []; // Array to hold promises
    const signature = process.argv[2];
    const userAccount = process.argv[3]
    const format = process.argv[4]
    const data = await SOLANA_CONNECTION.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });
    // console.log(`data: ${JSON.stringify(data, null, 2)}`);



    const tx_version = data?.version;
    // console.log(`tx_version: ${tx_version}`);

    let accountKeys = [];
    let preBalances = [];
    let postBalances = [];
    let preTokenBalances = [];
    let postTokenBalances = [];
    let signers = [];

    if (tx_version === "legacy") {
      accountKeys = data?.transaction.message.accountKeys;
      preBalances = data?.meta.preBalances;
      postBalances = data?.meta.postBalances;
      preTokenBalances = data?.meta.preTokenBalances;
      postTokenBalances = data?.meta.postTokenBalances;
      signers = data?.transaction.message.accountKeys.slice(0, data?.transaction.message.header.numRequiredSignatures) || null;

    } else if (tx_version === 0) {
      accountKeys = data?.transaction.message.staticAccountKeys
      // console.log(`accountKeys: ${JSON.stringify(accountKeys, null, 2)}`);
      preBalances = data?.meta.preBalances
      postBalances = data?.meta.postBalances
      preTokenBalances = data?.meta.preTokenBalances
      postTokenBalances = data?.meta.postTokenBalances
      
      signers = data?.transaction.message.staticAccountKeys.slice(0, data?.transaction.message.header.numRequiredSignatures) || null;

    } else {
      console.log(`tx_version not supported: ${tx_version}`);
    }

    let owner;
    if (userAccount.length > 40) { // userAccount = string; if length > 40, it's a pubkey provided
      owner = await getOwnerOrTokenOwner(userAccount);
      // console.log(`owner provided: ${owner}`);  
    } else { // if an empty or null field provided, use the first signer as the owner
      owner = new PublicKey(signers[0]).toBase58();
      // owner = signers[0];
      // console.log(`owner extracted: ${owner}`);  
    }

    // console.log(JSON.stringify(data, null, 2));

    // console.log(`signers: ${JSON.stringify(signers, null, 2)}`);

    // balance changes logic
    const ownerBalanceChanges = await findOwnerBalanceChanges(accountKeys, preBalances, postBalances, owner)
    // console.log(`ownerBalanceChanges: ${JSON.stringify(ownerBalanceChanges, null, 2)}`);
    // const ownerTokenBalanceChanges = [];
    const ownerTokenBalanceChanges = await findTokenBalanceChanges(preTokenBalances, postTokenBalances, owner, accountKeys)
    // console.log(`ownerTokenBalanceChanges: ${JSON.stringify(ownerTokenBalanceChanges, null, 2)}`);

    // // create txContext
    const transaction = data;
    const txContext = {};
    txContext.signature = signature;
    txContext.slot = data?.slot;
    txContext.blocktime = data?.blockTime;
    txContext.err = data?.meta.err;
    txContext.fee = data?.meta.fee / LAMPORTS_PER_SOL;
    txContext.data = data;
    txContext.owner = owner;
    txContext.ownerBalanceChanges = ownerBalanceChanges;
    txContext.ownerTokenBalanceChanges = ownerTokenBalanceChanges;
    txContext.signers = signers;

    // console.log(`txContext: ${JSON.stringify(txContext, null, 2)}`);

    // iterate through all instructions
    if (tx_version == "legacy") {
      data?.transaction.message.instructions.map(async (instr, index) => {
        const { accounts, data, programIdIndex } = instr;
        const keys = accounts.map(accountIndex => ({
          pubkey: new PublicKey(transaction.transaction.message.accountKeys[accountIndex]),
          isSigner: transaction.transaction.message.header.numRequiredSignatures > accountIndex,
          isWritable: transaction.transaction.message.header.numReadonlySignedAccounts > accountIndex ||
            transaction.transaction.message.header.numReadonlyUnsignedAccounts > (accountIndex - transaction.transaction.message.header.numRequiredSignatures)
        }));
        const programId = new PublicKey(transaction.transaction.message.accountKeys[programIdIndex]);
        const dataBuffer = bs58.decode(data);

        const instruction = new TransactionInstruction({
          keys,
          programId,
          data: dataBuffer
        });
        const program = programMap.get(programId.toBase58()) || "unknown";

        // fetch the instruction discriminator
        const ix = bs58.decode(instr.data);
        let disc;
        try {
          if (program === 'spl-token') {
            disc = ix.slice(0, 1);
          } else {
            disc = (Buffer.from(ix.slice(0, 4))).readUInt32LE()
          }
        } catch (err) {
          disc = 999;
        }

        // pass each instruction off to different parser modules
        if (program == 'system') {
          resultPromise = parseSystemInstruction(txContext, disc, instruction, ix);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
        else if (program == 'stake') {
          resultPromise = parseStakeInstruction(txContext, disc, instruction, ix);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
        else if (program == 'vote') {
          resultPromise = parseVoteInstruction(txContext, disc, instruction, ix);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
        else if (program == 'spl-token') {
          const resultPromise = parseSplTokenInstruction(txContext, disc, instruction, ix);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
        else if (program == 'compute-budget') {
          // promise wasn't needed, because parseComputeBudgetInstruction was not async until you messed with it.
          const resultPromise = parseComputeBudgetInstruction(txContext, disc, instruction, ix);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
        else {
          resultPromise = parseUnknownInstruction(txContext, disc, instruction, ix, program);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
      });
    } 
    else if (tx_version === 0) {
      data?.transaction.message.compiledInstructions.map(async (instr, index) => {
        const { accountKeyIndexes, data, programIdIndex } = instr;
        // console.log(`accountKeyIndexes: ${JSON.stringify(accountKeyIndexes, null, 2)}`);
        const keys = accountKeyIndexes.map(accountIndex => ({
            pubkey: new PublicKey(transaction.transaction.message.staticAccountKeys[accountIndex]),
            isSigner: transaction.transaction.message.header.numRequiredSignatures > accountIndex,
            isWritable: transaction.transaction.message.header.numReadonlySignedAccounts > accountIndex ||
                transaction.transaction.message.header.numReadonlyUnsignedAccounts > (accountIndex - transaction.transaction.message.header.numRequiredSignatures)
        }));
        // console.log(`keys: ${JSON.stringify(keys, null, 2)}`);
        const programId = new PublicKey(transaction.transaction.message.staticAccountKeys[programIdIndex]);
        // console.log(`programId: ${programId}`);
        
        // Handle the Buffer data
        let dataBuffer;
        dataBuffer = Buffer.from(data);
        // if (data.type == 'Buffer') {
        //     dataBuffer = Buffer.from(data.data);
        //     console.log(`dataBuffer - b: ${dataBuffer}`);
        // } else {
        //     dataBuffer = bs58.decode(data);
        //     console.log(`dataBuffer - bs58: ${dataBuffer}`);
        // }
    
        // Log the data in a readable format
    
        const instruction = new TransactionInstruction({
          keys,
          programId,
          data: dataBuffer
        });
        // console.log(`instruction: ${JSON.stringify(instruction)}`);

        const program = programMap.get(programId.toBase58()) || "unknown";

        // fetch the instruction discriminator
        const ix = dataBuffer;
        // const ix = bs58.decode(instr.data);
        let disc;
        try {
          if (program === 'spl-token') {
            disc = ix.slice(0, 1);
          } else {
            disc = (Buffer.from(ix.slice(0, 4))).readUInt32LE()
          }
        } catch (err) {
          disc = 999;
        }

        // pass each instruction off to different parser modules
        if (program == 'system') {
          resultPromise = parseSystemInstruction(txContext, disc, instruction, ix);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
        else if (program == 'stake') {
          resultPromise = parseStakeInstruction(txContext, disc, instruction, ix);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
        else if (program == 'vote') {
          resultPromise = parseVoteInstruction(txContext, disc, instruction, ix);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
        else if (program == 'spl-token') {
          const resultPromise = parseSplTokenInstruction(txContext, disc, instruction, ix);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
        else if (program == 'compute-budget') {
          // promise wasn't needed, because parseComputeBudgetInstruction was not async until you messed with it.
          const resultPromise = parseComputeBudgetInstruction(txContext, disc, instruction, ix);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
        else if (program == 'merkle-distributor' || program == 'jupiter-merkle-distributor' || program == 'jito-merkle-distributor') {
          const resultPromise = parseMerkleDistInstruction(txContext, disc, instruction, ix);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
        else {
          resultPromise = parseUnknownInstruction(txContext, disc, instruction, ix, program);
          promises.push(resultPromise.then(result => {
            if (format == 'csv')
              logCSV([result]);
            else if (format == 'json')
              console.log(JSON.stringify(result));
          }));
        }
      });
    }

    // Wait for all promises to resolve
    await Promise.all(promises);
    process.exit(0); // Exit with success code
  } catch (error) {
    console.error(error);
  }
}

parseSolanaTransaction();