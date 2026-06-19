// Zero-dependency encryptor.
//
// Takes a full standalone HTML document + a password and produces a
// password-protected HTML file. The output contains only AES-256-GCM
// ciphertext plus a small decryption shell. The visitor's browser derives
// the key (PBKDF2) and decrypts in-memory via the Web Crypto API, so the
// plaintext never touches GitHub. The crypto parameters here MUST stay in
// sync with templates/secure-wrapper.html.
import { webcrypto as crypto } from 'node:crypto';

export const ITERATIONS = 250000;

export async function encryptHtml(plaintextHtml, password, wrapperTemplate) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const ctBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, enc.encode(plaintextHtml),
  );

  const payload = {
    v: 1,
    iter: ITERATIONS,
    salt: Buffer.from(salt).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    ct: Buffer.from(new Uint8Array(ctBuf)).toString('base64'),
  };

  if (!wrapperTemplate.includes('__DESK_PAYLOAD__')) {
    throw new Error('secure-wrapper.html is missing the __DESK_PAYLOAD__ marker');
  }
  return wrapperTemplate.replace('__DESK_PAYLOAD__', JSON.stringify(payload));
}
