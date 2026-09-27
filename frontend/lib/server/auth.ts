import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export function configuredEmail() {
  return process.env.AUTH_EMAIL?.trim().toLowerCase() ?? "";
}

export function isAuthenticationConfigured() {
  return Boolean(configuredEmail() && process.env.AUTH_PASSWORD_HASH?.trim() && process.env.AUTH_SECRET?.trim());
}

export async function verifyCredentials(email: string, password: string) {
  const expectedEmail = configuredEmail();
  const encoded = process.env.AUTH_PASSWORD_HASH?.trim() ?? "";
  const [algorithm, saltHex, hashHex] = encoded.split(":");
  if (!expectedEmail || email.trim().toLowerCase() !== expectedEmail || algorithm !== "scrypt") return false;
  if (!saltHex || !hashHex || !/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(hashHex)) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
