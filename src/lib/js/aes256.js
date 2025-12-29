import cryptoJs from "crypto-js";
function deriveKey(salt) {
  let passwordBytes = cryptoJs.enc.Utf8.parse(import.meta.env.VITE_DISTANCE_ENCRYPT_KEY);
  return cryptoJs.PBKDF2(passwordBytes, salt, {
    keySize: 256 / 32,
    iterations: 70000,
    hasher: cryptoJs.algo.SHA1,
  });
}
export function encrypt(plaintext, encryptItems) {
  const salt = encryptItems.salt.clone();
  const key = encryptItems.key.clone();
  const iv = encryptItems.iv.clone();
  const encrypted = cryptoJs.AES.encrypt(cryptoJs.enc.Utf8.parse(plaintext), key, {
    iv: iv,
    mode: cryptoJs.mode.CBC,
    padding: cryptoJs.pad.Pkcs7,
  });
  // Salt, IV 및 암호화된 데이터를 함께 반환 (Base64 인코딩)
  const combined = salt.concat(iv).concat(encrypted.ciphertext);

  return cryptoJs.enc.Base64.stringify(combined);
}

export function decrypt(encryptedData) {
  // Base64 디코딩
  const combined = cryptoJs.enc.Base64.parse(encryptedData);

  // Salt (20 바이트), IV (16 바이트), 암호화된 텍스트 분리
  const salt = cryptoJs.lib.WordArray.create(combined.words.slice(0, 20 / 4));
  const iv = cryptoJs.lib.WordArray.create(combined.words.slice(20 / 4, (20 + 16) / 4));
  const ciphertext = cryptoJs.lib.WordArray.create(combined.words.slice((20 + 16) / 4), combined.sigBytes - 36);

  const key = deriveKey(salt);

  const decrypted = cryptoJs.AES.decrypt({ ciphertext: ciphertext }, key, {
    iv: iv,
    padding: cryptoJs.pad.Pkcs7,
    mode: cryptoJs.mode.CBC,
  });

  return decrypted.toString(cryptoJs.enc.Utf8);
}
export function getEncryptItems() {
  const salt = cryptoJs.lib.WordArray.random(160 / 8); // 20 바이트 salt
  const key = deriveKey(salt);
  const iv = cryptoJs.lib.WordArray.random(128 / 8); // 128 비트 IV
  return { salt, key, iv };
}
