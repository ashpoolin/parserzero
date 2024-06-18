// balanceChanges.js
require('dotenv').config();
const Buffer = require('buffer').Buffer;
const { Connection, LAMPORTS_PER_SOL, PublicKey} = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');

const SOLANA_CONNECTION = new Connection(process.env.SOLANA_CONNECTION, 'confirmed', {
    maxSupportedTransactionVersion: 0
  });

   async function getOwnerOrTokenOwner(ownerPublicKey) {
    try {
      let ownerAccountInfo = await SOLANA_CONNECTION.getAccountInfo(new PublicKey(ownerPublicKey));
      if (!ownerAccountInfo) {
        // console.log("Account not found.");
        return ownerPublicKey;
      }
  
      // Check if the account is an SPL Token account
      if (ownerAccountInfo.owner.toBase58() === TOKEN_PROGRAM_ID.toBase58()) {
        // console.log("This is an associated token account.");
        // Fetch and return the actual owner of the token account
        const tokenAccountData = Buffer.from(ownerAccountInfo.data);
        const ownerStartIndex = 32; // Owner public key starts at byte 32 in the account data layout for SPL Token accounts
        const ownerEndIndex = ownerStartIndex + 32;
        const ownerPublicKeyBytes = tokenAccountData.slice(ownerStartIndex, ownerEndIndex);
        const ownerPublicKey = new PublicKey(ownerPublicKeyBytes).toBase58();
        return ownerPublicKey;
      } else {
        // console.log("This is an owner wallet.");
        return ownerPublicKey; // Return the input public key as it is the owner
      }
    } catch (error) {
      // console.error("Error checking account type:", error);
      return null;
    }
  }

/**
 * Finds the balance changes for the owner in a Solana transaction.
 * 
 * @param {Array} accountKeys - Array of public keys involved in the transaction.
 * @param {Array} preBalances - Array of balances before the transaction, in lamports.
 * @param {Array} postBalances - Array of balances after the transaction, in lamports.
 * @param {string} owner - Public key of the owner in base58 format.
 * @returns {Object|null} Object containing the owner, preBalance, postBalance, and changeBalance if found, otherwise null.
 */
async function findOwnerBalanceChanges(accountKeys, preBalances, postBalances, owner) {
  const ownerBalanceChanges = accountKeys.map((key, index) => {
    if (key.toBase58() === owner) {
      return {
        owner,
        preBalance: preBalances[index] / LAMPORTS_PER_SOL,
        postBalance: postBalances[index] / LAMPORTS_PER_SOL,
        changeBalance: (postBalances[index] - preBalances[index]) / LAMPORTS_PER_SOL
      };
    }
  }).filter(Boolean)[0]; // Get the first match or undefined if no matches

  return ownerBalanceChanges || null; // Return null if no changes were found
}

async function findTokenBalanceChanges(preTokenBalances, postTokenBalances, ownerPublicKey, accountKeys) {
  if (!preTokenBalances || !postTokenBalances) {
    return []; // sometimes there are no token balance changes => handle this case
  }

  // Filter token balances for accounts owned by the owner
  const ownerPreTokenBalances = preTokenBalances.filter(balance => balance.owner === ownerPublicKey);
  const ownerPostTokenBalances = postTokenBalances.filter(balance => balance.owner === ownerPublicKey);

  // Create a map of postTokenBalances for quick lookup
  const postBalanceMap = new Map(ownerPostTokenBalances.map(post => [post.accountIndex, post]));

  // Map to find balance changes
  const tokenBalanceChanges = ownerPreTokenBalances.map(preBalance => {
    const postBalance = postBalanceMap.get(preBalance.accountIndex);
    if (postBalance) {
      const preAmount = preBalance.uiTokenAmount ? preBalance.uiTokenAmount.uiAmount : 0;
      const postAmount = postBalance.uiTokenAmount.uiAmount;
      const changeAmount = postAmount - preAmount;

      // Only return an object if there is a balance change
      if (changeAmount !== 0) {
        return {
          accountIndex: preBalance.accountIndex,
          account: accountKeys[preBalance.accountIndex],
          mint: preBalance.mint,
          preBalance: preAmount,
          postBalance: postAmount,
          changeBalance: changeAmount
        };
      }
    }
    return null;
  }).filter(Boolean); // Filter out any null entries if postBalance was not found or no balance change

  // Handle cases where there are post balances but no corresponding pre balances
  ownerPostTokenBalances.forEach(postBalance => {
    const preBalance = ownerPreTokenBalances.find(pre => pre.accountIndex === postBalance.accountIndex);
    if (!preBalance) {
      const postAmount = postBalance.uiTokenAmount.uiAmount;

      // Only return an object if there is a balance change (preBalance is implicitly 0)
      if (postAmount !== 0) {
        tokenBalanceChanges.push({
          accountIndex: postBalance.accountIndex,
          account: accountKeys[postBalance.accountIndex],
          mint: postBalance.mint,
          preBalance: 0,
          postBalance: postAmount,
          changeBalance: postAmount
        });
      }
    }
  });

  return tokenBalanceChanges;
}

// async function findTokenBalanceChanges(preTokenBalances, postTokenBalances, ownerPublicKey, accountKeys) {
//   if (!preTokenBalances || !postTokenBalances) {
//     return []; // sometimes there are no token balance changes => handle this case
//   }
//   // Filter token balances for accounts owned by the owner
//   const ownerPreTokenBalances = preTokenBalances.filter(balance => balance.owner === ownerPublicKey);
//   const ownerPostTokenBalances = postTokenBalances.filter(balance => balance.owner === ownerPublicKey);

//   // Map to find balance changes
//   const tokenBalanceChanges = ownerPreTokenBalances.map(preBalance => {
//     const postBalance = ownerPostTokenBalances.find(post => post.accountIndex === preBalance.accountIndex);
//     if (postBalance) {
//       return {
//         accountIndex: preBalance.accountIndex,
//         account: accountKeys[preBalance.accountIndex],
//         mint: preBalance.mint,
//         preBalance: preBalance.uiTokenAmount.uiAmount,
//         postBalance: postBalance.uiTokenAmount.uiAmount,
//         changeBalance: postBalance.uiTokenAmount.uiAmount - preBalance.uiTokenAmount.uiAmount
//       };
//     }
//     return null;
//   }).filter(Boolean); // Filter out any null entries if postBalance was not found

//   return tokenBalanceChanges;
// }


   module.exports = { getOwnerOrTokenOwner, findOwnerBalanceChanges, findTokenBalanceChanges };

