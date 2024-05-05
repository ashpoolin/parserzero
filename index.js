// index.js
// const { parseSystemInstruction } = require('./src/system/system');
// const { parseStakeInstruction } = require('./src/stake/stake');
// const { parseVoteInstruction } = require('./src/vote/vote');
// const { parseSplTokenInstruction } = require('./src/spl-token/spl-token');

require('dotenv').config();
const bs58 = require('bs58');
const BN = require('bn.js');
const Buffer = require('buffer').Buffer;
const { Connection, LAMPORTS_PER_SOL, PublicKey, TransactionInstruction} = require('@solana/web3.js');
const { stringify } = require('csv-stringify/sync');

// const { publicKey, u64 } = require('@solana/buffer-layout-utils');
// const { blob,  u8, u32, nu64, ns64, struct, seq } = require('@solana/buffer-layout'); // Layout

const programMap = require('./src/utils/programMap');

const { parseSystemInstruction } = require('./src/system/system');
const { parseStakeInstruction } = require('./src/stake/stake');
const { parseVoteInstruction } = require('./src/vote/vote');
const { parseSplTokenInstruction } = require('./src/spl-token/spl-token');
const { logCSV } = require('./src/utils/csvlogger');


const SOLANA_CONNECTION = new Connection(process.env.SOLANA_CONNECTION, 'confirmed', {
  maxSupportedTransactionVersion: 0
});




async function parseSolanaTransaction() {
  try {
    const signature = process.argv[2];
    //const owner = process.argv[3]
    const data = await SOLANA_CONNECTION.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });
    
    const signers = data?.transaction.message.accountKeys.slice(0, data?.transaction.message.header.numRequiredSignatures) || null;
    const transaction = data;
    const txContext = {};
    txContext.signature = signature;
    txContext.slot = data?.slot;
    txContext.blocktime = data?.blockTime;
    txContext.err = data?.meta.err;
    txContext.fee = data?.meta.fee / LAMPORTS_PER_SOL;
    txContext.data = data;
    txContext.signers = signers;

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
      const program = programMap.get(programId.toBase58());

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

      if (program == 'system') {
        result = parseSystemInstruction(txContext, disc, instruction, ix);
        logCSV([result]);
      }
      else if (program == 'stake') {
        result = parseStakeInstruction(txContext, disc, instruction, ix);
        logCSV([result]);
      }
      else if (program == 'vote') {
        result = parseVoteInstruction(txContext, disc, instruction, ix);
        logCSV([result]);
      }
      else if (program == 'spl-token') {
        result = await parseSplTokenInstruction(txContext, disc, instruction, ix);
        logCSV([result]);
      }
      else {

      }
    });

  } catch (error) {
    console.error(error);
  }
}

parseSolanaTransaction();