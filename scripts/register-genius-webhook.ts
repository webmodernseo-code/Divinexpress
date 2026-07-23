process.loadEnvFile('.env');

const WEBHOOK_URL = 'https://divinexpress.fr/api/checkout/webhook';

async function main() {
  const publicKey = process.env.GENIUSPAY_PUBLIC_KEY;
  const secretKey = process.env.GENIUSPAY_SECRET_KEY;
  if (!publicKey || !secretKey) {
    throw new Error('GENIUSPAY_PUBLIC_KEY / GENIUSPAY_SECRET_KEY must be set in .env before running this script.');
  }

  const response = await fetch('https://geniuspay.ci/api/v1/merchant/webhooks', {
    method: 'POST',
    headers: {
      'X-API-Key': publicKey,
      'X-API-Secret': secretKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'DivinExpress checkout',
      url: WEBHOOK_URL,
      events: ['payment.success', 'payment.failed', 'payment.cancelled', 'payment.expired']
    })
  });

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(`GeniusPay webhook registration failed: ${JSON.stringify(json)}`);
  }

  console.log('Webhook registered against', WEBHOOK_URL);
  console.log('Full response (find the webhook secret in here — the exact field name was not confirmed');
  console.log('from the docs alone; look for something starting with "whsec_"):');
  console.log(JSON.stringify(json, null, 2));
  console.log('\nCopy that secret into .env as GENIUSPAY_WEBHOOK_SECRET — it is only ever shown once.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
