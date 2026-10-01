/**
 * UNIT TEST: Mật Mã Bảo Mật Zero-Knowledge (Web Crypto PBKDF2 + AES-256-GCM)
 * Tương ứng: TC-ZK-01 -> TC-ZK-06
 */
const { webcrypto } = require('crypto');
const crypto = globalThis.crypto || webcrypto;

// Helper: Hex conversions
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Derive AES key via PBKDF2 100k iterations
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function setupMasterPassword(password, hint) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const enc = new TextEncoder();
  const payload = JSON.stringify({ token: "K12ONLINE_ADMIN_AUTH_TOKEN_VERIFIED", createdAt: Date.now() });

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(payload)
  );

  return {
    ciphertext: bufferToHex(encrypted),
    salt: bufferToHex(salt),
    iv: bufferToHex(iv),
    hint: hint || ''
  };
}

async function verifyMasterPassword(password, vaultData) {
  try {
    const salt = hexToBuffer(vaultData.salt);
    const iv = hexToBuffer(vaultData.iv);
    const ciphertext = hexToBuffer(vaultData.ciphertext);

    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const data = JSON.parse(dec.decode(decrypted));
    return data.token === "K12ONLINE_ADMIN_AUTH_TOKEN_VERIFIED";
  } catch (e) {
    return false;
  }
}

async function run() {
  const results = [];

  try {
    const testPassword = "K12OnlineSecureMasterPass@2026";
    const testHint = "Mật khẩu quản trị trường học";

    // TC-ZK-01: Khởi tạo Vault với PBKDF2 100.000 vòng
    const startSetup = performance.now();
    const vault = await setupMasterPassword(testPassword, testHint);
    const endSetup = performance.now();
    const setupDuration = (endSetup - startSetup).toFixed(1);

    if (vault.ciphertext && vault.salt.length === 32 && vault.iv.length === 24 && vault.hint === testHint) {
      results.push({ id: 'TC-ZK-01', name: 'Khởi tạo Vault với PBKDF2 100.000 vòng + AES-256-GCM', status: 'PASS', details: `Tạo thành công Ciphertext (${vault.ciphertext.length} hex chars), Salt 16 bytes, IV 12 bytes. Hint lưu an toàn.` });
    } else {
      results.push({ id: 'TC-ZK-01', name: 'Khởi tạo Vault với PBKDF2 100.000 vòng + AES-256-GCM', status: 'FAIL', details: 'Dữ liệu Vault sinh ra không đúng quy cách.' });
    }

    // TC-ZK-02: Xác minh mật mã đúng (Correct Password Decryption)
    const isVerified = await verifyMasterPassword(testPassword, vault);
    if (isVerified === true) {
      results.push({ id: 'TC-ZK-02', name: 'Giải mã thành công với Master Password chính xác', status: 'PASS', details: 'Giải mã chuẩn xác payload token xác thực quản trị viên.' });
    } else {
      results.push({ id: 'TC-ZK-02', name: 'Giải mã thành công với Master Password chính xác', status: 'FAIL', details: 'Không thể giải mã với mật khẩu đúng.' });
    }

    // TC-ZK-03: Từ chối mật mã sai (Wrong Password Rejection)
    const wrongVerified = await verifyMasterPassword("SaiMatKhauHeThong!@#", vault);
    if (wrongVerified === false) {
      results.push({ id: 'TC-ZK-03', name: 'Từ chối tuyệt đối khi nhập sai Master Password', status: 'PASS', details: 'Hệ thống bắt lỗi giải mã AES-GCM và từ chối cấp quyền.' });
    } else {
      results.push({ id: 'TC-ZK-03', name: 'Từ chối tuyệt đối khi nhập sai Master Password', status: 'FAIL', details: 'Mật khẩu sai nhưng vẫn được phê duyệt (Nguy hiểm!).' });
    }

    // TC-ZK-04: Kiểm tra chống can thiệp 1 bit Ciphertext (Tamper Resistance / Auth Tag)
    const tamperedHex = (vault.ciphertext[0] === 'a' ? 'b' : 'a') + vault.ciphertext.slice(1);
    const tamperedVault = { ...vault, ciphertext: tamperedHex };
    const tamperVerified = await verifyMasterPassword(testPassword, tamperedVault);
    if (tamperVerified === false) {
      results.push({ id: 'TC-ZK-04', name: 'Phát hiện can thiệp Ciphertext (Tamper Resistance / Auth Tag)', status: 'PASS', details: 'Sửa 1 ký tự trong ciphertext lập tức bị Authentication Tag từ chối giải mã.' });
    } else {
      results.push({ id: 'TC-ZK-04', name: 'Phát hiện can thiệp Ciphertext (Tamper Resistance / Auth Tag)', status: 'FAIL', details: 'Ciphertext bị can thiệp nhưng không bị phát hiện.' });
    }

    // TC-ZK-05: Kiểm tra tính độc nhất của Salt ngẫu nhiên
    const vault2 = await setupMasterPassword(testPassword, testHint);
    if (vault.salt !== vault2.salt && vault.ciphertext !== vault2.ciphertext) {
      results.push({ id: 'TC-ZK-05', name: 'Tính duy nhất của Salt ngẫu nhiên (Crypto Random Salt)', status: 'PASS', details: 'Cùng 1 mật khẩu nhưng 2 lần tạo sinh ra 2 bộ Salt và Ciphertext hoàn toàn khác nhau.' });
    } else {
      results.push({ id: 'TC-ZK-05', name: 'Tính duy nhất của Salt ngẫu nhiên (Crypto Random Salt)', status: 'FAIL', details: 'Salt bị trùng lặp.' });
    }

    // TC-ZK-06: Đo lường thời gian sinh khóa PBKDF2 (Brute-force delay)
    if (setupDuration >= 30 && setupDuration <= 1500) {
      results.push({ id: 'TC-ZK-06', name: 'Đo lường độ trễ an toàn PBKDF2 100.000 iterations', status: 'PASS', details: `Thời gian sinh khóa: ${setupDuration}ms (đủ để làm chậm brute-force nhưng mượt mà với người dùng).` });
    } else {
      results.push({ id: 'TC-ZK-06', name: 'Đo lường độ trễ an toàn PBKDF2 100.000 iterations', status: 'WARN', details: `Thời gian sinh khóa bất thường: ${setupDuration}ms.` });
    }

  } catch (err) {
    results.push({ id: 'TC-ZK-ERR', name: 'Lỗi thực thi Zero-Knowledge test', status: 'FAIL', details: err.message });
  }

  return results;
}

module.exports = { run };
