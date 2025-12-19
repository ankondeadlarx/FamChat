// Simple encryption using Web Crypto API (for demonstration)
// In production, use Signal Protocol or similar for proper E2E encryption

class EncryptionService {
  async generateKey() {
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    return key;
  }

  async exportKey(key) {
    const exported = await window.crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exported);
  }

  async importKey(keyData) {
    const keyObject = JSON.parse(keyData);
    return await window.crypto.subtle.importKey(
      'jwk',
      keyObject,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(text, key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv)
    };
  }

  async decrypt(encryptedData, ivData, key) {
    try {
      const encrypted = this.base64ToArrayBuffer(encryptedData);
      const iv = this.base64ToArrayBuffer(ivData);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return '[Unable to decrypt message]';
    }
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Store key in localStorage (in production, use more secure storage)
  async initializeUserKey() {
    let keyData = localStorage.getItem('encryptionKey');
    
    if (!keyData) {
      const key = await this.generateKey();
      keyData = await this.exportKey(key);
      localStorage.setItem('encryptionKey', keyData);
    }
    
    return await this.importKey(keyData);
  }
}

export default new EncryptionService();
