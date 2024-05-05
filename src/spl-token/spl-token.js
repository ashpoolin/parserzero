   // spl-token.js

require('dotenv').config();
const bs58 = require('bs58');
const BN = require('bn.js');
const Buffer = require('buffer').Buffer;
const { Connection, LAMPORTS_PER_SOL, PublicKey} = require('@solana/web3.js');
const { decodeInstruction, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const { TokenInstructionLookup } = require('./spl_token_layout');

const SOLANA_CONNECTION = new Connection(process.env.SOLANA_CONNECTION, 'confirmed', {
    maxSupportedTransactionVersion: 0
  });

// async function getTokenDataByATA(associatedTokenAccount) {
//     const info = await SOLANA_CONNECTION.getAccountInfo(new PublicKey(associatedTokenAccount));

//     // console.log(JSON.stringify(info))
//     return info
//     // const accounts = await SOLANA_CONNECTION.getParsedProgramAccounts(
//     //     new PublicKey(associatedTokenAccount), // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
//     //     {
//     //       filters: [
//     //         {
//     //           dataSize: 165, // number of bytes
//     //         },
//     //         {
//     //         //   memcmp: {
//     //         //     offset: 32, // number of bytes
//     //         //     bytes: MY_WALLET_ADDRESS, // base58 encoded string
//     //         //   },
//     //         },
//     //       ],
//     //     }
//     //   );
// }

async function getTokenAccountDetails(connection, tokenAccountAddress) {
    // Fetch the account info
    const accountInfo = await connection.getAccountInfo(new PublicKey(tokenAccountAddress));
    
    if (accountInfo === null) {
      throw new Error('Failed to find token account');
    }
  
    // Ensure the account data is the expected length (at least 64 bytes for Mint and Owner)
    if (accountInfo.data.length < 64) {
      throw new Error('Invalid token account data length');
    }
  
    // Extract the Mint and Owner addresses from the account data
    const mintAddress = new PublicKey(accountInfo.data.slice(0, 32));
    const ownerAddress = new PublicKey(accountInfo.data.slice(32, 64));
  
    return { mintAddress: mintAddress.toString(), ownerAddress: ownerAddress.toString() };
  }

  async function getMintDecimals(connection, mintAddress) {
    // Fetch the mint account info
    const mintAccountInfo = await connection.getAccountInfo(new PublicKey(mintAddress));
    
    if (mintAccountInfo === null) {
      throw new Error('Failed to find mint account');
    }
  
    // SPL Token Mint layout: The decimals field is at byte offset 44 and is 1 byte long
    const decimals = mintAccountInfo.data[44];
  
    return decimals;
  }

async function parseSplTokenInstruction(txContext, disc, instruction, ix) {

    const program = 'spl-token'
    const signature = txContext.signature
    const slot = txContext.slot
    const blocktime = txContext.blocktime
    const err = txContext.err
    const fee = txContext.fee
    const data = txContext.data
    const signers = txContext.signers
    // const instructionType = stakeProgramDiscriminatorMap.get(disc);
    const instructionType = TokenInstructionLookup[disc];
    // const instructionType = decodeInstructionType(instruction);

    const payload = {}
    payload.program = program
    payload.type = instructionType
    payload.signature = signature
    payload.err = err
    payload.slot = slot
    payload.blocktime = blocktime
    payload.fee = fee
    payload.signers = signers
       // Add the parsing logic specific to SPL-Token instructions here
       // Use the layouts imported above

    const decoded = decodeInstruction(instruction)
    if (instructionType == 'AmountToUiAmount') {
        // payload.decoded = decoded
    }	
    else if (instructionType == 'Approve') {
        
    }	
    else if (instructionType == 'ApproveChecked') {
        
    }	
    else if (instructionType == 'Burn') {
        
    }	
    else if (instructionType == 'BurnChecked') {
        
    }	
    else if (instructionType == 'CloseAccount') {
        
    }	
    else if (instructionType == 'FreezeAccount') {
        
    }	
    else if (instructionType == 'InitializeAccount') {
        
    }	
    else if (instructionType == 'InitializeAccount2') {
        
    }	
    else if (instructionType == 'InitializeAccount3') {
        
    }	
    else if (instructionType == 'InitializeMint') {
        
    }	
    else if (instructionType == 'InitializeMint2') {
        
    }	
    else if (instructionType == 'InitializeMultisig2') {
        
    }	
    else if (instructionType == 'MintTo') {
        // example signature: 
        // payload.decoded = decoded
        // payload.programId = decoded.programId
        // payload.mint = decoded.keys.mint
        // payload.destination = decoded.keys.destination
        // payload.authority = decoded.keys.authority
        // payload.multiSigners = decoded.keys.multiSigners
        // payload.data = decoded.data

        // const mint = data?.transaction.message.accountKeys[instruction.accounts[0]] // ok
        // const decimals = await getMintDecimals(SOLANA_CONNECTION, mint)
        // const destination = data?.transaction.message.accountKeys[instruction.accounts[1]]
        // const authority2 = await getTokenAccountDetails(SOLANA_CONNECTION, destination).ownerAddress // destination ATA owner
        // const authority = data?.transaction.message.accountKeys[instruction.accounts[2]]
        // let deserialized;
        // try {
        //   deserialized = MintToLayout.decode(ix);
        // } catch (err) {
        //   console.log(err);
        // }
        // const amount = Number(deserialized.amount); 
        // const uiAmount = amount / 10 ** decimals;
        
    }	
    else if (instructionType == 'MintToChecked') {
        
    }	
    else if (instructionType == 'Revoke') {
        
    }	
    else if (instructionType == 'SetAuthority') {
        
    }	
    else if (instructionType == 'SyncNative') {
        
    }	
    else if (instructionType == 'ThawAccount') {
        
    }	
    else if (instructionType == 'Transfer') {
        // const tokenData = await getTokenDataByATA(decoded.keys.source.pubkey.toBase58())
        // console.log(JSON.stringify(tokenData))
        payload.auth1 = decoded.keys.owner.pubkey.toBase58()
        payload.source = decoded.keys.source.pubkey.toBase58()
        destination = decoded.keys.destination.pubkey.toBase58()
        payload.destination = destination
        // payload.ownerDestination = await SOLANA_CONNECTION.getAccountInfo(decoded.keys.destination.pubkey).then((data) => { return bs58.encode(Buffer.from(data.data).slice(32, 64)) });
        const tokenAccountData = await getTokenAccountDetails(SOLANA_CONNECTION, destination) // destination ATA owner
        payload.auth2 = tokenAccountData.ownerAddress
        payload.misc1 = decoded.keys.multiSigners.map(signer => signer.pubkey.toBase58())
        // payload.amount = Number(decoded.data.amount) //
        // payload.decimals = Number(decoded.data.decimals)
        const mint = tokenAccountData.mintAddress
        const decimals = await getMintDecimals(SOLANA_CONNECTION, mint)
        payload.misc2 = decimals
        payload.misc3 = mint
        payload.misc4 = decoded.programId.toBase58()
        payload.uiAmount = Number(decoded.data.amount) / 10 ** Number(decimals)

        // console.log(payload)
    }	
    else if (instructionType == 'TransferChecked') {
      payload.auth1 = decoded.keys.owner.pubkey.toBase58()
      payload.auth2 = await SOLANA_CONNECTION.getAccountInfo(decoded.keys.destination.pubkey).then((data) => { return bs58.encode(Buffer.from(data.data).slice(32, 64)) });
      payload.source = decoded.keys.source.pubkey.toBase58()
      payload.destination = decoded.keys.destination.pubkey.toBase58()
      payload.misc1 = decoded.keys.multiSigners.map(signer => signer.pubkey.toBase58())
      payload.misc2 = Number(decoded.data.decimals)
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
      // payload.amount = Number(decoded.data.amount) //
        payload.uiAmount = Number(decoded.data.amount) / 10 ** Number(decoded.data.decimals)
    }	
    else if (instructionType == 'UiAmountToAmount') {
        // payload.decoded = decoded
    }
    else {
        // payload.decoded = decoded
        
    }	

    // return JSON.stringify(payload);
    return payload;


   }

   module.exports = { parseSplTokenInstruction };