import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits

// Environment variable for encryption key (should be at least 32 characters)
const getEncryptionKey = (): Buffer => {
  const key = process.env.SSN_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error('SSN_ENCRYPTION_KEY must be set and at least 32 characters long');
  }
  
  // Use PBKDF2 to derive a proper key from the environment variable
  const salt = process.env.SSN_ENCRYPTION_SALT || 'default-salt-change-in-production';
  return crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');
};

// Key rotation support
const getKeyVersion = (): number => {
  return parseInt(process.env.SSN_KEY_VERSION || '1', 10);
};

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  version: number;
}

/**
 * Encrypts SSN using AES-256-GCM
 * @param ssn The SSN to encrypt
 * @returns Encrypted data with IV, tag, and version
 */
export function encryptSSN(ssn: string): EncryptedData {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(ssn, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      version: getKeyVersion()
    };
  } catch (error) {
    console.error('SSN encryption failed:', error);
    throw new Error('Failed to encrypt SSN');
  }
}

/**
 * Decrypts SSN using AES-256-GCM
 * @param encryptedData The encrypted data
 * @returns Decrypted SSN
 */
export function decryptSSN(encryptedData: EncryptedData): string {
  try {
    const key = getEncryptionKey();
    
    // Handle key rotation - you might need different keys for different versions
    if (encryptedData.version !== getKeyVersion()) {
      console.warn(`Decrypting with old key version: ${encryptedData.version}`);
      // In production, you'd retrieve the old key based on version
    }
    
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('SSN decryption failed:', error);
    throw new Error('Failed to decrypt SSN');
  }
}

/**
 * Hashes SSN for secure lookups
 * @param ssn The SSN to hash
 * @returns Hashed SSN
 */
export function hashSSN(ssn: string): string {
  const salt = process.env.SSN_HASH_SALT || 'default-hash-salt-change-in-production';
  return crypto
    .createHash('sha256')
    .update(ssn + salt)
    .digest('hex');
}

/**
 * Masks SSN for display (shows only last 4 digits)
 * @param ssn The SSN to mask
 * @returns Masked SSN
 */
export function maskSSN(ssn: string): string {
  if (!ssn || ssn.length < 4) return '***-**-****';
  
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length !== 13) return '***-**-****';
  
  // Korean SSN format: YYMMDD-GXXXXXX
  // Show birth year and last 4 digits
  const year = cleaned.substring(0, 2);
  const last4 = cleaned.substring(9, 13);
  
  return `${year}****-***${last4}`;
}

/**
 * Validates SSN format and checksum
 * @param ssn The SSN to validate
 * @returns True if valid
 */
export function validateSSN(ssn: string): boolean {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length !== 13) return false;

  // Basic format validation
  const regex = /^\d{6}\d{7}$/;
  if (!regex.test(cleaned)) return false;

  // Birth date validation
  const year = parseInt(cleaned.substring(0, 2));
  const month = parseInt(cleaned.substring(2, 4));
  const day = parseInt(cleaned.substring(4, 6));
  const genderDigit = parseInt(cleaned.substring(6, 7));

  // Validate month and day
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Checksum validation (Korean SSN algorithm)
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights[i];
  }
  
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleaned.charAt(12));
}

/**
 * Audit log entry for SSN access
 */
export interface SSNAccessLog {
  userId: string;
  patientId: string;
  action: 'encrypt' | 'decrypt' | 'view_masked' | 'lookup';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Logs SSN access for audit trail
 * @param log The access log entry
 */
export async function logSSNAccess(log: SSNAccessLog): Promise<void> {
  // In production, this would write to a database or audit log service
  console.log('SSN Access Audit:', {
    ...log,
    timestamp: log.timestamp.toISOString()
  });
  
  // You could also send to a centralized logging service
  // await auditService.log('ssn_access', log);
}