import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(254, 'Email is too long');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one lowercase letter, one uppercase letter, and one number');

export const phoneSchema = z.string()
  .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
  .min(10, 'Phone number is too short')
  .max(15, 'Phone number is too long');

export const thaiIdSchema = z.string()
  .regex(/^\d{13}$/, 'Thai ID must be exactly 13 digits')
  .refine((id) => validateThaiId(id), 'Invalid Thai ID number');

export const applicationNumberSchema = z.string()
  .regex(/^GACP-\d{4}-\d{4}$/, 'Invalid application number format');

export const certificateNumberSchema = z.string()
  .regex(/^CERT-\d{6}-\d{4}$/, 'Invalid certificate number format');

// Input sanitization functions
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 1000); // Limit length
};

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .slice(0, 5000);
};

// Validation helpers
export const validateThaiId = (id: string): boolean => {
  if (!/^\d{13}$/.test(id)) return false;
  
  const digits = id.split('').map(Number);
  const checksum = digits.slice(0, 12).reduce((sum, digit, index) => {
    return sum + digit * (13 - index);
  }, 0);
  
  const checksumDigit = (11 - (checksum % 11)) % 10;
  return checksumDigit === digits[12];
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

// Security validation for user roles
export const validateUserRole = (role: string): boolean => {
  const validRoles = ['applicant', 'reviewer', 'auditor', 'admin'];
  return validRoles.includes(role);
};

// SQL injection prevention (additional layer)
export const containsSqlInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION|OR|AND)\s+\d+\s*=\s*\d+/i,
    /['";][\s]*(--)|(\/\*)/i,
    /\b(xp_|sp_|sys\.)/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

// XSS prevention
export const containsXss = (input: string): boolean => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

// Comprehensive input validation
export const validateInput = (input: string, type: 'text' | 'email' | 'html' = 'text'): {
  isValid: boolean;
  sanitized: string;
  errors: string[];
} => {
  const errors: string[] = [];
  let sanitized = input;

  // Check for malicious content
  if (containsSqlInjection(input)) {
    errors.push('Input contains potentially malicious content');
  }

  if (containsXss(input)) {
    errors.push('Input contains potentially dangerous HTML/JavaScript');
  }

  // Sanitize based on type
  switch (type) {
    case 'email':
      sanitized = sanitizeString(input);
      break;
    case 'html':
      sanitized = sanitizeHtml(input);
      break;
    default:
      sanitized = sanitizeString(input);
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
};