// Email validation regex for specific providers
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Disposable email domains to block
const DISPOSABLE_DOMAINS = [
  'tempmail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'yopmail.com',
  'temp-mail.org',
  'sharklasers.com',
  'getairmail.com',
  'mailnesia.com',
  'trashmail.com'
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  // Check if it's a valid email format
  if (!EMAIL_REGEX.test(email)) {
    errors.push('Please use a valid email from Gmail, Yahoo, or Outlook');
    return { isValid: false, errors };
  }

  // Check for disposable email domains
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
    errors.push('Disposable email addresses are not allowed');
    return { isValid: false, errors };
  }

  return { isValid: true, errors };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return { 
    isValid: errors.length === 0, 
    errors 
  };
}

export function validateName(name: string): ValidationResult {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
    return { isValid: false, errors };
  }

  if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (name.length > 50) {
    errors.push('Name must be less than 50 characters');
  }

  // Check for suspicious patterns
  if (/[<>\"'&]/.test(name)) {
    errors.push('Name contains invalid characters');
  }

  return { 
    isValid: errors.length === 0, 
    errors 
  };
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' '); // Normalize whitespace
} 