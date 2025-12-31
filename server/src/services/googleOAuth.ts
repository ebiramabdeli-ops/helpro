import axios from 'axios';
import { oauthConfig } from '../config/oauth.js';

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export class GoogleOAuthService {
  /**
   * Get Google OAuth authorization URL
   */
  static getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: oauthConfig.google.clientId,
      redirect_uri: oauthConfig.google.redirectUri,
      response_type: 'code',
      scope: oauthConfig.google.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    return `${oauthConfig.google.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  static async getTokens(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  }> {
    const response = await axios.post(oauthConfig.google.tokenUrl, {
      code,
      client_id: oauthConfig.google.clientId,
      client_secret: oauthConfig.google.clientSecret,
      redirect_uri: oauthConfig.google.redirectUri,
      grant_type: 'authorization_code',
    });

    return response.data;
  }

  /**
   * Get user info from Google
   */
  static async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await axios.get(oauthConfig.google.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const response = await axios.post(oauthConfig.google.tokenUrl, {
      client_id: oauthConfig.google.clientId,
      client_secret: oauthConfig.google.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    return response.data;
  }
}
