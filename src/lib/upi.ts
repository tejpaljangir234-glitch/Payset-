/**
 * NPCI UPI Specification Helper & Deep Link Builder
 * Complies with NPCI Unified Payments Interface 2.0 specs
 */

export interface UpiUriParams {
  pa: string; // Payee VPA / UPI ID (e.g. merchant@icici)
  pn: string; // Payee Name
  am?: number | string; // Transaction Amount (optional)
  cu?: string; // Currency (INR default)
  tn?: string; // Transaction Note
  tr?: string; // Transaction Reference ID
  mc?: string; // Merchant Category Code (optional)
}

/**
 * Builds standard NPCI UPI intent URI (upi://pay?...)
 */
export function buildUpiUri(params: UpiUriParams): string {
  const query = new URLSearchParams();
  query.set('pa', params.pa.trim());
  query.set('pn', params.pn.trim());
  
  if (params.am !== undefined && params.am !== '' && Number(params.am) > 0) {
    query.set('am', Number(params.am).toFixed(2));
  }
  query.set('cu', params.cu || 'INR');
  
  if (params.tn) {
    query.set('tn', params.tn.trim());
  }
  if (params.tr) {
    query.set('tr', params.tr.trim());
  }
  if (params.mc) {
    query.set('mc', params.mc.trim());
  }

  return `upi://pay?${query.toString()}`;
}

/**
 * Builds specific app intent deeplinks
 */
export function buildAppUpiUri(app: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'cred', upiUri: string): string {
  const baseParam = upiUri.replace('upi://pay?', '');
  switch (app) {
    case 'gpay':
      return `tez://upi/pay?${baseParam}`;
    case 'phonepe':
      return `phonepe://pay?${baseParam}`;
    case 'paytm':
      return `paytmmp://pay?${baseParam}`;
    case 'bhim':
      return `bhim://pay?${baseParam}`;
    case 'cred':
      return `cred://pay?${baseParam}`;
    default:
      return upiUri;
  }
}

/**
 * Validates Indian UPI ID format (e.g. user@okhdfcbank, merchant@upi)
 */
export function isValidUpiId(vpa: string): boolean {
  if (!vpa || typeof vpa !== 'string') return false;
  // Format: handle@bankhandle
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(vpa.trim());
}

/**
 * Validates 10-digit Indian mobile number
 */
export function isValidIndianPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\+]/g, '').slice(-10);
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Validates Email Address
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Formats Indian Currency with INR Symbol (₹)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generates official 12-digit NPCI RRN (Retrieval Reference Number / UTR)
 */
export function generateUpiRrn(): string {
  const date = new Date();
  const yearDigit = (date.getFullYear() % 10).toString();
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
    .toString()
    .padStart(3, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
  return `${yearDigit}${dayOfYear}${hour}${randomPart}`.slice(0, 12);
}
