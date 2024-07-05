function logJSON(jsonData) {

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

    // log the JSON data to console
    // console.log(JSON.stringify(processedData));
    return processedData[0];
}

module.exports = { logJSON };