import { createClient } from '@/lib/supabase/client';

export async function hashSSN(ssn: string): Promise<string> {
  // Remove any hyphens or spaces
  const cleanSSN = ssn.replace(/[-\s]/g, '');
  
  // Use Web Crypto API for browser compatibility
  const encoder = new TextEncoder();
  const data = encoder.encode(cleanSSN);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

export async function encryptSSN(ssn: string): Promise<Uint8Array> {
  // Remove any hyphens or spaces
  const cleanSSN = ssn.replace(/[-\s]/g, '');
  
  // For testing purposes, we'll use a simple encryption
  // In production, this should be done server-side with pgcrypto
  const encoder = new TextEncoder();
  const data = encoder.encode(cleanSSN);
  
  // Simple XOR encryption for testing (NOT SECURE FOR PRODUCTION)
  const key = new Uint8Array([0x42, 0x69, 0x74, 0x65]); // "Bite" in hex
  const encrypted = new Uint8Array(data.length);
  
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ key[i % key.length];
  }
  
  return encrypted;
}

export function maskSSN(ssn: string): string {
  // Remove any hyphens or spaces
  const cleanSSN = ssn.replace(/[-\s]/g, '');
  
  if (cleanSSN.length >= 13) {
    // Format: YYMMDD-XXXXXXX -> ***-**-XXXX
    const lastFour = cleanSSN.slice(-4);
    return `***-**-${lastFour}`;
  }
  
  return '***-**-****';
}