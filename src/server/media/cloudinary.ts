import { createHash } from 'node:crypto';

/**
 * Cloudinary signed-upload signature: SHA-1 of the parameters sorted by key and
 * joined as `key=value` with `&`, with the api_secret appended. The browser must
 * send exactly these signed params (plus api_key + file) to Cloudinary.
 */
export function signUpload(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1').update(toSign + apiSecret).digest('hex');
}
