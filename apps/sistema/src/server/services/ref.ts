import { randomBytes } from "node:crypto";

// Alfabeto base58-like (sem 0/O/I/l para evitar ambiguidade ao copiar).
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Gera um código curto e aleatório para usar no parâmetro ?ref=. */
export function generateRefCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}
