# ParserZero
A scalable, bare-bones, command-line transaction parser for Solana transactions. Written in Javascript. Dumps data into CSV, or JSON formats. Work in progress.

## Motivation
Explorers are filled with spam, they present transaction data in bizarre ways, and rarely can you access the full history for an address (often a couple 100 tx's, max). As the transaction volume on Solana increases, the volume will continue to outstrip what's possible with the current explorers. Beyond that, nobody has the time to click through an explorer to get the info they need. You can use enhanced transaction APIs from certain providers, but you are still left to post-process the results, and support for specific programs varies greatly. Dune and Flipside are great products for providing access to parsed data, but they are expensive for power users, and they may not have the data set you are looking for.

Here, I present ParserZero. A free, open-source, bare-bones Solana transaction parser. It is opinionated in the sense that it jams everything into a CSV or JSON object with a reduced number of fields. It is intended to communicate the most vital data about a transaction, namely: 1) what is the transaction doing, 2) who are the parties to it, and 3) what the transaction amounts are (UI/human readable). This parsing system can be scaled across resources easily, and arranges the data in a way that is conducive to data analysis, generating network graphs, whatever. 

## What you'll need
- RPC URL / subscription
- good amount of RAM, and CPU (depending on your needs; AMD 5800X w/ 32GB RAM)
- Various command line programs for data munging. At your preference. We use: GNU parallel, csvkit, and jq.

## Set up:
- add your RPC url to a .env file: modify env_example file, then `mv env_example .env`
- `npm install`

## Process
- You'll need a list of signatures to parse. The `signatures.js` helper script can do this for you: `node signatures.js <ADDRESS> <MAX NUMBER OF SIGNATURES TO RETRIEVE>`. The script will output a list of signatures in JSON format. 
- To get a basic list of the signature hashes, do something like this: `node signatures.js <ADDRESS> <MAX SIGNATURES> | jq . | in2csv --format json | csvcut -c signature | tail -n +2 > <ADDRESS>_signatures.txt`
- The parser is run using `node index.js <SIGNATURE>`. Doing this sequentially will take forever. So here, GNU parallel and a multicore CPU are used to parse the signatures in parallel. Here's how you do it:
  - `cat <ADDRESS>_signatures.txt | parallel -j <NUMBER OF ACTIVE THREADS> node index.js {} > <ADDRESS>_parsed.csv`
- You'll get a lot of headers (can be turned off setting `header: false` in `./src/utils/csvlogger.js`), errors and junk lines, which you'll want to get rid of. I do this is in a rather lazy way: `cat <ADDRESS>_parsed.csv | sort -bh | uniq > <ADDRESS>_parsed_uniq.csv`. This file should be workable, but check for errors and junk lines before you do you EDA.
- Once you have your parsed data, load into a spreadsheet, database, or whatever you like to analyze.

## Current Support
Native programs:
- System
- Stake
- Vote
- Compute Budget
- SPL token (in progress)

## To Do (NOW)
- return basic program / unparsed default response (w/ program address lookup)

## Feature Support (To-Do FUTURE)
- final balances and balance changes of owner-specific accounts (must provide the owner of interest) 
- generic IDL parser template (example) for users to add program support on their own 
- Flatten CPI / inner instructions
- Support for versioned transaction (version > 0), address lookup tables, and more
- Support popular DeFi protocols: Jupiter, Raydium, Orca, Tensor, Magic Eden, etc.

## Help Out
This thing will get a whole lot better if people add support for the programs they'd like to see. Each Solana program can be considered a "module" to be added to the parser. With each new module, the power of the tool will increase. I've created a template, but will need the community's support to get coverage on the thousands of programs that exist on Solana. 

## Mission / Final Words
Solana transactions are not nearly as opinionated as Ethereum ones. The expressivity this affords developers is amazing, but it also makes handling the colorful world of Solana transactions an incredible chore. CPIs and composability add layers of complexity to deciphering transactions, with highly compound arrangements of instructions, which may number in the dozens, and touch an equal many accounts. Generally, block explorers are unable to provide the full picture to power users, and we need something that can cut through the on-chain pollution that is clogging them. Some web-based parsers are incredibly good, but cannot handle large volumes of transactions in a reasonable amount of time. I have been using worse versions of this tool for more than a year, and I still find myself looking for greater power, accuracy, and flexibility. The ultimate goal is to have an extremely lightweight and versatile parser that can help you quickly obtain the data you're looking for. If you share this goal for increased visibility into Solana's on-chain activity, please consider donating some extra cycles to improve this tool. 

Thank you.
