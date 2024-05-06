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


// SPL Token Instructions Key:
// AmountToUiAmount       decodeAmountToUiAmountInstruction
// Approve              	decodeApproveInstruction
// ApproveChecked         decodeApproveCheckedInstruction
// Burn             	    decodeBurnInstruction
// BurnChecked            decodeBurnCheckedInstruction
// CloseAccount           decodeCloseAccountInstruction
// FreezeAccount          decodeFreezeAccountInstruction
// InitializeAccount      decodeInitializeAccountInstruction
// InitializeAccount2     decodeInitializeAccount2Instruction
// InitializeAccount3     decodeInitializeAccount3Instruction
// InitializeMint         decodeInitializeMintInstruction
// InitializeMint2        decodeInitializeMint2Instruction
// InitializeMultisig2    decodeInitializeMultisigInstruction
// MintTo             	  decodeMintToInstruction
// MintToChecked          decodeMintToCheckedInstruction
// Revoke                 decodeRevokeInstruction
// SetAuthority           decodeSetAuthorityInstruction
// SyncNative             decodeSyncNativeInstruction
// ThawAccount            decodeThawAccountInstruction
// Transfer             	decodeTransferInstruction
// TransferChecked        decodeTransferCheckedInstruction
// UiAmountToAmount       decodeUiAmountToAmountInstruction


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

    // decode SPL token instructions using the common decodeInstruction function
    const decoded = decodeInstruction(instruction)

    // cases for handling decoded instructions
    if (instructionType == 'AmountToUiAmount') {
      payload.misc4 = decoded.programId.toBase58()
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.amount = Number(decoded.data.amount)
    }	
    else if (instructionType == 'Approve') {
      payload.auth1 = decoded.keys.owner.pubkey.toBase58()
      payload.source = decoded.keys.account.pubkey.toBase58()
      payload.destination = decoded.keys.delegate.pubkey.toBase58()
      payload.misc1 = decoded.keys.multiSigners
      payload.amount = Number(decoded.data.amount) // could fetch decimals and get uiAmount
      payload.misc4 = decoded.programId.toBase58()
    }	
    else if (instructionType == 'ApproveChecked') {
      payload.auth1 = decoded.keys.owner.pubkey.toBase58()
      payload.source = decoded.keys.account.pubkey.toBase58()
      payload.destination = decoded.keys.delegate.pubkey.toBase58()
      payload.misc1 = decoded.keys.multiSigners
      payload.misc2 = decoded.data.decimals
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
      payload.amount = Number(decoded.data.amount)
      payload.uiAmount = Number(decoded.data.amount) / 10 ** Number(decoded.data.decimals)
    }	
    else if (instructionType == 'Burn') {
      payload.auth1 = decoded.keys.owner.pubkey.toBase58()
      payload.source = decoded.keys.account.pubkey.toBase58()
      payload.misc1 = decoded.keys.multiSigners
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
      payload.amount = Number(decoded.data.amount) // could fetch decimals and get uiAmount
    }	
    else if (instructionType == 'BurnChecked') {
      payload.auth1 = decoded.keys.owner.pubkey.toBase58()
      payload.source = decoded.keys.account.pubkey.toBase58()
      payload.misc1 = decoded.keys.multiSigners
      payload.misc2 = Number(decoded.data.decimals)
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
      payload.amount = Number(decoded.data.amount)
      payload.uiAmount = Number(decoded.data.amount) / 10 ** Number(decoded.data.decimals)
    }	
    else if (instructionType == 'CloseAccount') {
      payload.auth1 = decoded.keys.authority.pubkey.toBase58()
      payload.source = decoded.keys.account.pubkey.toBase58()
      payload.destination = decoded.keys.destination.pubkey.toBase58()
      payload.misc1 = decoded.keys.multiSigners
      payload.misc4 = decoded.programId.toBase58()
      // payload.data = decoded.data // = { instruction: TokenInstruction.CloseAccount; };
    }	
    else if (instructionType == 'FreezeAccount') {
      payload.auth1 = decoded.keys.authority.pubkey.toBase58()
      payload.source = decoded.keys.account.pubkey.toBase58()
      payload.misc1 = decoded.keys.multiSigners
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
      // payload.data = decoded.data  // { instruction: TokenInstruction.FreezeAccount; };
    }	
    else if (instructionType == 'InitializeAccount') {
      payload.auth1 = decoded.keys.owner.pubkey.toBase58()
      payload.source = decoded.keys.account.pubkey.toBase58()
      // payload.misc2 = decoded.keys.rent.pubkey.toBase58() -- who cares about this field? it just names the SysvarRent publickey
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
      // payload.data = decoded.data  // { instruction: TokenInstruction.InitializeAccount; };
    }	
    else if (instructionType == 'InitializeAccount2') {
      payload.auth1 = decoded.data.owner.pubkey.toBase58()
      payload.source = decoded.keys.account.pubkey.toBase58()
      // payload.misc2 = decoded.keys.rent.pubkey.toBase58()
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
    }	
    else if (instructionType == 'InitializeAccount3') {
      payload.auth1 = decoded.data.owner.pubkey.toBase58()
      payload.source = decoded.keys.account.pubkey.toBase58()
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
    }	
    else if (instructionType == 'InitializeImmutableOwner') { // add to spreadsheet
      payload.misc4 = decoded.programId.toBase58()
      payload.account = decoded.keys.account.pubkey.toBase58()
      payload.data = decoded.data // fix this!
    }	
    else if (instructionType == 'InitializeMint') {
      payload.auth1 = decoded.data.mintAuthority
      // payload.misc2 = decoded.keys.rent // conflict => need misc0 ?
      payload.misc2 = Number(decoded.data.decimals)
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
    }	
    else if (instructionType == 'InitializeMint2') {
      payload.auth1 = decoded.data.mintAuthority.pubkey.toBase58()
      payload.misc2 = Number(decoded.data.decimals)
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
    }	
    else if (instructionType == 'InitializeMintCloseAuthority') { // add to spreadsheet
      payload.auth1 = decoded.data.closeAuthority.pubkey.toBase58()
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
    }	
    else if (instructionType == 'InitializeMultisig') {
      payload.source = decoded.keys.account.pubkey.toBase58()
      payload.misc1 = decoded.keys.signers.map(signer => signer.pubkey.toBase58())
      payload.misc2 = decoded.keys.rent.pubkey.toBase58()
      payload.misc3 = decoded.data.m
      payload.misc4 = decoded.programId.toBase58()
        
    }	
    else if (instructionType == 'InitializeMultisig2') { // no functionality in spl-token currently
        
    }	
    else if (instructionType == 'InitializePermanentDelegate') { // no functionality in spl-token currently
        
    }	
    else if (instructionType == 'MintTo') {
      payload.auth1 = decoded.keys.authority.pubkey.toBase58()
      payload.destination = decoded.keys.destination.pubkey.toBase58()
      payload.misc1 = decoded.keys.multiSigners.map(signer => signer.pubkey.toBase58())
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
      payload.amount = decoded.data.amount // good to get fetch the token data (decimals, uiAmount)

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
      payload.auth1 = decoded.keys.authority.pubkey.toBase58()
      payload.destination = decoded.keys.destination.pubkey.toBase58()
      payload.misc1 = decoded.keys.multiSigners.map(signer => signer.pubkey.toBase58())
      payload.misc2 = decoded.data.decimals
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
      payload.amount = decoded.data.amount
      payload.uiAmount = Number(decoded.data.amount) / 10 ** Number(decoded.data.decimals)
    }	
    else if (instructionType == 'Reallocate') { // not implemented in spl-token yet
      
    }	    
    else if (instructionType == 'Revoke') {
      payload.auth1 = decoded.keys.owner.pubkey.toBase58()
      payload.source = decoded.keys.account.pubkey.toBase58()
      payload.misc1 = decoded.keys.multiSigners //.map(signer => signer.pubkey.toBase58())
      payload.misc4 = decoded.programId.toBase58()
      // payload.data = decoded.data  // don't use data, just is data: { instruction: TokenInstruction.Revoke; };
    }	
    else if (instructionType == 'SetAuthority') {
      payload.auth1 = decoded.keys.currentAuthority.pubkey.toBase58()
      payload.auth2 = decoded.data.newAuthority.pubkey.toBase58() // important info here
      payload.source = decoded.keys.account.pubkey.toBase58()
      payload.misc1 = decoded.keys.multiSigners.map(signer => signer.pubkey.toBase58())
      payload.misc2 = decoded.data.authorityType // important info here
      payload.misc4 = decoded.programId.toBase58()
    }	
    else if (instructionType == 'SyncNative') {
      payload.source = decoded.keys.account.pubkey.toBase58() // it's an array, might not work, maybe .map it
      payload.misc4 = decoded.programId.toBase58()
    }	
    else if (instructionType == 'ThawAccount') {
      payload.auth1 = decoded.keys.authority.pubkey.toBase58()
      payload.source = decoded.keys.account.pubkey.toBase58()
      payload.misc1 = decoded.keys.multiSigners.map(signer => signer.pubkey.toBase58())
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
      // payload.data = decoded.data 
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
      payload.amount = Number(decoded.data.amount)
      payload.misc3 = decoded.keys.mint.pubkey.toBase58()
      payload.misc4 = decoded.programId.toBase58()
    }
    else {
        
    }	

    // return JSON.stringify(payload);
    return payload;


   }

   module.exports = { parseSplTokenInstruction };