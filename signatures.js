const { Connection, PublicKey } = require('@solana/web3.js');

require('dotenv').config();
const SOLANA_CONNECTION = process.env.SOLANA_CONNECTION;
const connection = new Connection(SOLANA_CONNECTION, 'confirmed');

const address = process.argv[2];
const limit = process.argv[3];
const pubkey = new PublicKey(address)


const getSignatures = async (pkey) => {
    signatureBlock = await connection.getSignaturesForAddress(pkey);
    // console.log(JSON.stringify(signatures));
    return signatureBlock        // console.log(JSON.stringify(signatures));
};
const getSignaturesBefore = async (pkey, params) => {
    signatureBlock = await connection.getSignaturesForAddress(pkey, params);
    // console.log(JSON.stringify(signatures));  
    return signatureBlock      // console.log(JSON.stringify(signatures));
};

let signatures = []
let remainder = 0
let finished

const getSignaturesWithLimit = async () => {
    const signaturesBlock = await getSignatures(pubkey)
    signaturesBlock.forEach(signature => {
        signatures.push(signature);
    });
    
    remainder = signaturesBlock.length % 1000
    while (remainder === 0 && signatures.length < limit) {
        const earliest = signatures[signatures.length - 1].signature
        // console.log(earliest)
        const params = {before: earliest}
        // console.log(params)
        const signaturesBlock = await getSignaturesBefore(pubkey, params)
        // console.log(signaturesBlock)
        signaturesBlock.forEach(signature => {
            signatures.push(signature);
        });
        remainder = signaturesBlock.length % 1000
    }
    console.log(JSON.stringify(signatures))
};

getSignaturesWithLimit();

