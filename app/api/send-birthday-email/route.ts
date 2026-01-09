import { NextRequest, NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { to, name, message } = await request.json();

    if (!to || !name || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Sending birthday email to:', to);
    console.log('Using Brevo API key:', process.env.BREVO_API_KEY ? 'Set' : 'Not set');

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: 'DTCE ICT Department', email: 'brematech27@gmail.com' };
    sendSmtpEmail.to = [{ email: to, name: name }];

    sendSmtpEmail.subject = 'Happy Birthday from the DTCE ICT DEPARTMENT';
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Happy Birthday!</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">🎉 Happy Birthday! 🎉</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Dear ${name},</h2>
                      <div style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        ${message.replace(/\n/g, '<br>')}
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; font-weight: bold;">
                        With warm regards,
                      </p>
                      <p style="margin: 0; color: #667eea; font-size: 16px; font-weight: bold;">
                        DTCE ICT DEPARTMENT
                      </p>
                      <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px;">
                        Directorate of Teens and Children Education
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        Redeemed Christian Church of God (RCCG)
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', data);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Brevo error:', error);
    return NextResponse.json(
      { error: `Failed to send email: ${error.message || error.body?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
