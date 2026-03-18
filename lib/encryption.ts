import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(key, "hex");
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all hex)
  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decrypt(data: string): string {
  const [ivHex, tagHex, ciphertextHex] = data.split(":");
  if (!ivHex || !tagHex || !ciphertextHex) {
    throw new Error("Invalid encrypted data format");
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(ciphertextHex, "hex", "utf8") + decipher.final("utf8");
}
