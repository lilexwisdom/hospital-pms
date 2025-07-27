// Environment variable validation and utilities

export const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }

  return value;
};

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isStaging = process.env.NEXT_PUBLIC_ENV === 'staging';

// Type-safe environment variables
export const env = {
  // Database
  DATABASE_URL: getEnvVariable('DATABASE_URL'),

  // Authentication
  NEXTAUTH_URL: getEnvVariable('NEXTAUTH_URL'),
  NEXTAUTH_SECRET: getEnvVariable('NEXTAUTH_SECRET'),

  // API
  API_KEY: getEnvVariable('API_KEY'),

  // Email
  EMAIL_SERVER: getEnvVariable('EMAIL_SERVER'),
  EMAIL_FROM: getEnvVariable('EMAIL_FROM'),

  // Storage
  STORAGE_BUCKET_NAME: getEnvVariable('STORAGE_BUCKET_NAME'),
  STORAGE_ACCESS_KEY: getEnvVariable('STORAGE_ACCESS_KEY'),
  STORAGE_SECRET_KEY: getEnvVariable('STORAGE_SECRET_KEY'),

  // Payment
  PAYMENT_API_KEY: getEnvVariable('PAYMENT_API_KEY'),
  PAYMENT_WEBHOOK_SECRET: getEnvVariable('PAYMENT_WEBHOOK_SECRET'),

  // SMS
  SMS_API_KEY: getEnvVariable('SMS_API_KEY'),
  SMS_FROM_NUMBER: getEnvVariable('SMS_FROM_NUMBER'),
} as const;

// Client-side environment variables
export const publicEnv = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  ENV: process.env.NEXT_PUBLIC_ENV || 'development',
} as const;

