/**
 * Cryptographic helpers for Official Payment Gateway signature generation & verification
 * Implements HMAC-SHA256 algorithm matching Razorpay & Cashfree API standards
 */

export async function generateHmacSha256(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies gateway payment signature:
 * expectedSignature = HMAC_SHA256(orderId + "|" + paymentId, secret)
 */
export async function verifyGatewaySignature(
  orderId: string,
  paymentId: string,
  receivedSignature: string,
  secret: string
): Promise<boolean> {
  const expectedMessage = `${orderId}|${paymentId}`;
  const computedSignature = await generateHmacSha256(expectedMessage, secret);
  return computedSignature === receivedSignature;
}

/**
 * Verifies webhook payload signature
 */
export async function verifyWebhookSignature(
  rawBody: string,
  receivedSignature: string,
  secret: string
): Promise<boolean> {
  const computedSignature = await generateHmacSha256(rawBody, secret);
  return computedSignature === receivedSignature;
}
