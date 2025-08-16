// Import TronWeb library
const TronWeb = require('tronweb');

// Define TronGrid API endpoint and your API key
const fullNode = 'https://api.trongrid.io';
const solidityNode = 'https://api.trongrid.io';
const eventServer = 'https://api.trongrid.io';
const apiKey = 'your_api_key_here';

// Your private key (KEEP IT SAFE, NEVER SHARE)
const privateKey = 'your_private_key_here';

// Initialize TronWeb instance
const tronWeb = new TronWeb(
  fullNode,
  solidityNode,
  eventServer,
  privateKey,
  {
    headers: {
      'TRON-PRO-API-KEY': apiKey,
    },
  }
);

async function main() {
  try {
    // Get account address from private key
    const address = tronWeb.defaultAddress.base58;
    console.log('Your Tron Address:', address);

    // Get account balance in Sun (1 TRX = 1,000,000 Sun)
    const balanceSun = await tronWeb.trx.getBalance(address);
    console.log('Account Balance (Sun):', balanceSun);
    console.log('Account Balance (TRX):', balanceSun / 1_000_000);

    // Example: Send 1 TRX to another address (Uncomment to use)
    /*
    const toAddress = 'recipient_tron_address_here';
    const amountTrx = 1; // Amount in TRX

    const tradeobj = await tronWeb.transactionBuilder.sendTrx(toAddress, amountTrx * 1_000_000, address);
    const signedTxn = await tronWeb.trx.sign(tradeobj);
    const receipt = await tronWeb.trx.sendRawTransaction(signedTxn);

    console.log('Transaction Receipt:', receipt);
    */

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run main function
main();
