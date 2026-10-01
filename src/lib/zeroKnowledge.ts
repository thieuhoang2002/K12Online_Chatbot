/**
 * ZERO-KNOWLEDGE ENCRYPTION MODULE - K12ONLINE CHATBOT ADMIN
 * -------------------------------------------------------------
 * 1. Zero-Knowledge: Server và Database chỉ lưu ciphertext, salt, IV, hint.
 *    Kể cả Server hoặc DB bị hack 100%, hacker cũng không thể đọc được plaintext hay pass.
 * 2. PBKDF2 (100.000 iterations): Cố ý làm chậm quá trình suy dẫn key -> brute-force
 *    1 triệu mật khẩu sẽ mất hàng năm trời tính toán trên GPU.
 * 3. AES-256-GCM: Sử dụng khóa 256-bit kết hợp Authentication Tag.
 *    Nếu bất kỳ ai chỉnh sửa dù chỉ 1 bit trong ciphertext -> Tag mismatch -> Decrypt văng lỗi ngay lập tức.
 */

export const ADMIN_WHITELIST = [
  "thieuhoangent@gmail.com",
  "thieuviethoang7b@gmail.com",
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_WHITELIST.includes(email.trim().toLowerCase());
}

export interface AdminVaultRecord {
  email: string;
  ciphertext: string;
  salt: string;
  iv: string;
  hint: string;
  updated_at?: string;
}

// Chuyển đổi Uint8Array sang Base64 an toàn cho Browser và Node
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== "undefined") {
    return btoa(binary);
  }
  return Buffer.from(binary, "binary").toString("base64");
}

// Chuyển đổi Base64 sang Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  if (typeof atob !== "undefined") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, "base64"));
}

// Trích xuất SubtleCrypto tương thích môi trường
function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto?.subtle) {
    return (globalThis as any).crypto.subtle;
  }
  throw new Error("Môi trường không hỗ trợ Web Cryptography API (SubtleCrypto)");
}

/**
 * 1. PBKDF2: Suy dẫn khóa AES-GCM 256-bit từ Master Password
 * 100.000 iterations + SHA-256 + 16-byte random salt
 */
async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const passBuffer = encoder.encode(password);

  const baseKey = await subtle.importKey(
    "raw",
    passBuffer as any,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return await subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * 2. Khởi tạo / Đặt mật khẩu Vault mới (Client-side)
 * Mã hóa payload xác thực bí mật bằng AES-256-GCM
 */
export async function createAdminVault(
  email: string,
  masterPass: string,
  hint: string
): Promise<AdminVaultRecord> {
  const subtle = getSubtleCrypto();
  const cryptoObj = typeof window !== "undefined" ? window.crypto : (globalThis as any).crypto;

  // Tạo Salt 16 bytes và IV 12 bytes chuẩn AES-GCM
  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  cryptoObj.getRandomValues(salt);
  cryptoObj.getRandomValues(iv);

  const aesKey = await deriveAesKey(masterPass, salt);

  // Payload bí mật để kiểm tra tính toàn vẹn khi giải mã
  const secretPayload = JSON.stringify({
    admin: email.toLowerCase().trim(),
    role: "superadmin",
    verifiedAt: Date.now(),
    signature: "K12ONLINE_ZERO_KNOWLEDGE_VAULT_OK",
  });

  const encoder = new TextEncoder();
  const encryptedBuffer = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as any,
    },
    aesKey,
    encoder.encode(secretPayload) as any
  );

  return {
    email: email.toLowerCase().trim(),
    ciphertext: bufferToBase64(encryptedBuffer),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    hint: hint.trim(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * 3. Xác thực Master Password & Giải mã Vault (Client-side)
 * Nếu mật khẩu sai dù chỉ 1 ký tự hoặc ciphertext bị can thiệp dù 1 bit -> Thất bại ngay
 */
export async function verifyAdminPassword(
  masterPass: string,
  vault: AdminVaultRecord
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const subtle = getSubtleCrypto();
    const salt = base64ToBuffer(vault.salt);
    const iv = base64ToBuffer(vault.iv);
    const ciphertext = base64ToBuffer(vault.ciphertext);

    const aesKey = await deriveAesKey(masterPass, salt);

    const decryptedBuffer = await subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as any,
      },
      aesKey,
      ciphertext as any
    );


    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decryptedBuffer);
    const parsed = JSON.parse(plaintext);

    if (parsed.signature === "K12ONLINE_ZERO_KNOWLEDGE_VAULT_OK") {
      return { success: true, data: parsed };
    }
    return { success: false, error: "Chữ ký nội bộ không hợp lệ" };
  } catch (err: any) {
    // Web Crypto ném lỗi OperationError khi Authentication Tag không khớp
    return {
      success: false,
      error: "Mật khẩu không chính xác hoặc dữ liệu xác thực đã bị thay đổi!",
    };
  }
}
