/**
 * AWS SNS Token Utilities
 * 
 * Utilities for formatting and validating device tokens for AWS SNS compatibility
 */

/**
 * AWS SNS Token Requirements:
 * - Maximum 400 hexadecimal characters
 * - iOS APNs: 64 hex characters (32 bytes)
 * - Android FCM: Variable length, usually base64-encoded
 */

export interface SNSTokenValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  formattedToken?: string;
  originalLength: number;
  finalLength: number;
}

/**
 * Validate and format a device token for AWS SNS
 */
export function validateAndFormatSNSToken(token: string, platform: 'ios' | 'android'): SNSTokenValidation {
  const result: SNSTokenValidation = {
    isValid: false,
    errors: [],
    warnings: [],
    originalLength: token.length,
    finalLength: 0,
  };

  if (!token || typeof token !== 'string') {
    result.errors.push('Token is empty or not a string');
    return result;
  }

  let formattedToken = token;

  // Remove common invalid characters
  const originalToken = formattedToken;
  formattedToken = formattedToken.replace(/[\s\-\:]/g, ''); // Remove spaces, dashes, colons

  if (formattedToken.length !== originalToken.length) {
    result.warnings.push(`Removed ${originalToken.length - formattedToken.length} invalid characters (spaces, dashes, colons)`);
  }

  // Platform-specific validation and formatting
  if (platform === 'ios') {
    // iOS APNs tokens should be hexadecimal
    const hexOnlyToken = formattedToken.replace(/[^a-fA-F0-9]/g, '');
    
    if (hexOnlyToken.length !== formattedToken.length) {
      result.warnings.push(`Removed ${formattedToken.length - hexOnlyToken.length} non-hexadecimal characters`);
      formattedToken = hexOnlyToken;
    }

    // iOS tokens should be exactly 64 hex characters
    if (formattedToken.length !== 64) {
      if (formattedToken.length < 64) {
        result.errors.push(`iOS token too short: ${formattedToken.length} chars (expected 64)`);
      } else {
        result.warnings.push(`iOS token longer than expected: ${formattedToken.length} chars (expected 64)`);
      }
    }

  } else if (platform === 'android') {
    // Android FCM tokens are typically base64-like
    const validChars = /^[a-zA-Z0-9\+\/\=\_\-]+$/;
    
    if (!validChars.test(formattedToken)) {
      const cleanToken = formattedToken.replace(/[^a-zA-Z0-9\+\/\=\_\-]/g, '');
      result.warnings.push(`Removed ${formattedToken.length - cleanToken.length} invalid characters for Android FCM token`);
      formattedToken = cleanToken;
    }
  }

  // Check AWS SNS length limit (400 characters)
  if (formattedToken.length > 400) {
    result.errors.push(`Token exceeds AWS SNS limit: ${formattedToken.length} chars (max 400)`);
    formattedToken = formattedToken.substring(0, 400);
    result.warnings.push('Token truncated to 400 characters');
  }

  result.finalLength = formattedToken.length;
  result.formattedToken = formattedToken;
  result.isValid = result.errors.length === 0;

  return result;
}

/**
 * Generate a test iOS APNs token (for development/testing only)
 */
export function generateTestIOSToken(): string {
  const chars = '0123456789abcdef';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Generate a test Android FCM token (for development/testing only)
 */
export function generateTestAndroidToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = '';
  const length = Math.floor(Math.random() * 100) + 100; // Random length between 100-200 chars
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Log token validation results in a formatted way
 */
export function logTokenValidation(validation: SNSTokenValidation, platform: string) {
  console.log(`[SNS-TOKEN] 🔍 Validation for ${platform}:`);
  console.log(`[SNS-TOKEN] Original length: ${validation.originalLength}`);
  console.log(`[SNS-TOKEN] Final length: ${validation.finalLength}`);
  console.log(`[SNS-TOKEN] Valid: ${validation.isValid ? '✅' : '❌'}`);

  if (validation.warnings.length > 0) {
    console.log(`[SNS-TOKEN] ⚠️ Warnings:`);
    validation.warnings.forEach(warning => {
      console.log(`[SNS-TOKEN]   - ${warning}`);
    });
  }

  if (validation.errors.length > 0) {
    console.log(`[SNS-TOKEN] ❌ Errors:`);
    validation.errors.forEach(error => {
      console.log(`[SNS-TOKEN]   - ${error}`);
    });
  }

  if (validation.formattedToken) {
    console.log(`[SNS-TOKEN] Formatted token: ${validation.formattedToken.substring(0, 20)}...`);
  }
}

/**
 * Test token formatting with sample tokens
 */
export function testTokenFormatting() {
  console.log('[SNS-TOKEN] 🧪 Testing token formatting...');

  // Test iOS token
  const testIOSToken = generateTestIOSToken();
  const iosValidation = validateAndFormatSNSToken(testIOSToken, 'ios');
  console.log('\n--- iOS Token Test ---');
  logTokenValidation(iosValidation, 'iOS');

  // Test iOS token with formatting issues
  const messyIOSToken = testIOSToken.match(/.{1,8}/g)?.join('-') || testIOSToken;
  const messyIOSValidation = validateAndFormatSNSToken(messyIOSToken, 'ios');
  console.log('\n--- iOS Token with Dashes Test ---');
  logTokenValidation(messyIOSValidation, 'iOS (messy)');

  // Test Android token
  const testAndroidToken = generateTestAndroidToken();
  const androidValidation = validateAndFormatSNSToken(testAndroidToken, 'android');
  console.log('\n--- Android Token Test ---');
  logTokenValidation(androidValidation, 'Android');

  // Test oversized token
  const oversizedToken = 'a'.repeat(450);
  const oversizedValidation = validateAndFormatSNSToken(oversizedToken, 'android');
  console.log('\n--- Oversized Token Test ---');
  logTokenValidation(oversizedValidation, 'Oversized');
}