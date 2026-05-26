/**
 * TOTP (RFC 6238) implemented with Node.js built-in crypto.
 * No external OTP library required — qrcode is the only dependency.
 */
import { createHmac, randomBytes } from "crypto";
import QRCode from "qrcode";

// ── Base32 helpers ────────────────────────────────────────────────────────────

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function b32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 0x1f]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 0x1f];
  return out;
}

function b32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/=/g, "");
  let bits = 0, value = 0;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const ch  = clean[i];
    const idx = B32.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid base32 char: ${ch}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(out);
}

// ── HOTP core ─────────────────────────────────────────────────────────────────

function hotp(secret: string, counter: number): string {
  const key = b32Decode(secret);
  const msg = Buffer.alloc(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) { msg[i] = c & 0xff; c = Math.floor(c / 256); }
  const h   = createHmac("sha1", key).update(msg).digest();
  const off = h[h.length - 1] & 0x0f;
  const code =
    ((h[off]     & 0x7f) << 24) |
    ((h[off + 1] & 0xff) << 16) |
    ((h[off + 2] & 0xff) << 8)  |
     (h[off + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateTOTPSecret(): string {
  return b32Encode(randomBytes(20));
}

/** Verify a 6-digit TOTP code. Allows ±1 window (±30 s clock drift). */
export function verifyTOTP(secret: string, token: string): boolean {
  const t = String(token).trim();
  if (!/^\d{6}$/.test(t)) return false;
  const counter = Math.floor(Date.now() / 1000 / 30);
  try {
    for (let i = -1; i <= 1; i++) {
      if (hotp(secret, counter + i) === t) return true;
    }
  } catch { return false; }
  return false;
}

/** Returns a data-URL PNG QR code compatible with Google Authenticator / Authy. */
export async function generateQRCodeDataURL(email: string, secret: string): Promise<string> {
  const issuer = "BYG Manager";
  const uri =
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}` +
    `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  return await QRCode.toDataURL(uri, { width: 200, margin: 2 });
}
