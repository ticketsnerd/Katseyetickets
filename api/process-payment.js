import { Client, Environment } from 'square';

// Initialize Square Client
// Vercel will inject these environment variables automatically
const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' 
    ? Environment.Production 
    : Environment.Sandbox,
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, amount } = req.body;

    if (!token || !amount) {
      return res.status(400).json({ error: 'Missing token or amount' });
    }

    // Square requires amount in BigInt format for cents
    // e.g. 10.00 becomes 1000n
    const amountCents = BigInt(Math.round(amount * 100));

    const response = await client.paymentsApi.createPayment({
      sourceId: token,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: amountCents,
        currency: 'USD',
      },
      locationId: process.env.SQUARE_LOCATION_ID
    });

    // Serialize BigInt for JSON response
    const result = JSON.parse(JSON.stringify(response.result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));

    return res.status(200).json({ status: 'success', payment: result });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Payment failed' 
    });
  }
}
