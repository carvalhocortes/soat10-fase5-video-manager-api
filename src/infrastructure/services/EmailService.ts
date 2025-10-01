import * as nodemailer from 'nodemailer';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL ?? 'noreply@samuelvictor.dev';

    this.transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST ?? 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.MAILTRAP_PORT ?? '2525'),
      auth: {
        user: process.env.MAILTRAP_USER! ?? 'ef509f7efe2e8d',
        pass: process.env.MAILTRAP_PASS! ?? 'abcbe22be2bd36',
      },
    });
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    const mailOptions = {
      from: this.fromEmail,
      to: message.to,
      subject: message.subject,
      ...(message.isHtml ? { html: message.body } : { text: message.body }),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to: ${message.to}, MessageId: ${info.messageId}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email. Please try again.');
    }
  }

  async sendVideoProcessingFailureEmail(userId: string, fileName: string): Promise<void> {
    const subject = 'Falha no Processamento de Vídeo';
    const body = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; border-left: 5px solid #dc3545;">
            <h2 style="color: #dc3545; margin-top: 0;">🚫 Falha no Processamento de Vídeo</h2>
            <p style="color: #333; line-height: 1.6;">Olá,</p>
            <p style="color: #333; line-height: 1.6;">Infelizmente, ocorreu um erro durante o processamento do seu vídeo:</p>

            <div style="background-color: white; border-radius: 5px; padding: 20px; margin: 20px 0;">
              <ul style="list-style-type: none; padding: 0; margin: 0;">
                <li style="margin-bottom: 10px;"><strong>📁 Nome do arquivo:</strong> ${fileName}</li>
                <li style="margin-bottom: 10px;"><strong>🕒 Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</li>
              </ul>
            </div>

            <p style="color: #333; line-height: 1.6;">
              Por favor, tente fazer o upload novamente.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: userId,
      subject,
      body,
      isHtml: true,
    });
  }
}
