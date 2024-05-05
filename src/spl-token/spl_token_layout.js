const { publicKey, u64 } = require('@solana/buffer-layout-utils');
const { blob,  u8, u32, nu64, ns64, struct, seq } = require('@solana/buffer-layout'); // Layout

  const TokenInstructionLookup = {
    0: 'InitializeMint',
    1: 'InitializeAccount',
    2: 'InitializeMultisig',
    3: 'Transfer',
    4: 'Approve',
    5: 'Revoke',
    6: 'SetAuthority',
    7: 'MintTo',
    8: 'Burn',
    9: 'CloseAccount',
    10: 'FreezeAccount',
    11: 'ThawAccount',
    12: 'TransferChecked',
    13: 'ApproveChecked',
    14: 'MintToChecked',
    15: 'BurnChecked',
    16: 'InitializeAccount2',
    17: 'SyncNative',
    18: 'InitializeAccount3',
    19: 'InitializeMultisig2',
    20: 'InitializeMint2',
    21: 'GetAccountDataSize',
    22: 'InitializeImmutableOwner',
    23: 'AmountToUiAmount',
    24: 'UiAmountToAmount',
    25: 'InitializeMintCloseAuthority',
    26: 'TransferFeeExtension',
    27: 'ConfidentialTransferExtension',
    28: 'DefaultAccountStateExtension',
    29: 'Reallocate',
    30: 'MemoTransferExtension',
    31: 'CreateNativeMint',
    32: 'InitializeNonTransferableMint',
    33: 'InterestBearingMintExtension',
    34: 'CpiGuardExtension',
    35: 'InitializePermanentDelegate',
    36: 'TransferHookExtension',
    // Add other discriminators and names as needed
};

module.exports = {
  TokenInstructionLookup,
};