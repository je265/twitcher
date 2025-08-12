import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

// Generate a fallback key if not provided (for development)
const DEFAULT_KEY = "twitcher-default-key-32-bytes-long";
const keyString = process.env.STREAMKEY_ENC_KEY || Buffer.from(DEFAULT_KEY).toString("base64");
const KEY = Buffer.from(keyString, "base64").subarray(0, 32); // Ensure 32 bytes

export function encryptKey(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { cipher: enc, nonce: iv, tag };
}

export function decryptKey(cipher: Buffer, nonce: Buffer, tag: Buffer) {
  const dec = createDecipheriv("aes-256-gcm", KEY, nonce);
  dec.setAuthTag(tag);
  const out = Buffer.concat([dec.update(cipher), dec.final()]);
  return out.toString("utf8");
}
