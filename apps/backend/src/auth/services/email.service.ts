import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.getOrThrow('SMTP_HOST');
    const smtpPort = this.configService.getOrThrow('SMTP_PORT');
    const smtpUser = this.configService.getOrThrow('SMTP_USER');
    const smtpPass = this.configService.getOrThrow('SMTP_PASS');

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      this.logger.warn(
        'SMTP configuration is not complete. Email service will be disabled.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false, // For development only
      },
    });

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Email transporter verification failed:', error);
      } else {
        this.logger.log('Email transporter is ready to send messages');
      }
    });
  }

  private isEmailEnabled(): boolean {
    return !!this.transporter;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isEmailEnabled()) {
      this.logger.warn('Email service is disabled. Skipping email send.');
      return false;
    }

    try {
      const emailFrom = this.configService.getOrThrow('EMAIL_FROM');

      const info = await this.transporter.sendMail({
        from: emailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(
        `Email sent successfully to ${options.to}. Message ID: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  // Email Templates
  private getVerificationEmailTemplate(
    email: string,
    token: string,
  ): EmailTemplate {
    const subject = 'Verify your email';

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Email</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            text-align: center;
          }
          .logo {
            width: 64px;
            height: 64px;
            background-color: #f3f4f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 24px;
          }
          .title {
            color: #111827;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 16px;
          }
          .description {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 32px;
            line-height: 1.5;
          }
          .email-highlight {
            color: #2563eb;
            font-weight: 600;
          }
          .verification-code {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 24px;
            margin: 32px 0;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #111827;
            font-family: 'Courier New', monospace;
          }
          .expiry-note {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 32px;
          }
          .footer-note {
            color: #9ca3af;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            padding-top: 24px;
            margin-top: 32px;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">📧</div>
          
          <h1 class="title">Verify your email</h1>
          
          <p class="description">
            We need to verify your email address <span class="email-highlight">${email}</span> before you can 
            access your account. Enter the code below in your open browser window.
          </p>
          
          <div class="verification-code">
            ${token}
          </div>
          
          <p class="expiry-note">
            This code expires in <strong>10 minutes</strong>.
          </p>
          
          <div class="footer-note">
            If you didn't sign up for Cursor, you can safely ignore this email. 
            Someone else might have typed your email address by mistake.
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Verify your email
      
      We need to verify your email address ${email} before you can access your account. 
      Enter the code below in your open browser window.
      
      Verification Code: ${token}
      
      This code expires in 10 minutes.
      
      If you didn't sign up for Cursor, you can safely ignore this email. 
      Someone else might have typed your email address by mistake.
    `;

    return { subject, html, text };
  }

  private getPasswordResetEmailTemplate(
    email: string,
    token: string,
  ): EmailTemplate {
    const frontendUrl = this.configService.getOrThrow('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    const subject = 'Đặt lại mật khẩu của bạn';

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại Mật khẩu</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 10px;
          }
          .title {
            color: #1f2937;
            font-size: 20px;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #dc2626;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #b91c1c;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .warning {
            background-color: #fef2f2;
            border: 1px solid #f87171;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
          }
          .security-tip {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔒 NestJS App</div>
            <h1 class="title">Đặt lại mật khẩu của bạn</h1>
          </div>
          
          <div class="content">
            <p>Xin chào,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nếu bạn đã yêu cầu điều này, vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Đặt lại Mật khẩu</a>
            </div>
            
            <p>Hoặc bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            
            <div class="warning">
              <strong>⚠️ Quan trọng:</strong> Liên kết này sẽ hết hạn sau 1 giờ vì lý do bảo mật.
            </div>
            
            <div class="security-tip">
              <strong>💡 Lời khuyên bảo mật:</strong>
              <ul>
                <li>Chọn mật khẩu mạnh có ít nhất 8 ký tự</li>
                <li>Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                <li>Không sử dụng thông tin cá nhân dễ đoán</li>
                <li>Không chia sẻ mật khẩu với ai khác</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.</strong></p>
            <p>© 2024 NestJS App. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Đặt lại mật khẩu của bạn
      
      Xin chào,
      
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nếu bạn đã yêu cầu điều này, vui lòng truy cập liên kết sau để đặt lại mật khẩu:
      
      ${resetUrl}
      
      Liên kết này sẽ hết hạn sau 1 giờ vì lý do bảo mật.
      
      Lời khuyên bảo mật:
      - Chọn mật khẩu mạnh có ít nhất 8 ký tự
      - Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt
      - Không sử dụng thông tin cá nhân dễ đoán
      - Không chia sẻ mật khẩu với ai khác
      
      Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.
      
      © 2024 NestJS App
    `;

    return { subject, html, text };
  }

  private getWelcomeEmailTemplate(name: string): EmailTemplate {
    const frontendUrl = this.configService.getOrThrow('FRONTEND_URL');
    const dashboardUrl = `${frontendUrl}/dashboard`;

    const subject = `Chào mừng ${name} đến với NestJS App!`;

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chào mừng</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
          }
          .title {
            color: #1f2937;
            font-size: 20px;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #059669;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #047857;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .features {
            background-color: #f0fdf4;
            border: 1px solid #22c55e;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
          }
          .feature-list {
            list-style: none;
            padding: 0;
          }
          .feature-list li {
            padding: 5px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .feature-list li:last-child {
            border-bottom: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎉 NestJS App</div>
            <h1 class="title">Chào mừng ${name}!</h1>
          </div>
          
          <div class="content">
            <p>Xin chào ${name},</p>
            <p>Chào mừng bạn đến với NestJS App! Tài khoản của bạn đã được tạo thành công và email đã được xác thực.</p>
            
            <div class="features">
              <h3>🚀 Những gì bạn có thể làm:</h3>
              <ul class="feature-list">
                <li>✅ Quản lý thông tin cá nhân</li>
                <li>✅ Bật tính năng xác thực 2 yếu tố (2FA)</li>
                <li>✅ Quản lý phiên đăng nhập</li>
                <li>✅ Thay đổi mật khẩu</li>
                <li>✅ Kết nối với Google/Facebook</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Khám phá Dashboard</a>
            </div>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>
          </div>
          
          <div class="footer">
            <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!</p>
            <p>© 2024 NestJS App. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Chào mừng ${name}!
      
      Xin chào ${name},
      
      Chào mừng bạn đến với NestJS App! Tài khoản của bạn đã được tạo thành công và email đã được xác thực.
      
      Những gì bạn có thể làm:
      - Quản lý thông tin cá nhân
      - Bật tính năng xác thực 2 yếu tố (2FA)
      - Quản lý phiên đăng nhập
      - Thay đổi mật khẩu
      - Kết nối với Google/Facebook
      
      Khám phá Dashboard: ${dashboardUrl}
      
      Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.
      
      Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!
      
      © 2024 NestJS App
    `;

    return { subject, html, text };
  }

  // Public methods for sending specific emails
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const template = this.getVerificationEmailTemplate(email, token);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const template = this.getPasswordResetEmailTemplate(email, token);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendWelcomeEmail(name: string, email: string): Promise<boolean> {
    const template = this.getWelcomeEmailTemplate(name);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Test email functionality
  async sendTestEmail(to: string): Promise<boolean> {
    const template = {
      subject: 'Test Email từ NestJS App',
      html: `
        <h1>🧪 Email Test Thành Công!</h1>
        <p>Nếu bạn nhận được email này, nghĩa là email service đang hoạt động bình thường.</p>
        <p><strong>Thời gian gửi:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      `,
      text: `Email Test Thành Công! Nếu bạn nhận được email này, nghĩa là email service đang hoạt động bình thường. Thời gian gửi: ${new Date().toLocaleString('vi-VN')}`,
    };

    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}
