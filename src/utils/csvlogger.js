const { stringify } = require('csv-stringify/sync');

// Define the columns if the JSON keys are known and consistent
const columns = {
    program: 'program',
    type: 'instruction',
    signature: 'signature',
    err: 'err',
    slot: 'slot',
    blocktime: 'blocktime',
    fee: 'fee',
    auth1: 'auth1',
    auth2: 'auth2',
    auth3: 'auth3',
    source: 'source',
    destination: 'destination',
    misc1: 'misc1',
    misc2: 'misc2',
    misc3: 'misc3',
    misc4: 'misc4',
    amount: 'amount',
    uiAmount: 'uiAmount',
    signers: 'signers',
    owner: 'owner',
    // ownerBalanceChanges: 'ownerBalanceChanges',
    preBalance_sol: 'preBalance_sol',
    postBalance_sol: 'postBalance_sol',
    changeBalance_sol: 'changeBalance_sol',
    accountIndex_inc: 'accountIndex_inc',
    account_inc: 'account_inc',
    mint_inc: 'mint_inc',
    preBalance_inc: 'preBalance_inc',
    postBalance_inc: 'postBalance_inc',
    changeBalance_inc: 'changeBalance_inc',
    accountIndex_dec: 'accountIndex_dec',   
    account_dec: 'account_dec',
    mint_dec: 'mint_dec',
    preBalance_dec: 'preBalance_dec',
    postBalance_dec: 'postBalance_dec',
    changeBalance_dec: 'changeBalance_dec',
    ownerTokenBalanceChanges_overflow: 'ownerTokenBalanceChanges_overflow',
    trade: 'trade'
};

function getCSVHeader() {
    return "program,instruction,signature,err,slot,blocktime,fee,auth1,auth2,auth3,source,destination,misc1,misc2,misc3,misc4,amount,uiAmount,signers,owner,preBalance_sol,postBalance_sol,changeBalance_sol,accountIndex_inc,account_inc,mint_inc,preBalance_inc,postBalance_inc,changeBalance_inc,accountIndex_dec,account_dec,mint_dec,preBalance_dec,postBalance_dec,changeBalance_dec,ownerTokenBalanceChanges_overflow,trade"
}

function logCSV(jsonData) {


    // Process each JSON object to flatten the ownerTokenBalanceChanges and ownerBalanceChanges fields
    const processedData = jsonData.map(entry => {
        const incToken = entry.ownerTokenBalanceChanges.find(change => change.changeBalance > 0) || {};
        const decToken = entry.ownerTokenBalanceChanges.find(change => change.changeBalance < 0) || {};
        const overflow = entry.ownerTokenBalanceChanges.filter(change => change !== incToken && change !== decToken);

        const ownerBalanceChanges = entry.ownerBalanceChanges || {};

        // Determine if a trade has taken place
        const changeBalance_sol = ownerBalanceChanges.changeBalance || 0;
        const trade = (
          (incToken.changeBalance && incToken.changeBalance !== 0 && decToken.changeBalance && decToken.changeBalance !== 0) ||
          ((incToken.changeBalance && incToken.changeBalance !== 0) || (decToken.changeBalance && decToken.changeBalance !== 0)) &&
          Math.abs(changeBalance_sol) >= 0.005
      ) ? 1 : 0;

        return {
            ...entry,
            owner: ownerBalanceChanges.owner || null,
            preBalance_sol: ownerBalanceChanges.preBalance || null,
            postBalance_sol: ownerBalanceChanges.postBalance || null,
            changeBalance_sol: changeBalance_sol,
            accountIndex_inc: incToken.accountIndex || null,
            account_inc: incToken.account || null,
            mint_inc: incToken.mint || null,
            preBalance_inc: incToken.preBalance || null,
            postBalance_inc: incToken.postBalance || null,
            changeBalance_inc: incToken.changeBalance || null,
            accountIndex_dec: decToken.accountIndex || null,
            account_dec: decToken.account || null,
            mint_dec: decToken.mint || null,
            preBalance_dec: decToken.preBalance || null,
            postBalance_dec: decToken.postBalance || null,
            changeBalance_dec: decToken.changeBalance || null,
            ownerTokenBalanceChanges_overflow: overflow.length > 0 ? JSON.stringify(overflow) : null,
            trade: trade
        };
    });

    // Convert JSON data to CSV
    // const csvOutput = stringify(processedData, { header: false, columns: columns });
    const csvOutput = stringify(processedData, { 
        header: false, 
        columns: columns,
        record_delimiter: 'unix',  // This uses the appropriate line ending for the OS
        quoted: true,  // Ensure all fields are quoted to handle any commas in the data
    }).trim();

    // Log the CSV output to the console
    // console.log(csvOutput);
    return csvOutput;
}

module.exports = { logCSV, getCSVHeader };