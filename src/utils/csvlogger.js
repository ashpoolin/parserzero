const { stringify } = require('csv-stringify/sync');

function logCSV(jsonData) {
    // Define the columns if the JSON keys are known and consistent
    const columns = {
      program:	'program',
      type:	'type',
      signature:	'signature',
      err:	'err',
      slot:	'slot',
      blocktime:	'blocktime',
      fee:	'fee',
      auth1:	'auth1',
      auth2:	'auth2',
      auth3: 'auth3',
      source: 'source',
      destination: 'destination',
      misc1: 'misc1',
      misc2: 'misc2',
      misc3: 'misc3',
      misc4: 'misc4',
      uiAmount: 'uiAmount',
      amount: 'amount',
      signers: 'signers'
    };
    // Convert JSON data to CSV
    const csvOutput = stringify(jsonData, { header: true, columns: columns });

    // Log the CSV output to the console
    console.log(csvOutput);
}

module.exports = { logCSV };
