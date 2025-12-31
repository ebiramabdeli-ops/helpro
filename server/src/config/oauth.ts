export const oauthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback',
    scopes: ['profile', 'email'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
  
  // Apple Sign In (für zukünftige Implementation)
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || '',
    teamId: process.env.APPLE_TEAM_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
    redirectUri: process.env.APPLE_REDIRECT_URI || 'http://localhost:5173/auth/apple/callback',
  },
  
  // Facebook Login (für zukünftige Implementation)
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:5173/auth/facebook/callback',
  },
};

export const emailConfig = {
  verification: {
    tokenLength: 32,
    expiryHours: 24,
  },
  
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  
  from: {
    name: 'Helpro',
    email: process.env.SMTP_FROM || 'noreply@helpro.app',
  },
};
