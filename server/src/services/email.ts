import nodemailer from 'nodemailer';
import { emailConfig } from '../config/oauth.js';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: emailConfig.smtp.auth.user ? {
      user: emailConfig.smtp.auth.user,
      pass: emailConfig.smtp.auth.pass,
    } : undefined,
  });

  /**
   * Send verification email
   */
  static async sendVerificationEmail(
    to: string,
    name: string,
    verificationUrl: string
  ): Promise<boolean> {
    try {
      // Skip sending in development if SMTP not configured
      if (process.env.NODE_ENV === 'development' && !emailConfig.smtp.auth.user) {
        console.log(`
📧 Email Verification (Development Mode)
To: ${to}
Subject: Verify your Helpro account
Link: ${verificationUrl}
        `);
        return true;
      }

      await this.transporter.sendMail({
        from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
        to,
        subject: 'Verify your Helpro account',
        html: this.getVerificationEmailTemplate(name, verificationUrl),
      });

      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development' && !emailConfig.smtp.auth.user) {
        console.log(`📧 Welcome Email sent to ${to}`);
        return true;
      }

      await this.transporter.sendMail({
        from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
        to,
        subject: 'Welcome to Helpro!',
        html: this.getWelcomeEmailTemplate(name),
      });

      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string
  ): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development' && !emailConfig.smtp.auth.user) {
        console.log(`
📧 Password Reset Email (Development Mode)
To: ${to}
Link: ${resetUrl}
        `);
        return true;
      }

      await this.transporter.sendMail({
        from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
        to,
        subject: 'Reset your Helpro password',
        html: this.getPasswordResetTemplate(name, resetUrl),
      });

      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Email templates
   */
  private static getVerificationEmailTemplate(name: string, url: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Helpro</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
          <p>Thank you for registering with Helpro. Please verify your email address to activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #667eea; word-break: break-all; font-size: 14px;">${url}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  private static getWelcomeEmailTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Helpro</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to Helpro!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
          <p>Your account has been successfully created. You're now part of the Helpro community!</p>
          <h3 style="color: #667eea;">What's next?</h3>
          <ul>
            <li>Complete your profile to get more bookings</li>
            <li>Verify your phone number for added security</li>
            <li>Enable MFA for maximum protection</li>
            <li>Browse available help requests</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Go to Dashboard</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getPasswordResetTemplate(name: string, url: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Reset Password</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
          <p>You requested to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #667eea; word-break: break-all; font-size: 14px;">${url}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      </body>
      </html>
    `;
  }
}
