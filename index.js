require('dotenv').config();
const express = require('express');
const TronWeb = require('tronweb');
const QRCode = require('qrcode');
const NOWPayments = require('NOWPayments');
const rateLimit = require('express-rate-limit'); // <--- Add this line

const app = express();
app.use(express.json());

// Define your rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

// Place this here, before your route handlers
app.use(limiter);

const tronWeb = new TronWeb(
  process.env.TRON_FULL_NODE,
  process.env.TRON_SOLIDITY_NODE,
  process.env.TRON_EVENT_SERVER,
  process.env.TRON_PRIVATE_KEY
);

// Endpoint to generate a USDT payment request (QR code and payment link)
app.post('/api/payment-request', async (req, res) => {
  const { amount, guestName } = req.body;
  const receiver = process.env.RECEIVER_ADDRESS;

  // USDT contract address on TRON mainnet
  const usdtContract = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';
  // USDT has 6 decimals
  const amountInSun = parseInt(amount * 1e6);

  // Payment link (TronLink deep link format)
  const paymentLink = `tronlink://send?to=${receiver}&asset=${usdtContract}&amount=${amountInSun}`;

  // Generate QR code for payment link
  const qrCodeDataURL = await QRCode.toDataURL(paymentLink);

  res.json({
    guestName,
    receiver,
    usdtContract,
    amount,
    amountInSun,
    paymentLink,
    qrCodeDataURL
  });
});

// Endpoint to check payment confirmation (simple version)
app.post('/api/check-payment', async (req, res) => {
  const { txID } = req.body;
  try {
    const txInfo = await tronWeb.trx.getTransactionInfo(txID);
    if (txInfo && txInfo.receipt && txInfo.receipt.result === 'SUCCESS') {
      res.json({ confirmed: true, txInfo });
    } else {
      res.json({ confirmed: false, txInfo });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Hotel crypto payment server running on port ${PORT}`);
});
