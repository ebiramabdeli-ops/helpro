export const securityConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '7d',
    mfaExpiresIn: '5m', // Short-lived token before MFA
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max requests per window
    login: {
      windowMs: 15 * 60 * 1000,
      max: 5, // Max 5 login attempts per 15 minutes
    },
  },
  
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  
  accountLocking: {
    maxAttempts: 5,
    lockDuration: 15 * 60 * 1000, // 15 minutes
  },
  
  phoneVerification: {
    codeLength: 6,
    expiryMinutes: 10,
    maxAttempts: 3,
  },
  
  mfa: {
    issuer: 'Helpro',
    backupCodesCount: 10,
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  },
};
