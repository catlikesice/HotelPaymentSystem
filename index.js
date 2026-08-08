require('dotenv').config();
const express = require('express');
const path = require('path');
const QRCode = require('qrcode');
const rateLimiter = require('./middleware/rateLimitMiddleware');
const authRouter = require('./routes/auth');

const app = express();
app.use(express.json());

// Keep auth/user storage and server internals off the public static surface.
app.use((req, res, next) => {
  const blocked = ['/data', '/routes', '/middleware', '/node_modules', '/.env', '/package.json', '/package-lock.json'];
  if (blocked.some((prefix) => req.path === prefix || req.path.startsWith(prefix + '/'))) {
    return res.status(404).end();
  }
  next();
});

// Serve the static multi-page site alongside the API.
app.use(express.static(path.join(__dirname)));

// Apply rate limiter middleware before route handlers
app.use(rateLimiter);

app.use('/api/auth', authRouter);

let tronWeb = null;
function getTronWeb() {
  if (tronWeb) {
    return tronWeb;
  }
  if (!process.env.TRON_PRIVATE_KEY || process.env.TRON_PRIVATE_KEY === 'your_hotel_wallet_private_key') {
    throw new Error('TRON wallet is not configured. Set TRON_PRIVATE_KEY in .env');
  }
  const TronWeb = require('tronweb');
  tronWeb = new TronWeb(
    process.env.TRON_FULL_NODE,
    process.env.TRON_SOLIDITY_NODE,
    process.env.TRON_EVENT_SERVER,
    process.env.TRON_PRIVATE_KEY
  );
  return tronWeb;
}

// Endpoint to generate a USDT payment request (QR code and payment link)
app.post('/api/payment-request', async (req, res) => {
  try {
    getTronWeb();
  } catch (error) {
    return res.status(503).json({ error: error.message });
  }

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
    const client = getTronWeb();
    const txInfo = await client.trx.getTransactionInfo(txID);
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
