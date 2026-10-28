
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MOBILE_REGEX = /^(\+?[1-9]\d{1,3}[- ]?)?[6-9]\d{9}$/;
const TEN_DIGIT_REGEX = /^[0-9]{10}$/;

const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

const isValidMobile = (mobile) => {
  if (!mobile || typeof mobile !== 'string') return false;
  const cleaned = mobile.replace(/[\s-]/g, '');
  return MOBILE_REGEX.test(cleaned);
};

const sanitizeMobile = (mobile) => {
  if (!mobile) return '';
  return mobile.replace(/[\s-]/g, '').trim();
};

const validatePasswordStrength = (password) => {
  const result = {
    isValid: false,
    errors: [],
    criteria: {
      minLength: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSpecial: false
    }
  };

  if (!password || typeof password !== 'string') {
    result.errors.push('Password is required');
    return result;
  }

  result.criteria.minLength = password.length >= 8;
  result.criteria.hasUpper = /[A-Z]/.test(password);
  result.criteria.hasLower = /[a-z]/.test(password);
  result.criteria.hasNumber = /[0-9]/.test(password);
  result.criteria.hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~` ]/.test(password);

  if (!result.criteria.minLength) result.errors.push('Password must be at least 8 characters long');
  if (!result.criteria.hasUpper) result.errors.push('Password must include at least one uppercase letter');
  if (!result.criteria.hasLower) result.errors.push('Password must include at least one lowercase letter');
  if (!result.criteria.hasNumber) result.errors.push('Password must include at least one number');
  if (!result.criteria.hasSpecial) result.errors.push('Password must include at least one special character');

  result.isValid = result.errors.length === 0;
  return result;
};

const maskIdentifier = (identifier) => {
  if (!identifier) return '';
  const trimmed = identifier.trim();

  if (trimmed.includes('@')) {
    const [localPart, domain] = trimmed.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}*@${domain}`;
    }
    const firstChar = localPart[0];
    const lastChar = localPart[localPart.length - 1];
    return `${firstChar}${'*'.repeat(Math.max(localPart.length - 2, 3))}${lastChar}@${domain}`;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 4) {
    const lastFour = digits.slice(-4);
    const maskedPrefix = '*'.repeat(Math.min(digits.length - 4, 6));
    if (trimmed.startsWith('+')) {
      return `+${digits.slice(0, digits.length - 10)} ${maskedPrefix}${lastFour}`.trim();
    }
    return `${maskedPrefix}${lastFour}`;
  }

  return '****';
};

module.exports = {
  isValidEmail,
  isValidMobile,
  sanitizeMobile,
  validatePasswordStrength,
  maskIdentifier
};
