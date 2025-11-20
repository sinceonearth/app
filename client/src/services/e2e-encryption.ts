const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

interface GroupKey {
  groupId: string;
  key: CryptoKey;
  exportedKey: string;
}

const groupKeys = new Map<string, CryptoKey>();

export async function generateGroupKey(groupId: string): Promise<string> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedKey = await window.crypto.subtle.exportKey('raw', key);
  const exportedKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));

  groupKeys.set(groupId, key);
  
  saveGroupKeyToStorage(groupId, exportedKeyBase64);

  return exportedKeyBase64;
}

export async function importGroupKey(groupId: string, exportedKeyBase64: string): Promise<void> {
  const keyData = Uint8Array.from(atob(exportedKeyBase64), c => c.charCodeAt(0));
  
  const key = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );

  groupKeys.set(groupId, key);
  saveGroupKeyToStorage(groupId, exportedKeyBase64);
}

async function getGroupKey(groupId: string): Promise<CryptoKey | null> {
  if (groupKeys.has(groupId)) {
    return groupKeys.get(groupId)!;
  }

  const storedKey = getGroupKeyFromStorage(groupId);
  if (storedKey) {
    await importGroupKey(groupId, storedKey);
    return groupKeys.get(groupId)!;
  }

  return null;
}

export async function encryptMessage(groupId: string, plaintext: string): Promise<string> {
  const key = await getGroupKey(groupId);
  if (!key) {
    throw new Error('Group encryption key not found');
  }

  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedText = new TextEncoder().encode(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encodedText
  );

  const ivBase64 = btoa(String.fromCharCode(...iv));
  const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

  return `${ivBase64}:${ciphertextBase64}`;
}

export async function decryptMessage(groupId: string, encryptedData: string): Promise<string> {
  const key = await getGroupKey(groupId);
  if (!key) {
    return '[Encrypted - Key not available]';
  }

  try {
    const [ivBase64, ciphertextBase64] = encryptedData.split(':');
    
    if (!ivBase64 || !ciphertextBase64) {
      return encryptedData;
    }

    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error('Decryption error:', err);
    return '[Decryption failed]';
  }
}

function saveGroupKeyToStorage(groupId: string, key: string): void {
  try {
    const keys = JSON.parse(localStorage.getItem('radr_group_keys') || '{}');
    keys[groupId] = key;
    localStorage.setItem('radr_group_keys', JSON.stringify(keys));
  } catch (err) {
    console.error('Failed to save group key:', err);
  }
}

function getGroupKeyFromStorage(groupId: string): string | null {
  try {
    const keys = JSON.parse(localStorage.getItem('radr_group_keys') || '{}');
    return keys[groupId] || null;
  } catch (err) {
    console.error('Failed to get group key:', err);
    return null;
  }
}

export function hasGroupKey(groupId: string): boolean {
  return groupKeys.has(groupId) || getGroupKeyFromStorage(groupId) !== null;
}

export function removeGroupKey(groupId: string): void {
  groupKeys.delete(groupId);
  try {
    const keys = JSON.parse(localStorage.getItem('radr_group_keys') || '{}');
    delete keys[groupId];
    localStorage.setItem('radr_group_keys', JSON.stringify(keys));
  } catch (err) {
    console.error('Failed to remove group key:', err);
  }
}
